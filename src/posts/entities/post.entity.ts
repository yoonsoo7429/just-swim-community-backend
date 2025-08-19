import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { SwimmingRecord } from '../../swimming/entities/swimming.entity';
import { TrainingProgram } from '../../training/entities/training-program.entity';
import { TrainingSeries } from '../../training/entities/training-series.entity';
import { BaseEntity } from 'src/common/entities/base.entity';

export enum PostCategory {
  기록공유 = '기록 공유',
  팁공유 = '팁 공유',
  질문 = '질문',
  훈련후기 = '훈련 후기',
  챌린지 = '챌린지',
  가이드 = '가이드',
}

@Entity()
export class Post extends BaseEntity {
  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: ['기록 공유', '팁 공유', '질문', '훈련 후기', '챌린지', '가이드'],
    default: '기록 공유',
  })
  category: string;

  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'post_likes',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  likedBy: User[];

  @Column('simple-array', { nullable: true })
  tags: string[];

  @ManyToOne(() => SwimmingRecord, { nullable: true })
  @JoinColumn({ name: 'swimmingRecordId' })
  swimmingRecord: SwimmingRecord;

  @ManyToOne(() => TrainingProgram, { nullable: true })
  @JoinColumn({ name: 'trainingProgramId' })
  trainingProgram: TrainingProgram;

  @ManyToOne(() => TrainingSeries, { nullable: true })
  @JoinColumn({ name: 'trainingSeriesId' })
  trainingSeries: TrainingSeries;
}
