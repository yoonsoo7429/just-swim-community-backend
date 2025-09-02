import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { Goal } from './entities/goal.entity';
import { Streak } from './entities/streak.entity';
import { User } from '../users/entities/user.entity';
import { SwimmingRecord } from '../swimming/entities/swimming.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Goal, Streak, User, SwimmingRecord])],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
