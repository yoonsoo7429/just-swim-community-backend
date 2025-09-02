import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadgesController } from './badges.controller';
import { BadgesService } from './badges.service';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { User } from '../users/entities/user.entity';
import { SwimmingRecord } from '../swimming/entities/swimming.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Badge, UserBadge, User, SwimmingRecord])],
  controllers: [BadgesController],
  providers: [BadgesService],
  exports: [BadgesService],
})
export class BadgesModule {}
