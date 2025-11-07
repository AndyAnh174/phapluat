import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import {
  QuestionsService,
  CreateQuestionDto,
  UpdateQuestionDto,
  BulkCreateQuestionsDto,
} from './questions.service';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';

@ApiTags('Questions (Admin)')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(AdminJwtAuthGuard)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @ApiOperation({ summary: 'Create a new question' })
  @ApiParam({ name: 'examSetId', description: 'Exam set ID' })
  @ApiResponse({ status: 201, description: 'Question created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Exam set not found' })
  @Post('exam-sets/:examSetId/questions')
  create(
    @Param('examSetId') examSetId: string,
    @Body() createDto: CreateQuestionDto,
  ) {
    return this.questionsService.create(examSetId, createDto);
  }

  @ApiOperation({ summary: 'Create multiple questions at once' })
  @ApiParam({ name: 'examSetId', description: 'Exam set ID' })
  @ApiResponse({ status: 201, description: 'Questions created' })
  @Post('exam-sets/:examSetId/questions/bulk')
  bulkCreate(
    @Param('examSetId') examSetId: string,
    @Body() bulkDto: BulkCreateQuestionsDto,
  ) {
    return this.questionsService.bulkCreate(examSetId, bulkDto);
  }

  @ApiOperation({ summary: 'Get all questions for an exam set' })
  @ApiParam({ name: 'examSetId', description: 'Exam set ID' })
  @ApiResponse({ status: 200, description: 'List of questions' })
  @Get('exam-sets/:examSetId/questions')
  findAll(@Param('examSetId') examSetId: string) {
    return this.questionsService.findAll(examSetId);
  }

  @ApiOperation({ summary: 'Get question by ID' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Question details' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  @Get('questions/:id')
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update question' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Question updated' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  @Patch('questions/:id')
  update(@Param('id') id: string, @Body() updateDto: UpdateQuestionDto) {
    return this.questionsService.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Delete question' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Question deleted' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  @Delete('questions/:id')
  remove(@Param('id') id: string) {
    return this.questionsService.remove(id);
  }
}

