import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/prisma.service';
import { TokenService } from 'src/token/token.service';
import { TokenModule } from 'src/token/token.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  imports: [TokenModule],
})
export class AuthModule {}
