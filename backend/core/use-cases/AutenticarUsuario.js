const NOMBRE_USUARIO_VALIDO = /^[a-zA-Z0-9._-]{3,32}$/;
const DURACION_SESION_MS = 7 * 24 * 60 * 60 * 1000;

function errorAutenticacion(codigo, mensaje) {
  const error = new Error(mensaje);
  error.codigo = codigo;
  return error;
}

function presentarUsuario(usuario) {
  return {
    id: usuario.id,
    nombreUsuario: usuario.nombreUsuario,
    creadoEn: usuario.creadoEn
  };
}

export class AutenticarUsuario {
  constructor(repositorioUsuarios, repositorioSesiones, seguridad) {
    this.repositorioUsuarios = repositorioUsuarios;
    this.repositorioSesiones = repositorioSesiones;
    this.seguridad = seguridad;
  }

  async registrar({ nombreUsuario, contrasena }) {
    const nombre = String(nombreUsuario || '').trim();
    const normalizado = nombre.toLocaleLowerCase('es-MX');
    if (!NOMBRE_USUARIO_VALIDO.test(nombre)) {
      throw errorAutenticacion('DATOS_INVALIDOS', 'El usuario debe tener de 3 a 32 caracteres: letras, números, punto, guion o guion bajo.');
    }
    if (typeof contrasena !== 'string' || contrasena.length < 8 || contrasena.length > 128) {
      throw errorAutenticacion('DATOS_INVALIDOS', 'La contraseña debe tener entre 8 y 128 caracteres.');
    }
    if (await this.repositorioUsuarios.buscarPorNombreNormalizado(normalizado)) {
      throw errorAutenticacion('USUARIO_EXISTENTE', 'Ese nombre de usuario ya está registrado.');
    }

    const hashContrasena = await this.seguridad.crearHashContrasena(contrasena);
    let usuario;
    try {
      usuario = await this.repositorioUsuarios.guardar({
        nombreUsuario: nombre,
        nombreNormalizado: normalizado,
        hashContrasena
      });
    } catch (error) {
      if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw errorAutenticacion('USUARIO_EXISTENTE', 'Ese nombre de usuario ya está registrado.');
      }
      throw error;
    }
    return this.crearSesion(usuario);
  }

  async iniciarSesion({ nombreUsuario, contrasena }) {
    const normalizado = String(nombreUsuario || '').trim().toLocaleLowerCase('es-MX');
    const usuario = await this.repositorioUsuarios.buscarPorNombreNormalizado(normalizado);
    if (!usuario || typeof contrasena !== 'string' ||
      !(await this.seguridad.verificarContrasena(contrasena, usuario.hashContrasena))) {
      throw errorAutenticacion('CREDENCIALES_INVALIDAS', 'El usuario o la contraseña no son correctos.');
    }
    return this.crearSesion(usuario);
  }

  async obtenerUsuario(token) {
    if (!token) return null;
    const hashToken = this.seguridad.crearHashToken(token);
    const sesion = await this.repositorioSesiones.buscarVigente(hashToken, new Date().toISOString());
    if (!sesion) return null;
    const usuario = await this.repositorioUsuarios.buscarPorId(sesion.usuarioId);
    return usuario ? presentarUsuario(usuario) : null;
  }

  async cerrarSesion(token) {
    if (token) {
      await this.repositorioSesiones.eliminar(this.seguridad.crearHashToken(token));
    }
  }

  async crearSesion(usuario) {
    const token = this.seguridad.crearTokenSesion();
    await this.repositorioSesiones.guardar({
      tokenHash: this.seguridad.crearHashToken(token),
      usuarioId: usuario.id,
      expiraEn: new Date(Date.now() + DURACION_SESION_MS).toISOString()
    });
    return { usuario: presentarUsuario(usuario), token };
  }
}
