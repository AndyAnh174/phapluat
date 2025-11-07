import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Res,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ResultsService } from './results.service';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';

@ApiTags('Results (Admin)')
@ApiBearerAuth()
@Controller('admin/results')
@UseGuards(AdminJwtAuthGuard)
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @ApiOperation({ summary: 'Get all exam results with pagination' })
  @ApiQuery({ name: 'examSetId', required: false, description: 'Filter by exam set ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'List of results' })
  @Get()
  findAll(
    @Query('examSetId') examSetId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.resultsService.findAll(
      examSetId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @ApiOperation({ summary: 'Get detailed result by session ID' })
  @ApiParam({ name: 'sessionId', description: 'Exam session ID' })
  @ApiResponse({ status: 200, description: 'Result details' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @Get(':sessionId')
  findOne(@Param('sessionId') sessionId: string) {
    return this.resultsService.findOne(sessionId);
  }

  @ApiOperation({ summary: 'Reset exam session to allow retake' })
  @ApiParam({ name: 'sessionId', description: 'Exam session ID' })
  @ApiResponse({ status: 200, description: 'Session reset successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @Post(':sessionId/reset')
  reset(@Param('sessionId') sessionId: string) {
    return this.resultsService.reset(sessionId);
  }

  @ApiOperation({ summary: 'Export results as JSON' })
  @ApiQuery({ name: 'examSetId', required: false, description: 'Filter by exam set ID' })
  @ApiResponse({ status: 200, description: 'JSON export' })
  @Get('export/json')
  async exportJSON(@Query('examSetId') examSetId?: string) {
    const data = await this.resultsService.exportJSON(examSetId);
    return data;
  }

  @ApiOperation({ summary: 'Export results as CSV file' })
  @ApiQuery({ name: 'examSetId', required: false, description: 'Filter by exam set ID' })
  @ApiResponse({ status: 200, description: 'CSV file download', content: { 'text/csv': {} } })
  @Get('export/csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=results.csv')
  async exportCSV(
    @Query('examSetId') examSetId: string,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.resultsService.exportCSV(examSetId);
    res.send(csv);
  }
}

