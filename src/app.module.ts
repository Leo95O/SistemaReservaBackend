import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ZonesModule } from './modules/zones/zones.module';
import { TablesModule } from './modules/tables/tables.module';
import { BranchesModule } from './modules/branches/branches.module';

@Module({
  imports: [
    ConfigModule.forRoot(), // 1. Leer .env
    TypeOrmModule.forRoot({ // 2. Conectar a Postgres
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true, 
    }), ZonesModule, TablesModule, BranchesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}