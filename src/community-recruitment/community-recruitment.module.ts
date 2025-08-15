import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityRecruitmentController } from './community-recruitment.controller';
import { CommunityRecruitmentService } from './community-recruitment.service';
import { TrainingProgramRecruitment } from './entities/training-program-recruitment.entity';
import { TrainingRecruitmentParticipation } from './entities/training-recruitment-participation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrainingProgramRecruitment,
      TrainingRecruitmentParticipation,
    ]),
  ],
  controllers: [CommunityRecruitmentController],
  providers: [CommunityRecruitmentService],
  exports: [CommunityRecruitmentService],
})
export class CommunityRecruitmentModule {}
