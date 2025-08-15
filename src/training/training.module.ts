import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';
import { TrainingProgram } from './entities/training-program.entity';
import { TrainingSession } from './entities/training-session.entity';
import { TrainingSeries } from './entities/training-series.entity';
import { TrainingMeeting } from './entities/training-meeting.entity';
import { TrainingMeetingParticipation } from './entities/training-meeting-participation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrainingProgram,
      TrainingSession,
      TrainingSeries,
      TrainingMeeting,
      TrainingMeetingParticipation,
    ]),
  ],
  controllers: [TrainingController],
  providers: [TrainingService],
  exports: [TrainingService],
})
export class TrainingModule {}
