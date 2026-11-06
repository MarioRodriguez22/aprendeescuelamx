import { Router } from 'express';
import { casosUso, repositorio } from '../../../config/container.js';

export const examenRouter = Router();

examenRouter.post('/', async (req, res, next) => {
  try {
    const examen = await casosUso.generarExamen.ejecutar(req.body || {}, req.usuario.id);
    res.status(201).json(examen);
  } catch (error) {
    next(error);
  }
});

examenRouter.get('/:id', async (req, res, next) => {
  try {
    const examen = await repositorio.obtenerPorId(req.params.id, req.usuario.id);
    if (!examen) return res.status(404).json({ error: 'No encontramos ese examen.' });
    res.json(examen);
  } catch (error) {
    next(error);
  }
});

examenRouter.post('/:id/calificar', async (req, res, next) => {
  try {
    const resultado = await casosUso.calificarExamen.ejecutar({
      examenId: req.params.id,
      respuestas: req.body?.respuestas || {},
      tiempo_usado: req.body?.tiempo_usado || 0,
      usuarioId: req.usuario.id
    });
    res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
});
