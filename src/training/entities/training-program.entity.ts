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

  @Column({ type: 'int' })
  totalWeeks: number;

  @Column({ type: 'int' })
  sessionsPerWeek: number;

  @Column({ type: 'varchar', length: 20, default: 'public' })
  visibility: string;

  @Column({ type: 'boolean', default: false })
  isPublished: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => TrainingSession, (session) => session.trainingProgram, {
    cascade: true,
  })
  sessions: TrainingSession[];
}
