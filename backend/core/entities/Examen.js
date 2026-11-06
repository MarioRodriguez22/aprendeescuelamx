export class Examen {
  constructor({ id, materia, grado, tiempo_lim = 30, preguntas = [] }) {
    if (!materia || !Number.isInteger(Number(grado)) || !Array.isArray(preguntas) || preguntas.length !== 20) {
      throw new Error('El examen requiere materia, grado y exactamente 20 preguntas.');
    }
    this.id = id;
    this.materia = String(materia).trim();
    this.grado = Number(grado);
    this.tiempo_lim = Number(tiempo_lim) || 30;
    this.preguntas = preguntas;
  }
}
