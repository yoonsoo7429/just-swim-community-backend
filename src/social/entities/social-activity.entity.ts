import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import e from 'express';
import { BaseEntity } from 'src/common/entities/base.entity';

export enum ActivityType {
  SWIMMING_RECORD = 'swimming_record',
  GOAL_COMPLETED = 'goal_completed',
  BADGE_EARNED = 'badge_earned',
  LEVEL_UP = 'level_up',
  CHALLENGE_JOINED = 'challenge_joined',
  CHALLENGE_COMPLETED = 'challenge_completed',
  STREAK_MILESTONE = 'streak_milestone',
  FRIENDSHIP_ACCEPTED = 'friendship_accepted',
}

@Entity('social_activities')
export class SocialActivity extends BaseEntity {
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  type: ActivityType;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  data: any; // 활동 관련 데이터

  @Column({ type: 'boolean', default: true })
  isPublic: boolean; // 공개 활동 여부
}
