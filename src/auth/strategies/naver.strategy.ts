import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-naver-v2';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const options = {
      clientID: configService.get('NAVER_CLIENT_ID')!,
      clientSecret: configService.get('NAVER_CLIENT_SECRET')!,
      callbackURL: configService.get('NAVER_CALLBACK_URL')!,
    };
    super(options);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: any,
  ) {
    const user = await this.authService.validateNaverUser(profile);
    return user;
  }
}
