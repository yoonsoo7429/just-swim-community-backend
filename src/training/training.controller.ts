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
} from '@nestjs/common';
import { TrainingService } from './training.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('training')
@UseGuards(JwtAuthGuard)
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  // Training Program Endpoints
  @Post('programs')
  createProgram(@Body() programData: any, @Request() req: any) {
    return this.trainingService.createProgram(programData, req.user.id);
  }

  @Get('programs/my-programs')
  findMyPrograms(@Request() req: any) {
    return this.trainingService.findMyPrograms(req.user.id);
  }

  @Get('programs/public')
  findPublicPrograms() {
    return this.trainingService.findPublicPrograms();
  }

  @Get('programs/:id')
  findProgramById(@Param('id', ParseIntPipe) id: number) {
    return this.trainingService.findProgramById(id);
  }

  @Patch('programs/:id')
  updateProgram(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: any,
    @Request() req: any,
  ) {
    return this.trainingService.updateProgram(id, updateData, req.user.id);
  }

  @Delete('programs/:id')
  deleteProgram(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.trainingService.deleteProgram(id, req.user.id);
  }

  @Post('programs/:id/join')
  joinProgram(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.trainingService.joinProgram(id, req.user.id);
  }

  @Delete('programs/:id/leave')
  leaveProgram(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.trainingService.leaveProgram(id, req.user.id);
  }

  @Get('programs/:id/participants')
  findProgramParticipants(@Param('id', ParseIntPipe) id: number) {
    return this.trainingService.findProgramParticipants(id);
  }

  // Training Session Endpoints
  @Post('sessions')
  createSession(@Body() sessionData: any, @Request() req: any) {
    return this.trainingService.createSession(sessionData, req.user.id);
  }

  @Get('programs/:id/sessions')
  findSessionsByProgram(@Param('id', ParseIntPipe) id: number) {
    return this.trainingService.findSessionsByProgram(id);
  }

  // Training Series Endpoints
  @Post('series')
  createSeries(@Body() createSeriesDto: any, @Request() req: any) {
    return this.trainingService.createSeries(createSeriesDto, req.user.id);
  }

  @Get('series/my-series')
  findMySeries(@Request() req: any) {
    return this.trainingService.findMySeries(req.user.id);
  }

  @Get('series/public')
  findPublicSeries() {
    return this.trainingService.findPublicSeries();
  }

  @Get('series/:id')
  findSeriesById(@Param('id') id: string) {
    return this.trainingService.findSeriesById(+id);
  }

  @Patch('series/:id')
  updateSeries(
    @Param('id') id: string,
    @Body() updateSeriesDto: any,
    @Request() req: any,
  ) {
    return this.trainingService.updateSeries(+id, updateSeriesDto, req.user.id);
  }

  @Delete('series/:id')
  deleteSeries(@Param('id') id: string, @Request() req: any) {
    return this.trainingService.deleteSeries(+id, req.user.id);
  }

  @Post('series/:id/publish')
  publishSeries(@Param('id') id: string, @Request() req: any) {
    return this.trainingService.publishSeries(+id, req.user.id);
  }

  @Post('series/:id/unpublish')
  unpublishSeries(@Param('id') id: string, @Request() req: any) {
    return this.trainingService.unpublishSeries(+id, req.user.id);
  }

  // Training Meeting Endpoints
  @Post('meetings')
  createMeeting(@Body() createMeetingDto: any) {
    return this.trainingService.createMeeting(createMeetingDto);
  }

  @Get('series/:id/meetings')
  findMeetingsBySeries(@Param('id') id: string) {
    return this.trainingService.findMeetingsBySeries(+id);
  }

  @Get('meetings/:id')
  findMeetingById(@Param('id') id: string) {
    return this.trainingService.findMeetingById(+id);
  }

  @Patch('meetings/:id')
  updateMeeting(
    @Param('id') id: string,
    @Body() updateMeetingDto: any,
    @Request() req: any,
  ) {
    return this.trainingService.updateMeeting(
      +id,
      updateMeetingDto,
      req.user.id,
    );
  }

  @Delete('meetings/:id')
  deleteMeeting(@Param('id') id: string, @Request() req: any) {
    return this.trainingService.deleteMeeting(+id, req.user.id);
  }

  // Meeting Participation Endpoints
  @Post('meetings/:id/join')
  joinMeeting(
    @Param('id') id: string,
    @Body() joinData: any,
    @Request() req: any,
  ) {
    return this.trainingService.joinMeeting(+id, req.user.id, joinData);
  }

  @Delete('meetings/:id/leave')
  leaveMeeting(@Param('id') id: string, @Request() req: any) {
    return this.trainingService.leaveMeeting(+id, req.user.id);
  }

  @Get('meetings/:id/participants')
  findMeetingParticipants(@Param('id') id: string) {
    return this.trainingService.findMeetingParticipants(+id);
  }

  @Get('meetings/my-participations')
  findMyMeetingParticipations(@Request() req: any) {
    return this.trainingService.findMyMeetingParticipations(req.user.id);
  }

  // Auto-generation Endpoints
  @Post('series/:id/generate-next-meetings')
  generateNextMeetings(@Param('id') id: string, @Request() req: any) {
    return this.trainingService.generateNextMeetings(+id, req.user.id);
  }

  @Post('series/:id/generate-recurring-meetings')
  generateRecurringMeetings(
    @Param('id') id: string,
    @Body() params: { weeks?: number },
    @Request() req: any,
  ) {
    return this.trainingService.generateRecurringMeetings(
      +id,
      req.user.id,
      params.weeks,
    );
  }
}
