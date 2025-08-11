import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SwimmingRecord } from './entities/swimming.entity';
import { CreateSwimmingDto } from './dto/create-swimming.dto';
import { UpdateSwimmingDto } from './dto/update-swimming.dto';
import { User } from '../users/entities/user.entity';
import { SwimmingLike } from './entities/swimming-like.entity';
import { SwimmingComment } from './entities/swimming-comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class SwimmingService {
  constructor(
    @InjectRepository(SwimmingRecord)
    private swimmingRepository: Repository<SwimmingRecord>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SwimmingLike)
    private swimmingLikeRepository: Repository<SwimmingLike>,
    @InjectRepository(SwimmingComment)
    private swimmingCommentRepository: Repository<SwimmingComment>,
  ) {}

  async create(
    createSwimmingDto: CreateSwimmingDto,
    userId: number,
  ): Promise<SwimmingRecord> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const swimming = this.swimmingRepository.create({
      ...createSwimmingDto,
      user: user,
    });

    return await this.swimmingRepository.save(swimming);
  }

  async findAll(): Promise<SwimmingRecord[]> {
    return await this.swimmingRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: number): Promise<SwimmingRecord[]> {
    return await this.swimmingRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<SwimmingRecord> {
    const swimming = await this.swimmingRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!swimming) {
      throw new NotFoundException(`Swimming record with ID ${id} not found`);
    }
    return swimming;
  }

  async update(
    id: number,
    updateSwimmingDto: UpdateSwimmingDto,
  ): Promise<SwimmingRecord> {
    const swimming = await this.findOne(id);
    Object.assign(swimming, updateSwimmingDto);
    return await this.swimmingRepository.save(swimming);
  }

  async remove(id: number): Promise<void> {
    const swimming = await this.findOne(id);
    await this.swimmingRepository.remove(swimming);
  }

  async getStats() {
    const totalSessions = await this.swimmingRepository.count();
    const totalDistance = await this.swimmingRepository
      .createQueryBuilder('swimming')
      .select('SUM(swimming.totalDistance)', 'totalDistance')
      .getRawOne();

    const totalDuration = await this.swimmingRepository
      .createQueryBuilder('swimming')
      .select('SUM(swimming.totalDuration)', 'totalDuration')
      .getRawOne();

    const totalCalories = await this.swimmingRepository
      .createQueryBuilder('swimming')
      .select('SUM(swimming.calories)', 'totalCalories')
      .getRawOne();

    return {
      totalSessions,
      totalDistance: parseInt(totalDistance.totalDistance) || 0,
      totalDuration: parseInt(totalDuration.totalDuration) || 0,
      totalCalories: parseInt(totalCalories.totalCalories) || 0,
    };
  }

  async getUserStats(userId: number) {
    const userSessions = await this.swimmingRepository.count({
      where: { user: { id: userId } },
    });

    const userDistance = await this.swimmingRepository
      .createQueryBuilder('swimming')
      .select('SUM(swimming.totalDistance)', 'totalDistance')
      .where('swimming.user.id = :userId', { userId })
      .getRawOne();

    const userDuration = await this.swimmingRepository
      .createQueryBuilder('swimming')
      .select('SUM(swimming.totalDuration)', 'totalDuration')
      .where('swimming.user.id = :userId', { userId })
      .getRawOne();

    const userCalories = await this.swimmingRepository
      .createQueryBuilder('swimming')
      .select('SUM(swimming.calories)', 'totalCalories')
      .where('swimming.user.id = :userId', { userId })
      .getRawOne();

    // 스타일별 통계 (strokes 배열에서 추출)
    const allRecords = await this.swimmingRepository.find({
      where: { user: { id: userId } },
      select: ['strokes'],
    });

    const styleStats = new Map();
    allRecords.forEach((record) => {
      if (record.strokes) {
        record.strokes.forEach((stroke: any) => {
          const style = stroke.style;
          if (!styleStats.has(style)) {
            styleStats.set(style, {
              count: 0,
              totalDistance: 0,
            });
          }
          const stats = styleStats.get(style);
          stats.count += 1;
          stats.totalDistance += stroke.distance;
        });
      }
    });

    // 월별 통계 (최근 6개월)
    const monthlyStats = await this.swimmingRepository
      .createQueryBuilder('swimming')
      .select('DATE_FORMAT(swimming.sessionDate, "%Y-%m")', 'month')
      .addSelect('COUNT(*)', 'sessions')
      .addSelect('SUM(swimming.totalDistance)', 'distance')
      .addSelect('SUM(swimming.totalDuration)', 'duration')
      .where('swimming.user.id = :userId', { userId })
      .andWhere('swimming.sessionDate >= DATE_SUB(NOW(), INTERVAL 6 MONTH)')
      .groupBy('month')
      .orderBy('month', 'DESC')
      .getRawMany();

    return {
      totalSessions: userSessions,
      totalDistance: parseInt(userDistance.totalDistance) || 0,
      totalDuration: parseInt(userDuration.totalDuration) || 0,
      totalCalories: parseInt(userCalories.totalCalories) || 0,
      styleStats: Array.from(styleStats.entries()).map(([style, stats]) => ({
        style,
        ...stats,
      })),
      monthlyStats,
    };
  }

  async getRecentRecords(limit: number = 10): Promise<SwimmingRecord[]> {
    return await this.swimmingRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getRecordsByStyle(style: string): Promise<SwimmingRecord[]> {
    const allRecords = await this.swimmingRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    // strokes 배열에서 특정 영법을 포함하는 기록만 필터링
    return allRecords.filter(
      (record) =>
        record.strokes &&
        record.strokes.some((stroke) => stroke.style === style),
    );
  }

  // 좋아요 추가
  async addLike(swimmingRecordId: number, userId: number): Promise<void> {
    const existingLike = await this.swimmingLikeRepository.findOne({
      where: {
        swimmingRecord: { id: swimmingRecordId },
        user: { id: userId },
      },
    });

    if (existingLike) {
      throw new ConflictException('Already liked this record');
    }

    const swimmingRecord = await this.findOne(swimmingRecordId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const like = new SwimmingLike();
    like.swimmingRecord = swimmingRecord;
    like.user = user;

    await this.swimmingLikeRepository.save(like);

    // 좋아요 수 증가
    swimmingRecord.likesCount += 1;
    await this.swimmingRepository.save(swimmingRecord);
  }

  // 좋아요 제거
  async removeLike(swimmingRecordId: number, userId: number): Promise<void> {
    const like = await this.swimmingLikeRepository.findOne({
      where: {
        swimmingRecord: { id: swimmingRecordId },
        user: { id: userId },
      },
    });

    if (!like) {
      throw new NotFoundException('Like not found');
    }

    await this.swimmingLikeRepository.remove(like);

    // 좋아요 수 감소
    const swimmingRecord = await this.findOne(swimmingRecordId);
    swimmingRecord.likesCount = Math.max(0, swimmingRecord.likesCount - 1);
    await this.swimmingRepository.save(swimmingRecord);
  }

  // 댓글 추가
  async addComment(
    swimmingRecordId: number,
    userId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<SwimmingComment> {
    const swimmingRecord = await this.findOne(swimmingRecordId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const comment = new SwimmingComment();
    comment.content = createCommentDto.content;
    comment.swimmingRecord = swimmingRecord;
    comment.user = user;
    comment.likes = 0;

    const savedComment = await this.swimmingCommentRepository.save(comment);

    // 댓글 수 증가
    swimmingRecord.commentsCount += 1;
    await this.swimmingRepository.save(swimmingRecord);

    return savedComment;
  }

  // 댓글 목록 조회
  async getComments(swimmingRecordId: number): Promise<SwimmingComment[]> {
    return await this.swimmingCommentRepository.find({
      where: { swimmingRecord: { id: swimmingRecordId } },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  // 댓글 삭제
  async removeComment(commentId: number, userId: number): Promise<void> {
    const comment = await this.swimmingCommentRepository.findOne({
      where: { id: commentId },
      relations: ['user', 'swimmingRecord'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user.id !== userId) {
      throw new NotFoundException('Cannot delete comment of another user');
    }

    await this.swimmingCommentRepository.remove(comment);

    // 댓글 수 감소
    const swimmingRecord = await this.findOne(comment.swimmingRecord.id);
    swimmingRecord.commentsCount = Math.max(
      0,
      swimmingRecord.commentsCount - 1,
    );
    await this.swimmingRepository.save(swimmingRecord);
  }

  // 사용자가 특정 기록을 좋아요했는지 확인
  async isLikedByUser(
    swimmingRecordId: number,
    userId: number,
  ): Promise<boolean> {
    const like = await this.swimmingLikeRepository.findOne({
      where: {
        swimmingRecord: { id: swimmingRecordId },
        user: { id: userId },
      },
    });
    return !!like;
  }
}
