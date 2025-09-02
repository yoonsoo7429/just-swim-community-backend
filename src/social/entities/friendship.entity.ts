import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BaseEntity } from 'src/common/entities/base.entity';

export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  BLOCKED = 'blocked',
  REJECTED = 'rejected',
}

@Entity('friendships')
export class Friendship extends BaseEntity {
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'requesterId' })
  requester: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'addresseeId' })
  addressee: User;

  @Column({
    type: 'enum',
    enum: FriendshipStatus,
    default: FriendshipStatus.PENDING,
  })
  status: FriendshipStatus;

  @Column({ type: 'text', nullable: true })
  message: string; // 친구 요청 메시지

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date; // 수락된 시간
}
