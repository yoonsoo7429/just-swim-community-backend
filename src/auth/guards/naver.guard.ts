import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class NaverAuthGuard extends AuthGuard('naver') {
  constructor() {
    super(); // Guard의 super를 통해 AuthGuard('naver') 클래스 생성자를 실행 ==> NaverStrategy 클래스
  }
  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    // 에러
    if (err || !user) {
      throw err;
    }
    return user;
  }
}
