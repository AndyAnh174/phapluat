import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { Book, BookDocument } from '../schemas/book.schema';

export class CreateBookDto {
  @ApiProperty({ example: 'The Great Book', description: 'Book title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'A Subtitle', description: 'Book subtitle' })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiPropertyOptional({ example: 'This is a great book...', description: 'Book description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg', description: 'Cover image URL' })
  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: 'A memorable quote from the book', description: 'Notable quote' })
  @IsString()
  @IsOptional()
  quote?: string;

  @ApiProperty({ example: 'John Doe', description: 'Author name' })
  @IsString()
  @IsNotEmpty()
  author: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Publication date (ISO string)' })
  @IsDateString()
  publishedAt: Date;

  @ApiPropertyOptional({ example: true, description: 'Whether book is public', default: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class UpdateBookDto {
  @ApiPropertyOptional({ example: 'Updated Title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated Subtitle' })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/new-cover.jpg' })
  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: 'Updated quote' })
  @IsString()
  @IsOptional()
  quote?: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiPropertyOptional({ example: '2024-06-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  publishedAt?: Date;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

@Injectable()
export class BooksService {
  constructor(@InjectModel(Book.name) private bookModel: Model<BookDocument>) {}

  async create(createDto: CreateBookDto) {
    const book = await this.bookModel.create({
      ...createDto,
      isPublic: createDto.isPublic ?? false,
    });

    return book;
  }

  async findAll(
    author?: string,
    year?: number,
    isPublic?: boolean,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (author) {
      filter.author = { $regex: author, $options: 'i' };
    }

    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year + 1, 0, 1);
      filter.publishedAt = { $gte: startDate, $lt: endDate };
    }

    if (isPublic !== undefined) {
      filter.isPublic = isPublic;
    }

    const [data, total] = await Promise.all([
      this.bookModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.bookModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const book = await this.bookModel.findById(id).exec();

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  async update(id: string, updateDto: UpdateBookDto) {
    const book = await this.bookModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  async remove(id: string) {
    const result = await this.bookModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return { message: 'Book deleted successfully' };
  }

  async findPublicBooks(page: number = 1, limit: number = 10) {
    return this.findAll(undefined, undefined, true, page, limit);
  }

  async findPublicOne(id: string) {
    const book = await this.bookModel
      .findOne({ _id: id, isPublic: true })
      .exec();

    if (!book) {
      throw new NotFoundException(
        `Public book with ID ${id} not found or not public`,
      );
    }

    return book;
  }
}

