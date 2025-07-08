import { Module, OnModuleInit } from '@nestjs/common';
import { HeaderButtonService } from './header-button.service';
import { HeaderButtonController } from './header-button.controller';
import { PrismaService } from 'src/prisma.service';
import { TokenModule } from 'src/token/token.module';

@Module({
  controllers: [HeaderButtonController],
  providers: [HeaderButtonService, PrismaService],
  imports: [TokenModule],
  exports: [HeaderButtonService],
})
export class HeaderButtonModule implements OnModuleInit {
  constructor(private readonly headerButtonService: HeaderButtonService) {}

  async onModuleInit() {
    await this.headerButtonService.initializeDefaultButtons();
  }
} 