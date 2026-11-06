export class ISeguridadAutenticacion {
  async crearHashContrasena() {
    throw new Error('ISeguridadAutenticacion.crearHashContrasena debe implementarse.');
  }

  async verificarContrasena() {
    throw new Error('ISeguridadAutenticacion.verificarContrasena debe implementarse.');
  }

  crearTokenSesion() {
    throw new Error('ISeguridadAutenticacion.crearTokenSesion debe implementarse.');
  }

  crearHashToken() {
    throw new Error('ISeguridadAutenticacion.crearHashToken debe implementarse.');
  }
}
