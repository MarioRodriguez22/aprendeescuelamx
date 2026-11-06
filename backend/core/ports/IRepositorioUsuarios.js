export class IRepositorioUsuarios {
  async buscarPorNombreNormalizado() {
    throw new Error('IRepositorioUsuarios.buscarPorNombreNormalizado debe implementarse.');
  }

  async buscarPorId() {
    throw new Error('IRepositorioUsuarios.buscarPorId debe implementarse.');
  }

  async guardar() {
    throw new Error('IRepositorioUsuarios.guardar debe implementarse.');
  }

  async listar() {
    throw new Error('IRepositorioUsuarios.listar debe implementarse.');
  }
}
