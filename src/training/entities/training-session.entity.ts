import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { TrainingProgram } from './training-program.entity';
import { User } from '../../users/entities/user.entity';

@Entity('training_sessions')
export class TrainingSession extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', nullable: true })
  weekNumber: number;

  @Column({ type: 'int', nullable: true })
  sessionNumber: number;

  @Column({ type: 'int', nullable: true })
  order: number;

  @Column({ type: 'int' })
  totalDistance: number;

  @Column({ type: 'int' })
  estimatedDuration: number;

  @Column({ type: 'text' })
  workout: string;

  @ManyToOne(() => TrainingProgram, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trainingProgramId' })
  trainingProgram: TrainingProgram;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
