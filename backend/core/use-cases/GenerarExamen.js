import { Examen } from '../entities/Examen.js';

export class GenerarExamen {
  constructor(bancoPreguntas, examenRepository, preguntaRepository) {
    this.banco = bancoPreguntas;
    this.examenRepository = examenRepository;
    this.preguntaRepository = preguntaRepository;
  }

  async ejecutar({ materia, grado, tiempo_lim = 30, texto = '' }, usuarioId) {
    const limite = Number(tiempo_lim);
    if (!Number.isFinite(limite) || limite < 1 || limite > 180) {
      throw new Error('El tiempo debe ser de 1 a 180 minutos.');
    }
    const { preguntas } = await this.banco.obtener({ materia, grado, texto, usuarioId });
    const mezcladas = [...preguntas].sort(() => Math.random() - 0.5);
    const examen = new Examen({ materia, grado, tiempo_lim: limite, preguntas: mezcladas });
    const creado = await this.examenRepository.crear(examen, usuarioId);
    await this.preguntaRepository.incrementarUsos(mezcladas.map((pregunta) => pregunta.id), usuarioId);
    return creado;
  }
}
