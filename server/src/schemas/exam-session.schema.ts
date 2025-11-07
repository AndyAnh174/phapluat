import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExamSessionDocument = ExamSession & Document;

@Schema({ timestamps: true })
export class ExamSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ExamSet', required: true })
  examSetId: Types.ObjectId;

  @Prop({ required: true })
  startedAt: Date;

  @Prop()
  submittedAt?: Date;

  @Prop({ min: 0, max: 100 })
  score?: number;
}

export const ExamSessionSchema = SchemaFactory.createForClass(ExamSession);
ExamSessionSchema.index({ userId: 1, examSetId: 1 });

