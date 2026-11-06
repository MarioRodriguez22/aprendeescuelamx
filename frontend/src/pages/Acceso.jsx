import { useState } from 'react';
import { api } from '../services/api.js';

export default function Acceso({ alAutenticar, errorServidor = '' }) {
  const [modo, setModo] = useState('registro');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const registrando = modo === 'registro';

  async function enviar(evento) {
    evento.preventDefault();
    setError('');
    setOcupado(true);
    try {
      const resultado = registrando
        ? await api.registrar({ nombreUsuario, contrasena })
        : await api.iniciarSesion({ nombreUsuario, contrasena });
      alAutenticar(resultado.usuario);
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <main className="pantalla centrado">
      <div className="marca" aria-hidden="true">📚</div>
      <h1>AprendeEscuelaMx</h1>
      <p>{registrando ? 'Crea tu cuenta para guardar tus fotos y estudiar a tu ritmo.' : 'Inicia sesión para ver tus fotos y exámenes.'}</p>
      {errorServidor && <p className="error" role="alert">{errorServidor}</p>}
      <form className="formulario tarjeta formulario-acceso" onSubmit={enviar}>
        <label>
          Nombre de usuario
          <input
            type="text"
            autoComplete="username"
            minLength={3}
            maxLength={32}
            pattern="[A-Za-z0-9._-]{3,32}"
            title="Usa de 3 a 32 letras, números, puntos, guiones o guiones bajos."
            value={nombreUsuario}
            onChange={(evento) => setNombreUsuario(evento.target.value)}
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            autoComplete={registrando ? 'new-password' : 'current-password'}
            minLength={8}
            maxLength={128}
            value={contrasena}
            onChange={(evento) => setContrasena(evento.target.value)}
            required
          />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="boton principal" disabled={ocupado}>
          {ocupado ? 'Un momento…' : registrando ? 'Crear cuenta' : 'Iniciar sesión'}
        </button>
      </form>
      <button
        className="enlace"
        type="button"
        onClick={() => {
          setModo(registrando ? 'sesion' : 'registro');
          setError('');
        }}
      >
        {registrando ? 'Ya tengo una cuenta' : 'Crear una cuenta nueva'}
      </button>
      <p className="nota-privacidad">Cada cuenta conserva sus fotos por separado. Elige una contraseña que puedas recordar y no la compartas.</p>
    </main>
  );
}
