import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { SignUpDto, SignInDto, AuthResponseDto, UserResponseDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup(signUpDto: SignUpDto): Promise<AuthResponseDto> {
    // 이메일 중복 확인
    const existingUser = await this.usersService.findByEmail(signUpDto.email);
    if (existingUser) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(signUpDto.password, 10);

    // 새 사용자 생성
    const user = await this.usersService.create({
      email: signUpDto.email,
      name: signUpDto.name,
      password: hashedPassword,
      provider: 'email',
      providerId: signUpDto.email, // 이메일을 providerId로 사용
    });

    return this.signin(user);
  }

  async emailSignin(signInDto: SignInDto): Promise<AuthResponseDto> {
    // 사용자 찾기
    const user = await this.usersService.findByEmail(signInDto.email);
    if (!user) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(
      signInDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    return this.signin(user);
  }

  async validateKakaoUser(profile: any): Promise<User> {
    const { id, name, _json } = profile;

    let user = await this.usersService.findByKakaoId(id);

    if (!user) {
      // 새 사용자 생성
      user = await this.usersService.create({
        email: _json.kakao_account?.email,
        name: _json.properties.nickname,
        profileImage: _json.properties.profile_image,
        provider: 'kakao',
        providerId: id.toString(),
      });
    }

    return user;
  }

  async validateGoogleUser(profile: any): Promise<User> {
    const { id, emails, displayName, photos } = profile;

    let user = await this.usersService.findByGoogleId(id);

    if (!user) {
      // 새 사용자 생성
      user = await this.usersService.create({
        email: emails[0]?.value,
        name: displayName,
        profileImage: photos[0]?.value,
        provider: 'google',
        providerId: id,
      });
    }

    return user;
  }

  async validateNaverUser(profile: any): Promise<User> {
    const { id, email, nickname, profile_image } = profile;

    let user = await this.usersService.findByNaverId(id);

    if (!user) {
      // 새 사용자 생성
      user = await this.usersService.create({
        email: email,
        name: nickname,
        profileImage: profile_image,
        provider: 'naver',
        providerId: id,
      });
    }

    return user;
  }

  async signin(user: User): Promise<AuthResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      provider: user.provider,
    };

    const userResponse: UserResponseDto = {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      provider: user.provider,
      providerId: user.providerId,
      level: user.level,
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: userResponse,
    };
  }
}
