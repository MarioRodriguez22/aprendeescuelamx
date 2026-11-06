import multer from 'multer';
import { env } from '../../../config/env.js';

const tiposPermitidos = new Set(['image/jpeg', 'image/png', 'image/webp']);

const cargaFotos = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 50 },
  fileFilter(_req, archivo, callback) {
    if (!tiposPermitidos.has(archivo.mimetype)) {
      callback(new Error('Usa fotos JPG, PNG o WebP.'));
      return;
    }
    callback(null, true);
  }
});

export const subirFotos = cargaFotos.array('fotos', 50);
export const subirFoto = cargaFotos.single('foto');
