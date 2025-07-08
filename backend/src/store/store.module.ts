import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { PrismaService } from 'src/prisma.service';
import { TokenModule } from 'src/token/token.module';

@Module({
  controllers: [StoreController],
  providers: [StoreService, PrismaService],
  imports: [TokenModule],
})
export class StoreModule {}
