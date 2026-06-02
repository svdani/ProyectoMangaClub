import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import {
  SwaggerModule,
  DocumentBuilder,
} from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  
  const config = new DocumentBuilder()
    .setTitle('MangaClub API')
    .setDescription('API del proyecto MangaClub')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(
    app,
    config,
  );

  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}

bootstrap();