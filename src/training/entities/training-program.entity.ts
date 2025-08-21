import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('training_programs')
export class TrainingProgram extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 20, default: 'beginner' })
  difficulty: string;

  @Column({ type: 'varchar', length: 20, default: 'private' })
  visibility: string; // 'private' | 'public'

  @Column({ type: 'boolean', default: false })
  isPublished: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
