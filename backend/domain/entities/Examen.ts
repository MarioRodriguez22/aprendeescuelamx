import { Pregunta } from './Pregunta.js';

export interface DatosExamen {
  preguntas: readonly Pregunta[];
  duracionMinutos: number;
  iniciadoEn?: Date;
}

export class Examen {
  readonly preguntas: readonly Pregunta[];
  readonly duracionMinutos: number;
  readonly iniciadoEn: Date;

  constructor(datos: DatosExamen) {
    if (datos.preguntas.length === 0) {
      throw new Error('El examen debe contener al menos una pregunta.');
    }
    if (!Number.isInteger(datos.duracionMinutos) || datos.duracionMinutos < 1) {
      throw new Error('La duración del examen debe ser de al menos un minuto.');
    }
    if (datos.iniciadoEn && Number.isNaN(datos.iniciadoEn.getTime())) {
      throw new Error('La fecha de inicio del examen no es válida.');
    }

    this.preguntas = [...datos.preguntas];
    this.duracionMinutos = datos.duracionMinutos;
    this.iniciadoEn = datos.iniciadoEn ? new Date(datos.iniciadoEn) : new Date();
  }
}
