import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingProgramReview } from './entities/training-program-review.entity';

@Injectable()
export class TrainingReviewService {
  constructor(
    @InjectRepository(TrainingProgramReview)
    private trainingProgramReviewRepository: Repository<TrainingProgramReview>,
  ) {}

  // Program Review Methods
  async createProgramReview(
    programId: number,
    userId: number,
    reviewData: any,
  ): Promise<TrainingProgramReview> {
    // 이미 리뷰를 작성했는지 확인
    const existingReview = await this.trainingProgramReviewRepository.findOne({
      where: { program: { id: programId }, user: { id: userId } },
    });

    if (existingReview) {
      throw new ForbiddenException('You have already reviewed this program');
    }

    const review = this.trainingProgramReviewRepository.create({
      program: { id: programId },
      user: { id: userId },
      rating: reviewData.rating,
      review: reviewData.review,
      isAnonymous: reviewData.isAnonymous || false,
      reviewCategories: reviewData.reviewCategories,
      isVerified: true,
    });

    return await this.trainingProgramReviewRepository.save(review);
  }

  async getProgramReviews(programId: number): Promise<TrainingProgramReview[]> {
    return await this.trainingProgramReviewRepository.find({
      where: { program: { id: programId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateProgramReview(
    reviewId: number,
    userId: number,
    updateData: any,
  ): Promise<TrainingProgramReview> {
    const review = await this.trainingProgramReviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.user.id !== userId) {
      throw new ForbiddenException('You can only update your own review');
    }

    Object.assign(review, updateData);
    return await this.trainingProgramReviewRepository.save(review);
  }

  async deleteProgramReview(reviewId: number, userId: number): Promise<void> {
    const review = await this.trainingProgramReviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.user.id !== userId) {
      throw new ForbiddenException('You can only delete your own review');
    }

    await this.trainingProgramReviewRepository.remove(review);
  }

  async getMyReviews(userId: number): Promise<TrainingProgramReview[]> {
    return await this.trainingProgramReviewRepository.find({
      where: { user: { id: userId } },
      relations: ['program'],
      order: { createdAt: 'DESC' },
    });
  }

  async getReviewById(reviewId: number): Promise<TrainingProgramReview> {
    const review = await this.trainingProgramReviewRepository.findOne({
      where: { id: reviewId },
      relations: ['user', 'program'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async getProgramReviewStatistics(programId: number): Promise<any> {
    const reviews = await this.getProgramReviews(programId);
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : 0;

    // 카테고리별 평균 평점
    const categoryRatings = {
      difficulty: 0,
      effectiveness: 0,
      enjoyment: 0,
      instructor: 0,
      value: 0,
    };

    if (reviews.length > 0) {
      reviews.forEach((review) => {
        if (review.reviewCategories) {
          Object.keys(categoryRatings).forEach((category) => {
            if (review.reviewCategories[category]) {
              categoryRatings[category] += review.reviewCategories[category];
            }
          });
        }
      });

      Object.keys(categoryRatings).forEach((category) => {
        const count = reviews.filter(
          (r) => r.reviewCategories?.[category],
        ).length;
        categoryRatings[category] =
          count > 0 ? categoryRatings[category] / count : 0;
      });
    }

    return {
      averageRating,
      categoryRatings,
      totalReviews: reviews.length,
    };
  }
}
