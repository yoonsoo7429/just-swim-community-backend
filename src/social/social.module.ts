import { Module } from '@nestjs/common';
import { GoalsModule } from '../goals/goals.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { Friendship } from './entities/friendship.entity';
import { Challenge } from './entities/challenge.entity';
import { ChallengeParticipant } from './entities/challenge-participant.entity';
import { SocialActivity } from './entities/social-activity.entity';
import { User } from '../users/entities/user.entity';
import { SwimmingRecord } from '../swimming/entities/swimming.entity';

@Module({
  imports: [
    GoalsModule,
    TypeOrmModule.forFeature([
      Friendship,
      Challenge,
      ChallengeParticipant,
      SocialActivity,
      User,
      SwimmingRecord,
    ]),
  ],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
