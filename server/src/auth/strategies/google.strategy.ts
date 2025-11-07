import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3001/auth/google/callback';
    
    if (!clientID || !clientSecret) {
      // Don't throw error, just log warning - Google OAuth is optional
      console.warn('Google OAuth credentials not configured. Student login via Google will not work.');
    }
    
    super({
      clientID: clientID || 'dummy',
      clientSecret: clientSecret || 'dummy',
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { emails, name, id } = profile;

    const email = emails[0].value;

    // Validate HCMUTE domain
    const allowedDomains = ['@student.hcmute.edu.vn', '@hcmute.edu.vn'];
    const isValidDomain = allowedDomains.some((domain) =>
      email.endsWith(domain),
    );

    if (!isValidDomain) {
      return done(
        new Error('Only HCMUTE email addresses are allowed'),
        false,
      );
    }

    const user = {
      googleId: id,
      email,
      name: `${name.givenName} ${name.familyName}`,
      role: 'STUDENT',
    };

    done(null, user);
  }
}

