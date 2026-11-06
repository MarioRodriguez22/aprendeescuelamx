export class IGeneradorPreguntas {
  constructor() {
    this.permiteReutilizarPreguntas = true;
  }

  async generarPreguntas() {
    throw new Error('IGeneradorPreguntas.generarPreguntas debe implementarse.');
  }

  async analizarImagen() {
    throw new Error('IGeneradorPreguntas.analizarImagen debe implementarse.');
  }
}
