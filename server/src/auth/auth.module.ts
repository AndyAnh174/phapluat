import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminAuthService } from './admin-auth.service';
import { AdminLocalStrategy } from './strategies/admin-local.strategy';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { StudentJwtStrategy } from './strategies/student-jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): any => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is required');
        }
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '1h';
        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AdminAuthService,
    AdminLocalStrategy,
    AdminJwtStrategy,
    StudentJwtStrategy,
    GoogleStrategy,
  ],
  exports: [AdminAuthService],
})
export class AuthModule {}

