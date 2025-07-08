import { Injectable } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TokenService } from 'src/token/token.service';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization']?.split(' ')[1];

    if (!token) return false;
    try {
      const user = this.tokenService.verifyAccessToken(token);
      const existingUser = await this.prismaService.user.findUnique({
        where: { id: user.userId },
      });

      if (!existingUser) {
        return false;
      }

      request.user = user;

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
