import { Module, OnModuleInit } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';
import { PrismaService } from 'src/prisma.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [ExchangeRateService, PrismaService],
  exports: [ExchangeRateService],
})
export class ExchangeRateModule implements OnModuleInit {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  async onModuleInit() {
    await this.exchangeRateService.initRates();
  }
} 