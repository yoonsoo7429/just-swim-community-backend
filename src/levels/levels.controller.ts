import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { LevelsService } from './levels.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('levels')
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Get()
  async getAllLevels() {
    return this.levelsService.getAllLevels();
  }

  @Get('my/progress')
  @UseGuards(JwtAuthGuard)
  async getMyProgress(@Request() req) {
    return this.levelsService.getUserLevelProgress(req.user.id);
  }

  @Get('user/:userId/progress')
  async getUserProgress(@Param('userId', ParseIntPipe) userId: number) {
    return this.levelsService.getUserLevelProgress(userId);
  }

  @Get('stats')
  async getLevelStats() {
    return this.levelsService.getLevelStats();
  }

  @Get('leaderboard')
  async getTopUsers(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 10;
    return this.levelsService.getTopLevelUsers(limitNum);
  }

  @Post('my/recalculate')
  @UseGuards(JwtAuthGuard)
  async recalculateMyXP(@Request() req) {
    await this.levelsService.recalculateUserXP(req.user.id);
    return { message: 'XP recalculated successfully' };
  }

  @Get('info/:level')
  async getLevelInfo(@Param('level', ParseIntPipe) level: number) {
    const info = this.levelsService.getLevelInfo(level);
    if (!info) {
      throw new Error('Level not found');
    }
    return info;
  }
}
