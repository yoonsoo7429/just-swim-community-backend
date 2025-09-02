import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { BadgesService } from './badges.service';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createBadge(@Body() createBadgeDto: CreateBadgeDto) {
    return this.badgesService.createBadge(createBadgeDto);
  }

  @Get()
  async getAllBadges() {
    return this.badgesService.getAllBadges();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyBadges(@Request() req) {
    return this.badgesService.getUserBadges(req.user.id);
  }

  @Get('my/stats')
  @UseGuards(JwtAuthGuard)
  async getMyBadgeStats(@Request() req) {
    return this.badgesService.getUserBadgeStats(req.user.id);
  }

  @Get('user/:userId')
  async getUserBadges(@Param('userId', ParseIntPipe) userId: number) {
    return this.badgesService.getUserBadges(userId);
  }

  @Get('user/:userId/stats')
  async getUserBadgeStats(@Param('userId', ParseIntPipe) userId: number) {
    return this.badgesService.getUserBadgeStats(userId);
  }

  @Post('check')
  @UseGuards(JwtAuthGuard)
  async checkBadges(@Request() req) {
    return this.badgesService.checkAndAwardBadges(req.user.id);
  }
}
