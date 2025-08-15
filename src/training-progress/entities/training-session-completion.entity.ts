import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { TrainingSession } from '../../training/entities/training-session.entity';

@Entity('training_session_completions')
export class TrainingSessionCompletion extends BaseEntity {
  @Column({ type: 'date' })
  completedDate: Date;

  @Column({ type: 'varchar', length: 20, default: 'completed' })
  status: 'completed' | 'partially_completed' | 'skipped';

  @Column({ type: 'int', nullable: true })
  actualDuration: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  difficultyRating: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  performanceMetrics: any;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => TrainingSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: TrainingSession;
}
