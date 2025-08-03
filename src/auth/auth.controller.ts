import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  async kakaoAuth() {
    // Kakao OAuth 시작
  }

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoAuthCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.signin(req.user);

    // JWT 토큰을 쿠키에 저장
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    // 프론트엔드로 리다이렉트
    res.redirect(`${process.env.FRONTEND_URL}/auth/success`);
  }

  @Get('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('access_token');
    res.redirect(`${process.env.FRONTEND_URL}`);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: any) {
    return req.user;
  }
}
