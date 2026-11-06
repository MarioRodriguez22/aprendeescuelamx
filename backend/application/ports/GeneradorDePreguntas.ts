import { Materia } from '../../domain/entities/Materia.js';
import { Pregunta } from '../../domain/entities/Pregunta.js';

export interface GeneradorDePreguntas {
  generar(texto: string, materia: Materia, cantidad: number): Promise<Pregunta[]>;
}
