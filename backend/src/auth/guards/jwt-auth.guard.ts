import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest();

    const authHeader =
      request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException(
        'Token requerido',
      );
    }

    const [type, token] =
      authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException(
        'Token inválido',
      );
    }

    try {
      const payload =
        await this.jwtService.verifyAsync(
          token,
          {
            secret: 'SUPER_SECRET_JWT',
          },
        );

      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException(
        'Token inválido',
      );
    }
  }
}