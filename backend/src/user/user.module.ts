import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from 'src/prisma.service';
import { TokenModule } from 'src/token/token.module';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService],
  imports: [TokenModule],
})
export class UserModule {}
