import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { CommunityRecruitmentService } from './community-recruitment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('community-recruitment')
@UseGuards(JwtAuthGuard)
export class CommunityRecruitmentController {
  constructor(
    private readonly communityRecruitmentService: CommunityRecruitmentService,
  ) {}

  // Community Recruitment Endpoints
  @Post('programs/:id/recruit')
  createCommunityRecruitment(
    @Param('id', ParseIntPipe) id: number,
    @Body() recruitmentData: any,
    @Request() req: any,
  ) {
    return this.communityRecruitmentService.createCommunityRecruitment(
      id,
      req.user.id,
      recruitmentData,
    );
  }

  @Get('recruitments')
  getCommunityRecruitments(
    @Query('type') type?: 'short-term' | 'recurring',
    @Query('targetLevel') targetLevel?: string,
    @Query('status') status?: string,
  ) {
    return this.communityRecruitmentService.getCommunityRecruitments(
      type,
      targetLevel,
      status,
    );
  }

  @Get('recruitments/my')
  getMyRecruitments(@Request() req: any) {
    return this.communityRecruitmentService.getMyRecruitments(req.user.id);
  }

  @Patch('recruitments/:id')
  updateRecruitment(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: any,
    @Request() req: any,
  ) {
    return this.communityRecruitmentService.updateRecruitment(
      id,
      req.user.id,
      updateData,
    );
  }

  @Delete('recruitments/:id')
  deleteRecruitment(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.communityRecruitmentService.deleteRecruitment(id, req.user.id);
  }

  @Post('recruitments/:id/join')
  joinRecruitment(
    @Param('id', ParseIntPipe) id: number,
    @Body() joinData: any,
    @Request() req: any,
  ) {
    return this.communityRecruitmentService.joinRecruitment(
      id,
      req.user.id,
      joinData,
    );
  }

  @Delete('recruitments/:id/leave')
  leaveRecruitment(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.communityRecruitmentService.leaveRecruitment(id, req.user.id);
  }

  @Get('recruitments/:id/participants')
  getRecruitmentParticipants(@Param('id', ParseIntPipe) id: number) {
    return this.communityRecruitmentService.getRecruitmentParticipants(id);
  }

  @Get('recruitments/my-participations')
  getMyRecruitmentParticipations(@Request() req: any) {
    return this.communityRecruitmentService.getMyRecruitmentParticipations(
      req.user.id,
    );
  }

  @Get('recruitments/:id/statistics')
  getRecruitmentStatistics(@Param('id', ParseIntPipe) id: number) {
    return this.communityRecruitmentService.getRecruitmentStatistics(id);
  }

  // Auto-update endpoints
  @Post('recruitments/auto-update-recurring')
  updateRecurringRecruitments() {
    return this.communityRecruitmentService.updateRecurringRecruitments();
  }

  @Post('recruitments/auto-close-expired')
  closeExpiredShortTermRecruitments() {
    return this.communityRecruitmentService.closeExpiredShortTermRecruitments();
  }
}
