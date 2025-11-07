import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IsString, IsNotEmpty, IsArray, IsIn, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { ExamSession, ExamSessionDocument } from '../schemas/exam-session.schema';
import { Answer, AnswerDocument } from '../schemas/answer.schema';
import { Question, QuestionDocument } from '../schemas/question.schema';
import { ActiveExam, ActiveExamDocument } from '../schemas/active-exam.schema';
import { ExamService } from '../exam/exam.service';

export class AnswerDto {
  @ApiProperty({ example: '690d234a9ce6dd768e552b73', description: 'Question ID' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ example: 'B', enum: ['A', 'B', 'C', 'D'], description: 'Selected answer' })
  @IsString()
  @IsIn(['A', 'B', 'C', 'D'])
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
}

export class SubmitExamDto {
  @ApiProperty({ example: '690d234a9ce6dd768e552b80', description: 'Exam session ID' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ type: [AnswerDto], description: 'Array of answers' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}

@Injectable()
export class ExamSessionsService {
  constructor(
    @InjectModel(ExamSession.name)
    private examSessionModel: Model<ExamSessionDocument>,
    @InjectModel(Answer.name) private answerModel: Model<AnswerDocument>,
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @InjectModel(ActiveExam.name)
    private activeExamModel: Model<ActiveExamDocument>,
    private examService: ExamService,
  ) {}

  async startExam(userId: string) {
    // Get active exam
    const activeExam = await this.examService.getActiveExamForStudent();

    if (!activeExam) {
      throw new NotFoundException('No active exam found');
    }

    // Get the active exam record to check activatedAt
    const currentActiveExam = await this.activeExamModel
      .findOne({ isActive: true })
      .exec();

    // Check if user already has a session for this exam
    const existingSession = await this.examSessionModel
      .findOne({
        userId: new Types.ObjectId(userId),
        examSetId: new Types.ObjectId(activeExam.examSetId),
      })
      .sort({ startedAt: -1 }) // Get the most recent session
      .exec();

    if (existingSession) {
      // If session is not submitted, allow to continue
      if (!existingSession.submittedAt) {
        const questions = await this.getQuestionsForSession(
          (existingSession._id as any).toString(),
        );
        return {
          sessionId: (existingSession._id as any).toString(),
          examSetId: activeExam.examSetId,
          examSet: activeExam,
          questions,
          startedAt: existingSession.startedAt,
          durationMinutes: activeExam.durationMinutes,
        };
      }
      
      // If session is submitted, check if this is a new exam activation
      // Allow retaking if:
      // 1. Exam was reactivated (closed and reopened) - activatedAt > submittedAt
      // 2. Or if examSetId is different (different exam set)
      if (existingSession.submittedAt) {
        if (currentActiveExam?.activatedAt) {
          const examReactivated = currentActiveExam.activatedAt > existingSession.submittedAt;
          if (examReactivated) {
            // Exam was closed and reopened, allow retaking
            // Continue to create new session below
          } else {
            // Same exam activation, don't allow retaking
            throw new ForbiddenException('Bạn đã nộp bài thi này rồi. Vui lòng đợi admin đóng và mở lại bài thi để làm lại.');
          }
        } else {
          // No activatedAt info, don't allow retaking to be safe
          throw new ForbiddenException('Bạn đã nộp bài thi này rồi. Vui lòng đợi admin đóng và mở lại bài thi để làm lại.');
        }
      }
    }

    // Create new session
    const session = await this.examSessionModel.create({
      userId: new Types.ObjectId(userId),
      examSetId: new Types.ObjectId(activeExam.examSetId),
      startedAt: new Date(),
    });

    // Get questions without correct answers
    const questions = await this.questionModel
      .find({ examSetId: new Types.ObjectId(activeExam.examSetId) })
      .sort({ order: 1 })
      .select('-correctAnswer')
      .exec();

    return {
      sessionId: (session._id as any).toString(),
      examSetId: activeExam.examSetId,
      examSet: activeExam,
      questions: questions.map((q) => ({
        _id: (q._id as any).toString(),
        content: q.content,
        options: q.options,
        order: q.order,
      })),
      startedAt: session.startedAt,
      durationMinutes: activeExam.durationMinutes,
    };
  }

  async getQuestionsForSession(sessionId: string) {
    const session = await this.examSessionModel.findById(sessionId).exec();

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const questions = await this.questionModel
      .find({ examSetId: session.examSetId })
      .sort({ order: 1 })
      .select('-correctAnswer')
      .exec();

    return questions.map((q) => ({
      _id: (q._id as any).toString(),
      content: q.content,
      options: q.options,
      order: q.order,
    }));
  }

  async submitExam(userId: string, submitDto: SubmitExamDto) {
    const session = await this.examSessionModel
      .findById(submitDto.sessionId)
      .exec();

    if (!session) {
      throw new NotFoundException(
        `Session with ID ${submitDto.sessionId} not found`,
      );
    }

    // Verify session belongs to user
    if (session.userId.toString() !== userId) {
      throw new ForbiddenException('Session does not belong to user');
    }

    // Check if already submitted
    if (session.submittedAt) {
      throw new BadRequestException('Bạn đã nộp bài thi này rồi. Không thể nộp lại.');
    }

    // Get all questions for this exam
    const questions = await this.questionModel
      .find({ examSetId: session.examSetId })
      .exec();

    const questionMap = new Map(
      questions.map((q) => [(q._id as any).toString(), q]),
    );

    // Validate all answers
    const answerMap = new Map(
      submitDto.answers.map((a) => [a.questionId, a.selectedAnswer]),
    );

    let correctCount = 0;
    const totalQuestions = questions.length;

    // Create answer records and calculate score
    const answerPromises = submitDto.answers.map(async (answer) => {
      const question = questionMap.get(answer.questionId);
      if (!question) {
        throw new NotFoundException(
          `Question with ID ${answer.questionId} not found`,
        );
      }

      const isCorrect = answer.selectedAnswer === question.correctAnswer;
      if (isCorrect) {
        correctCount++;
      }

      return this.answerModel.create({
        sessionId: session._id,
        questionId: new Types.ObjectId(answer.questionId),
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
      });
    });

    await Promise.all(answerPromises);

    // Calculate score (percentage)
    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // Update session
    session.submittedAt = new Date();
    session.score = score;
    await session.save();

    return {
      sessionId: (session._id as any).toString(),
      score: Math.round(score * 100) / 100,
      correctCount,
      totalQuestions,
      submittedAt: session.submittedAt,
    };
  }

  async getResult(sessionId: string, userId: string) {
    const session = await this.examSessionModel
      .findById(sessionId)
      .populate('examSetId', 'name description')
      .exec();

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Verify session belongs to user
    if (session.userId.toString() !== userId) {
      throw new ForbiddenException('Session does not belong to user');
    }

    if (!session.submittedAt) {
      throw new BadRequestException('Exam not yet submitted');
    }

    // Get answers with questions
    const answers = await this.answerModel
      .find({ sessionId: new Types.ObjectId(sessionId) })
      .populate('questionId')
      .exec();

    return {
      sessionId: (session._id as any).toString(),
      examSet: session.examSetId,
      score: session.score,
      correctCount: answers.filter((a) => a.isCorrect).length,
      totalQuestions: answers.length,
      submittedAt: session.submittedAt,
      answers: answers.map((a) => ({
        question: {
          _id: (a.questionId as any)._id.toString(),
          content: (a.questionId as any).content,
          options: (a.questionId as any).options,
          correctAnswer: (a.questionId as any).correctAnswer,
        },
        selectedAnswer: a.selectedAnswer,
        isCorrect: a.isCorrect,
      })),
    };
  }
}

