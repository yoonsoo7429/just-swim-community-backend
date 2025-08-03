import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { SwimmingRecord } from '../../swimming/entities/swimming.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { TrainingProgram } from '../../training/entities/training-program.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 20, default: 'local' })
  provider: string; // local, google, github, etc.

  @Column({ nullable: true })
  providerId: string; // OAuth provider의 ID

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  profileImage: string;

  @Column({ type: 'varchar', length: 20, default: 'beginner' })
  level: string; // beginner, intermediate, advanced, expert

  @OneToMany('SwimmingRecord', 'user')
  swimmingRecords: SwimmingRecord[];

  @OneToMany('Comment', 'user')
  comments: Comment[];

  @OneToMany('TrainingProgram', 'user')
  trainingPrograms: TrainingProgram[];
}
