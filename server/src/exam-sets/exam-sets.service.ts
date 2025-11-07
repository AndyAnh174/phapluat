import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Model, Types } from 'mongoose';
import { ExamSet, ExamSetDocument } from '../schemas/exam-set.schema';

export class CreateExamSetDto {
  @ApiProperty({ example: 'Midterm Exam 2024', description: 'Exam set name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'This is a midterm exam', description: 'Exam set description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 60, description: 'Duration in minutes', minimum: 1 })
  @IsNumber()
  @Min(1)
  durationMinutes: number;
}

export class UpdateExamSetDto {
  @ApiPropertyOptional({ example: 'Updated Exam Name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 90, minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;
}

@Injectable()
export class ExamSetsService {
  constructor(
    @InjectModel(ExamSet.name) private examSetModel: Model<ExamSetDocument>,
  ) {}

  async create(createDto: CreateExamSetDto, createdBy: string) {
    if (createDto.durationMinutes < 1) {
      throw new BadRequestException('Duration must be at least 1 minute');
    }

    const examSet = await this.examSetModel.create({
      ...createDto,
      createdBy: new Types.ObjectId(createdBy),
    });

    return examSet;
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.examSetModel
        .find()
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.examSetModel.countDocuments().exec(),
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
    const examSet = await this.examSetModel
      .findById(id)
      .populate('createdBy', 'name email')
      .exec();

    if (!examSet) {
      throw new NotFoundException(`ExamSet with ID ${id} not found`);
    }

    return examSet;
  }

  async update(id: string, updateDto: UpdateExamSetDto) {
    if (updateDto.durationMinutes && updateDto.durationMinutes < 1) {
      throw new BadRequestException('Duration must be at least 1 minute');
    }

    const examSet = await this.examSetModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();

    if (!examSet) {
      throw new NotFoundException(`ExamSet with ID ${id} not found`);
    }

    return examSet;
  }

  async remove(id: string) {
    const result = await this.examSetModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`ExamSet with ID ${id} not found`);
    }

    return { message: 'ExamSet deleted successfully' };
  }

  async duplicate(id: string, createdBy: string) {
    const original = await this.findOne(id);

    const duplicated = await this.examSetModel.create({
      name: `${original.name} (Copy)`,
      description: original.description,
      durationMinutes: original.durationMinutes,
      createdBy: new Types.ObjectId(createdBy),
    });

    return duplicated;
  }
}

