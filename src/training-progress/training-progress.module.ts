import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingProgressController } from './training-progress.controller';
import { TrainingProgressService } from './training-progress.service';
import { TrainingProgramProgress } from './entities/training-program-progress.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrainingProgramProgress])],
  controllers: [TrainingProgressController],
  providers: [TrainingProgressService],
  exports: [TrainingProgressService],
})
export class TrainingProgressModule {}
