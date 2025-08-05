import { BaseDto } from '../../common/dto/base.dto';

export class UserResponseDto extends BaseDto {
  id: number;
  email: string;
  name: string;
  profileImage?: string;
  provider: string;
  providerId: string;
  level: string;
}

export class AuthResponseDto {
  access_token: string;
  user: UserResponseDto;
}
