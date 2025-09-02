import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { LeaderboardsService } from './leaderboards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('leaderboards')
export class LeaderboardsController {
  constructor(private readonly leaderboardsService: LeaderboardsService) {}

  @Get('level')
  async getLevelLeaderboard(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 20;
    return this.leaderboardsService.getLevelLeaderboard(limitNum);
  }

  @Get('distance/monthly')
  async getMonthlyDistanceLeaderboard(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('limit') limit?: string,
  ) {
    const currentDate = new Date();
    const yearNum = year ? parseInt(year) : currentDate.getFullYear();
    const monthNum = month ? parseInt(month) : currentDate.getMonth() + 1;
    const limitNum = limit ? parseInt(limit) : 20;

    return this.leaderboardsService.getMonthlyDistanceLeaderboard(
      yearNum,
      monthNum,
      limitNum,
    );
  }

  @Get('distance/weekly')
  async getWeeklyDistanceLeaderboard(
    @Query('startDate') startDate?: string,
    @Query('limit') limit?: string,
  ) {
    const start = startDate ? new Date(startDate) : this.getThisWeekStart();
    const limitNum = limit ? parseInt(limit) : 20;

    return this.leaderboardsService.getWeeklyDistanceLeaderboard(
      start,
      limitNum,
    );
  }

  @Get('stroke/:strokeType')
  async getStrokeLeaderboard(
    @Param('strokeType') strokeType: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 20;
    return this.leaderboardsService.getStrokeLeaderboard(strokeType, limitNum);
  }

  @Get('badges')
  async getBadgeLeaderboard(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 20;
    return this.leaderboardsService.getBadgeLeaderboard(limitNum);
  }

  @Get('streak')
  async getStreakLeaderboard(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 20;
    return this.leaderboardsService.getStreakLeaderboard(limitNum);
  }

  @Get('my-rank/:type')
  @UseGuards(JwtAuthGuard)
  async getMyRank(
    @Param('type') type: string,
    @Request() req,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('startDate') startDate?: string,
  ) {
    const params: any = {};

    if (year) params.year = parseInt(year);
    if (month) params.month = parseInt(month);
    if (startDate) params.startDate = new Date(startDate);

    return this.leaderboardsService.getUserRankInLeaderboard(
      req.user.id,
      type,
      params,
    );
  }

  @Get('stats/:type')
  async getLeaderboardStats(
    @Param('type') type: string,
    @Query('userId') userId?: string,
  ) {
    const userIdNum = userId ? parseInt(userId) : undefined;
    return this.leaderboardsService.getLeaderboardStats(type, userIdNum);
  }

  @Get('stats/:type/my')
  @UseGuards(JwtAuthGuard)
  async getMyLeaderboardStats(@Param('type') type: string, @Request() req) {
    return this.leaderboardsService.getLeaderboardStats(type, req.user.id);
  }

  private getThisWeekStart(): Date {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff));
  }
}
