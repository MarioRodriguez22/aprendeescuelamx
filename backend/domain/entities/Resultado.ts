export interface ResumenPorMateria {
  materia: string;
  aciertos: number;
  total: number;
}

export interface DatosResultado {
  calificacion: number;
  aciertos: number;
  totalPreguntas: number;
  tiempoUsadoSegundos: number;
  resumenPorMateria: readonly ResumenPorMateria[];
}

export class Resultado {
  readonly calificacion: number;
  readonly aciertos: number;
  readonly totalPreguntas: number;
  readonly tiempoUsadoSegundos: number;
  readonly resumenPorMateria: readonly ResumenPorMateria[];

  constructor(datos: DatosResultado) {
    if (!Number.isInteger(datos.totalPreguntas) || datos.totalPreguntas < 1) {
      throw new Error('El resultado debe tener al menos una pregunta.');
    }
    if (!Number.isInteger(datos.aciertos) || datos.aciertos < 0 || datos.aciertos > datos.totalPreguntas) {
      throw new Error('El número de aciertos no es válido.');
    }
    if (!Number.isFinite(datos.calificacion) || datos.calificacion < 0 || datos.calificacion > 10) {
      throw new Error('La calificación debe estar entre 0 y 10.');
    }
    if (!Number.isInteger(datos.tiempoUsadoSegundos) || datos.tiempoUsadoSegundos < 0) {
      throw new Error('El tiempo usado debe ser un entero no negativo.');
    }
    if (datos.resumenPorMateria.some((resumen) =>
      !resumen.materia.trim() ||
      !Number.isInteger(resumen.aciertos) ||
      !Number.isInteger(resumen.total) ||
      resumen.aciertos < 0 ||
      resumen.total < 1 ||
      resumen.aciertos > resumen.total
    )) {
      throw new Error('El resumen por materia contiene datos no válidos.');
    }

    this.calificacion = datos.calificacion;
    this.aciertos = datos.aciertos;
    this.totalPreguntas = datos.totalPreguntas;
    this.tiempoUsadoSegundos = datos.tiempoUsadoSegundos;
    this.resumenPorMateria = datos.resumenPorMateria.map((resumen) => ({ ...resumen }));
  }
}
