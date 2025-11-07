import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ActiveExamDocument = ActiveExam & Document;

@Schema({ timestamps: true })
export class ActiveExam {
  @Prop({ type: Types.ObjectId, ref: 'ExamSet' })
  examSetId?: Types.ObjectId;

  @Prop({ default: false })
  isActive: boolean;

  @Prop()
  activatedAt?: Date;

  @Prop()
  deactivatedAt?: Date;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;
}

export const ActiveExamSchema = SchemaFactory.createForClass(ActiveExam);

