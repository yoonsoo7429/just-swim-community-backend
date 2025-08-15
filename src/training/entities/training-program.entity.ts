import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { TrainingSession } from './training-session.entity';

@Entity('training_programs')
export class TrainingProgram extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 20, default: 'beginner' })
  difficulty: string;

  @Column({ type: 'varchar', length: 20, default: 'regular' })
  type: string; // 'regular' | 'short-term'

  // 정기 훈련용 필드들
  @Column({ type: 'int', nullable: true })
  totalWeeks: number;

  @Column({ type: 'int', nullable: true })
  sessionsPerWeek: number;

  // 단기 훈련용 필드들
  @Column({ type: 'int', nullable: true })
  totalSessions: number;

  @Column({ type: 'int', nullable: true })
  estimatedDuration: number;

  @Column({ type: 'varchar', length: 20, default: 'public' })
  visibility: string;

  @Column({ type: 'boolean', default: false })
  isPublished: boolean;

  @Column({ type: 'int', default: 0 })
  participantsCount: number;

  @Column({ type: 'int', nullable: true })
  maxParticipants: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => TrainingSession, (session) => session.trainingProgram, {
    cascade: true,
  })
  sessions: TrainingSession[];
}
