import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TokenModule } from 'src/token/token.module';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, PrismaService],
  imports: [TokenModule],
})
export class AdminModule {}
