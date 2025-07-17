// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   app.enableCors();
//   const port = process.env.PORT; // ❗️KHÔNG có mặc định
//   if (!port) {
//     throw new Error('❌ Missing PORT environment variable');
//   }
//   await app.listen(port);
// }
// bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // ✅ quan trọng nếu bạn gọi từ trình duyệt
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 App is running on http://localhost:${port}`);
}
bootstrap();
