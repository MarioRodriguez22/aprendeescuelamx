import { Router } from 'express';
import { casosUso, repositorio } from '../../../config/container.js';
import { subirFoto, subirFotos } from '../middlewares/upload.js';

export const preguntaRouter = Router();

function adaptarArchivo(archivo) {
  if (!archivo) return null;
  return {
    nombre: archivo.originalname,
    mimeType: archivo.mimetype,
    bytes: archivo.buffer
  };
}

preguntaRouter.post('/clasificar-foto', (req, res, next) => {
  subirFoto(req, res, async (error) => {
    if (error) return next(error);
    try {
      const resultado = await casosUso.clasificarFotos.ejecutarUna(
        adaptarArchivo(req.file),
        req.body?.materia,
        req.usuario.id
      );
      res.json(resultado);
    } catch (fallo) {
      next(fallo);
    }
  });
});

preguntaRouter.post('/clasificar-fotos', (req, res, next) => {
  subirFotos(req, res, async (error) => {
    if (error) return next(error);
    try {
      const resultado = await casosUso.clasificarFotos.ejecutar(
        (req.files || []).map(adaptarArchivo),
        req.body?.materia,
        req.usuario.id
      );
      res.json(resultado);
    } catch (fallo) {
      next(fallo);
    }
  });
});

preguntaRouter.get('/fotos', async (req, res, next) => {
  try {
    res.json({ fotos: await repositorio.listarFotos(req.usuario.id) });
  } catch (error) {
    next(error);
  }
});

preguntaRouter.get('/fotos/:id/imagen', async (req, res, next) => {
  try {
    const imagen = await repositorio.obtenerImagenFoto(req.params.id, req.usuario.id);
    if (!imagen) return res.status(404).json({ error: 'No se encontró la foto de esta cuenta.' });
    res.set('Cache-Control', 'private, no-store');
    res.type(imagen.mimeType).send(imagen.bytes);
  } catch (error) {
    next(error);
  }
});

preguntaRouter.post('/extraer-texto', (req, res, next) => {
  subirFotos(req, res, async (error) => {
    if (error) return next(error);
    try {
      const resultado = await casosUso.extraerTexto.ejecutar(req.files || []);
      res.json(resultado);
    } catch (fallo) {
      next(fallo);
    }
  });
});

preguntaRouter.get('/', async (req, res, next) => {
  try {
    const materia = String(req.query.materia || '').trim();
    const grado = Number(req.query.grado);
    if (!materia || !Number.isInteger(grado) || grado < 1 || grado > 6) {
      return res.status(400).json({ error: 'Indica materia y grado válido.' });
    }
    res.json(await repositorio.listarPreguntas({ materia, grado, usuarioId: req.usuario.id }));
  } catch (error) {
    next(error);
  }
});
