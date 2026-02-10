import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Configuración global de Validación (Ya la tenías)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, 
      forbidNonWhitelisted: true, 
      transform: true, 
    }),
  );

  // 2. CALIDAD: Serialización Automática (NUEVO)
  // Esto activa los decoradores @Exclude() y @Expose() en tus entidades
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // 3. Prefijo global para la API
  app.setGlobalPrefix('api/v1');

  await app.listen(3000);
}
bootstrap();