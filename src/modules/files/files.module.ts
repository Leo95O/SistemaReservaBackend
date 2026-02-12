import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid'; // Asegúrate de tener: npm install uuid @types/uuid

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/zones', // Carpeta específica para zonas
        filename: (req, file, cb) => {
          // Generamos nombre único: uuid + extensión original
          const randomName = uuidv4();
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB en bytes
      },
    }),
  ],
  controllers: [FilesController],
})
export class FilesModule {}