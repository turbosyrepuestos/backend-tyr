import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

const IMAGE_MIME = /^image\/(jpeg|jpg|png|gif|webp)$/i;

export function createImageMulterOptions(maxSizeMb = 5) {
  return {
    storage: memoryStorage(),
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
    fileFilter: (
      _req: Express.Request,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (!IMAGE_MIME.test(file.mimetype)) {
        cb(
          new BadRequestException(
            'Solo se permiten imágenes (jpeg, png, gif, webp)',
          ),
          false,
        );
        return;
      }
      cb(null, true);
    },
  };
}
