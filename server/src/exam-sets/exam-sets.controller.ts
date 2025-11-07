import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { ExamSetsService, CreateExamSetDto, UpdateExamSetDto } from './exam-sets.service';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';

@ApiTags('Exam Sets (Admin)')
@ApiBearerAuth()
@Controller('admin/exam-sets')
@UseGuards(AdminJwtAuthGuard)
export class ExamSetsController {
  constructor(private readonly examSetsService: ExamSetsService) {}

  @ApiOperation({ summary: 'Create a new exam set' })
  @ApiResponse({ status: 201, description: 'Exam set created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  create(@Body() createDto: CreateExamSetDto, @Request() req) {
    // For admin, create a new ObjectId (in production, you'd get admin user from DB)
    const createdBy = new Types.ObjectId().toString();
    return this.examSetsService.create(createDto, createdBy);
  }

  @ApiOperation({ summary: 'Get all exam sets with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'List of exam sets' })
  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.examSetsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @ApiOperation({ summary: 'Get exam set by ID' })
  @ApiParam({ name: 'id', description: 'Exam set ID' })
  @ApiResponse({ status: 200, description: 'Exam set details' })
  @ApiResponse({ status: 404, description: 'Exam set not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examSetsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update exam set' })
  @ApiParam({ name: 'id', description: 'Exam set ID' })
  @ApiResponse({ status: 200, description: 'Exam set updated' })
  @ApiResponse({ status: 404, description: 'Exam set not found' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateExamSetDto) {
    return this.examSetsService.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Delete exam set' })
  @ApiParam({ name: 'id', description: 'Exam set ID' })
  @ApiResponse({ status: 200, description: 'Exam set deleted' })
  @ApiResponse({ status: 404, description: 'Exam set not found' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.examSetsService.remove(id);
  }

  @ApiOperation({ summary: 'Duplicate exam set' })
  @ApiParam({ name: 'id', description: 'Exam set ID to duplicate' })
  @ApiResponse({ status: 201, description: 'Exam set duplicated' })
  @ApiResponse({ status: 404, description: 'Exam set not found' })
  @Post(':id/duplicate')
  duplicate(@Param('id') id: string, @Request() req) {
    const createdBy = new Types.ObjectId().toString();
    return this.examSetsService.duplicate(id, createdBy);
  }
}

