import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { TrainingMeeting } from './training-meeting.entity';

@Entity('training_meeting_participations')
export class TrainingMeetingParticipation extends BaseEntity {
  @Column({ type: 'varchar', length: 20, default: 'confirmed' })
  status: string; // 'confirmed', 'waiting', 'cancelled'

  @Column({ type: 'text', nullable: true })
  notes: string; // 참여자 메모

  @Column({ type: 'boolean', default: false })
  isRegularParticipant: boolean; // 정기 참여자 여부

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => TrainingMeeting, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meetingId' })
  meeting: TrainingMeeting;
}
