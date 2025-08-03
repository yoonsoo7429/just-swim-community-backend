import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Comment } from '../../comments/entities/comment.entity';

@Entity('swimming_records')
export class SwimmingRecord extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  duration: number; // 분 단위

  @Column({ type: 'int' })
  distance: number; // 미터 단위

  @Column({ type: 'varchar', length: 50 })
  style: string; // 자유형, 접영, 평영, 배영 등

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
