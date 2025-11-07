import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActiveExam, ActiveExamSchema } from '../schemas/active-exam.schema';
import { ExamSet, ExamSetSchema } from '../schemas/exam-set.schema';
import { Question, QuestionSchema } from '../schemas/question.schema';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ActiveExam.name, schema: ActiveExamSchema },
      { name: ExamSet.name, schema: ExamSetSchema },
      { name: Question.name, schema: QuestionSchema },
    ]),
  ],
  controllers: [ExamController],
  providers: [ExamService],
  exports: [ExamService],
})
export class ExamModule {}

