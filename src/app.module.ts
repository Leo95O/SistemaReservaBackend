import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Módulos Feature
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { BranchesModule } from './modules/branches/branches.module';
import { ZonesModule } from './modules/zones/zones.module';
import { TablesModule } from './modules/tables/tables.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { FilesModule } from './modules/files/files.module'; // <--- EL NUEVO

// Core
import { RedisModule } from './core/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432, 
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true, // Recuerda: false en producción
    }),
    
    // REGISTRO DE MÓDULOS (Sin esto, no existen endpoints)
    UsersModule,
    AuthModule,
    BranchesModule,     // Ya tenía la entidad actualizada
    ZonesModule,        // Ya tiene el Batch Update
    TablesModule,       // Ya tiene la geometría
    ReservationsModule, // Ya tiene la lógica de colisión
    FilesModule,        // Ya sube imágenes
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}