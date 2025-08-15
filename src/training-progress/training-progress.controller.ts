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
import { TrainingProgressService } from './training-progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('training-progress')
@UseGuards(JwtAuthGuard)
export class TrainingProgressController {
  constructor(
    private readonly trainingProgressService: TrainingProgressService,
  ) {}

  // Program Progress Endpoints
  @Post('programs/:id/start')
  startProgram(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { totalSessions: number },
    @Request() req: any,
  ) {
    return this.trainingProgressService.startProgram(
      id,
      req.user.id,
      data.totalSessions,
    );
  }

  @Post('sessions/:id/complete')
  completeSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() completionData: any,
    @Request() req: any,
  ) {
    return this.trainingProgressService.completeSession(
      id,
      req.user.id,
      completionData.programId,
      completionData,
    );
  }

  @Get('programs/:id/progress')
  getProgramProgress(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.trainingProgressService.getProgramProgress(id, req.user.id);
  }

  @Get('programs/my-progress')
  getMyProgramsProgress(@Request() req: any) {
    return this.trainingProgressService.getUserProgramsProgress(req.user.id);
  }

  @Patch('sessions/:id/completion')
  updateSessionCompletion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: any,
    @Request() req: any,
  ) {
    return this.trainingProgressService.updateSessionCompletion(
      id,
      req.user.id,
      updateData,
    );
  }

  @Delete('sessions/:id/completion')
  deleteSessionCompletion(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.trainingProgressService.deleteSessionCompletion(
      id,
      req.user.id,
    );
  }
}
