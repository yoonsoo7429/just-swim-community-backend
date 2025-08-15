import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingProgressController } from './training-progress.controller';
import { TrainingProgressService } from './training-progress.service';
import { TrainingProgramProgress } from './entities/training-program-progress.entity';
import { TrainingSessionCompletion } from './entities/training-session-completion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrainingProgramProgress,
      TrainingSessionCompletion,
    ]),
  ],
  controllers: [TrainingProgressController],
  providers: [TrainingProgressService],
  exports: [TrainingProgressService],
})
export class TrainingProgressModule {}
