import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PrismaService } from 'src/prisma.service';
import { TokenModule } from 'src/token/token.module';

@Module({
  controllers: [ProductController],
  providers: [ProductService, PrismaService],
  imports: [TokenModule],
})
export class ProductModule {}
