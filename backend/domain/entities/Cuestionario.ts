import { Materia } from './Materia.js';
import { Pregunta } from './Pregunta.js';

export const PREGUNTAS_POR_CUESTIONARIO = 20;

export class Cuestionario {
  readonly materia: Materia;
  readonly grado: number;
  readonly preguntas: readonly Pregunta[];

  constructor(materia: Materia, grado: number, preguntas: readonly Pregunta[]) {
    if (!Number.isInteger(grado) || grado < 1 || grado > 6) {
      throw new Error('El grado debe ser un entero del 1 al 6.');
    }
    if (preguntas.length !== PREGUNTAS_POR_CUESTIONARIO) {
      throw new Error(`El cuestionario debe tener exactamente ${PREGUNTAS_POR_CUESTIONARIO} preguntas.`);
    }
    if (preguntas.some((pregunta) =>
      pregunta.materia.nombre !== materia.nombre || pregunta.grado !== grado
    )) {
      throw new Error('Todas las preguntas deben corresponder a la materia y grado del cuestionario.');
    }

    this.materia = materia;
    this.grado = grado;
    this.preguntas = [...preguntas];
  }
}
