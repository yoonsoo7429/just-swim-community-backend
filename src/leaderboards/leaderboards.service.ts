import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { SwimmingRecord } from '../swimming/entities/swimming.entity';
import { UserBadge } from '../badges/entities/user-badge.entity';

export interface LeaderboardEntry {
  userId: number;
  user: {
    id: number;
    name: string;
    profileImage?: string;
    userLevel: number;
    title?: string;
  };
  rank: number;
  value: number;
  additionalInfo?: any;
}

export interface LeaderboardStats {
  totalParticipants: number;
  userRank?: number;
  userValue?: number;
  topThreeUsers: LeaderboardEntry[];
}

@Injectable()
export class LeaderboardsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SwimmingRecord)
    private swimmingRecordRepository: Repository<SwimmingRecord>,
    @InjectRepository(UserBadge)
    private userBadgeRepository: Repository<UserBadge>,
  ) {}

  // 레벨 리더보드 (이미 levels 서비스에 있지만 통합을 위해)
  async getLevelLeaderboard(limit: number = 20): Promise<LeaderboardEntry[]> {
    const users = await this.userRepository.find({
      select: [
        'id',
        'name',
        'profileImage',
        'userLevel',
        'experience',
        'title',
      ],
      order: { userLevel: 'DESC', experience: 'DESC' },
      take: limit,
    });

    return users.map((user, index) => ({
      userId: user.id,
      user: {
        id: user.id,
        name: user.name,
        profileImage: user.profileImage,
        userLevel: user.userLevel,
        title: user.title,
      },
      rank: index + 1,
      value: user.experience,
      additionalInfo: { level: user.userLevel },
    }));
  }

  // 월간 거리 리더보드
  async getMonthlyDistanceLeaderboard(
    year: number,
    month: number,
    limit: number = 20,
  ): Promise<LeaderboardEntry[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const query = this.swimmingRecordRepository
      .createQueryBuilder('record')
      .leftJoin('record.user', 'user')
      .select([
        'user.id as userId',
        'user.name as userName',
        'user.profileImage as userProfileImage',
        'user.userLevel as userLevel',
        'user.title as userTitle',
        'SUM(record.totalDistance) as totalDistance',
        'COUNT(record.id) as sessionCount',
      ])
      .where('record.sessionDate BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })
      .groupBy(
        'user.id, user.name, user.profileImage, user.userLevel, user.title',
      )
      .orderBy('totalDistance', 'DESC')
      .limit(limit);

    const results = await query.getRawMany();

    return results.map((result, index) => ({
      userId: parseInt(result.userId),
      user: {
        id: parseInt(result.userId),
        name: result.userName,
        profileImage: result.userProfileImage,
        userLevel: result.userLevel,
        title: result.userTitle,
      },
      rank: index + 1,
      value: parseInt(result.totalDistance),
      additionalInfo: {
        sessionCount: parseInt(result.sessionCount),
        averageDistance: Math.round(
          parseInt(result.totalDistance) / parseInt(result.sessionCount),
        ),
      },
    }));
  }

  // 주간 거리 리더보드
  async getWeeklyDistanceLeaderboard(
    startDate: Date,
    limit: number = 20,
  ): Promise<LeaderboardEntry[]> {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const query = this.swimmingRecordRepository
      .createQueryBuilder('record')
      .leftJoin('record.user', 'user')
      .select([
        'user.id as userId',
        'user.name as userName',
        'user.profileImage as userProfileImage',
        'user.userLevel as userLevel',
        'user.title as userTitle',
        'SUM(record.totalDistance) as totalDistance',
        'COUNT(record.id) as sessionCount',
        'AVG(record.totalDuration) as avgDuration',
      ])
      .where('record.sessionDate BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })
      .groupBy(
        'user.id, user.name, user.profileImage, user.userLevel, user.title',
      )
      .orderBy('totalDistance', 'DESC')
      .limit(limit);

    const results = await query.getRawMany();

    return results.map((result, index) => ({
      userId: parseInt(result.userId),
      user: {
        id: parseInt(result.userId),
        name: result.userName,
        profileImage: result.userProfileImage,
        userLevel: result.userLevel,
        title: result.userTitle,
      },
      rank: index + 1,
      value: parseInt(result.totalDistance),
      additionalInfo: {
        sessionCount: parseInt(result.sessionCount),
        avgDuration: Math.round(parseFloat(result.avgDuration) || 0),
      },
    }));
  }

  // 영법별 리더보드
  async getStrokeLeaderboard(
    strokeType: string,
    limit: number = 20,
  ): Promise<LeaderboardEntry[]> {
    // JSON 컬럼에서 특정 영법의 거리를 합산하는 복잡한 쿼리
    const query = this.swimmingRecordRepository
      .createQueryBuilder('record')
      .leftJoin('record.user', 'user')
      .select([
        'user.id as userId',
        'user.name as userName',
        'user.profileImage as userProfileImage',
        'user.userLevel as userLevel',
        'user.title as userTitle',
      ])
      .where('JSON_LENGTH(record.strokes) > 0');

    const records = await query.getMany();

    // 영법별 거리 계산
    const userStrokeDistances = new Map<
      number,
      {
        user: any;
        totalDistance: number;
        sessionCount: number;
      }
    >();

    records.forEach((record) => {
      if (record.strokes && Array.isArray(record.strokes)) {
        const strokeDistance = record.strokes
          .filter(
            (stroke) => stroke.style.toLowerCase() === strokeType.toLowerCase(),
          )
          .reduce((sum, stroke) => sum + stroke.distance, 0);

        if (strokeDistance > 0) {
          const existing = userStrokeDistances.get(record.user.id) || {
            user: record.user,
            totalDistance: 0,
            sessionCount: 0,
          };

          existing.totalDistance += strokeDistance;
          existing.sessionCount += 1;
          userStrokeDistances.set(record.user.id, existing);
        }
      }
    });

    // 정렬 및 순위 부여
    const sortedUsers = Array.from(userStrokeDistances.values())
      .sort((a, b) => b.totalDistance - a.totalDistance)
      .slice(0, limit);

    return sortedUsers.map((userData, index) => ({
      userId: userData.user.id,
      user: {
        id: userData.user.id,
        name: userData.user.name,
        profileImage: userData.user.profileImage,
        userLevel: userData.user.userLevel,
        title: userData.user.title,
      },
      rank: index + 1,
      value: userData.totalDistance,
      additionalInfo: {
        sessionCount: userData.sessionCount,
        strokeType: strokeType,
      },
    }));
  }

  // 배지 수집 리더보드
  async getBadgeLeaderboard(limit: number = 20): Promise<LeaderboardEntry[]> {
    const query = this.userBadgeRepository
      .createQueryBuilder('userBadge')
      .leftJoin('userBadge.user', 'user')
      .leftJoin('userBadge.badge', 'badge')
      .select([
        'user.id as userId',
        'user.name as userName',
        'user.profileImage as userProfileImage',
        'user.userLevel as userLevel',
        'user.title as userTitle',
        'COUNT(userBadge.id) as badgeCount',
        'SUM(badge.points) as totalPoints',
      ])
      .groupBy(
        'user.id, user.name, user.profileImage, user.userLevel, user.title',
      )
      .orderBy('badgeCount', 'DESC')
      .addOrderBy('totalPoints', 'DESC')
      .limit(limit);

    const results = await query.getRawMany();

    return results.map((result, index) => ({
      userId: parseInt(result.userId),
      user: {
        id: parseInt(result.userId),
        name: result.userName,
        profileImage: result.userProfileImage,
        userLevel: result.userLevel,
        title: result.userTitle,
      },
      rank: index + 1,
      value: parseInt(result.badgeCount),
      additionalInfo: {
        totalPoints: parseInt(result.totalPoints),
      },
    }));
  }

  // 연속 수영일 리더보드
  async getStreakLeaderboard(limit: number = 20): Promise<LeaderboardEntry[]> {
    const users = await this.userRepository.find({
      select: ['id', 'name', 'profileImage', 'userLevel', 'title'],
    });

    const userStreaks = await Promise.all(
      users.map(async (user) => {
        const streak = await this.calculateUserStreak(user.id);
        return {
          user,
          streak,
        };
      }),
    );

    const sortedStreaks = userStreaks
      .filter((us) => us.streak > 0)
      .sort((a, b) => b.streak - a.streak)
      .slice(0, limit);

    return sortedStreaks.map((userStreak, index) => ({
      userId: userStreak.user.id,
      user: {
        id: userStreak.user.id,
        name: userStreak.user.name,
        profileImage: userStreak.user.profileImage,
        userLevel: userStreak.user.userLevel,
        title: userStreak.user.title,
      },
      rank: index + 1,
      value: userStreak.streak,
      additionalInfo: {
        unit: '일',
      },
    }));
  }

  // 사용자의 연속 수영일 계산
  private async calculateUserStreak(userId: number): Promise<number> {
    const records = await this.swimmingRecordRepository.find({
      where: { user: { id: userId } },
      select: ['sessionDate'],
      order: { sessionDate: 'DESC' },
    });

    if (records.length === 0) return 0;

    const uniqueDates = [
      ...new Set(records.map((r) => new Date(r.sessionDate).toDateString())),
    ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 1;
    const today = new Date();
    const lastSwimDate = new Date(uniqueDates[0]);

    // 오늘 또는 어제 수영했는지 확인
    const daysDiff = Math.floor(
      (today.getTime() - lastSwimDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysDiff > 1) return 0; // 2일 이상 간격이면 스트릭 끊김

    // 연속일 계산
    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i - 1]);
      const nextDate = new Date(uniqueDates[i]);
      const diffTime = currentDate.getTime() - nextDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // 사용자의 특정 리더보드에서의 순위 조회
  async getUserRankInLeaderboard(
    userId: number,
    leaderboardType: string,
    params?: any,
  ): Promise<{ rank: number; value: number } | null> {
    let leaderboard: LeaderboardEntry[] = [];

    switch (leaderboardType) {
      case 'level':
        leaderboard = await this.getLevelLeaderboard(1000);
        break;
      case 'monthly_distance':
        leaderboard = await this.getMonthlyDistanceLeaderboard(
          params?.year || new Date().getFullYear(),
          params?.month || new Date().getMonth() + 1,
          1000,
        );
        break;
      case 'weekly_distance':
        leaderboard = await this.getWeeklyDistanceLeaderboard(
          params?.startDate || this.getThisWeekStart(),
          1000,
        );
        break;
      case 'badge':
        leaderboard = await this.getBadgeLeaderboard(1000);
        break;
      case 'streak':
        leaderboard = await this.getStreakLeaderboard(1000);
        break;
      default:
        return null;
    }

    const userEntry = leaderboard.find((entry) => entry.userId === userId);
    return userEntry ? { rank: userEntry.rank, value: userEntry.value } : null;
  }

  // 이번 주 시작일 계산
  private getThisWeekStart(): Date {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff));
  }

  // 리더보드 통계
  async getLeaderboardStats(
    leaderboardType: string,
    userId?: number,
  ): Promise<LeaderboardStats> {
    let leaderboard: LeaderboardEntry[] = [];

    switch (leaderboardType) {
      case 'level':
        leaderboard = await this.getLevelLeaderboard(1000);
        break;
      case 'monthly_distance':
        const now = new Date();
        leaderboard = await this.getMonthlyDistanceLeaderboard(
          now.getFullYear(),
          now.getMonth() + 1,
          1000,
        );
        break;
      case 'badge':
        leaderboard = await this.getBadgeLeaderboard(1000);
        break;
      case 'streak':
        leaderboard = await this.getStreakLeaderboard(1000);
        break;
    }

    const stats: LeaderboardStats = {
      totalParticipants: leaderboard.length,
      topThreeUsers: leaderboard.slice(0, 3),
    };

    if (userId) {
      const userEntry = leaderboard.find((entry) => entry.userId === userId);
      if (userEntry) {
        stats.userRank = userEntry.rank;
        stats.userValue = userEntry.value;
      }
    }

    return stats;
  }
}
