import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { TrainingProgram } from '../../training/entities/training-program.entity';

@Entity('training_program_progress')
export class TrainingProgramProgress extends BaseEntity {
  @Column({ type: 'int', default: 0 })
  completedSessions: number;

  @Column({ type: 'int', default: 0 })
  totalSessions: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  progressPercentage: number;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  lastCompletedDate: Date;

  @Column({ type: 'date', nullable: true })
  expectedCompletionDate: Date;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: 'active' | 'completed' | 'paused' | 'abandoned';

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => TrainingProgram, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programId' })
  program: TrainingProgram;
}
