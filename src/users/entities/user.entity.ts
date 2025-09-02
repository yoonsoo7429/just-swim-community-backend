import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { SwimmingRecord } from '../../swimming/entities/swimming.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { TrainingProgram } from '../../training/entities/training-program.entity';
import { Post } from '../../posts/entities/post.entity';
import { UserBadge } from '../../badges/entities/user-badge.entity';

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

  @Column({ type: 'int', default: 0 })
  experience: number; // 총 경험치

  @Column({ type: 'int', default: 1 })
  userLevel: number; // 현재 레벨

  @Column({ type: 'varchar', nullable: true })
  title: string; // 특별 칭호

  @Column({ type: 'text', nullable: true })
  bio: string; // 자기소개

  @OneToMany(() => SwimmingRecord, (record) => record.user)
  swimmingRecords: SwimmingRecord[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments: Comment[];

  @OneToMany(() => TrainingProgram, (program) => program.user)
  trainingPrograms: TrainingProgram[];

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @OneToMany(() => UserBadge, (userBadge) => userBadge.user)
  badges: UserBadge[];
}
