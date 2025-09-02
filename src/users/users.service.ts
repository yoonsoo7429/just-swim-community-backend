import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { SwimmingRecord } from '../swimming/entities/swimming.entity';
import { UserBadge } from '../badges/entities/user-badge.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SwimmingRecord)
    private swimmingRecordRepository: Repository<SwimmingRecord>,
    @InjectRepository(UserBadge)
    private userBadgeRepository: Repository<UserBadge>,
  ) {}

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findByKakaoId(kakaoId: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { providerId: kakaoId.toString(), provider: 'kakao' },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { providerId: googleId, provider: 'google' },
    });
  }

  async findByNaverId(naverId: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { providerId: naverId, provider: 'naver' },
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return await this.userRepository.save(user);
  }

  async update(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, userData);
    return await this.userRepository.save(user);
  }

  async getUserProfile(userId: number, currentUserId: number) {
    const user = await this.findOne(userId);

    // 수영 기록 통계 계산
    const swimmingStats = await this.swimmingRecordRepository
      .createQueryBuilder('record')
      .select([
        'COUNT(*) as totalSessions',
        'SUM(record.totalDistance) as totalDistance',
        'SUM(record.totalDuration) as totalSwimTime',
      ])
      .where('record.userId = :userId', { userId })
      .getRawOne();

    // 최근 활동 조회 (최근 10개)
    const recentActivities = await this.swimmingRecordRepository
      .createQueryBuilder('record')
      .select([
        'record.id',
        'record.totalDistance',
        'record.totalDuration',
        'record.title',
        'record.createdAt',
      ])
      .where('record.userId = :userId', { userId })
      .orderBy('record.createdAt', 'DESC')
      .limit(10)
      .getMany();

    // 획득한 배지 조회
    const badges = await this.userBadgeRepository
      .createQueryBuilder('userBadge')
      .leftJoinAndSelect('userBadge.badge', 'badge')
      .where('userBadge.userId = :userId', { userId })
      .getMany();

    // 연속 기록 계산 (간단한 버전)
    const currentStreak = await this.calculateCurrentStreak(userId);
    const longestStreak = await this.calculateLongestStreak(userId);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      userLevel: user.userLevel,
      title: user.title,
      bio: user.bio,
      joinDate: user.createdAt,
      totalSwimTime: parseInt(swimmingStats?.totalSwimTime || '0'),
      totalDistance: parseInt(swimmingStats?.totalDistance || '0'),
      totalSessions: parseInt(swimmingStats?.totalSessions || '0'),
      currentStreak,
      longestStreak,
      badges: badges.map((ub) => ({
        id: ub.badge.id,
        name: ub.badge.name,
        icon: ub.badge.icon,
        description: ub.badge.description,
        earnedAt: ub.createdAt,
      })),
      recentActivities: recentActivities.map((record) => ({
        id: record.id,
        type: 'swimming_record',
        title: record.title || `${record.totalDistance}m 수영`,
        description: `${Math.floor(Number(record.totalDuration))}분`,
        icon: '🏊‍♂️',
        date: record.createdAt,
      })),
    };
  }

  private async calculateCurrentStreak(userId: number): Promise<number> {
    // 간단한 연속 기록 계산 (실제로는 더 복잡한 로직 필요)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const records = await this.swimmingRecordRepository
      .createQueryBuilder('record')
      .select('DATE(record.createdAt) as date')
      .where('record.userId = :userId', { userId })
      .andWhere('record.createdAt >= :today', { today })
      .orderBy('record.createdAt', 'DESC')
      .getRawMany();

    return records.length;
  }

  private async calculateLongestStreak(userId: number): Promise<number> {
    // 간단한 최장 연속 기록 계산
    const records = await this.swimmingRecordRepository
      .createQueryBuilder('record')
      .select('DATE(record.createdAt) as date')
      .where('record.userId = :userId', { userId })
      .orderBy('record.createdAt', 'DESC')
      .getRawMany();

    return Math.min(records.length, 30); // 최대 30일로 제한
  }
}
