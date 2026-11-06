export class Materia {
  readonly nombre: string;

  constructor(nombre: string) {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      throw new Error('El nombre de la materia es obligatorio.');
    }
    this.nombre = nombreLimpio;
  }
}
