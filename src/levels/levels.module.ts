import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LevelsController } from './levels.controller';
import { LevelsService } from './levels.service';
import { User } from '../users/entities/user.entity';
import { SwimmingRecord } from '../swimming/entities/swimming.entity';
import { UserBadge } from '../badges/entities/user-badge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, SwimmingRecord, UserBadge])],
  controllers: [LevelsController],
  providers: [LevelsService],
  exports: [LevelsService],
})
export class LevelsModule {}
