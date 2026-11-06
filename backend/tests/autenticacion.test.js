import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { AutenticarUsuario } from '../core/use-cases/AutenticarUsuario.js';
import { CryptoSeguridadAutenticacion } from '../adapters/security/CryptoSeguridadAutenticacion.js';
import { SQLiteAuthRepository } from '../adapters/db/SQLiteAuthRepository.js';

function crearAutenticacion() {
  const usuarios = new Map();
  const sesiones = new Map();
  let siguienteId = 1;
  const repositorioUsuarios = {
    async buscarPorNombreNormalizado(nombreNormalizado) {
      return [...usuarios.values()].find((usuario) => usuario.nombreNormalizado === nombreNormalizado) || null;
    },
    async buscarPorId(id) {
      return usuarios.get(id) || null;
    },
    async guardar(datos) {
      const usuario = { id: siguienteId++, ...datos, creadoEn: new Date().toISOString() };
      usuarios.set(usuario.id, usuario);
      return usuario;
    }
  };
  const repositorioSesiones = {
    async guardar(sesion) {
      sesiones.set(sesion.tokenHash, sesion);
    },
    async buscarVigente(tokenHash, ahora) {
      const sesion = sesiones.get(tokenHash);
      return sesion && sesion.expiraEn > ahora ? sesion : null;
    },
    async eliminar(tokenHash) {
      sesiones.delete(tokenHash);
    }
  };
  return {
    autenticacion: new AutenticarUsuario(
      repositorioUsuarios,
      repositorioSesiones,
      new CryptoSeguridadAutenticacion()
    )
  };
}

test('registra una cuenta, valida su sesión y la cierra', async () => {
  const { autenticacion } = crearAutenticacion();
  const sesion = await autenticacion.registrar({
    nombreUsuario: 'Estudiante_1',
    contrasena: 'clave-segura-123'
  });

  assert.equal(sesion.usuario.nombreUsuario, 'Estudiante_1');
  assert.equal('token' in sesion.usuario, false);
  assert.deepEqual(await autenticacion.obtenerUsuario(sesion.token), sesion.usuario);

  await autenticacion.cerrarSesion(sesion.token);
  assert.equal(await autenticacion.obtenerUsuario(sesion.token), null);
});

test('permite iniciar sesión sin distinguir mayúsculas y no revela contraseñas', async () => {
  const { autenticacion } = crearAutenticacion();
  await autenticacion.registrar({ nombreUsuario: 'Alumno', contrasena: 'mi-clave-valida' });

  const sesion = await autenticacion.iniciarSesion({
    nombreUsuario: 'ALUMNO',
    contrasena: 'mi-clave-valida'
  });
  assert.equal(sesion.usuario.nombreUsuario, 'Alumno');
  await assert.rejects(
    autenticacion.iniciarSesion({ nombreUsuario: 'Alumno', contrasena: 'incorrecta-123' }),
    { codigo: 'CREDENCIALES_INVALIDAS' }
  );
});

test('rechaza nombres y contraseñas inválidos y cuentas repetidas', async () => {
  const { autenticacion } = crearAutenticacion();
  await assert.rejects(
    autenticacion.registrar({ nombreUsuario: 'x', contrasena: 'mi-clave-valida' }),
    { codigo: 'DATOS_INVALIDOS' }
  );
  await assert.rejects(
    autenticacion.registrar({ nombreUsuario: 'alumno', contrasena: 'corta' }),
    { codigo: 'DATOS_INVALIDOS' }
  );
  await autenticacion.registrar({ nombreUsuario: 'alumno', contrasena: 'mi-clave-valida' });
  await assert.rejects(
    autenticacion.registrar({ nombreUsuario: 'ALUMNO', contrasena: 'otra-clave-valida' }),
    { codigo: 'USUARIO_EXISTENTE' }
  );
});

test('asigna a la primera cuenta los datos antiguos que aún no tienen propietario', async () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_usuario TEXT NOT NULL,
      nombre_normalizado TEXT NOT NULL UNIQUE,
      hash_contrasena TEXT NOT NULL,
      creado_en TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE fotos_cargadas (usuario_id INTEGER);
    CREATE TABLE preguntas (usuario_id INTEGER);
    CREATE TABLE examenes (usuario_id INTEGER);
    INSERT INTO fotos_cargadas (usuario_id) VALUES (NULL);
    INSERT INTO preguntas (usuario_id) VALUES (NULL);
    INSERT INTO examenes (usuario_id) VALUES (NULL);
  `);
  const repositorio = new SQLiteAuthRepository(db);
  const usuario = await repositorio.guardar({
    nombreUsuario: 'primera',
    nombreNormalizado: 'primera',
    hashContrasena: 'hash'
  });

  for (const tabla of ['fotos_cargadas', 'preguntas', 'examenes']) {
    assert.equal(db.prepare(`SELECT usuario_id FROM ${tabla}`).get().usuario_id, usuario.id);
  }
  db.close();
});
