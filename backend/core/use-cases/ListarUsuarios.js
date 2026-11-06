export class ListarUsuarios {
  constructor(repositorioUsuarios) {
    this.repositorioUsuarios = repositorioUsuarios;
  }

  async ejecutar() {
    const usuarios = await this.repositorioUsuarios.listar();
    return {
      total: usuarios.length,
      usuarios: usuarios.map(({ id, nombreUsuario, rol, creadoEn }) => ({
        id,
        nombreUsuario,
        rol,
        creadoEn
      }))
    };
  }
}
