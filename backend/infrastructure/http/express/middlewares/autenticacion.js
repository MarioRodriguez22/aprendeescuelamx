function tokenDeCookie(req) {
  const cookies = String(req.headers.cookie || '').split(';');
  for (const cookie of cookies) {
    const [nombre, ...partes] = cookie.trim().split('=');
    if (nombre === 'aprende_sesion') return partes.join('=');
  }
  return '';
}

export function crearMiddlewareAutenticacion(autenticacion) {
  return async (req, res, next) => {
    try {
      const usuario = await autenticacion.obtenerUsuario(tokenDeCookie(req));
      if (!usuario) {
        return res.status(401).json({ error: 'Inicia sesión para continuar.' });
      }
      req.usuario = usuario;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requerirAdministrador(req, res, next) {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Esta sección es solo para administradores.' });
  }
  next();
}

export { tokenDeCookie };
