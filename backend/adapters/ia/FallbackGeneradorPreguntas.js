import { IGeneradorPreguntas } from '../../core/ports/IGeneradorPreguntas.js';

const CODIGOS_REINTENTABLES = /insufficient_quota|quota[_ ]exceeded|resource[_ ]exhausted|rate_limit|overloaded|capacity|temporarily_unavailable/i;
const MENSAJES_DE_CREDITO_AGOTADO = /credit balance.{0,30}(too low|low)|insufficient credits|purchase credits|billing.{0,30}(limit|credit)/i;
const ERRORES_DE_RED = /ECONNREFUSED|ECONNRESET|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH|ENOTFOUND|fetch failed|AbortError|TimeoutError/i;

function proveedorAgotadoOInactivo(error) {
  const estado = Number(error?.status || error?.statusCode);
  const codigo = [
    error?.code,
    error?.type,
    error?.error?.code,
    error?.error?.type,
    error?.name,
    error?.message,
    error?.error?.message,
    error?.cause?.code
  ].filter(Boolean).join(' ');

  return estado === 401 || estado === 403 || estado === 408 || estado === 429 || estado === 529 ||
    (estado >= 500 && estado <= 599) ||
    CODIGOS_REINTENTABLES.test(codigo) ||
    ERRORES_DE_RED.test(codigo) ||
    (estado === 400 && MENSAJES_DE_CREDITO_AGOTADO.test(codigo));
}

export class FallbackGeneradorPreguntas extends IGeneradorPreguntas {
  constructor(proveedores) {
    super();
    this.proveedores = proveedores;
    this.indicePreferido = 0;
    this.permiteReutilizarPreguntas = proveedores.every(
      ({ adapter }) => adapter.permiteReutilizarPreguntas !== false
    );
  }

  async ejecutarConAlternativa(metodo, argumentos) {
    if (this.proveedores.length === 0) {
      throw new Error(
        'AI_PROVIDER=auto requiere GEMINI_API_KEY, GROQ_API_KEY o OLLAMA_ENABLED=true. Los proveedores de pago solo se agregan con AI_ALLOW_PAID_FALLBACK=true.'
      );
    }

    let ultimoError;
    const inicio = this.indicePreferido;
    for (let intento = 0; intento < this.proveedores.length; intento += 1) {
      const indice = (inicio + intento) % this.proveedores.length;
      const proveedor = this.proveedores[indice];
      try {
        const resultado = await proveedor.adapter[metodo](...argumentos);
        this.indicePreferido = indice;
        return resultado;
      } catch (error) {
        ultimoError = error;
        if (!proveedorAgotadoOInactivo(error)) throw error;
        if (this.proveedores.length === 1) throw error;

        this.indicePreferido = (indice + 1) % this.proveedores.length;
        const siguiente = this.proveedores[this.indicePreferido];
        console.warn(
          `${proveedor.nombre} alcanzó su límite o no está disponible; se intentará con ${siguiente.nombre}.`
        );
      }
    }

    throw ultimoError;
  }

  generarPreguntas(datos) {
    return this.ejecutarConAlternativa('generarPreguntas', [datos]);
  }

  clasificarMateria(texto) {
    return this.ejecutarConAlternativa('clasificarMateria', [texto]);
  }

  analizarImagen(datos) {
    return this.ejecutarConAlternativa('analizarImagen', [datos]);
  }
}
