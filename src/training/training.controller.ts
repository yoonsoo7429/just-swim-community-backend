import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { TrainingService } from './training.service';

@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Post('programs')
  createProgram(@Body() programData: any) {
    return this.trainingService.createProgram(programData);
  }

  @Get('programs')
  findAllPrograms() {
    return this.trainingService.findAllPrograms();
  }

  @Get('programs/:id')
  findProgramById(@Param('id', ParseIntPipe) id: number) {
    return this.trainingService.findProgramById(id);
  }

  @Post('sessions')
  createSession(@Body() sessionData: any) {
    return this.trainingService.createSession(sessionData);
  }

  @Get('programs/:id/sessions')
  findSessionsByProgram(@Param('id', ParseIntPipe) id: number) {
    return this.trainingService.findSessionsByProgram(id);
  }
}
