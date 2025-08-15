import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { TrainingReviewService } from './training-review.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('training-review')
@UseGuards(JwtAuthGuard)
export class TrainingReviewController {
  constructor(private readonly trainingReviewService: TrainingReviewService) {}

  // Program Review Endpoints
  @Post('programs/:id/reviews')
  createProgramReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() reviewData: any,
    @Request() req: any,
  ) {
    return this.trainingReviewService.createProgramReview(
      id,
      req.user.id,
      reviewData,
    );
  }

  @Get('programs/:id/reviews')
  getProgramReviews(@Param('id', ParseIntPipe) id: number) {
    return this.trainingReviewService.getProgramReviews(id);
  }

  @Get('reviews/:id')
  getReviewById(@Param('id', ParseIntPipe) id: number) {
    return this.trainingReviewService.getReviewById(id);
  }

  @Patch('reviews/:id')
  updateProgramReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: any,
    @Request() req: any,
  ) {
    return this.trainingReviewService.updateProgramReview(
      id,
      req.user.id,
      updateData,
    );
  }

  @Delete('reviews/:id')
  deleteProgramReview(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.trainingReviewService.deleteProgramReview(id, req.user.id);
  }

  @Get('reviews/my')
  getMyReviews(@Request() req: any) {
    return this.trainingReviewService.getMyReviews(req.user.id);
  }

  @Get('programs/:id/reviews/statistics')
  getProgramReviewStatistics(@Param('id', ParseIntPipe) id: number) {
    return this.trainingReviewService.getProgramReviewStatistics(id);
  }
}
