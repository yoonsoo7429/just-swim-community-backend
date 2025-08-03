import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateKakaoUser(profile: any): Promise<User> {
    const { id, name, _json } = profile;

    let user = await this.usersService.findByKakaoId(id);

    if (!user) {
      // 새 사용자 생성
      user = await this.usersService.create({
        email: _json.kakao_account?.email,
        name: _json.kakao_account.nickname,
        profileImage: _json.properties.profile_image,
        provider: 'kakao',
        providerId: id.toString(),
      });
    }

    return user;
  }

  async signin(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      provider: user.provider,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        provider: user.provider,
        providerId: user.providerId,
        level: user.level,
      },
    };
  }
}
