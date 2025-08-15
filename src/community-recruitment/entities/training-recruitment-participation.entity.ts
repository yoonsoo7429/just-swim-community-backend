import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { TrainingProgramRecruitment } from './training-program-recruitment.entity';

@Entity('training_recruitment_participations')
export class TrainingRecruitmentParticipation extends BaseEntity {
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';

  @Column({ type: 'text', nullable: true })
  message: string; // 참여 신청 메시지

  @Column({ type: 'boolean', default: false })
  isRegularParticipant: boolean; // 정기 참여자 여부

  @Column({ type: 'date', nullable: true })
  joinDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string; // 추가 메모

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => TrainingProgramRecruitment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recruitmentId' })
  recruitment: TrainingProgramRecruitment;
}
