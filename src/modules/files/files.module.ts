import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { imageFileFilter, editFileName } from './helpers/file-upload.utils';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads', // Carpeta destino
      storage: diskStorage({
        destination: './uploads',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  ],
  controllers: [FilesController],
})
export class FilesModule {}