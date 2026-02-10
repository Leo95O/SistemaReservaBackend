import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { User } from '@modules/users/entities/user.entity'; // Ejemplo de cómo se vería con alias a futuro

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      // Solución: Validación segura. Si es undefined, usa 5432.
      port: Number(process.env.DB_PORT) || 5432, 
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true, 
    }),
    // Aquí irían tus módulos importados:
    // BranchesModule,
    // ZonesModule,
    // TablesModule,
    // ReservationsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}