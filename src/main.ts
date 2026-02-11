import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express'; // IMPORTANTE
import * as path from 'path';

async function bootstrap() {
  // 1. Especificar el tipo genérico NestExpressApplication
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, 
      forbidNonWhitelisted: true, 
      transform: true, 
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.setGlobalPrefix('api/v1');

  // 2. SERVIR ARCHIVOS ESTÁTICOS
  // Esto permite acceder a http://localhost:3000/uploads/mi-imagen.jpg directamente
  app.useStaticAssets(path.join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/', // Prefijo virtual en la URL
  });

  // Habilitar CORS es vital para que Angular pueda enviar imágenes
  app.enableCors();

  await app.listen(3000);
}
bootstrap();