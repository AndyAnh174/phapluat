import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ExamSessionsService, SubmitExamDto } from './exam-sessions.service';
import { StudentJwtAuthGuard } from '../auth/guards/student-jwt-auth.guard';
import { ExamService } from '../exam/exam.service';

@ApiTags('Student Exam')
@Controller('student/exam')
export class ExamSessionsController {
  constructor(
    private readonly examSessionsService: ExamSessionsService,
    private readonly examService: ExamService,
  ) {}

  @ApiOperation({ summary: 'Get active exam status for student (public, no auth required)' })
  @ApiResponse({ status: 200, description: 'Exam status retrieved' })
  @Get('status')
  async getStatus() {
    const activeExam = await this.examService.getActiveExamForStudent();
    return {
      isActive: !!activeExam,
      exam: activeExam,
    };
  }

  @ApiOperation({ summary: 'Start an exam session' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Exam session started' })
  @ApiResponse({ status: 404, description: 'No active exam found' })
  @ApiResponse({ status: 403, description: 'Already submitted' })
  @Post('start')
  @UseGuards(StudentJwtAuthGuard)
  async startExam(@Request() req) {
    const userId = req.user.userId;
    return this.examSessionsService.startExam(userId);
  }

  @ApiOperation({ summary: 'Submit exam answers' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Exam submitted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Post('submit')
  @UseGuards(StudentJwtAuthGuard)
  async submitExam(@Request() req, @Body() submitDto: SubmitExamDto) {
    const userId = req.user.userId;
    return this.examSessionsService.submitExam(userId, submitDto);
  }

  @ApiOperation({ summary: 'Get exam result by session ID' })
  @ApiBearerAuth()
  @ApiParam({ name: 'sessionId', description: 'Exam session ID' })
  @ApiResponse({ status: 200, description: 'Exam result retrieved' })
  @ApiResponse({ status: 400, description: 'Exam not yet submitted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @Get('result/:sessionId')
  @UseGuards(StudentJwtAuthGuard)
  async getResult(@Param('sessionId') sessionId: string, @Request() req) {
    const userId = req.user.userId;
    return this.examSessionsService.getResult(sessionId, userId);
  }
}

