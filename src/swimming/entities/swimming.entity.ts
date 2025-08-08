import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Comment } from '../../comments/entities/comment.entity';

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

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany('Comment', 'swimmingRecord', {
    cascade: true,
  })
  comments: Comment[];
}
