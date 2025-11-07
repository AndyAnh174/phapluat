import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActiveExam, ActiveExamDocument } from '../schemas/active-exam.schema';
import { ExamSet, ExamSetDocument } from '../schemas/exam-set.schema';
import { Question, QuestionDocument } from '../schemas/question.schema';

@Injectable()
export class ExamService {
  constructor(
    @InjectModel(ActiveExam.name)
    private activeExamModel: Model<ActiveExamDocument>,
    @InjectModel(ExamSet.name) private examSetModel: Model<ExamSetDocument>,
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
  ) {}

  async activate(examSetId: string, startDate?: Date, endDate?: Date) {
    // Verify exam set exists
    const examSet = await this.examSetModel.findById(examSetId).exec();
    if (!examSet) {
      throw new NotFoundException(`ExamSet with ID ${examSetId} not found`);
    }

    // Check if exam set has questions
    const questionCount = await this.questionModel
      .countDocuments({ examSetId: new Types.ObjectId(examSetId) })
      .exec();

    if (questionCount === 0) {
      throw new BadRequestException(
        'Cannot activate exam set without questions',
      );
    }

    // Validate dates if provided
    if (startDate && endDate && endDate <= startDate) {
      throw new BadRequestException(
        'End date must be after start date',
      );
    }

    const now = new Date();
    
    // Determine if exam should be active immediately
    // If startDate is provided and in the future, exam is not active yet
    const shouldBeActive = !startDate || startDate <= now;
    
    // If endDate is provided and has passed, exam should not be active
    const isExpired = endDate && endDate < now;

    // Deactivate any currently active exam
    await this.activeExamModel.updateMany(
      { isActive: true },
      { isActive: false, deactivatedAt: new Date() },
    );

    // Activate new exam
    let activeExam = await this.activeExamModel.findOne().exec();
    if (!activeExam) {
      activeExam = await this.activeExamModel.create({
        examSetId: new Types.ObjectId(examSetId),
        isActive: shouldBeActive && !isExpired,
        activatedAt: startDate || now,
        startDate: startDate,
        endDate: endDate,
      });
    } else {
      activeExam.examSetId = new Types.ObjectId(examSetId);
      activeExam.isActive = shouldBeActive && !isExpired;
      activeExam.activatedAt = startDate || now;
      activeExam.startDate = startDate;
      activeExam.endDate = endDate;
      activeExam.deactivatedAt = undefined;
      await activeExam.save();
    }

    return activeExam;
  }

  async deactivate() {
    try {
      // Find the most recent exam (regardless of isActive status)
      const activeExam = await this.activeExamModel
        .findOne()
        .populate('examSetId')
        .sort({ createdAt: -1 })
        .exec();

      if (!activeExam || !activeExam.examSetId) {
        throw new NotFoundException('No exam found to deactivate');
      }

      console.log('Deactivating exam:', {
        id: activeExam._id,
        isActive: activeExam.isActive,
        startDate: activeExam.startDate,
        endDate: activeExam.endDate,
      });

      // Simply deactivate the exam using updateOne to ensure it's saved
      const result = await this.activeExamModel.updateOne(
        { _id: activeExam._id },
        {
          $set: {
            isActive: false,
            deactivatedAt: new Date(),
          },
          $unset: {
            startDate: '',
            endDate: '',
          },
        }
      );

      console.log('Deactivate result:', result);

      if (result.matchedCount === 0) {
        throw new NotFoundException('Exam not found for deactivation');
      }

      return { message: 'Exam deactivated successfully' };
    } catch (error) {
      console.error('Error in deactivate:', error);
      throw error;
    }
  }

