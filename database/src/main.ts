import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with full configuration
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Database Service API')
    .setDescription('Database operations API for AI-FinOps platform')
    .setVersion('1.0')
    .addTag('Users')
    .addTag('Refresh Tokens')
    .addTag('Sessions')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3002;
  await app.listen(port);
  console.log(`Database service is running on: http://localhost:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
