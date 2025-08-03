import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';
import { TrainingProgram } from './entities/training-program.entity';
import { TrainingSession } from './entities/training-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrainingProgram, TrainingSession])],
  controllers: [TrainingController],
  providers: [TrainingService],
  exports: [TrainingService],
})
export class TrainingModule {}
