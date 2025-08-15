import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { TrainingProgram } from '../../training/entities/training-program.entity';

@Entity('training_program_reviews')
export class TrainingProgramReview extends BaseEntity {
  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text' })
  review: string;

  @Column({ type: 'boolean', default: false })
  isAnonymous: boolean;

  @Column({ type: 'jsonb', nullable: true })
  reviewCategories: any;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => TrainingProgram, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programId' })
  program: TrainingProgram;
}
