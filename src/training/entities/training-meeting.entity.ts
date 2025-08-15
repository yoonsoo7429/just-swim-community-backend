import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { TrainingSeries } from './training-series.entity';
import { TrainingMeetingParticipation } from './training-meeting-participation.entity';

@Entity('training_meetings')
export class TrainingMeeting extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // 모임 일정
  @Column({ type: 'date' })
  meetingDate: Date;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'int' })
  duration: number; // 분 단위

  // 장소 및 인원
  @Column({ type: 'varchar', length: 100 })
  location: string;

  @Column({ type: 'int' })
  minParticipants: number;

  @Column({ type: 'int' })
  maxParticipants: number;

  // 현재 상태
  @Column({ type: 'int', default: 0 })
  currentParticipants: number;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: string; // 'open', 'full', 'cancelled', 'completed'

  // 특별 설정 (기본값과 다른 경우)
  @Column({ type: 'text', nullable: true })
  specialNotes: string; // 특별한 안내사항

  @Column({ type: 'boolean', default: false })
  isModified: boolean; // 기본 설정에서 수정되었는지 여부

  // 관계
  @ManyToOne(() => TrainingSeries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seriesId' })
  series: TrainingSeries;

  @OneToMany(
    () => TrainingMeetingParticipation,
    (participation) => participation.meeting,
    {
      cascade: true,
    },
  )
  participations: TrainingMeetingParticipation[];
}
