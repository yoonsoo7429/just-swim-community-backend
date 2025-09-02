import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { SwimmingRecord } from '../swimming/entities/swimming.entity';
import { UserBadge } from '../badges/entities/user-badge.entity';

export interface LevelInfo {
  level: number;
  requiredXP: number;
  title: string;
  perks: string[];
  icon: string;
}

export interface UserLevelProgress {
  currentLevel: number;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPercentage: number;
  title: string;
  nextTitle: string;
  totalXPEarned: number;
}

@Injectable()
export class LevelsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SwimmingRecord)
    private swimmingRecordRepository: Repository<SwimmingRecord>,
    @InjectRepository(UserBadge)
    private userBadgeRepository: Repository<UserBadge>,
  ) {}

  // 레벨별 정보 정의
  private readonly levelData: LevelInfo[] = [
    {
      level: 1,
      requiredXP: 0,
      title: '수영 입문자',
      perks: ['기본 기능 사용'],
      icon: '🌊',
    },
    {
      level: 2,
      requiredXP: 100,
      title: '물에 익숙한 자',
      perks: ['프로필 커스터마이징', '기본 통계 조회'],
      icon: '🏊',
    },
    {
      level: 3,
      requiredXP: 250,
      title: '초보 수영러',
      perks: ['상세 통계 조회', '목표 설정'],
      icon: '🏊‍♂️',
    },
    {
      level: 4,
      requiredXP: 450,
      title: '꾸준한 수영러',
      perks: ['친구 기능', '그룹 기능 해금'],
      icon: '💪',
    },
    {
      level: 5,
      requiredXP: 700,
      title: '수영 애호가',
      perks: ['커뮤니티 리더 권한', '특별 배지 해금'],
      icon: '🌟',
    },
    {
      level: 6,
      requiredXP: 1000,
      title: '수영 마니아',
      perks: ['고급 통계', '훈련 프로그램 생성'],
      icon: '🏆',
    },
    {
      level: 7,
      requiredXP: 1350,
      title: '수영 전문가',
      perks: ['멘토 기능', '코칭 권한'],
      icon: '🥇',
    },
    {
      level: 8,
      requiredXP: 1750,
      title: '수영 달인',
      perks: ['전문가 분석', '특별 챌린지 참여'],
      icon: '💎',
    },
    {
      level: 9,
      requiredXP: 2200,
      title: '수영 구루',
      perks: ['마스터 클래스 참여', '특별 이벤트 우선 참여'],
      icon: '⭐',
    },
    {
      level: 10,
      requiredXP: 2700,
      title: '수영 레전드',
      perks: ['모든 기능 해금', '레전드 전용 배지', '특별 칭호'],
      icon: '👑',
    },
    // 10레벨 이후는 250씩 증가
    {
      level: 11,
      requiredXP: 2950,
      title: '수영 마스터',
      perks: ['마스터 전용 기능'],
      icon: '🔥',
    },
    {
      level: 12,
      requiredXP: 3200,
      title: '수영 신',
      perks: ['신급 기능 해금'],
      icon: '⚡',
    },
  ];

  // XP 획득 계산
  calculateXPFromRecord(record: SwimmingRecord): number {
    let xp = 0;

    // 거리 기반 XP (1m = 0.1 XP)
    xp += Math.floor(record.totalDistance * 0.1);

    // 시간 기반 XP (1분 = 2 XP)
    xp += Math.floor(record.totalDuration * 2);

    // 영법 다양성 보너스 (여러 영법 사용 시)
    if (record.strokes && record.strokes.length > 1) {
      const uniqueStrokes = new Set(record.strokes.map((s) => s.style)).size;
      xp += uniqueStrokes * 5;
    }

    // 장거리 보너스
    if (record.totalDistance >= 1000) xp += 20; // 1km 이상
    if (record.totalDistance >= 2000) xp += 30; // 2km 이상
    if (record.totalDistance >= 3000) xp += 50; // 3km 이상

    // 장시간 보너스
    if (record.totalDuration >= 60) xp += 15; // 1시간 이상
    if (record.totalDuration >= 120) xp += 25; // 2시간 이상

    return Math.max(5, xp); // 최소 5 XP 보장
  }

  // 배지로부터 XP 획득
  calculateXPFromBadge(badgePoints: number): number {
    return badgePoints * 2; // 배지 포인트의 2배
  }

  // 레벨 계산
  calculateLevelFromXP(totalXP: number): number {
    for (let i = this.levelData.length - 1; i >= 0; i--) {
      if (totalXP >= this.levelData[i].requiredXP) {
        return this.levelData[i].level;
      }
    }
    return 1;
  }

  // 레벨 정보 조회
  getLevelInfo(level: number): LevelInfo | null {
    return this.levelData.find((l) => l.level === level) || null;
  }

  // 사용자 레벨 진행도 조회
  async getUserLevelProgress(userId: number): Promise<UserLevelProgress> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const currentLevel = this.calculateLevelFromXP(user.experience);
    const currentLevelInfo = this.getLevelInfo(currentLevel);
    const nextLevelInfo = this.getLevelInfo(currentLevel + 1);

    const xpForCurrentLevel = currentLevelInfo?.requiredXP || 0;
    const xpForNextLevel = nextLevelInfo?.requiredXP || user.experience;

    const xpInCurrentLevel = user.experience - xpForCurrentLevel;
    const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
    const progressPercentage =
      xpNeededForNext > 0 ? (xpInCurrentLevel / xpNeededForNext) * 100 : 100;

    return {
      currentLevel,
      currentXP: user.experience,
      xpForCurrentLevel,
      xpForNextLevel,
      progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
      title: currentLevelInfo?.title || '수영 입문자',
      nextTitle: nextLevelInfo?.title || '최고 레벨',
      totalXPEarned: user.experience,
    };
  }

  // 사용자 XP 추가 및 레벨업 확인
  async addXPAndCheckLevelUp(
    userId: number,
    xpToAdd: number,
  ): Promise<{
    leveledUp: boolean;
    oldLevel: number;
    newLevel: number;
    xpAdded: number;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const oldLevel = this.calculateLevelFromXP(user.experience);
    const newXP = user.experience + xpToAdd;
    const newLevel = this.calculateLevelFromXP(newXP);

    // DB 업데이트
    user.experience = newXP;
    user.userLevel = newLevel;

    // 레벨업 시 타이틀 업데이트
    if (newLevel > oldLevel) {
      const levelInfo = this.getLevelInfo(newLevel);
      if (levelInfo) {
        user.title = levelInfo.title;
      }
    }

    await this.userRepository.save(user);

    return {
      leveledUp: newLevel > oldLevel,
      oldLevel,
      newLevel,
      xpAdded: xpToAdd,
    };
  }

  // 사용자의 모든 기록을 기반으로 XP 재계산
  async recalculateUserXP(userId: number): Promise<void> {
    const records = await this.swimmingRecordRepository.find({
      where: { user: { id: userId } },
    });

    const userBadges = await this.userBadgeRepository.find({
      where: { user: { id: userId } },
      relations: ['badge'],
    });

    let totalXP = 0;

    // 수영 기록으로부터 XP 계산
    for (const record of records) {
      totalXP += this.calculateXPFromRecord(record);
    }

    // 배지로부터 XP 계산
    for (const userBadge of userBadges) {
      totalXP += this.calculateXPFromBadge(userBadge.badge.points);
    }

    // 사용자 XP 업데이트
    const newLevel = this.calculateLevelFromXP(totalXP);
    const levelInfo = this.getLevelInfo(newLevel);

    await this.userRepository.update(userId, {
      experience: totalXP,
      userLevel: newLevel,
      title: levelInfo?.title || '수영 입문자',
    });
  }

  // 모든 레벨 정보 조회
  getAllLevels(): LevelInfo[] {
    return this.levelData;
  }

  // 레벨별 통계
  async getLevelStats(): Promise<any> {
    const users = await this.userRepository.find({
      select: ['userLevel'],
    });

    const levelDistribution = {};
    users.forEach((user) => {
      const level = user.userLevel || 1;
      levelDistribution[level] = (levelDistribution[level] || 0) + 1;
    });

    const totalUsers = users.length;
    const avgLevel =
      users.reduce((sum, user) => sum + (user.userLevel || 1), 0) / totalUsers;

    return {
      totalUsers,
      averageLevel: Math.round(avgLevel * 10) / 10,
      levelDistribution,
      maxLevel: Math.max(...users.map((u) => u.userLevel || 1)),
    };
  }

  // 상위 레벨 사용자 조회
  async getTopLevelUsers(limit: number = 10): Promise<any[]> {
    return await this.userRepository.find({
      select: [
        'id',
        'name',
        'userLevel',
        'experience',
        'title',
        'profileImage',
      ],
      order: { userLevel: 'DESC', experience: 'DESC' },
      take: limit,
    });
  }
}
