import { useEffect, useState } from 'react';
import { api } from '../services/api.js';

function fechaLegible(fecha) {
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime())
    ? 'Fecha no disponible'
    : new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(valor);
}

export default function PanelAdmin({ alVolver }) {
  const [usuarios, setUsuarios] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activa = true;
    api.listarUsuarios()
      .then((resultado) => {
        if (!activa) return;
        setUsuarios(resultado.usuarios);
        setTotal(resultado.total);
      })
      .catch((fallo) => {
        if (activa) setError(fallo.message);
      })
      .finally(() => {
        if (activa) setCargando(false);
      });

    return () => { activa = false; };
  }, []);

  return (
    <main className="pantalla">
      <button className="enlace" type="button" onClick={alVolver}>← Volver a la app</button>
      <h1>Panel de administración</h1>
      <p>Consulta las cuentas registradas. Las contraseñas y las fotos de cada persona no se muestran aquí.</p>
      {cargando && <p role="status">Cargando usuarios…</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {!cargando && !error && (
        <section className="tarjeta" aria-live="polite">
          <h2>{total} {total === 1 ? 'usuario registrado' : 'usuarios registrados'}</h2>
          {usuarios.length === 0
            ? <p>Aún no hay cuentas registradas.</p>
            : <div className="tabla-usuarios">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Usuario</th>
                    <th scope="col">Tipo de cuenta</th>
                    <th scope="col">Fecha de registro</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>{usuario.nombreUsuario}</td>
                      <td>{usuario.rol === 'admin' ? 'Administración' : 'Usuario'}</td>
                      <td>{fechaLegible(usuario.creadoEn)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
        </section>
      )}
    </main>
  );
}
