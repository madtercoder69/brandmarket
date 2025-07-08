import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma.service';
import * as argon2 from 'argon2';
import { Role } from '@prisma/client';
import { TokenService } from 'src/token/token.service';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async register(user: CreateUserDto) {
    const isExisting = await this.prismaService.user.findUnique({
      where: { username: user.username },
    });

    if (isExisting) throw new ConflictException('Username is already taken');

    const hashedPass = await argon2.hash(user.password);

    const createdUser = await this.prismaService.user.create({
      data: {
        username: user.username,
        password: hashedPass,
        role: Role.USER,
      },
    });

    const accessToken =
      await this.tokenService.generateAccessToken(createdUser);
    const refreshToken =
      await this.tokenService.generateRefreshToken(createdUser);

    return { accessToken, refreshToken };
  }

  async login(user: LoginUserDto) {
    const existingUser = await this.prismaService.user.findUnique({
      where: { username: user.username },
    });
    if (!existingUser) throw new UnauthorizedException('Invalid credentials');

    if (existingUser.isBlocked) {
      throw new ForbiddenException('Your account is blocked');
    }

    const passwordMatches = await argon2.verify(
      existingUser.password,
      user.password,
    );

    if (!passwordMatches)
      throw new UnauthorizedException('Invalid credentials');

    const accessToken =
      await this.tokenService.generateAccessToken(existingUser);
    const refreshToken =
      await this.tokenService.generateRefreshToken(existingUser);

    return { accessToken, refreshToken };
  }
}
