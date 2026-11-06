import { Materia } from '../../domain/entities/Materia.js';
import { Pregunta } from '../../domain/entities/Pregunta.js';

export interface FiltrosPreguntas {
  materia: Materia;
  grado: number;
  hashEnunciado?: string;
}

export interface RepositorioPreguntas {
  guardar(preguntas: readonly Pregunta[]): Promise<void>;
  buscar(filtros: FiltrosPreguntas): Promise<Pregunta[]>;
  contar(materia: Materia, grado: number): Promise<number>;
}
