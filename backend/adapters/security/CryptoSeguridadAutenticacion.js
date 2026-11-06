import { promisify } from 'node:util';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { ISeguridadAutenticacion } from '../../core/ports/ISeguridadAutenticacion.js';

const scrypt = promisify(scryptCallback);
const LONGITUD_HASH = 64;

export class CryptoSeguridadAutenticacion extends ISeguridadAutenticacion {
  async crearHashContrasena(contrasena) {
    const sal = randomBytes(16);
    const hash = await scrypt(contrasena, sal, LONGITUD_HASH);
    return `${sal.toString('hex')}:${hash.toString('hex')}`;
  }

  async verificarContrasena(contrasena, hashAlmacenado) {
    const [salHex, hashHex, ...extras] = String(hashAlmacenado || '').split(':');
    if (!salHex || !hashHex || extras.length || !/^[a-f0-9]{32}$/i.test(salHex) ||
      !/^[a-f0-9]{128}$/i.test(hashHex)) {
      return false;
    }
    const esperado = Buffer.from(hashHex, 'hex');
    const calculado = await scrypt(contrasena, Buffer.from(salHex, 'hex'), esperado.length);
    return timingSafeEqual(esperado, calculado);
  }

  crearTokenSesion() {
    return randomBytes(32).toString('hex');
  }

  crearHashToken(token) {
    return createHash('sha256').update(token).digest('hex');
  }
}
