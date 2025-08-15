import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { TrainingProgram } from '../../training/entities/training-program.entity';

@Entity('training_program_recruitments')
export class TrainingProgramRecruitment extends BaseEntity {
  @Column({ type: 'varchar', length: 20, default: 'short-term' })
  type: 'short-term' | 'recurring'; // 단기 모임 | 정기 모임

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: 'open' | 'full' | 'closed' | 'completed';

  // 모임 정보
  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'time', nullable: true })
  meetingTime: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location: string;

  // 정기 모임용 필드들
  @Column({ type: 'json', nullable: true })
  repeatDays: string[]; // ['monday', 'wednesday', 'friday']

  @Column({ type: 'date', nullable: true })
  recurringStartDate: Date;

  @Column({ type: 'date', nullable: true })
  recurringEndDate: Date;

  // 참여자 관리
  @Column({ type: 'int', default: 1 })
  minParticipants: number;

  @Column({ type: 'int', default: 10 })
  maxParticipants: number;

  @Column({ type: 'int', default: 0 })
  currentParticipants: number;

  // 모집 조건
  @Column({ type: 'varchar', length: 20, default: 'all' })
  targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'all';

  @Column({ type: 'text', nullable: true })
  requirements: string;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastRecruitmentUpdate: Date; // 마지막 모집 글 갱신 시간

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => TrainingProgram, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programId' })
  program: TrainingProgram;
}
