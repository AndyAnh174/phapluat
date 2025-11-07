import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from '../schemas/book.schema';
import { BooksService } from './books.service';
import { BooksAdminController, BooksPublicController } from './books.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Book.name, schema: BookSchema }]),
  ],
  controllers: [BooksAdminController, BooksPublicController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}

