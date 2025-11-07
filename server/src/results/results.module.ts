import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExamSession, ExamSessionSchema } from '../schemas/exam-session.schema';
import { Answer, AnswerSchema } from '../schemas/answer.schema';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExamSession.name, schema: ExamSessionSchema },
      { name: Answer.name, schema: AnswerSchema },
    ]),
  ],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}

