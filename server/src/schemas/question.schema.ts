import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuestionDocument = Question & Document;

export interface QuestionOption {
  A: string;
  B: string;
  C: string;
  D: string;
}

@Schema({ timestamps: true })
export class Question {
  @Prop({ type: Types.ObjectId, ref: 'ExamSet', required: true })
  examSetId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({
    type: {
      A: String,
      B: String,
      C: String,
      D: String,
    },
    required: true,
  })
  options: QuestionOption;

  @Prop({ required: true, enum: ['A', 'B', 'C', 'D'] })
  correctAnswer: string;

  @Prop({ required: true, min: 0 })
  order: number;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
QuestionSchema.index({ examSetId: 1, order: 1 });

