import test from 'node:test';
import assert from 'node:assert/strict';
import { requerirAdministrador } from '../infrastructure/http/express/middlewares/autenticacion.js';

function invocar(usuario) {
  let continuado = false;
  const respuesta = {
    statusCode: 200,
    body: null,
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(contenido) {
      this.body = contenido;
      return this;
    }
  };
  requerirAdministrador({ usuario }, respuesta, () => { continuado = true; });
  return { respuesta, continuado };
}

test('permite continuar únicamente a una cuenta administradora', () => {
  assert.equal(invocar({ id: 1, rol: 'admin' }).continuado, true);

  const usuario = invocar({ id: 2, rol: 'usuario' });
  assert.equal(usuario.continuado, false);
  assert.equal(usuario.respuesta.statusCode, 403);
  assert.equal(usuario.respuesta.body.error, 'Esta sección es solo para administradores.');

  assert.equal(invocar(undefined).respuesta.statusCode, 403);
});
