import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async generateAccessToken(user: User) {
    return this.jwtService.signAsync({
      userId: user.id,
      username: user.username,
      role: user.role,
    });
  }

  async generateRefreshToken(user: User) {
    return this.jwtService.signAsync({ userId: user.id }, { expiresIn: '7d' });
  }

  verifyAccessToken(token: string): any {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}
