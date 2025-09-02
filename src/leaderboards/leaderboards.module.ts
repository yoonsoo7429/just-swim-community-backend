import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaderboardsController } from './leaderboards.controller';
import { LeaderboardsService } from './leaderboards.service';
import { User } from '../users/entities/user.entity';
import { SwimmingRecord } from '../swimming/entities/swimming.entity';
import { UserBadge } from '../badges/entities/user-badge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, SwimmingRecord, UserBadge])],
  controllers: [LeaderboardsController],
  providers: [LeaderboardsService],
  exports: [LeaderboardsService],
})
export class LeaderboardsModule {}
