import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFriendshipDto {
  @IsNumber()
  addresseeId: number;

  @IsOptional()
  @IsString()
  message?: string;
}
