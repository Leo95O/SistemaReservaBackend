import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Get, Param, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // <--- Importar ConfigService
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('files')
export class FilesController {
  // Inyectamos ConfigService
  constructor(private readonly configService: ConfigService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }

    // Obtenemos la URL base del entorno, si no existe usa localhost como fallback
    const baseUrl = this.configService.get<string>('API_URL') || 'http://localhost:3000';
    
    // Construimos la URL dinámica
    const secureUrl = `${baseUrl}/api/v1/files/product/${file.filename}`;
    
    return {
      originalName: file.originalname,
      filename: file.filename,
      url: secureUrl,
    };
  }

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