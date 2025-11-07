import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExamSetDocument = ExamSet & Document;

@Schema({ timestamps: true })
export class ExamSet {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true, min: 1 })
  durationMinutes: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const ExamSetSchema = SchemaFactory.createForClass(ExamSet);

