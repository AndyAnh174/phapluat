import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExamSession, ExamSessionSchema } from '../schemas/exam-session.schema';
import { Answer, AnswerSchema } from '../schemas/answer.schema';
import { Question, QuestionSchema } from '../schemas/question.schema';
import { ActiveExam, ActiveExamSchema } from '../schemas/active-exam.schema';
import { ExamSessionsService } from './exam-sessions.service';
import { ExamSessionsController } from './exam-sessions.controller';
import { ExamModule } from '../exam/exam.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExamSession.name, schema: ExamSessionSchema },
      { name: Answer.name, schema: AnswerSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: ActiveExam.name, schema: ActiveExamSchema },
    ]),
    ExamModule,
  ],
  controllers: [ExamSessionsController],
  providers: [ExamSessionsService],
  exports: [ExamSessionsService],
})
export class ExamSessionsModule {}

