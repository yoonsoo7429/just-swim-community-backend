import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StreakType } from './entities/streak.entity';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  async createGoal(@Body() createGoalDto: CreateGoalDto, @Request() req) {
    return this.goalsService.createGoal(createGoalDto, req.user.id);
  }

  @Get('my')
  async getMyGoals(@Request() req) {
    return this.goalsService.getUserActiveGoals(req.user.id);
  }

  @Get('recommendations')
  async getRecommendations(@Request() req) {
    return this.goalsService.getPersonalizedGoalRecommendations(req.user.id);
  }

  @Get('streaks')
  async getMyStreaks(@Request() req) {
    return this.goalsService.getStreakInfo(req.user.id);
  }

  @Get(':id/progress')
  async getGoalProgress(@Param('id', ParseIntPipe) id: number) {
    return this.goalsService.getGoalProgress(id);
  }

  @Put(':id')
  async updateGoal(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGoalDto: UpdateGoalDto,
  ) {
    return this.goalsService.updateGoal(id, updateGoalDto);
  }

  @Put(':id/complete')
  async completeGoal(@Param('id', ParseIntPipe) id: number) {
    return this.goalsService.completeGoal(id);
  }

  @Delete(':id')
  async deleteGoal(@Param('id', ParseIntPipe) id: number) {
    await this.goalsService.deleteGoal(id);
    return { message: 'Goal deleted successfully' };
  }

  @Post('streaks/:type/update')
  async updateStreak(
    @Param('type') type: StreakType,
    @Request() req,
    @Body('activityDate') activityDate?: string,
  ) {
    const date = activityDate ? new Date(activityDate) : new Date();
    return this.goalsService.updateStreak(req.user.id, type, date);
  }

  @Get('streaks/:type')
  async getStreak(@Param('type') type: StreakType, @Request() req) {
    return this.goalsService.getUserStreak(req.user.id, type);
  }

  @Get('my-stats')
  @UseGuards(JwtAuthGuard)
  getMyStats(@Request() req) {
    return this.goalsService.getUserStats(req.user.id);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  getIntegratedDashboard(@Request() req) {
    return this.goalsService.getIntegratedDashboard(req.user.id);
  }

  @Get('challenge-goals')
  @UseGuards(JwtAuthGuard)
  getChallengeLinkedGoals(@Request() req) {
    return this.goalsService.getChallengeLinkedGoals(req.user.id);
  }

  @Get('challenge-recommendations')
  @UseGuards(JwtAuthGuard)
  getChallengeBasedRecommendations(@Request() req) {
    return this.goalsService.getChallengeBasedRecommendations(req.user.id);
  }

  @Post('challenge-linked')
  @UseGuards(JwtAuthGuard)
  createChallengeLinkedGoal(
    @Body() createChallengeGoalDto: any,
    @Request() req,
  ) {
    return this.goalsService.createChallengeLinkedGoal(
      req.user.id,
      createChallengeGoalDto.challengeId,
      createChallengeGoalDto.challengeTitle,
      createChallengeGoalDto.targetValue,
      createChallengeGoalDto.unit,
      new Date(createChallengeGoalDto.startDate),
      new Date(createChallengeGoalDto.endDate),
    );
  }
}
