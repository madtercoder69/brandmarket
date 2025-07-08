import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaService } from 'src/prisma.service';
import { TokenModule } from 'src/token/token.module';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, PrismaService],
  imports: [TokenModule],
})
export class CategoryModule {}
