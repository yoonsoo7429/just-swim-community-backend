import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SwimmingController } from './swimming.controller';
import { SwimmingRecord } from './entities/swimming.entity';
import { SwimmingService } from './swimming.service';

@Module({
  imports: [TypeOrmModule.forFeature([SwimmingRecord])],
  controllers: [SwimmingController],
  providers: [SwimmingService],
  exports: [SwimmingService],
})
export class SwimmingModule {}
