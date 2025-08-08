import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SwimmingRecord } from './entities/swimming.entity';
import { CreateSwimmingDto } from './dto/create-swimming.dto';
import { UpdateSwimmingDto } from './dto/update-swimming.dto';

@Injectable()
export class SwimmingService {
  constructor(
    @InjectRepository(SwimmingRecord)
    private swimmingRepository: Repository<SwimmingRecord>,
  ) {}

  async create(createSwimmingDto: CreateSwimmingDto): Promise<SwimmingRecord> {
    const swimming = this.swimmingRepository.create(createSwimmingDto);
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
}
