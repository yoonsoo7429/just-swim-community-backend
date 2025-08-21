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
import { CreateTrainingProgramDto } from './dto/create-training-program.dto';

@Controller('training')
@UseGuards(JwtAuthGuard)
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Post('programs')
  createProgram(@Body() programData: CreateTrainingProgramDto, @Request() req: any) {
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
    @Body() updateData: Partial<CreateTrainingProgramDto>,
    @Request() req: any,
  ) {
    return this.trainingService.updateProgram(id, updateData, req.user.id);
  }

  @Delete('programs/:id')
  deleteProgram(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.trainingService.deleteProgram(id, req.user.id);
  }
}
