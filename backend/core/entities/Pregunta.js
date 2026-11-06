const TIPOS = new Set(['opcion_multiple', 'verdadero_falso', 'completar', 'abierta']);

export class Pregunta {
  constructor({ id, materia, grado, tipo, enunciado, opciones = [], respuesta, explicacion = '', dificultad = 'media' }) {
    if (!materia || !Number.isInteger(Number(grado)) || !TIPOS.has(tipo) || !enunciado || !respuesta) {
      throw new Error('Los datos de la pregunta no son válidos.');
    }
    this.id = id;
    this.materia = String(materia).trim();
    this.grado = Number(grado);
    this.tipo = tipo;
    this.enunciado = String(enunciado).trim();
    this.opciones = Array.isArray(opciones) ? opciones : [];
    this.respuesta = String(respuesta).trim();
    this.explicacion = String(explicacion || '');
    this.dificultad = ['facil', 'media', 'dificil'].includes(dificultad) ? dificultad : 'media';
  }

  toJSON() {
    return {
      id: this.id,
      materia: this.materia,
      grado: this.grado,
      tipo: this.tipo,
      enunciado: this.enunciado,
      opciones: this.opciones,
      respuesta: this.respuesta,
      explicacion: this.explicacion,
      dificultad: this.dificultad
    };
  }
}
