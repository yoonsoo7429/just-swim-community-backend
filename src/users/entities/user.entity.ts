import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { SwimmingRecord } from '../../swimming/entities/swimming.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { TrainingProgram } from '../../training/entities/training-program.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 20, default: 'local' })
  provider: string;

  @Column({ nullable: true })
  providerId: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  password: string;

  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  profileImage: string;

  @Column({ type: 'varchar', length: 20, default: 'beginner' })
  level: string;

  @OneToMany('SwimmingRecord', 'user')
  swimmingRecords: SwimmingRecord[];

  @OneToMany('Comment', 'user')
  comments: Comment[];

  @OneToMany('TrainingProgram', 'user')
  trainingPrograms: TrainingProgram[];
}
