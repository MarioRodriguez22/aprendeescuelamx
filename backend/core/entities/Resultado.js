export class Resultado {
  constructor({ examen_id, calificacion, respuestas, tiempo_usado }) {
    if (!Number.isFinite(calificacion) || calificacion < 0 || calificacion > 10) {
      throw new Error('La calificación debe estar entre 0 y 10.');
    }
    this.examen_id = Number(examen_id);
    this.calificacion = Math.round(calificacion * 100) / 100;
    this.respuestas = respuestas;
    this.tiempo_usado = Math.max(0, Math.floor(Number(tiempo_usado) || 0));
  }
}
