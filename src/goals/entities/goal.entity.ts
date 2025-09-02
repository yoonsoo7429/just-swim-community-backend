import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BaseEntity } from 'src/common/entities/base.entity';

export enum GoalType {
  WEEKLY_DISTANCE = 'weekly_distance',
  MONTHLY_DISTANCE = 'monthly_distance',
  STREAK = 'streak',
  STROKE_MASTERY = 'stroke_mastery',
  LEVEL_UP = 'level_up',
  SESSION_COUNT = 'session_count',
  DURATION = 'duration',
  CHALLENGE_LINKED = 'challenge_linked', // 챌린지 연동 목표
}

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  FAILED = 'failed',
}

export enum GoalDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXTREME = 'extreme',
}

@Entity('goals')
export class Goal extends BaseEntity {
  @Column({
    type: 'enum',
    enum: GoalType,
  })
  type: GoalType;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  targetValue: number; // 목표값 (거리, 일수, 세션수 등)

  @Column({ type: 'int', default: 0 })
  currentValue: number; // 현재 진행값

  @Column({ type: 'varchar', length: 20 })
  unit: string; // m, km, 일, 회 등

  @Column({
    type: 'enum',
    enum: GoalStatus,
    default: GoalStatus.ACTIVE,
  })
  status: GoalStatus;

  @Column({
    type: 'enum',
    enum: GoalDifficulty,
    default: GoalDifficulty.MEDIUM,
  })
  difficulty: GoalDifficulty;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'int', default: 0 })
  rewardXP: number; // 완료시 보상 XP

  @Column({ type: 'int', default: 0 })
  rewardPoints: number; // 완료시 보상 포인트

  @Column({ type: 'json', nullable: true })
  metadata: any; // 추가 데이터 (영법 타입, 레벨 등)

  @Column({ type: 'boolean', default: false })
  isRecommended: boolean; // 시스템 추천 목표 여부

  @Column({ type: 'int', default: 0 })
  progressPercentage: number; // 진행률 (0-100)

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date; // 완료 시간

  @Column({ type: 'int', nullable: true })
  linkedChallengeId: number; // 연동된 챌린지 ID

  @Column({ type: 'boolean', default: false })
  isChallengeGoal: boolean; // 챌린지에서 생성된 목표인지 여부

  @Column({ type: 'json', nullable: true })
  challengeMetadata: any; // 챌린지 관련 메타데이터

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;
}
