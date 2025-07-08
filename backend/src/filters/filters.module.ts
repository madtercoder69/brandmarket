import { Module } from '@nestjs/common';
import { FiltersService } from './filters.service';
import { FiltersController } from './filters.controller';
import { TokenModule } from 'src/token/token.module';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [FiltersController],
  providers: [FiltersService, PrismaService],
  imports: [TokenModule],
})
export class FiltersModule {}
