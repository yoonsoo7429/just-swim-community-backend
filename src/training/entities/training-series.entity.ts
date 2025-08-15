import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { TrainingProgram } from './training-program.entity';
import { TrainingMeeting } from './training-meeting.entity';

@Entity('training_series')
export class TrainingSeries extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 20, default: 'beginner' })
  difficulty: string;

  @Column({ type: 'varchar', length: 20, default: 'recurring' })
  type: string; // 'one-time' | 'recurring'

  // 반복 설정 (정기 모임일 때만)
  @Column({ type: 'simple-array', nullable: true })
  repeatDays: string[]; // ['monday', 'wednesday', 'friday']

  @Column({ type: 'varchar', length: 10, nullable: true })
  repeatTime: string; // "19:00"

  @Column({ type: 'int', nullable: true })
  duration: number; // 분 단위

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  // 기본 설정
  @Column({ type: 'varchar', length: 100, nullable: true })
  defaultLocation: string; // 기본 장소

  @Column({ type: 'int', default: 8 })
  defaultMinParticipants: number; // 기본 최소 인원

  @Column({ type: 'int', default: 12 })
  defaultMaxParticipants: number; // 기본 최대 인원

  // 상태 관리
  @Column({ type: 'boolean', default: true })
  isActive: boolean; // 시리즈 활성화 상태

  @Column({ type: 'boolean', default: false })
  isPublished: boolean; // 커뮤니티 공개 여부

  // 관계
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => TrainingProgram, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trainingProgramId' })
  trainingProgram: TrainingProgram;

  @OneToMany(
    () => TrainingMeeting,
    (meeting: TrainingMeeting) => meeting.series,
    {
      cascade: true,
    },
  )
  meetings: TrainingMeeting[];
}
