import test from 'node:test';
import assert from 'node:assert/strict';
import { ListarUsuarios } from '../core/use-cases/ListarUsuarios.js';

test('expone solo el perfil público de las cuentas', async () => {
  const listarUsuarios = new ListarUsuarios({
    async listar() {
      return [
        {
          id: 8,
          nombreUsuario: 'cuenta',
          rol: 'usuario',
          creadoEn: '2026-01-01',
          hashContrasena: 'no debe salir'
        }
      ];
    }
  });

  assert.deepEqual(await listarUsuarios.ejecutar(), {
    total: 1,
    usuarios: [{ id: 8, nombreUsuario: 'cuenta', rol: 'usuario', creadoEn: '2026-01-01' }]
  });
});
