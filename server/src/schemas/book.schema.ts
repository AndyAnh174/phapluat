import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BookDocument = Book & Document;

@Schema({ timestamps: true })
export class Book {
  @Prop({ required: true })
  title: string;

  @Prop()
  subtitle?: string;

  @Prop()
  description?: string;

  @Prop()
  coverImageUrl?: string;

  @Prop()
  quote?: string;

  @Prop({ required: true })
  author: string;

  @Prop({ required: true })
  publishedAt: Date;

  @Prop({ default: false })
  isPublic: boolean;
}

export const BookSchema = SchemaFactory.createForClass(Book);

