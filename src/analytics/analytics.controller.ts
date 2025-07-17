import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // @Get('summary')
  // getSummary(@Query('from') from?: string, @Query('to') to?: string) {
  //   return this.analyticsService.getSummary(from, to);
  // }
  @Get('summary')
  getSummary() {
    return { message: 'Hello from API' }; // ✅ Tạm thời hardcode test
  }
}
