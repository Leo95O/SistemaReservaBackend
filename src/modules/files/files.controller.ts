import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  BadRequestException, 
  ParseFilePipe, 
  FileTypeValidator, 
  MaxFileSizeValidator 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

@Controller('files')
export class FilesController {
  constructor(private readonly configService: ConfigService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // 'file' es el nombre del campo en el Form-Data
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // 1. Validar Tipo (Regex para imágenes)
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
          // 2. Validar Tamaño (5MB)
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), 
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }

    // Construir URL pública
    // Usa la variable de entorno API_URL o localhost por defecto
    const baseUrl = this.configService.get<string>('API_URL') || 'http://localhost:3000';
    
    // La ruta debe coincidir con la configuración estática en main.ts
    const url = `${baseUrl}/uploads/zones/${file.filename}`;

    return { url };
  }
}