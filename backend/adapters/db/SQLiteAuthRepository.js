import { IRepositorioSesiones } from '../../core/ports/IRepositorioSesiones.js';
import { IRepositorioUsuarios } from '../../core/ports/IRepositorioUsuarios.js';

export class SQLiteAuthRepository extends IRepositorioUsuarios {
  constructor(db) {
    super();
    this.db = db;
    this.repositorioSesiones = new RepositorioSesiones(db);
  }

  async buscarPorNombreNormalizado(nombreNormalizado) {
    const fila = this.db.prepare(`
      SELECT id, nombre_usuario, nombre_normalizado, hash_contrasena, rol, creado_en
      FROM usuarios WHERE nombre_normalizado = ?
    `).get(nombreNormalizado);
    return fila ? mapearUsuario(fila, true) : null;
  }

  async buscarPorId(id) {
    const fila = this.db.prepare(`
      SELECT id, nombre_usuario, nombre_normalizado, hash_contrasena, rol, creado_en
      FROM usuarios WHERE id = ?
    `).get(id);
    return fila ? mapearUsuario(fila, false) : null;
  }

  async guardar({ nombreUsuario, nombreNormalizado, hashContrasena, rol = 'usuario' }) {
    const crearUsuario = this.db.transaction(() => {
      const resultado = this.db.prepare(`
        INSERT INTO usuarios (nombre_usuario, nombre_normalizado, hash_contrasena, rol)
        VALUES (?, ?, ?, ?)
      `).run(nombreUsuario, nombreNormalizado, hashContrasena, rol);
      const id = Number(resultado.lastInsertRowid);
      this.db.prepare('UPDATE fotos_cargadas SET usuario_id = ? WHERE usuario_id IS NULL').run(id);
      this.db.prepare('UPDATE preguntas SET usuario_id = ? WHERE usuario_id IS NULL').run(id);
      this.db.prepare('UPDATE examenes SET usuario_id = ? WHERE usuario_id IS NULL').run(id);
      return id;
    });
    return this.buscarPorId(crearUsuario());
  }

  async listar() {
    return this.db.prepare(`
      SELECT id, nombre_usuario, rol, creado_en
      FROM usuarios
      ORDER BY creado_en DESC, id DESC
    `).all().map((fila) => ({
      id: fila.id,
      nombreUsuario: fila.nombre_usuario,
      rol: fila.rol,
      creadoEn: fila.creado_en
    }));
  }

  async configurarAdministrador({ nombreUsuario, nombreNormalizado, hashContrasena }) {
    return this.db.transaction(() => {
      const existente = this.db.prepare(`
        SELECT id FROM usuarios WHERE nombre_normalizado = ?
      `).get(nombreNormalizado);
      if (existente) {
        this.db.prepare(`
          UPDATE usuarios SET nombre_usuario = ?, hash_contrasena = ?, rol = 'admin'
          WHERE id = ?
        `).run(nombreUsuario, hashContrasena, existente.id);
        this.db.prepare('DELETE FROM sesiones WHERE usuario_id = ?').run(existente.id);
        return Number(existente.id);
      }

      const resultado = this.db.prepare(`
        INSERT INTO usuarios (nombre_usuario, nombre_normalizado, hash_contrasena, rol)
        VALUES (?, ?, ?, 'admin')
      `).run(nombreUsuario, nombreNormalizado, hashContrasena);
      const id = Number(resultado.lastInsertRowid);
      this.db.prepare('UPDATE fotos_cargadas SET usuario_id = ? WHERE usuario_id IS NULL').run(id);
      this.db.prepare('UPDATE preguntas SET usuario_id = ? WHERE usuario_id IS NULL').run(id);
      this.db.prepare('UPDATE examenes SET usuario_id = ? WHERE usuario_id IS NULL').run(id);
      return id;
    })();
  }

}

class RepositorioSesiones extends IRepositorioSesiones {
  constructor(db) {
    super();
    this.db = db;
  }

  async guardar({ tokenHash, usuarioId, expiraEn }) {
    this.db.prepare(`
      INSERT INTO sesiones (token_hash, usuario_id, expira_en)
      VALUES (?, ?, ?)
    `).run(tokenHash, usuarioId, expiraEn);
  }

  async buscarVigente(tokenHash, ahora) {
    const fila = this.db.prepare(`
      SELECT usuario_id, expira_en FROM sesiones
      WHERE token_hash = ? AND expira_en > ?
    `).get(tokenHash, ahora);
    if (!fila) {
      this.db.prepare('DELETE FROM sesiones WHERE token_hash = ?').run(tokenHash);
      return null;
    }
    return { usuarioId: fila.usuario_id, expiraEn: fila.expira_en };
  }

  async eliminar(tokenHash) {
    this.db.prepare('DELETE FROM sesiones WHERE token_hash = ?').run(tokenHash);
  }
}

function mapearUsuario(fila, incluirHash) {
  return {
    id: fila.id,
    nombreUsuario: fila.nombre_usuario,
    nombreNormalizado: fila.nombre_normalizado,
    ...(incluirHash ? { hashContrasena: fila.hash_contrasena } : {}),
    rol: fila.rol || 'usuario',
    creadoEn: fila.creado_en
  };
}