  async getStatus() {
    try {
      const now = new Date();
      
      // Find active exam or exam with scheduled dates
      let activeExam = await this.activeExamModel
        .findOne()
        .populate('examSetId')
        .sort({ createdAt: -1 })
        .exec();

      if (!activeExam || !activeExam.examSetId) {
        return { isActive: false, exam: null, activeExam: null };
      }

      // Check if exam should be active based on startDate/endDate
      const hasStartDate = activeExam.startDate && activeExam.startDate instanceof Date;
      const hasEndDate = activeExam.endDate && activeExam.endDate instanceof Date;
      
      const startDate = hasStartDate ? activeExam.startDate : null;
      const endDate = hasEndDate ? activeExam.endDate : null;
      
      const isWithinTimeRange = 
        (!startDate || startDate <= now) &&
        (!endDate || endDate >= now);

      // Only update isActive status if exam was not manually deactivated
      // If exam has deactivatedAt, it means it was manually deactivated, don't auto-update
      const wasManuallyDeactivated = activeExam.deactivatedAt && !activeExam.isActive;
      
      if (!wasManuallyDeactivated && activeExam.isActive !== isWithinTimeRange) {
        activeExam.isActive = isWithinTimeRange;
        if (!isWithinTimeRange) {
          activeExam.deactivatedAt = now;
        } else {
          activeExam.deactivatedAt = undefined;
        }
        await activeExam.save();
      }

      // Check if exam is scheduled for future (has startDate in future)
      const isScheduledForFuture = hasStartDate && startDate && startDate > now;
      
      // Check if exam was manually deactivated (has deactivatedAt and isActive is false)
      const isManuallyDeactivated = activeExam.deactivatedAt && !activeExam.isActive && !isScheduledForFuture;
      
      // Only return activeExam if:
      // 1. Exam is active (isWithinTimeRange = true), OR
      // 2. Exam is scheduled for future (has startDate in future)
      // If exam was manually deactivated and not scheduled, don't return activeExam
      const shouldReturnActiveExam = !isManuallyDeactivated && (isWithinTimeRange || isScheduledForFuture);

      console.log('getStatus check:', {
        isActive: activeExam.isActive,
        isWithinTimeRange,
        isScheduledForFuture,
        isManuallyDeactivated,
        deactivatedAt: activeExam.deactivatedAt,
        shouldReturnActiveExam,
      });

      const examInfo = {
        examSetId: activeExam.examSetId._id.toString(),
        examSet: activeExam.examSetId,
        activatedAt: activeExam.activatedAt,
        startDate: activeExam.startDate,
        endDate: activeExam.endDate,
      };

      return {
        isActive: isWithinTimeRange,
        examSetId: activeExam.examSetId._id.toString(),
        exam: isWithinTimeRange ? examInfo : null,
        activeExam: shouldReturnActiveExam ? examInfo : null, // Only return if active or scheduled
      };
    } catch (error) {
      console.error('Error in getStatus:', error);
      // Return empty status on error
      return { isActive: false, exam: null, activeExam: null };
    }
  }

  async getActiveExamForStudent() {
    try {
      const now = new Date();
      
      // Find the most recent exam (active or scheduled)
      let activeExam = await this.activeExamModel
        .findOne()
        .populate({
          path: 'examSetId',
          select: 'name description durationMinutes',
        })
        .sort({ createdAt: -1 })
        .exec();

      if (!activeExam || !activeExam.examSetId) {
        return null;
      }

      // Check if exam was manually deactivated
      const wasManuallyDeactivated = activeExam.deactivatedAt && !activeExam.isActive;
      if (wasManuallyDeactivated) {
        return null;
      }

      // Check if exam should be active based on startDate/endDate
      const hasStartDate = activeExam.startDate && activeExam.startDate instanceof Date;
      const hasEndDate = activeExam.endDate && activeExam.endDate instanceof Date;
      
      const startDate = hasStartDate ? activeExam.startDate : null;
      const endDate = hasEndDate ? activeExam.endDate : null;
      
      const isWithinTimeRange = 
        (!startDate || startDate <= now) &&
        (!endDate || endDate >= now);

      // Only return if exam is within time range (actually active)
      if (!isWithinTimeRange) {
        return null;
      }

      console.log('getActiveExamForStudent returning exam:', {
        examSetId: activeExam.examSetId._id.toString(),
        isActive: activeExam.isActive,
        isWithinTimeRange,
        startDate,
        endDate,
      });

      return {
        examSetId: activeExam.examSetId._id.toString(),
        name: (activeExam.examSetId as any).name,
        description: (activeExam.examSetId as any).description,
        durationMinutes: (activeExam.examSetId as any).durationMinutes,
        activatedAt: activeExam.activatedAt,
        startDate: activeExam.startDate,
        endDate: activeExam.endDate,
      };
    } catch (error) {
      console.error('Error in getActiveExamForStudent:', error);
      return null;
    }
  }
}

