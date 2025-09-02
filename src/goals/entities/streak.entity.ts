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

export enum StreakType {
  SWIMMING = 'swimming', // 연속 수영일
  GOAL_COMPLETION = 'goal_completion', // 연속 목표 달성
  LOGIN = 'login', // 연속 로그인
}

export enum StreakStatus {
  ACTIVE = 'active',
  BROKEN = 'broken',
  PAUSED = 'paused',
}

@Entity('streaks')
export class Streak extends BaseEntity {
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: StreakType,
  })
  type: StreakType;

  @Column({ type: 'int', default: 0 })
  currentStreak: number; // 현재 연속일

  @Column({ type: 'int', default: 0 })
  longestStreak: number; // 최고 연속일

  @Column({ type: 'date' })
  lastActivityDate: Date; // 마지막 활동일

  @Column({ type: 'date' })
  startDate: Date; // 현재 스트릭 시작일

  @Column({
    type: 'enum',
    enum: StreakStatus,
    default: StreakStatus.ACTIVE,
  })
  status: StreakStatus;

  @Column({ type: 'int', default: 0 })
  freezeCount: number; // 스트릭 프리즈 사용 횟수

  @Column({ type: 'int', default: 0 })
  maxFreezeCount: number; // 최대 프리즈 사용 가능 횟수

  @Column({ type: 'date', nullable: true })
  lastFreezeDate: Date; // 마지막 프리즈 사용일

  @Column({ type: 'json', nullable: true })
  milestones: any[]; // 스트릭 마일스톤 달성 기록
}
