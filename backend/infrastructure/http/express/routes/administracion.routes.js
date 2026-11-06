import { Router } from 'express';
import { listarUsuarios } from '../../../config/container.js';
import { requerirAdministrador } from '../middlewares/autenticacion.js';

export const administracionRouter = Router();

administracionRouter.use(requerirAdministrador);

administracionRouter.get('/usuarios', async (_req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');
    res.json(await listarUsuarios.ejecutar());
  } catch (error) {
    next(error);
  }
});
