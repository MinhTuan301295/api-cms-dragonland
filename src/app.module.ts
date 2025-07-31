import { Module } from '@nestjs/common';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
@Module({
  imports: [AnalyticsModule],
  controllers: [AppController],
})
export class AppModule {}
