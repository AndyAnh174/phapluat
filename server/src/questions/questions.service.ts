import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IsString, IsNotEmpty, IsOptional, IsIn, IsNumber, Min, ValidateNested, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { Question, QuestionDocument } from '../schemas/question.schema';
import { ExamSet, ExamSetDocument } from '../schemas/exam-set.schema';

export class QuestionOptionsDto {
  @ApiProperty({ example: 'Option A text' })
  @IsString()
  @IsNotEmpty()
  A: string;

  @ApiProperty({ example: 'Option B text' })
  @IsString()
  @IsNotEmpty()
  B: string;

  @ApiProperty({ example: 'Option C text' })
  @IsString()
  @IsNotEmpty()
  C: string;

  @ApiProperty({ example: 'Option D text' })
  @IsString()
  @IsNotEmpty()
  D: string;
}

export class CreateQuestionDto {
  @ApiProperty({ example: 'What is 2 + 2?', description: 'Question content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ type: QuestionOptionsDto, description: 'Answer options' })
  @ValidateNested()
  @Type(() => QuestionOptionsDto)
  options: QuestionOptionsDto;

  @ApiProperty({ example: 'B', enum: ['A', 'B', 'C', 'D'], description: 'Correct answer' })
  @IsString()
  @IsIn(['A', 'B', 'C', 'D'])
  correctAnswer: 'A' | 'B' | 'C' | 'D';

  @ApiProperty({ example: 1, description: 'Question order', minimum: 0 })
  @IsNumber()
  @Min(0)
  order: number;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional({ example: 'Updated question content' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ type: QuestionOptionsDto })
  @ValidateNested()
  @Type(() => QuestionOptionsDto)
  @IsOptional()
  options?: QuestionOptionsDto;

  @ApiPropertyOptional({ example: 'A', enum: ['A', 'B', 'C', 'D'] })
  @IsString()
  @IsIn(['A', 'B', 'C', 'D'])
  @IsOptional()
  correctAnswer?: 'A' | 'B' | 'C' | 'D';

  @ApiPropertyOptional({ example: 1, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class BulkCreateQuestionsDto {
  @ApiProperty({ type: [CreateQuestionDto], description: 'Array of questions to create' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @InjectModel(ExamSet.name) private examSetModel: Model<ExamSetDocument>,
  ) {}

  async create(examSetId: string, createDto: CreateQuestionDto) {
    // Verify exam set exists
    const examSet = await this.examSetModel.findById(examSetId).exec();
    if (!examSet) {
      throw new NotFoundException(`ExamSet with ID ${examSetId} not found`);
    }

    // Validate correctAnswer
    if (!['A', 'B', 'C', 'D'].includes(createDto.correctAnswer)) {
      throw new BadRequestException(
        'correctAnswer must be one of: A, B, C, D',
      );
    }

    // Validate options
    if (
      !createDto.options.A ||
      !createDto.options.B ||
      !createDto.options.C ||
      !createDto.options.D
    ) {
      throw new BadRequestException('All options (A, B, C, D) are required');
    }

    const question = await this.questionModel.create({
      ...createDto,
      examSetId: new Types.ObjectId(examSetId),
    });

    return question;
  }

  async bulkCreate(examSetId: string, bulkDto: BulkCreateQuestionsDto) {
    // Verify exam set exists
    const examSet = await this.examSetModel.findById(examSetId).exec();
    if (!examSet) {
      throw new NotFoundException(`ExamSet with ID ${examSetId} not found`);
    }

    const questions = bulkDto.questions.map((q) => ({
      ...q,
      examSetId: new Types.ObjectId(examSetId),
    }));

    // Validate all questions
    for (const q of questions) {
      if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
        throw new BadRequestException(
          `Question ${q.order}: correctAnswer must be one of: A, B, C, D`,
        );
      }
      if (!q.options.A || !q.options.B || !q.options.C || !q.options.D) {
        throw new BadRequestException(
          `Question ${q.order}: All options (A, B, C, D) are required`,
        );
      }
    }

    const created = await this.questionModel.insertMany(questions);
    return created;
  }

  async findAll(examSetId: string) {
    const questions = await this.questionModel
      .find({ examSetId: new Types.ObjectId(examSetId) })
      .sort({ order: 1 })
      .exec();

    return questions;
  }

  async findOne(id: string) {
    const question = await this.questionModel.findById(id).exec();

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    return question;
  }

  async update(id: string, updateDto: UpdateQuestionDto) {
    if (updateDto.correctAnswer && !['A', 'B', 'C', 'D'].includes(updateDto.correctAnswer)) {
      throw new BadRequestException(
        'correctAnswer must be one of: A, B, C, D',
      );
    }

    const question = await this.questionModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    return question;
  }

  async remove(id: string) {
    const result = await this.questionModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    return { message: 'Question deleted successfully' };
  }
}

