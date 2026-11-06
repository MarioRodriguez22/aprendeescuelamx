export class IRepositorioSesiones {
  async guardar() {
    throw new Error('IRepositorioSesiones.guardar debe implementarse.');
  }

  async buscarVigente() {
    throw new Error('IRepositorioSesiones.buscarVigente debe implementarse.');
  }

  async eliminar() {
    throw new Error('IRepositorioSesiones.eliminar debe implementarse.');
  }
}
