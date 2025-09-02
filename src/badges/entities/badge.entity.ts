import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserBadge } from './user-badge.entity';

@Entity('badges')
export class Badge extends BaseEntity {
  @Column({ unique: true })
  key: string; // 배지 고유 키 (예: 'distance_1km', 'consecutive_7days')

  @Column()
  name: string; // 배지 이름 (예: '첫 1km 달성')

  @Column({ type: 'text', nullable: true })
  description: string; // 배지 설명

  @Column()
  icon: string; // 배지 아이콘 (이모지 또는 이미지 URL)

  @Column({ type: 'varchar', length: 20, default: 'bronze' })
  tier: string; // bronze, silver, gold, platinum

  @Column({ type: 'varchar', length: 30 })
  category: string; // distance, consecutive, stroke, special 등

  @Column({ type: 'json', nullable: true })
  criteria: any; // 배지 획득 조건 (JSON 형태)

  @Column({ type: 'int', default: 10 })
  points: number; // 배지 획득 시 받는 포인트

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // 활성화 여부

  @OneToMany(() => UserBadge, (userBadge) => userBadge.badge)
  userBadges: UserBadge[];
}
