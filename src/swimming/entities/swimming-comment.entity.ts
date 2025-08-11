import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { SwimmingRecord } from './swimming.entity';

@Entity('swimming_comments')
export class SwimmingComment extends BaseEntity {
  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => SwimmingRecord, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'swimmingRecordId' })
  swimmingRecord: SwimmingRecord;

  @Column({ type: 'int', default: 0 })
  likes: number;
}
