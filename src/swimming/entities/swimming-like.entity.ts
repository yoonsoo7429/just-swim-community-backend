import { Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { SwimmingRecord } from './swimming.entity';

@Entity('swimming_likes')
export class SwimmingLike extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => SwimmingRecord, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'swimmingRecordId' })
  swimmingRecord: SwimmingRecord;
}
