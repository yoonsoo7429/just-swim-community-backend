import { IsEnum } from 'class-validator';
import { FriendshipStatus } from '../entities/friendship.entity';

export class RespondFriendshipDto {
  @IsEnum([FriendshipStatus.ACCEPTED, FriendshipStatus.REJECTED])
  status: FriendshipStatus.ACCEPTED | FriendshipStatus.REJECTED;
}
