import { Module } from '@nestjs/common';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
@Module({
  imports: [AnalyticsModule, PrismaModule],
  controllers: [AppController],
})
export class AppModule {}
