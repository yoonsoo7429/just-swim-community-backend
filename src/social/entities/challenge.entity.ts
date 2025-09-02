import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ChallengeParticipant } from './challenge-participant.entity';
import e from 'express';
import { BaseEntity } from 'src/common/entities/base.entity';

export enum ChallengeType {
  INDIVIDUAL = 'individual', // 개인 챌린지
  GROUP = 'group', // 그룹 챌린지
  COMMUNITY = 'community', // 커뮤니티 이벤트
}

export enum ChallengeStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ChallengeCategory {
  DISTANCE = 'distance', // 거리 챌린지
  DURATION = 'duration', // 시간 챌린지
  FREQUENCY = 'frequency', // 빈도 챌린지 (주 N회)
  STREAK = 'streak', // 연속일 챌린지
  STROKE = 'stroke', // 특정 영법 챌린지
  SPEED = 'speed', // 속도 챌린지
}

@Entity('challenges')
export class Challenge extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ChallengeType,
  })
  type: ChallengeType;

  @Column({
    type: 'enum',
    enum: ChallengeCategory,
  })
  category: ChallengeCategory;

  @Column({
    type: 'enum',
    enum: ChallengeStatus,
    default: ChallengeStatus.UPCOMING,
  })
  status: ChallengeStatus;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'int' })
  targetValue: number; // 목표값 (거리, 시간, 횟수 등)

  @Column({ type: 'varchar', length: 20 })
  unit: string; // 단위 (m, 분, 회 등)

  @Column({ type: 'int', default: 0 })
  maxParticipants: number; // 최대 참가자 수 (0 = 무제한)

  @Column({ type: 'int', default: 0 })
  rewardXP: number; // 완료 시 보상 XP

  @Column({ type: 'int', default: 0 })
  rewardPoints: number; // 완료 시 보상 포인트

  @Column({ type: 'json', nullable: true })
  rules: any; // 챌린지 규칙 (JSON)

  @Column({ type: 'json', nullable: true })
  metadata: any; // 추가 메타데이터

  @Column({ type: 'boolean', default: false })
  isPublic: boolean; // 공개 챌린지 여부

  @Column({ type: 'varchar', length: 500, nullable: true })
  bannerImage: string; // 챌린지 배너 이미지

  @OneToMany(() => ChallengeParticipant, (participant) => participant.challenge)
  participants: ChallengeParticipant[];
}
