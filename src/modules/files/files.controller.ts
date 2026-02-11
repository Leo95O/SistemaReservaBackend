import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Get, Param, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express'; // Importante: de express
import * as path from 'path';
import * as fs from 'fs';

@Controller('files')
export class FilesController {
  
  // 1. SUBIR IMAGEN
  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // 'file' es el nombre del campo en el FormData
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }

    // Construimos la URL pública (ajusta el puerto/dominio según tu entorno)
    // NOTA: Para producción, aquí usarías variables de entorno (process.env.HOST_URL)
    const secureUrl = `http://localhost:3000/api/v1/files/product/${file.filename}`;
    
    return {
      originalName: file.originalname,
      filename: file.filename,
      url: secureUrl, // Esta es la URL que guardarás en backgroundImageUrl
    };
  }

  // 2. SERVIR IMAGEN (Alternativa si no usamos StaticAssets)
  // Esto es útil si quieres control de acceso o si las imágenes están fuera del root
  @Get('product/:imagename')
  findProductImage(@Param('imagename') imagename: string, @Res() res: Response) {
    const filePath = path.join(process.cwd(), 'uploads', imagename);
    
    if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
    } else {
        throw new BadRequestException('Imagen no encontrada');
    }
  }
}