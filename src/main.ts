import { NestFactory, Reflector } from '@nestjs/core'; // 1. Importar Reflector
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common'; // 2. Importar Interceptor
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  // Especificar NestExpressApplication para usar assets estáticos
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api/v1');

  // --- PIPES GLOBALES (Validación) ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // --- INTERCEPTORES GLOBALES (Seguridad/Serialización) ---
  // Esto activa los decoradores @Exclude() y @Expose() en tus entidades
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // --- ARCHIVOS ESTÁTICOS (Imágenes) ---
  // Expone la carpeta './uploads' en la URL '/uploads/'
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // --- CORS (Para que Angular pueda conectarse) ---
  app.enableCors();

  await app.listen(process.env.PORT || 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();