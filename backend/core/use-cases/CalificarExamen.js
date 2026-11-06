import { Resultado } from '../entities/Resultado.js';

const normalizar = (valor) => String(valor ?? '').trim().toLocaleLowerCase('es-MX');

export class CalificarExamen {
  constructor(examenRepository) {
    this.repository = examenRepository;
  }

  async ejecutar({ examenId, respuestas = {}, tiempo_usado = 0, usuarioId }) {
    const examen = await this.repository.obtenerPorId(examenId, usuarioId);
    if (!examen) throw new Error('No encontramos ese examen.');
    let aciertos = 0;
    const detalle = examen.preguntas.map((pregunta, index) => {
      const respuesta = respuestas[pregunta.id] ?? respuestas[index] ?? '';
      const correcta = normalizar(respuesta) === normalizar(pregunta.respuesta);
      if (correcta) aciertos += 1;
      return {
        pregunta_id: pregunta.id,
        respuesta: String(respuesta),
        respuesta_correcta: pregunta.respuesta,
        correcta,
        explicacion: pregunta.explicacion
      };
    });
    const resultado = new Resultado({
      examen_id: examen.id,
      calificacion: (aciertos / examen.preguntas.length) * 10,
      respuestas: detalle,
      tiempo_usado
    });
    return this.repository.guardarResultado(resultado);
  }
}
