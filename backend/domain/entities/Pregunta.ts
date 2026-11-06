import { Materia } from './Materia.js';

export type OpcionesPregunta = readonly [string, string, string, string];

export interface DatosPregunta {
  enunciado: string;
  opciones: OpcionesPregunta;
  respuestaCorrecta: string;
  explicacion: string;
  materia: Materia;
  grado: number;
  hashEnunciado: string;
}

export class Pregunta {
  readonly enunciado: string;
  readonly opciones: OpcionesPregunta;
  readonly respuestaCorrecta: string;
  readonly explicacion: string;
  readonly materia: Materia;
  readonly grado: number;
  readonly hashEnunciado: string;

  constructor(datos: DatosPregunta) {
    const enunciado = datos.enunciado.trim();
    const explicacion = datos.explicacion.trim();
    if (datos.opciones.length !== 4) {
      throw new Error('La pregunta debe tener exactamente cuatro opciones.');
    }
    const opciones: OpcionesPregunta = [
      datos.opciones[0].trim(),
      datos.opciones[1].trim(),
      datos.opciones[2].trim(),
      datos.opciones[3].trim()
    ];

    if (!enunciado) throw new Error('El enunciado de la pregunta es obligatorio.');
    if (opciones.some((opcion) => !opcion)) {
      throw new Error('Las cuatro opciones de la pregunta son obligatorias.');
    }
    if (new Set(opciones).size !== 4) {
      throw new Error('Las opciones de la pregunta deben ser distintas.');
    }
    if (!opciones.includes(datos.respuestaCorrecta.trim())) {
      throw new Error('La respuesta correcta debe coincidir con una de las opciones.');
    }
    if (!explicacion) throw new Error('La explicación de la pregunta es obligatoria.');
    if (!Number.isInteger(datos.grado) || datos.grado < 1 || datos.grado > 6) {
      throw new Error('El grado debe ser un entero del 1 al 6.');
    }
    if (!datos.hashEnunciado.trim()) {
      throw new Error('El hash del enunciado es obligatorio.');
    }

    this.enunciado = enunciado;
    this.opciones = opciones;
    this.respuestaCorrecta = datos.respuestaCorrecta.trim();
    this.explicacion = explicacion;
    this.materia = datos.materia;
    this.grado = datos.grado;
    this.hashEnunciado = datos.hashEnunciado.trim();
  }
}
