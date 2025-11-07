import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExamService } from './exam.service';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';

export class ActivateExamDto {
  @ApiProperty({ example: '690d234a9ce6dd768e552b6d', description: 'Exam set ID to activate' })
  @IsString()
  @IsNotEmpty()
  examSetId: string;

  @ApiProperty({ 
    example: '2024-12-01T08:00:00.000Z', 
    description: 'Start date/time for the exam (optional, if not provided, exam activates immediately)',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ 
    example: '2024-12-31T23:59:59.000Z', 
    description: 'End date/time for the exam (optional, if not provided, exam stays active until manually deactivated)',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

@ApiTags('Exam Activation (Admin)')
@ApiBearerAuth()
@Controller('admin/exam')
@UseGuards(AdminJwtAuthGuard)
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @ApiOperation({ summary: 'Activate an exam set for students' })
  @ApiBody({ type: ActivateExamDto })
  @ApiResponse({ status: 200, description: 'Exam activated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request (e.g., no questions)' })
  @ApiResponse({ status: 404, description: 'Exam set not found' })
  @Post('activate')
  activate(@Body() activateDto: ActivateExamDto) {
    return this.examService.activate(
      activateDto.examSetId,
      activateDto.startDate ? new Date(activateDto.startDate) : undefined,
      activateDto.endDate ? new Date(activateDto.endDate) : undefined,
    );
  }

  @ApiOperation({ summary: 'Deactivate the current active exam' })
  @ApiResponse({ status: 200, description: 'Exam deactivated successfully' })
  @ApiResponse({ status: 404, description: 'No active exam found' })
  @Post('deactivate')
  deactivate() {
    return this.examService.deactivate();
  }

  @ApiOperation({ summary: 'Get current exam activation status' })
  @ApiResponse({ status: 200, description: 'Exam status retrieved' })
  @Get('status')
  getStatus() {
    return this.examService.getStatus();
  }
}

