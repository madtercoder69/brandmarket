import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { StoreModule } from './store/store.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ProductModule } from './product/product.module';
import { UserModule } from './user/user.module';
import { OverviewModule } from './overview/overview.module';
import { CategoryModule } from './category/category.module';
import { FiltersModule } from './filters/filters.module';
import { ChatModule } from './chat/chat.module';
import { PaymentModule } from './payment/payment.module';
import { ExchangeRateModule } from './exchange-rate/exchange-rate.module';
import { HeaderButtonModule } from './header-button/header-button.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AdminModule,
    StoreModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
    }),
    StoreModule,
    ProductModule,
    UserModule,
    OverviewModule,
    CategoryModule,
    FiltersModule,
    ChatModule,
    PaymentModule,
    ExchangeRateModule,
    HeaderButtonModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
