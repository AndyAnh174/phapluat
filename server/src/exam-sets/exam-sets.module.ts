import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExamSet, ExamSetSchema } from '../schemas/exam-set.schema';
import { ExamSetsService } from './exam-sets.service';
import { ExamSetsController } from './exam-sets.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ExamSet.name, schema: ExamSetSchema }]),
  ],
  controllers: [ExamSetsController],
  providers: [ExamSetsService],
  exports: [ExamSetsService],
})
export class ExamSetsModule {}

