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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  BooksService,
  CreateBookDto,
  UpdateBookDto,
} from './books.service';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';

@ApiTags('Books (Admin)')
@ApiBearerAuth()
@Controller('admin/books')
@UseGuards(AdminJwtAuthGuard)
export class BooksAdminController {
  constructor(private readonly booksService: BooksService) {}

  @ApiOperation({ summary: 'Create a new book' })
  @ApiResponse({ status: 201, description: 'Book created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  create(@Body() createDto: CreateBookDto) {
    return this.booksService.create(createDto);
  }

  @ApiOperation({ summary: 'Get all books with filters and pagination' })
  @ApiQuery({ name: 'author', required: false, description: 'Filter by author name' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Filter by publication year' })
  @ApiQuery({ name: 'isPublic', required: false, type: Boolean, description: 'Filter by public status' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'List of books' })
  @Get()
  findAll(
    @Query('author') author?: string,
    @Query('year') year?: string,
    @Query('isPublic') isPublic?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.booksService.findAll(
      author,
      year ? parseInt(year) : undefined,
      isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @ApiOperation({ summary: 'Get book by ID' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiResponse({ status: 200, description: 'Book details' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @ApiOperation({ summary: 'Update book' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiResponse({ status: 200, description: 'Book updated' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateBookDto) {
    return this.booksService.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Delete book' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiResponse({ status: 200, description: 'Book deleted' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }
}

@ApiTags('Books (Public)')
@Controller('books')
export class BooksPublicController {
  constructor(private readonly booksService: BooksService) {}

  @ApiOperation({ summary: 'Get all public books' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'List of public books' })
  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.booksService.findPublicBooks(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @ApiOperation({ summary: 'Get public book by ID' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiResponse({ status: 200, description: 'Public book details' })
  @ApiResponse({ status: 404, description: 'Book not found or not public' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.booksService.findPublicOne(id);
  }
}

