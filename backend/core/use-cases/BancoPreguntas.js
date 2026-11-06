const DISTRIBUCION = [
  ['opcion_multiple', 10],
  ['verdadero_falso', 5],
  ['completar', 3],
  ['abierta', 2]
];

function normalizarPregunta(pregunta, materia, grado, tipo) {
  const respuesta = pregunta.respuesta_correcta ?? pregunta.respuesta;
  if (!pregunta.enunciado || !respuesta) throw new Error('La IA generó una pregunta incompleta.');
  const opciones = tipo === 'opcion_multiple' && Array.isArray(pregunta.opciones)
    ? pregunta.opciones.map(String).slice(0, 4)
    : [];
  if (tipo === 'opcion_multiple' && opciones.length < 2) {
    throw new Error('La IA generó una pregunta de opción múltiple sin opciones suficientes.');
  }
  return {
    materia,
    grado,
    tipo,
    enunciado: String(pregunta.enunciado).trim(),
    opciones,
    respuesta: String(respuesta).trim(),
    explicacion: String(pregunta.explicacion || ''),
    dificultad: ['facil', 'media', 'dificil'].includes(pregunta.dificultad) ? pregunta.dificultad : 'media'
  };
}

export class BancoPreguntas {
  constructor(preguntaRepository, generadorPreguntas) {
    this.repository = preguntaRepository;
    this.generador = generadorPreguntas;
  }

  async obtener({ materia, grado, texto = '', usuarioId }) {
    const tema = String(materia || '').trim();
    const nivel = Number(grado);
    if (!tema || !Number.isInteger(nivel) || nivel < 1 || nivel > 6) {
      throw new Error('Indica una materia y un grado de primaria válido (1 a 6).');
    }

    const material = String(texto || '').trim();
    const hashTexto = material ? await this.calcularHash(material) : '';
    const preguntas = this.generador.permiteReutilizarPreguntas === false
      ? []
      : await this.repository.buscarPorMateriaGradoHash(tema, nivel, hashTexto, usuarioId);
    const seleccion = new Map(DISTRIBUCION.map(([tipo, cantidad]) => [
      tipo,
      preguntas.filter((pregunta) => pregunta.tipo === tipo).slice(0, cantidad)
    ]));
    const tiposFaltantes = DISTRIBUCION.flatMap(([tipo, cantidad]) =>
      Array(Math.max(0, cantidad - seleccion.get(tipo).length)).fill(tipo)
    );

    if (tiposFaltantes.length) {
      const generadas = await this.generador.generarPreguntas({
        materia: tema,
        grado: nivel,
        texto: material,
        tipos: tiposFaltantes
      });
      if (!Array.isArray(generadas) || generadas.length < tiposFaltantes.length) {
        throw new Error('No se pudieron generar todas las preguntas requeridas. Intenta de nuevo.');
      }
      const normalizadas = tiposFaltantes.map((tipo, indice) =>
        normalizarPregunta(generadas[indice], tema, nivel, tipo)
      );
      await this.repository.guardarMuchas(normalizadas, hashTexto, usuarioId);
      const actualizadas = await this.repository.buscarPorMateriaGradoHash(tema, nivel, hashTexto, usuarioId);
      for (const [tipo, cantidad] of DISTRIBUCION) {
        seleccion.set(tipo, actualizadas.filter((pregunta) => pregunta.tipo === tipo).slice(0, cantidad));
      }
    }

    const resultado = DISTRIBUCION.flatMap(([tipo]) => seleccion.get(tipo));
    if (resultado.length !== 20) throw new Error('No hay suficientes preguntas para crear el examen.');
    return { preguntas: resultado, hashTexto };
  }

  async calcularHash(texto) {
    const normalizado = texto.toLowerCase().replace(/\s+/g, ' ').trim();
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizado));
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }
}
