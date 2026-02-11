import { Request } from 'express';
import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';

// 1. Filtro: Solo permitir imágenes
export const imageFileFilter = (req: Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
    return callback(new BadRequestException('Solo se permiten archivos de imagen (jpg, jpeg, png, webp)'), false);
  }
  callback(null, true);
};

// 2. Renombrado: UUID + Extensión original (Evita colisiones)
export const editFileName = (req: Request, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => {
  const fileExtName = extname(file.originalname);
  // Generamos un nombre aleatorio simple (o usa uuid si prefieres instalar la librería)
  const randomName = Array(32)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${randomName}${fileExtName}`);
};