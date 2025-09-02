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
import { Challenge } from './challenge.entity';
import { BaseEntity } from 'src/common/entities/base.entity';

export enum ParticipantStatus {
  INVITED = 'invited',
  JOINED = 'joined',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

@Entity('challenge_participants')
export class ChallengeParticipant extends BaseEntity {
  @ManyToOne(() => Challenge, (challenge) => challenge.participants)
  @JoinColumn({ name: 'challengeId' })
  challenge: Challenge;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.JOINED,
  })
  status: ParticipantStatus;

  @Column({ type: 'int', default: 0 })
  currentProgress: number; // 현재 진행도

  @Column({ type: 'int', default: 0 })
  progressPercentage: number; // 진행률 (0-100)

  @Column({ type: 'int', default: 0 })
  ranking: number; // 순위 (그룹 챌린지에서)

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date; // 완료 시간

  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt: Date; // 마지막 활동 시간

  @Column({ type: 'json', nullable: true })
  progressData: any; // 세부 진행 데이터
}
