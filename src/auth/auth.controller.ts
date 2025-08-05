import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import type { Response } from 'express';
import { KakaoAuthGuard } from './guards/kakao.guard';
import { GoogleAuthGuard } from './guards/google.guard';
import { NaverAuthGuard } from './guards/naver.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Get('kakao')
  @UseGuards(KakaoAuthGuard)
  async kakaoAuth() {
    return;
  }

  @Get('kakao/callback')
  @UseGuards(KakaoAuthGuard)
  async kakaoAuthCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.signin(req.user);

    // JWT 토큰을 쿠키에 저장
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    // 프론트엔드로 리다이렉트 (토큰 정보를 URL 파라미터로 전달)
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/success?token=${result.access_token}`,
    );
  }

  // Google OAuth
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    return;
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.signin(req.user);

    // JWT 토큰을 쿠키에 저장
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    // 프론트엔드로 리다이렉트 (토큰 정보를 URL 파라미터로 전달)
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/success?token=${result.access_token}`,
    );
  }

  // Naver OAuth
  @Get('naver')
  @UseGuards(NaverAuthGuard)
  async naverAuth() {
    return;
  }

  @Get('naver/callback')
  @UseGuards(NaverAuthGuard)
  async naverAuthCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.signin(req.user);

    // JWT 토큰을 쿠키에 저장
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    // 프론트엔드로 리다이렉트 (토큰 정보를 URL 파라미터로 전달)
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/success?token=${result.access_token}`,
    );
  }

  @Get('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('access_token');
    res.redirect(`${process.env.FRONTEND_URL}`);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: any) {
    const user = await this.usersService.findOne(req.user.id);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      provider: user.provider,
      providerId: user.providerId,
      level: user.level,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
