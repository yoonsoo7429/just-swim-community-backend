import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SwimmingController } from './swimming.controller';
import { SwimmingRecord } from './entities/swimming.entity';
import { SwimmingService } from './swimming.service';
import { User } from '../users/entities/user.entity';
import { SwimmingLike } from './entities/swimming-like.entity';
import { SwimmingComment } from './entities/swimming-comment.entity';
import { BadgesModule } from '../badges/badges.module';
import { LevelsModule } from '../levels/levels.module';
import { GoalsModule } from '../goals/goals.module';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SwimmingRecord,
      User,
      SwimmingLike,
      SwimmingComment,
    ]),
    forwardRef(() => BadgesModule),
    forwardRef(() => LevelsModule),
    forwardRef(() => GoalsModule),
    forwardRef(() => SocialModule),
  ],
  controllers: [SwimmingController],
  providers: [SwimmingService],
  exports: [SwimmingService],
})
export class SwimmingModule {}
