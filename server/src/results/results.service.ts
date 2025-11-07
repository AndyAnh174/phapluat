import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExamSession, ExamSessionDocument } from '../schemas/exam-session.schema';
import { Answer, AnswerDocument } from '../schemas/answer.schema';
import * as csvWriter from 'csv-writer';

@Injectable()
export class ResultsService {
  constructor(
    @InjectModel(ExamSession.name)
    private examSessionModel: Model<ExamSessionDocument>,
    @InjectModel(Answer.name) private answerModel: Model<AnswerDocument>,
  ) {}

  async findAll(examSetId?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const filter: any = { submittedAt: { $exists: true, $ne: null } };

    if (examSetId) {
      filter.examSetId = new Types.ObjectId(examSetId);
    }

    const [data, total] = await Promise.all([
      this.examSessionModel
        .find(filter)
        .populate('userId', 'name email')
        .populate('examSetId', 'name')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.examSessionModel.countDocuments(filter).exec(),
    ]);

    return {
      data: data.map((session) => ({
        sessionId: (session._id as any).toString(),
        user: session.userId,
        examSet: session.examSetId,
        score: session.score,
        submittedAt: session.submittedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(sessionId: string) {
    const session = await this.examSessionModel
      .findById(sessionId)
      .populate('userId', 'name email')
      .populate('examSetId', 'name description')
      .exec();

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (!session.submittedAt) {
      throw new NotFoundException('Session not yet submitted');
    }

    // Get answers with questions
    const answers = await this.answerModel
      .find({ sessionId: new Types.ObjectId(sessionId) })
      .populate('questionId')
      .exec();

    return {
      sessionId: (session._id as any).toString(),
      user: session.userId,
      examSet: session.examSetId,
      score: session.score,
      submittedAt: session.submittedAt,
      startedAt: session.startedAt,
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

  async reset(sessionId: string) {
    const session = await this.examSessionModel.findById(sessionId).exec();

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Delete answers
    await this.answerModel.deleteMany({
      sessionId: new Types.ObjectId(sessionId),
    });

    // Delete session
    await session.deleteOne();

    return { message: 'Session reset successfully. User can retake the exam.' };
  }

  async exportJSON(examSetId?: string) {
    const filter: any = { submittedAt: { $exists: true, $ne: null } };

    if (examSetId) {
      filter.examSetId = new Types.ObjectId(examSetId);
    }

    const sessions = await this.examSessionModel
      .find(filter)
      .populate('userId', 'name email')
      .populate('examSetId', 'name')
      .sort({ submittedAt: -1 })
      .exec();

    const results = await Promise.all(
      sessions.map(async (session) => {
        const answers = await this.answerModel
          .find({ sessionId: session._id })
          .populate('questionId')
          .exec();

        return {
          sessionId: (session._id as any).toString(),
          user: {
            name: (session.userId as any).name,
            email: (session.userId as any).email,
          },
          examSet: {
            name: (session.examSetId as any).name,
          },
          score: session.score,
          startedAt: session.startedAt,
          submittedAt: session.submittedAt,
          answers: answers.map((a) => ({
            question: {
              content: (a.questionId as any).content,
              correctAnswer: (a.questionId as any).correctAnswer,
            },
            selectedAnswer: a.selectedAnswer,
            isCorrect: a.isCorrect,
          })),
        };
      }),
    );

    return results;
  }

  async exportCSV(examSetId?: string): Promise<string> {
    const results = await this.exportJSON(examSetId);

    if (results.length === 0) {
      return '';
    }

    const csvStringifier = csvWriter.createObjectCsvStringifier({
      header: [
        { id: 'userName', title: 'User Name' },
        { id: 'userEmail', title: 'User Email' },
        { id: 'examSetName', title: 'Exam Set' },
        { id: 'score', title: 'Score' },
        { id: 'startedAt', title: 'Started At' },
        { id: 'submittedAt', title: 'Submitted At' },
      ],
    });

    const records = results.map((r) => ({
      userName: r.user.name,
      userEmail: r.user.email,
      examSetName: r.examSet.name,
      score: r.score,
      startedAt: r.startedAt.toISOString(),
      submittedAt: r.submittedAt?.toISOString() || '',
    }));

    return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
  }
}

