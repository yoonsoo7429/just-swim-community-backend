import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { SocialService } from './social.service';
import { CreateFriendshipDto } from './dto/create-friendship.dto';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { RespondFriendshipDto } from './dto/respond-friendship.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChallengeStatus } from './entities/challenge.entity';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // 친구 관련 API
  @Post('friends/request')
  async sendFriendRequest(
    @Body() createFriendshipDto: CreateFriendshipDto,
    @Request() req,
  ) {
    return this.socialService.sendFriendRequest(
      req.user.id,
      createFriendshipDto,
    );
  }

  @Put('friends/requests/:id/respond')
  async respondToFriendRequest(
    @Param('id', ParseIntPipe) friendshipId: number,
    @Body() respondDto: RespondFriendshipDto,
    @Request() req,
  ) {
    return this.socialService.respondToFriendRequest(
      friendshipId,
      req.user.id,
      respondDto,
    );
  }

  @Get('friends')
  async getFriends(@Request() req) {
    return this.socialService.getFriends(req.user.id);
  }

  @Get('friends/requests')
  async getFriendRequests(@Request() req) {
    return this.socialService.getFriendRequests(req.user.id);
  }

  @Get('friends/suggestions')
  async getFriendSuggestions(@Request() req, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 5;
    return this.socialService.getFriendSuggestions(req.user.id, limitNum);
  }

  @Get('users/search')
  async searchUsers(
    @Query('q') query: string,
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 10;
    return this.socialService.searchUsers(query, req.user.id, limitNum);
  }

  // 챌린지 관련 API
  @Post('challenges')
  async createChallenge(
    @Body() createChallengeDto: CreateChallengeDto,
    @Request() req,
  ) {
    return this.socialService.createChallenge(req.user.id, createChallengeDto);
  }

  @Post('challenges/:id/join')
  async joinChallenge(
    @Param('id', ParseIntPipe) challengeId: number,
    @Request() req,
  ) {
    return this.socialService.joinChallenge(challengeId, req.user.id);
  }

  @Get('challenges/public')
  async getPublicChallenges(
    @Request() req,
    @Query('status') status?: ChallengeStatus,
  ) {
    return this.socialService.getPublicChallenges(req.user.id, status);
  }

  @Get('challenges/my')
  async getUserChallenges(@Request() req) {
    return this.socialService.getUserChallenges(req.user.id);
  }

  @Get('challenges/:id')
  async getChallengeDetails(
    @Param('id', ParseIntPipe) challengeId: number,
    @Request() req,
  ) {
    return this.socialService.getChallengeDetails(challengeId, req.user.id);
  }

  @Put('challenges/:id/progress')
  async updateChallengeProgress(
    @Param('id', ParseIntPipe) challengeId: number,
    @Body('progress') progress: number,
    @Request() req,
  ) {
    return this.socialService.updateChallengeProgress(
      req.user.id,
      challengeId,
      progress,
    );
  }

  // 소셜 피드 API
  @Get('feed')
  async getSocialFeed(@Request() req, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 20;
    return this.socialService.getSocialFeed(req.user.id, limitNum);
  }

  // 친구 상태 확인 API
  @Get('friends/status/:userId')
  async getFriendshipStatus(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req,
  ) {
    return this.socialService.getFriendshipStatus(req.user.id, userId);
  }
}
