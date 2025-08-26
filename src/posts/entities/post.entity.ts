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
import { BaseEntity } from 'src/common/entities/base.entity';

export enum PostCategory {
  기록공유 = '기록 공유',
  팁공유 = '팁 공유',
  질문 = '질문',
  훈련후기 = '훈련 후기',
  훈련모집 = '훈련 모집',
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
    enum: [
      '기록 공유',
      '팁 공유',
      '질문',
      '훈련 후기',
      '훈련 모집',
      '챌린지',
      '가이드',
    ],
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
  likedBy: User[]; // 좋아요한 사용자들

  @ManyToMany(() => User)
  @JoinTable({
    name: 'post_participants',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  participants: User[];

  @Column('simple-array', { nullable: true })
  tags: string[];

  @ManyToOne(() => SwimmingRecord, { nullable: true })
  @JoinColumn({ name: 'swimmingRecordId' })
  swimmingRecord: SwimmingRecord;

  @ManyToOne(() => TrainingProgram, { nullable: true })
  @JoinColumn({ name: 'trainingProgramId' })
  trainingProgram: TrainingProgram;

  // 훈련 모집 관련 필드들 (category가 '훈련 모집'일 때만 사용)
  @Column({ type: 'varchar', length: 20, nullable: true })
  recruitmentType?: string; // 'regular' | 'one-time'

  // 정기 모임일 때
  @Column({ type: 'simple-array', nullable: true })
  meetingDays?: string[]; // ['monday', 'wednesday', 'friday']

  @Column({ type: 'time', nullable: true })
  meetingTime?: string; // "19:00"

  // 단기 모임일 때
  @Column({ type: 'timestamp', nullable: true })
  meetingDateTime?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  participationFee?: number; // 참가료 (원 단위, 소수점 2자리까지)

  @Column({ type: 'int', nullable: true })
  maxParticipants?: number;

  @Column({ type: 'int', default: 0 })
  currentParticipants?: number;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  recruitmentStatus?: string; // 'open' | 'full' | 'closed'
}
