import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import {
  Goal,
  GoalType,
  GoalStatus,
  GoalDifficulty,
} from './entities/goal.entity';
import { Streak, StreakType, StreakStatus } from './entities/streak.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { User } from '../users/entities/user.entity';
import { SwimmingRecord } from '../swimming/entities/swimming.entity';

export interface GoalProgress {
  goal: Goal;
  progressPercentage: number;
  remainingDays: number;
  isOnTrack: boolean;
  dailyTarget: number;
}

export interface StreakInfo {
  type: StreakType;
  currentStreak: number;
  longestStreak: number;
  canUseFreezer: boolean;
  nextMilestone: number;
  daysUntilBreak: number;
}

export interface GoalRecommendation {
  type: GoalType;
  title: string;
  description: string;
  targetValue: number;
  unit: string;
  difficulty: GoalDifficulty;
  duration: number; // days
  reasoning: string;
}

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal)
    private goalRepository: Repository<Goal>,
    @InjectRepository(Streak)
    private streakRepository: Repository<Streak>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SwimmingRecord)
    private swimmingRecordRepository: Repository<SwimmingRecord>,
  ) {}

  // 목표 생성
  async createGoal(
    createGoalDto: CreateGoalDto,
    userId: number,
  ): Promise<Goal> {
    const goal = this.goalRepository.create({
      ...createGoalDto,
      user: { id: userId },
      startDate: new Date(createGoalDto.startDate),
      endDate: new Date(createGoalDto.endDate),
      rewardXP: this.calculateRewardXP(
        createGoalDto.type,
        createGoalDto.targetValue,
        createGoalDto.difficulty || GoalDifficulty.MEDIUM,
      ),
      rewardPoints: this.calculateRewardPoints(
        createGoalDto.type,
        createGoalDto.targetValue,
        createGoalDto.difficulty || GoalDifficulty.MEDIUM,
      ),
    });

    return this.goalRepository.save(goal);
  }

  // 사용자의 활성 목표 조회
  async getUserActiveGoals(userId: number): Promise<Goal[]> {
    return this.goalRepository.find({
      where: {
        user: { id: userId },
        status: GoalStatus.ACTIVE,
      },
      order: { createdAt: 'DESC' },
    });
  }

  // 목표 진행도 계산
  async getGoalProgress(goalId: number): Promise<GoalProgress> {
    const goal = await this.goalRepository.findOne({
      where: { id: goalId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    const currentValue = await this.calculateCurrentProgress(goal);
    const progressPercentage = Math.min(
      100,
      Math.round((currentValue / goal.targetValue) * 100),
    );

    const now = new Date();
    const remainingDays = Math.max(
      0,
      Math.ceil(
        (goal.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    const totalDays = Math.ceil(
      (goal.endDate.getTime() - goal.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const elapsedDays = totalDays - remainingDays;
    const expectedProgress = (elapsedDays / totalDays) * 100;
    const isOnTrack = progressPercentage >= expectedProgress * 0.9; // 90% 이상이면 순조롭다고 판단

    const dailyTarget =
      remainingDays > 0
        ? Math.ceil((goal.targetValue - currentValue) / remainingDays)
        : 0;

    // 진행률 업데이트
    await this.goalRepository.update(goalId, {
      currentValue,
      progressPercentage,
    });

    return {
      goal: { ...goal, currentValue, progressPercentage },
      progressPercentage,
      remainingDays,
      isOnTrack,
      dailyTarget,
    };
  }

  // 목표 진행도 실제 계산
  private async calculateCurrentProgress(goal: Goal): Promise<number> {
    const { user, type, startDate, endDate } = goal;
    const userId = user.id;

    switch (type) {
      case GoalType.WEEKLY_DISTANCE:
      case GoalType.MONTHLY_DISTANCE:
        return this.calculateDistanceProgress(userId, startDate, endDate);

      case GoalType.SESSION_COUNT:
        return this.calculateSessionProgress(userId, startDate, endDate);

      case GoalType.STREAK:
        const streak = await this.getUserStreak(userId, StreakType.SWIMMING);
        return streak?.currentStreak || 0;

      case GoalType.STROKE_MASTERY:
        return this.calculateStrokeProgress(
          userId,
          startDate,
          endDate,
          goal.metadata?.strokeType,
        );

      case GoalType.LEVEL_UP:
        const user = await this.userRepository.findOne({
          where: { id: userId },
        });
        return user?.userLevel || 1;

      case GoalType.DURATION:
        return this.calculateDurationProgress(userId, startDate, endDate);

      default:
        return 0;
    }
  }

  private async calculateDistanceProgress(
    userId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.swimmingRecordRepository
      .createQueryBuilder('record')
      .select('SUM(record.totalDistance)', 'total')
      .where('record.userId = :userId', { userId })
      .andWhere('record.sessionDate BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })
      .getRawOne();

    return parseInt(result?.total) || 0;
  }

  private async calculateSessionProgress(
    userId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return this.swimmingRecordRepository.count({
      where: {
        user: { id: userId },
        sessionDate: Between(startDate, endDate),
      },
    });
  }

  private async calculateStrokeProgress(
    userId: number,
    startDate: Date,
    endDate: Date,
    strokeType: string,
  ): Promise<number> {
    const records = await this.swimmingRecordRepository.find({
      where: {
        user: { id: userId },
        sessionDate: Between(startDate, endDate),
      },
    });

    let totalDistance = 0;
    records.forEach((record) => {
      if (record.strokes && Array.isArray(record.strokes)) {
        const strokeDistance = record.strokes
          .filter(
            (stroke) => stroke.style.toLowerCase() === strokeType.toLowerCase(),
          )
          .reduce((sum, stroke) => sum + stroke.distance, 0);
        totalDistance += strokeDistance;
      }
    });

    return totalDistance;
  }

  private async calculateDurationProgress(
    userId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.swimmingRecordRepository
      .createQueryBuilder('record')
      .select('SUM(record.totalDuration)', 'total')
      .where('record.userId = :userId', { userId })
      .andWhere('record.sessionDate BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })
      .getRawOne();

    return parseInt(result?.total) || 0;
  }

  // 스트릭 관련 메서드들
  async getUserStreak(
    userId: number,
    type: StreakType,
  ): Promise<Streak | null> {
    return this.streakRepository.findOne({
      where: { user: { id: userId }, type },
    });
  }

  async updateStreak(
    userId: number,
    type: StreakType,
    activityDate: Date,
  ): Promise<Streak> {
    let streak = await this.getUserStreak(userId, type);
    const today = new Date(activityDate.toDateString());

    if (!streak) {
      // 새 스트릭 생성
      streak = this.streakRepository.create({
        user: { id: userId },
        type,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
        startDate: today,
        maxFreezeCount: this.getMaxFreezeCount(type),
        milestones: [],
      });
    } else {
      const lastActivity = new Date(streak.lastActivityDate.toDateString());
      const daysDiff = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysDiff === 0) {
        // 같은 날, 업데이트 없음
        return streak;
      } else if (daysDiff === 1) {
        // 연속일 증가
        streak.currentStreak += 1;
        streak.lastActivityDate = today;

        if (streak.currentStreak > streak.longestStreak) {
          streak.longestStreak = streak.currentStreak;
        }

        // 마일스톤 체크
        this.checkStreakMilestones(streak);
      } else {
        // 스트릭 끊김
        if (streak.status === StreakStatus.ACTIVE) {
          streak.status = StreakStatus.BROKEN;
        }

        // 새로운 스트릭 시작
        streak.currentStreak = 1;
        streak.startDate = today;
        streak.lastActivityDate = today;
        streak.status = StreakStatus.ACTIVE;
      }
    }

    return this.streakRepository.save(streak);
  }

  private checkStreakMilestones(streak: Streak): void {
    const milestones = [7, 14, 30, 60, 100, 365]; // 일주일, 2주, 한달, 두달, 100일, 1년
    const newMilestones = milestones.filter(
      (milestone) =>
        streak.currentStreak >= milestone &&
        !streak.milestones?.some((m) => m.days === milestone),
    );

    if (newMilestones.length > 0) {
      streak.milestones = streak.milestones || [];
      newMilestones.forEach((milestone) => {
        streak.milestones.push({
          days: milestone,
          achievedAt: new Date(),
          rewardXP: milestone * 10, // 마일스톤 보상
        });
      });
    }
  }

  private getMaxFreezeCount(type: StreakType): number {
    switch (type) {
      case StreakType.SWIMMING:
        return 3; // 월 3회
      case StreakType.GOAL_COMPLETION:
        return 2;
      case StreakType.LOGIN:
        return 1;
      default:
        return 1;
    }
  }

  // 목표 추천 시스템
  async getPersonalizedGoalRecommendations(
    userId: number,
  ): Promise<GoalRecommendation[]> {
    const userStats = await this.getUserStats(userId);
    const recommendations: GoalRecommendation[] = [];

    // 주간 거리 목표 추천
    if (userStats.avgWeeklyDistance > 0) {
      const recommendedDistance = Math.ceil(userStats.avgWeeklyDistance * 1.2);
      recommendations.push({
        type: GoalType.WEEKLY_DISTANCE,
        title: `주간 ${recommendedDistance}m 달성`,
        description: `평균보다 20% 향상된 거리 목표`,
        targetValue: recommendedDistance,
        unit: 'm',
        difficulty: this.getDifficultyByImprovement(0.2),
        duration: 7,
        reasoning: '평균 주간 거리 기반 추천',
      });
    }

    // 월간 거리 목표 추천
    if (userStats.avgMonthlyDistance > 0) {
      const recommendedDistance = Math.ceil(
        userStats.avgMonthlyDistance * 1.15,
      );
      recommendations.push({
        type: GoalType.MONTHLY_DISTANCE,
        title: `월간 ${(recommendedDistance / 1000).toFixed(1)}km 달성`,
        description: `꾸준한 성장을 위한 월간 목표`,
        targetValue: recommendedDistance,
        unit: 'm',
        difficulty: this.getDifficultyByImprovement(0.15),
        duration: 30,
        reasoning: '평균 월간 거리 기반 추천',
      });
    }

    // 스트릭 목표 추천
    const currentStreak = await this.getUserStreak(userId, StreakType.SWIMMING);
    const streakTarget = currentStreak ? currentStreak.longestStreak + 7 : 7;
    recommendations.push({
      type: GoalType.STREAK,
      title: `${streakTarget}일 연속 수영`,
      description: '꾸준한 수영 습관 만들기',
      targetValue: streakTarget,
      unit: '일',
      difficulty: GoalDifficulty.MEDIUM,
      duration: streakTarget + 3,
      reasoning: '스트릭 기록 기반 추천',
    });

    // 세션 수 목표 추천
    if (userStats.avgWeeklySessions > 0) {
      const recommendedSessions = Math.ceil(userStats.avgWeeklySessions * 1.3);
      recommendations.push({
        type: GoalType.SESSION_COUNT,
        title: `주간 ${recommendedSessions}회 수영`,
        description: '수영 빈도 증가 목표',
        targetValue: recommendedSessions,
        unit: '회',
        difficulty: this.getDifficultyByImprovement(0.3),
        duration: 7,
        reasoning: '평균 세션 수 기반 추천',
      });
    }

    return recommendations.slice(0, 4); // 최대 4개 추천
  }

  async getUserStats(userId: number): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const records = await this.swimmingRecordRepository.find({
      where: {
        user: { id: userId },
        sessionDate: MoreThanOrEqual(thirtyDaysAgo),
      },
      order: { sessionDate: 'DESC' },
    });

    const totalDistance = records.reduce((sum, r) => sum + r.totalDistance, 0);
    const totalSessions = records.length;

    return {
      avgWeeklyDistance: Math.round((totalDistance / 30) * 7),
      avgMonthlyDistance: totalDistance,
      avgWeeklySessions: Math.round((totalSessions / 30) * 7),
      totalSessions,
    };
  }

  private getDifficultyByImprovement(improvement: number): GoalDifficulty {
    if (improvement <= 0.1) return GoalDifficulty.EASY;
    if (improvement <= 0.25) return GoalDifficulty.MEDIUM;
    if (improvement <= 0.5) return GoalDifficulty.HARD;
    return GoalDifficulty.EXTREME;
  }

  // 보상 계산
  private calculateRewardXP(
    type: GoalType,
    targetValue: number,
    difficulty: GoalDifficulty,
  ): number {
    const baseXP = {
      [GoalType.WEEKLY_DISTANCE]: Math.floor(targetValue / 100), // 100m당 1XP
      [GoalType.MONTHLY_DISTANCE]: Math.floor(targetValue / 200), // 200m당 1XP
      [GoalType.STREAK]: targetValue * 10, // 1일당 10XP
      [GoalType.SESSION_COUNT]: targetValue * 20, // 1세션당 20XP
      [GoalType.STROKE_MASTERY]: Math.floor(targetValue / 50), // 50m당 1XP
      [GoalType.LEVEL_UP]: targetValue * 100, // 1레벨당 100XP
      [GoalType.DURATION]: Math.floor(targetValue / 5), // 5분당 1XP
    };

    const difficultyMultiplier = {
      [GoalDifficulty.EASY]: 1,
      [GoalDifficulty.MEDIUM]: 1.5,
      [GoalDifficulty.HARD]: 2,
      [GoalDifficulty.EXTREME]: 3,
    };

    return Math.floor((baseXP[type] || 50) * difficultyMultiplier[difficulty]);
  }

  private calculateRewardPoints(
    type: GoalType,
    targetValue: number,
    difficulty: GoalDifficulty,
  ): number {
    return Math.floor(
      this.calculateRewardXP(type, targetValue, difficulty) / 5,
    );
  }

  // 목표 완료 처리
  async completeGoal(goalId: number): Promise<Goal> {
    const goal = await this.goalRepository.findOne({
      where: { id: goalId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    goal.status = GoalStatus.COMPLETED;
    goal.completedAt = new Date();
    goal.progressPercentage = 100;

    // 챌린지 연동 목표인 경우 챌린지 참가자 상태도 업데이트
    if (goal.isChallengeGoal && goal.linkedChallengeId) {
      await this.updateChallengeParticipantProgress(
        goal.user.id,
        goal.linkedChallengeId,
        100,
      );
    }

    return this.goalRepository.save(goal);
  }

  // 챌린지 연동 개인 목표 생성
  async createChallengeLinkedGoal(
    userId: number,
    challengeId: number,
    challengeTitle: string,
    targetValue: number,
    unit: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Goal> {
    const goal = this.goalRepository.create({
      type: GoalType.CHALLENGE_LINKED,
      title: `챌린지: ${challengeTitle}`,
      description: `커뮤니티 챌린지 참가 목표`,
      targetValue,
      unit,
      startDate,
      endDate,
      user: { id: userId },
      linkedChallengeId: challengeId,
      isChallengeGoal: true,
      difficulty: GoalDifficulty.MEDIUM,
      rewardXP: 50, // 챌린지 목표 기본 보상
      rewardPoints: 10,
      challengeMetadata: {
        challengeId,
        challengeTitle,
        linkedAt: new Date(),
      },
    });

    return this.goalRepository.save(goal);
  }

  // 챌린지 참가자 진행도 업데이트 (외부 서비스에서 호출)
  async updateChallengeParticipantProgress(
    userId: number,
    challengeId: number,
    progressPercentage: number,
  ): Promise<void> {
    // 이 부분은 실제로는 챌린지 서비스에서 처리해야 하지만,
    // 목표 서비스에서도 접근할 수 있도록 인터페이스 제공
    // 실제 구현은 챌린지 서비스와의 의존성 주입을 통해 처리
  }

  // 챌린지 연동 목표 조회
  async getChallengeLinkedGoals(userId: number): Promise<Goal[]> {
    return this.goalRepository.find({
      where: {
        user: { id: userId },
        isChallengeGoal: true,
        status: GoalStatus.ACTIVE,
      },
      order: { createdAt: 'DESC' },
    });
  }

  // 목표 상태 업데이트
  async updateGoal(
    goalId: number,
    updateGoalDto: UpdateGoalDto,
  ): Promise<Goal> {
    const goal = await this.goalRepository.findOne({
      where: { id: goalId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    Object.assign(goal, updateGoalDto);
    return this.goalRepository.save(goal);
  }

  // 목표 삭제
  async deleteGoal(goalId: number): Promise<void> {
    const result = await this.goalRepository.delete(goalId);
    if (result.affected === 0) {
      throw new NotFoundException('Goal not found');
    }
  }

  // 스트릭 정보 조회
  async getStreakInfo(userId: number): Promise<StreakInfo[]> {
    const streaks = await this.streakRepository.find({
      where: { user: { id: userId } },
    });

    return streaks.map((streak) => {
      const milestones = [7, 14, 30, 60, 100, 365];
      const nextMilestone =
        milestones.find((m) => m > streak.currentStreak) || 1000;

      const today = new Date();
      const lastActivity = new Date(streak.lastActivityDate);
      const daysSinceActivity = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        type: streak.type,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        canUseFreezer:
          streak.freezeCount < streak.maxFreezeCount && daysSinceActivity <= 2,
        nextMilestone,
        daysUntilBreak: Math.max(0, 2 - daysSinceActivity),
      };
    });
  }

  // 통합 대시보드 정보 조회
  async getIntegratedDashboard(userId: number): Promise<any> {
    const [activeGoals, challengeGoals, streakInfo, recommendations] =
      await Promise.all([
        this.getUserActiveGoals(userId),
        this.getChallengeLinkedGoals(userId),
        this.getStreakInfo(userId),
        this.getPersonalizedGoalRecommendations(userId),
      ]);

    // 개인 목표와 챌린지 목표 통합
    const allGoals = [
      ...activeGoals.filter((goal) => !goal.isChallengeGoal),
      ...challengeGoals,
    ];

    // 진행률별 정렬
    const sortedGoals = allGoals.sort(
      (a, b) => b.progressPercentage - a.progressPercentage,
    );

    return {
      personalGoals: activeGoals.filter((goal) => !goal.isChallengeGoal),
      challengeGoals,
      allGoals: sortedGoals,
      streakInfo,
      recommendations,
      summary: {
        totalActiveGoals: allGoals.length,
        completedThisWeek: allGoals.filter(
          (goal) =>
            goal.status === GoalStatus.COMPLETED &&
            goal.completedAt &&
            new Date(goal.completedAt) >
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        ).length,
        averageProgress:
          allGoals.length > 0
            ? Math.round(
                allGoals.reduce(
                  (sum, goal) => sum + goal.progressPercentage,
                  0,
                ) / allGoals.length,
              )
            : 0,
      },
    };
  }

  // 챌린지 기반 목표 추천
  async getChallengeBasedRecommendations(
    userId: number,
  ): Promise<GoalRecommendation[]> {
    // 사용자의 현재 수영 패턴 분석
    const userStats = await this.getUserStats(userId);
    const recommendations: GoalRecommendation[] = [];

    // 챌린지 스타일의 목표 추천
    if (userStats.avgWeeklyDistance > 0) {
      const challengeDistance = Math.ceil(userStats.avgWeeklyDistance * 1.5);
      recommendations.push({
        type: GoalType.WEEKLY_DISTANCE,
        title: `주간 챌린지: ${challengeDistance}m`,
        description: `커뮤니티와 함께하는 주간 거리 챌린지`,
        targetValue: challengeDistance,
        unit: 'm',
        difficulty: GoalDifficulty.HARD,
        duration: 7,
        reasoning: '챌린지 스타일 목표 추천',
      });
    }

    // 스트릭 챌린지 추천
    const currentStreak = await this.getUserStreak(userId, StreakType.SWIMMING);
    const challengeStreak = currentStreak
      ? currentStreak.longestStreak + 10
      : 10;
    recommendations.push({
      type: GoalType.STREAK,
      title: `스트릭 챌린지: ${challengeStreak}일`,
      description: '커뮤니티와 함께하는 연속 수영 챌린지',
      targetValue: challengeStreak,
      unit: '일',
      difficulty: GoalDifficulty.HARD,
      duration: challengeStreak + 5,
      reasoning: '스트릭 챌린지 스타일 추천',
    });

    return recommendations;
  }
}
