import { Module } from '@nestjs/common';
import { OverviewService } from './overview.service';
import { OverviewController } from './overview.controller';
import { PrismaService } from 'src/prisma.service';
import { TokenModule } from 'src/token/token.module';

@Module({
  controllers: [OverviewController],
  providers: [OverviewService, PrismaService],
  imports: [TokenModule],
})
export class OverviewModule {}
