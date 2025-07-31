import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // ✅ quan trọng nếu bạn gọi từ trình duyệt
  const port = process.env.PORT || 3000;
  await app.listen(process.env.PORT || 8080, '0.0.0.0');
  console.log(`🚀 App is running on http://localhost:${port}`);
}
bootstrap();
