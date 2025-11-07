import {
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  Body,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AdminLocalAuthGuard } from './guards/admin-local-auth.guard';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { StudentJwtAuthGuard } from './guards/student-jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { UsersService } from '../users/users.service';

export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Admin username' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'admin123', description: 'Admin password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'Admin login with username and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', schema: { properties: { accessToken: { type: 'string' }, admin: { type: 'object' } } } })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @UseGuards(AdminLocalAuthGuard)
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Request() req, @Body() loginDto: LoginDto) {
    const payload = {
      username: req.user.username,
      role: req.user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      admin: {
        username: req.user.username,
        role: req.user.role,
      },
    };
  }

  @ApiOperation({ summary: 'Get admin profile' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Admin profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(AdminJwtAuthGuard)
  @Get('admin/me')
  async getAdminProfile(@Request() req) {
    return {
      username: req.user.username,
      role: req.user.role,
    };
  }

  @ApiOperation({ summary: 'Get student profile' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Student profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(StudentJwtAuthGuard)
  @Get('student/me')
  async getStudentProfile(@Request() req) {
    return {
      userId: req.user.userId,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    };
  }

  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with token' })
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Request() req, @Res() res: Response): Promise<void> {
    try {
      const googleUser = req.user;

      // Find or create user in database
      const user = await this.usersService.findOrCreate(
        googleUser.googleId,
        googleUser.email,
        googleUser.name,
      );

      // Generate JWT token
      const payload = {
        userId: (user._id as any).toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload);

      // Redirect to frontend with token (adjust URL as needed)
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
    } catch (error) {
      // Handle errors (e.g., invalid email domain)
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const errorMessage = error.message || 'Đăng nhập thất bại';
      
      // Check if it's an email domain error
      if (error.message && error.message.includes('HCMUTE')) {
        res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent('Tài khoản email của bạn không thuộc hệ thống HCMUTE. Vui lòng sử dụng tài khoản Google có đuôi @hcmute.edu.vn hoặc @student.hcmute.edu.vn để đăng nhập.')}`);
      } else {
        res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(errorMessage)}`);
      }
    }
  }
}

