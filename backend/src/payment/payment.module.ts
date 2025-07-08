import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentFactoryService } from './payment-factory.service';
import { CryptoBotService } from './providers/cryptobot.service';
import { BTCPayService } from './providers/btcpay.service';
import { PrismaService } from 'src/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { TokenModule } from 'src/token/token.module';
import { ExchangeRateModule } from 'src/exchange-rate/exchange-rate.module';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [ConfigModule, TokenModule, ExchangeRateModule, ChatModule],
  controllers: [PaymentController],
  providers: [PaymentService, CryptoBotService, BTCPayService, PaymentFactoryService, PrismaService],
  exports: [PaymentService, PaymentFactoryService],
})
export class PaymentModule {} 