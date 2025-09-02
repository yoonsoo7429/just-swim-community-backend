import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Between } from 'typeorm';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { User } from '../users/entities/user.entity';
import { SwimmingRecord } from '../swimming/entities/swimming.entity';
import { CreateBadgeDto } from './dto/create-badge.dto';

@Injectable()
export class BadgesService implements OnModuleInit {
  constructor(
    @InjectRepository(Badge)
    private badgeRepository: Repository<Badge>,
    @InjectRepository(UserBadge)
    private userBadgeRepository: Repository<UserBadge>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SwimmingRecord)
    private swimmingRecordRepository: Repository<SwimmingRecord>,
  ) {}

  async onModuleInit() {
    // 애플리케이션 시작 시 기본 배지들을 생성
    await this.initializeDefaultBadges();
  }

  async initializeDefaultBadges() {
    const defaultBadges = [
      // 거리 배지
      {
        key: 'distance_1km',
        name: '첫 걸음',
        description: '총 1km 수영 달성',
        icon: '🏊',
        tier: 'bronze',
        category: 'distance',
        criteria: { totalDistance: 1000 },
        points: 10,
      },
      {
        key: 'distance_5km',
        name: '꾸준한 수영러',
        description: '총 5km 수영 달성',
        icon: '🏊‍♂️',
        tier: 'bronze',
        category: 'distance',
        criteria: { totalDistance: 5000 },
        points: 25,
      },
      {
        key: 'distance_10km',
        name: '수영 마니아',
        description: '총 10km 수영 달성',
        icon: '🏆',
        tier: 'silver',
        category: 'distance',
        criteria: { totalDistance: 10000 },
        points: 50,
      },
      {
        key: 'distance_50km',
        name: '수영 전문가',
        description: '총 50km 수영 달성',
        icon: '🥇',
        tier: 'gold',
        category: 'distance',
        criteria: { totalDistance: 50000 },
        points: 100,
      },
      {
        key: 'distance_100km',
        name: '수영 마스터',
        description: '총 100km 수영 달성',
        icon: '👑',
        tier: 'platinum',
        category: 'distance',
        criteria: { totalDistance: 100000 },
        points: 200,
      },

      // 연속 수영 배지
      {
        key: 'consecutive_3days',
        name: '꾸준함의 시작',
        description: '3일 연속 수영',
        icon: '🔥',
        tier: 'bronze',
        category: 'consecutive',
        criteria: { consecutiveDays: 3 },
        points: 15,
      },
      {
        key: 'consecutive_7days',
        name: '일주일 챌린저',
        description: '7일 연속 수영',
        icon: '⚡',
        tier: 'silver',
        category: 'consecutive',
        criteria: { consecutiveDays: 7 },
        points: 30,
      },
      {
        key: 'consecutive_30days',
        name: '한 달 마라토너',
        description: '30일 연속 수영',
        icon: '💎',
        tier: 'gold',
        category: 'consecutive',
        criteria: { consecutiveDays: 30 },
        points: 100,
      },

      // 영법별 배지
      {
        key: 'freestyle_specialist',
        name: '자유형 스페셜리스트',
        description: '자유형으로 총 10km 수영',
        icon: '🌊',
        tier: 'silver',
        category: 'stroke',
        criteria: { strokeType: 'freestyle', distance: 10000 },
        points: 40,
      },
      {
        key: 'backstroke_specialist',
        name: '배영 스페셜리스트',
        description: '배영으로 총 5km 수영',
        icon: '🔄',
        tier: 'silver',
        category: 'stroke',
        criteria: { strokeType: 'backstroke', distance: 5000 },
        points: 40,
      },
      {
        key: 'breaststroke_specialist',
        name: '평영 스페셜리스트',
        description: '평영으로 총 5km 수영',
        icon: '🐸',
        tier: 'silver',
        category: 'stroke',
        criteria: { strokeType: 'breaststroke', distance: 5000 },
        points: 40,
      },
      {
        key: 'butterfly_specialist',
        name: '접영 스페셜리스트',
        description: '접영으로 총 3km 수영',
        icon: '🦋',
        tier: 'gold',
        category: 'stroke',
        criteria: { strokeType: 'butterfly', distance: 3000 },
        points: 60,
      },

      // 특별 배지
      {
        key: 'early_bird',
        name: '새벽 수영러',
        description: '새벽 6시 이전 수영 10회',
        icon: '🌅',
        tier: 'silver',
        category: 'special',
        criteria: { earlySwims: 10 },
        points: 35,
      },
      {
        key: 'night_swimmer',
        name: '야간 수영러',
        description: '저녁 9시 이후 수영 10회',
        icon: '🌙',
        tier: 'silver',
        category: 'special',
        criteria: { nightSwims: 10 },
        points: 35,
      },
      {
        key: 'long_distance',
        name: '장거리 스위머',
        description: '한 번에 2km 이상 수영',
        icon: '🎯',
        tier: 'gold',
        category: 'special',
        criteria: { singleSessionDistance: 2000 },
        points: 50,
      },
    ];

    for (const badgeData of defaultBadges) {
      const existingBadge = await this.badgeRepository.findOne({
        where: { key: badgeData.key },
      });

      if (!existingBadge) {
        await this.badgeRepository.save(badgeData);
      }
    }
  }

  async checkAndAwardBadges(userId: number): Promise<UserBadge[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['swimmingRecords'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    const allBadges = await this.badgeRepository.find({
      where: { isActive: true },
    });
    const userBadges = await this.userBadgeRepository.find({
      where: { user: { id: userId } },
      relations: ['badge'],
    });

    const earnedBadgeKeys = userBadges.map((ub) => ub.badge.key);
    const newlyEarnedBadges: UserBadge[] = [];

    for (const badge of allBadges) {
      if (earnedBadgeKeys.includes(badge.key)) {
        continue; // 이미 획득한 배지는 스킵
      }

      const isEarned = await this.checkBadgeCriteria(userId, badge);
      if (isEarned) {
        const userBadge = await this.awardBadge(userId, badge.id);
        newlyEarnedBadges.push(userBadge);
      }
    }

    return newlyEarnedBadges;
  }

  private async checkBadgeCriteria(
    userId: number,
    badge: Badge,
  ): Promise<boolean> {
    const records = await this.swimmingRecordRepository.find({
      where: { user: { id: userId } },
      order: { sessionDate: 'ASC' },
    });

    switch (badge.category) {
      case 'distance':
        return this.checkDistanceCriteria(records, badge.criteria);
      case 'consecutive':
        return this.checkConsecutiveCriteria(records, badge.criteria);
      case 'stroke':
        return this.checkStrokeCriteria(records, badge.criteria);
      case 'special':
        return this.checkSpecialCriteria(records, badge.criteria);
      default:
        return false;
    }
  }

  private checkDistanceCriteria(
    records: SwimmingRecord[],
    criteria: any,
  ): boolean {
    const totalDistance = records.reduce(
      (sum, record) => sum + record.totalDistance,
      0,
    );
    return totalDistance >= criteria.totalDistance;
  }

  private checkConsecutiveCriteria(
    records: SwimmingRecord[],
    criteria: any,
  ): boolean {
    if (records.length === 0) return false;

    const uniqueDates = [
      ...new Set(records.map((r) => new Date(r.sessionDate).toDateString())),
    ].sort();

    let maxConsecutive = 1;
    let currentConsecutive = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currentDate = new Date(uniqueDates[i]);
      const diffTime = currentDate.getTime() - prevDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }

    return maxConsecutive >= criteria.consecutiveDays;
  }

  private checkStrokeCriteria(
    records: SwimmingRecord[],
    criteria: any,
  ): boolean {
    const strokeDistance = records.reduce((sum, record) => {
      if (!record.strokes) return sum;

      const strokeRecords = record.strokes.filter(
        (stroke) =>
          stroke.style.toLowerCase() === criteria.strokeType.toLowerCase(),
      );

      return (
        sum +
        strokeRecords.reduce(
          (strokeSum, stroke) => strokeSum + stroke.distance,
          0,
        )
      );
    }, 0);

    return strokeDistance >= criteria.distance;
  }

  private checkSpecialCriteria(
    records: SwimmingRecord[],
    criteria: any,
  ): boolean {
    if (criteria.earlySwims) {
      const earlySwims = records.filter((record) => {
        const startTime = record.sessionStartTime;
        const hour = parseInt(startTime.split(':')[0]);
        return hour < 6;
      });
      return earlySwims.length >= criteria.earlySwims;
    }

    if (criteria.nightSwims) {
      const nightSwims = records.filter((record) => {
        const startTime = record.sessionStartTime;
        const hour = parseInt(startTime.split(':')[0]);
        return hour >= 21;
      });
      return nightSwims.length >= criteria.nightSwims;
    }

    if (criteria.singleSessionDistance) {
      const hasLongSession = records.some(
        (record) => record.totalDistance >= criteria.singleSessionDistance,
      );
      return hasLongSession;
    }

    return false;
  }

  private async awardBadge(
    userId: number,
    badgeId: number,
  ): Promise<UserBadge> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const badge = await this.badgeRepository.findOne({
      where: { id: badgeId },
    });

    if (!user || !badge) {
      throw new Error('User or Badge not found');
    }

    const userBadge = this.userBadgeRepository.create({
      user,
      badge,
      earnedAt: new Date(),
    });

    return await this.userBadgeRepository.save(userBadge);
  }

  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return await this.userBadgeRepository.find({
      where: { user: { id: userId } },
      relations: ['badge'],
      order: { earnedAt: 'DESC' },
    });
  }

  async getAllBadges(): Promise<Badge[]> {
    return await this.badgeRepository.find({
      where: { isActive: true },
      order: { category: 'ASC', points: 'ASC' },
    });
  }

  async createBadge(createBadgeDto: CreateBadgeDto): Promise<Badge> {
    const badge = this.badgeRepository.create(createBadgeDto);
    return await this.badgeRepository.save(badge);
  }

  async getUserBadgeStats(userId: number): Promise<any> {
    const userBadges = await this.getUserBadges(userId);
    const allBadges = await this.getAllBadges();

    const stats = {
      totalEarned: userBadges.length,
      totalAvailable: allBadges.length,
      completionRate: (userBadges.length / allBadges.length) * 100,
      totalPoints: userBadges.reduce((sum, ub) => sum + ub.badge.points, 0),
      byCategory: {},
      byTier: {},
      recentBadges: userBadges.slice(0, 5),
    };

    // 카테고리별 통계
    const categories = ['distance', 'consecutive', 'stroke', 'special'];
    categories.forEach((category) => {
      const categoryBadges = allBadges.filter((b) => b.category === category);
      const earnedCategoryBadges = userBadges.filter(
        (ub) => ub.badge.category === category,
      );

      stats.byCategory[category] = {
        earned: earnedCategoryBadges.length,
        total: categoryBadges.length,
        percentage:
          categoryBadges.length > 0
            ? (earnedCategoryBadges.length / categoryBadges.length) * 100
            : 0,
      };
    });

    // 등급별 통계
    const tiers = ['bronze', 'silver', 'gold', 'platinum'];
    tiers.forEach((tier) => {
      const tierBadges = allBadges.filter((b) => b.tier === tier);
      const earnedTierBadges = userBadges.filter(
        (ub) => ub.badge.tier === tier,
      );

      stats.byTier[tier] = {
        earned: earnedTierBadges.length,
        total: tierBadges.length,
        percentage:
          tierBadges.length > 0
            ? (earnedTierBadges.length / tierBadges.length) * 100
            : 0,
      };
    });

    return stats;
  }
}
