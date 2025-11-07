import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnswerDocument = Answer & Document;

@Schema({ timestamps: true })
export class Answer {
  @Prop({ type: Types.ObjectId, ref: 'ExamSession', required: true })
  sessionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Question', required: true })
  questionId: Types.ObjectId;

  @Prop({ required: true, enum: ['A', 'B', 'C', 'D'] })
  selectedAnswer: string;

  @Prop({ required: true })
  isCorrect: boolean;
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);
AnswerSchema.index({ sessionId: 1, questionId: 1 }, { unique: true });

