import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Badge } from './badge.entity';

@Entity('user_badges')
export class UserBadge extends BaseEntity {
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  earnedAt: Date; // 배지 획득 시점

  @Column({ type: 'json', nullable: true })
  metadata: any; // 배지 획득 당시의 추가 정보 (예: 달성한 거리, 연속일 등)

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Badge, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'badgeId' })
  badge: Badge;
}
