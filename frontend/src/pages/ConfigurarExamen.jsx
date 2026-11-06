import { useState } from 'react';
import { api } from '../services/api.js';

const materias = ['Español', 'Matemáticas', 'Ciencias Naturales', 'Historia', 'Geografía', 'Formación Cívica y Ética'];

export default function ConfigurarExamen({ texto, materiaInicial, alCrear, ir }) {
  const [materia, setMateria] = useState(materiaInicial || 'Español');
  const [grado, setGrado] = useState(3);
  const [tiempo, setTiempo] = useState(30);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const opcionesMateria = materiaInicial && !materias.includes(materiaInicial)
    ? [materiaInicial, ...materias]
    : materias;

  async function crear(evento) {
    evento.preventDefault();
    setError('');
    setOcupado(true);
    try {
      const examen = await api.generarExamen({
        materia,
        grado: Number(grado),
        tiempo_lim: Number(tiempo),
        texto
      });
      alCrear(examen);
      ir('examen');
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <main className="pantalla">
      <button className="enlace" onClick={() => ir(texto ? 'subir' : 'inicio')}>← Volver</button>
      <h1>✏️ Prepara tu examen</h1>
      {materiaInicial
        ? <p className="materia-seleccionada">Materia de tus fotos: <strong>{materiaInicial}</strong>. Puedes cambiarla si lo necesitas.</p>
        : <p>Elige tu materia y grado. ¡Tú puedes!</p>}
      {texto.trim() && (
        <p className="nota-privacidad">
          Este examen usará el contenido reconocido de tus fotos. Para generar preguntas reales basadas en tus apuntes, configura OpenAI o Anthropic; el modo demo no sustituye tus apuntes con ejercicios inventados.
        </p>
      )}
      <form className="formulario" onSubmit={crear}>
        <label>Materia
          <select value={materia} onChange={(evento) => setMateria(evento.target.value)}>
            {opcionesMateria.map((item) => (
              <option key={item} value={item}>
                {item}{item === materiaInicial ? ' (de tus fotos)' : ''}
              </option>
            ))}
          </select>
        </label>
        <label>Grado
          <select value={grado} onChange={(evento) => setGrado(evento.target.value)}>
            {[1, 2, 3, 4, 5, 6].map((item) => <option key={item} value={item}>{item}° de primaria</option>)}
          </select>
        </label>
        <label>Tiempo
          <select value={tiempo} onChange={(evento) => setTiempo(evento.target.value)}>
            {[15, 20, 30, 45, 60].map((item) => <option key={item} value={item}>{item} minutos</option>)}
          </select>
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="boton principal" disabled={ocupado}>
          {ocupado ? 'Preparando tus preguntas…' : '¡Crear mi examen!'}
        </button>
      </form>
    </main>
  );
}
