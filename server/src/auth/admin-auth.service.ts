import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminAuthService {
  constructor(private configService: ConfigService) {}

  async validateAdmin(username: string, password: string): Promise<any> {
    const adminUsername = this.configService.get<string>('ADMIN_USERNAME');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
    const adminPasswordHash = this.configService.get<string>(
      'ADMIN_PASSWORD_HASH',
    );

    if (username !== adminUsername) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let isValid = false;

    if (adminPasswordHash) {
      // Use bcrypt to verify hashed password
      isValid = await bcrypt.compare(password, adminPasswordHash);
    } else if (adminPassword) {
      // Use plaintext comparison
      isValid = password === adminPassword;
    } else {
      throw new UnauthorizedException('Admin password not configured');
    }

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Return admin user object
    return {
      username: adminUsername,
      role: 'ADMIN',
    };
  }
}

