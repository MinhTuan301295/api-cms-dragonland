import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT; // ❗️KHÔNG có mặc định
  if (!port) {
    throw new Error('❌ Missing PORT environment variable');
  }
  await app.listen(port);
}
bootstrap();
