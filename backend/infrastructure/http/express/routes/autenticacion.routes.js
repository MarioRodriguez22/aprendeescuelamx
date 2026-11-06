import { Router } from 'express';
import { tokenDeCookie } from '../middlewares/autenticacion.js';

const COOKIE = 'aprende_sesion';
const DURACION_COOKIE_SEGUNDOS = 7 * 24 * 60 * 60;

function establecerCookie(res, token, segura) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${DURACION_COOKIE_SEGUNDOS}${segura ? '; Secure' : ''}`
  );
}

function limpiarCookie(res, segura) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${segura ? '; Secure' : ''}`
  );
}

function responderError(res, error) {
  const estados = {
    DATOS_INVALIDOS: 400,
    USUARIO_EXISTENTE: 409,
    CREDENCIALES_INVALIDAS: 401
  };
  if (!error.codigo || !estados[error.codigo]) return false;
  res.status(estados[error.codigo]).json({ error: error.message });
  return true;
}

export function crearRouterAutenticacion(autenticacion, { cookiesSeguras = false } = {}) {
  const router = Router();

  router.post('/registro', async (req, res, next) => {
    try {
      const sesion = await autenticacion.registrar(req.body || {});
      establecerCookie(res, sesion.token, cookiesSeguras);
      res.status(201).json({ usuario: sesion.usuario });
    } catch (error) {
      if (!responderError(res, error)) next(error);
    }
  });

  router.post('/iniciar-sesion', async (req, res, next) => {
    try {
      const sesion = await autenticacion.iniciarSesion(req.body || {});
      establecerCookie(res, sesion.token, cookiesSeguras);
      res.json({ usuario: sesion.usuario });
    } catch (error) {
      if (!responderError(res, error)) next(error);
    }
  });

  router.get('/yo', async (req, res, next) => {
    try {
      res.json({ usuario: await autenticacion.obtenerUsuario(tokenDeCookie(req)) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/cerrar-sesion', async (req, res, next) => {
    try {
      await autenticacion.cerrarSesion(tokenDeCookie(req));
      limpiarCookie(res, cookiesSeguras);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
