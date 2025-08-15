import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingReviewController } from './training-review.controller';
import { TrainingReviewService } from './training-review.service';
import { TrainingProgramReview } from './entities/training-program-review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrainingProgramReview])],
  controllers: [TrainingReviewController],
  providers: [TrainingReviewService],
  exports: [TrainingReviewService],
})
export class TrainingReviewModule {}
