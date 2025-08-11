import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SwimmingController } from './swimming.controller';
import { SwimmingRecord } from './entities/swimming.entity';
import { SwimmingService } from './swimming.service';
import { User } from '../users/entities/user.entity';
import { SwimmingLike } from './entities/swimming-like.entity';
import { SwimmingComment } from './entities/swimming-comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SwimmingRecord,
      User,
      SwimmingLike,
      SwimmingComment,
    ]),
  ],
  controllers: [SwimmingController],
  providers: [SwimmingService],
  exports: [SwimmingService],
})
export class SwimmingModule {}
