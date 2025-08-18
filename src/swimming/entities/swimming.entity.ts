import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { SwimmingComment } from './swimming-comment.entity';
import { SwimmingLike } from './swimming-like.entity';

interface StrokeRecord {
  style: string;
  distance: number;
}

@Entity('swimming_records')
export class SwimmingRecord extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  poolLength: number; // 수영장 길이 (미터)

  @Column({ type: 'varchar', length: 100, nullable: true })
  poolName: string; // 수영장 이름 (예: "올림픽공원 수영장", "잠실 실내수영장")

  @Column({ type: 'varchar', length: 10 })
  sessionStartTime: string; // HH:MM 형식

  @Column({ type: 'varchar', length: 10 })
  sessionEndTime: string; // HH:MM 형식

  @Column({ type: 'json', nullable: true })
  strokes: StrokeRecord[];

  @Column({ type: 'int' })
  totalDistance: number; // 미터 단위

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalDuration: number; // 분 단위

  @Column({ type: 'int', nullable: true })
  calories: number;

  @Column({ type: 'timestamp', nullable: true })
  sessionDate: Date;

  @Column({ type: 'varchar', length: 20, default: 'public' })
  visibility: string; // public, private, friends

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => SwimmingComment, (comment) => comment.swimmingRecord, {
    cascade: true,
  })
  comments: SwimmingComment[];

  @OneToMany(() => SwimmingLike, (like) => like.swimmingRecord, {
    cascade: true,
  })
  likes: SwimmingLike[];

  @Column({ type: 'int', default: 0 })
  likesCount: number;

  @Column({ type: 'int', default: 0 })
  commentsCount: number;
}
