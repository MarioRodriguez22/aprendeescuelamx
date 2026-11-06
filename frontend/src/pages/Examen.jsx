import { useCallback, useMemo, useRef, useState } from 'react';
import Temporizador from '../components/Temporizador.jsx';
import PreguntaCard from '../components/PreguntaCard.jsx';
import BarraProgreso from '../components/BarraProgreso.jsx';
import { api } from '../services/api.js';

export default function Examen({ examen, alTerminar, ir }) {
  const [respuestas, setRespuestas] = useState({});
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const inicio = useRef(Date.now());
  const enviando = useRef(false);
  const contestadas = useMemo(
    () => Object.values(respuestas).filter((valor) => String(valor).trim()).length,
    [respuestas]
  );

  const terminar = useCallback(async () => {
    if (enviando.current) return;
    enviando.current = true;
    setOcupado(true);
    setError('');
    try {
      const tiempo_usado = Math.floor((Date.now() - inicio.current) / 1000);
      const resultado = await api.calificar(examen.id, respuestas, tiempo_usado);
      alTerminar(resultado);
      ir('resultados');
    } catch (fallo) {
      setError(fallo.message);
      enviando.current = false;
      setOcupado(false);
    }
  }, [examen.id, respuestas, alTerminar, ir]);

  function cambiar(id, valor) {
    setRespuestas((actuales) => ({ ...actuales, [id]: valor }));
  }

  return (
    <main className="pantalla">
      <header className="cabecera-examen">
        <div><h1>{examen.materia}</h1><p>{examen.grado}° de primaria</p></div>
        <Temporizador minutos={examen.tiempo_lim} alTerminar={terminar} />
      </header>
      <BarraProgreso actual={contestadas} total={examen.preguntas.length} />
      {examen.preguntas.map((pregunta, indice) => (
        <PreguntaCard
          key={pregunta.id}
          pregunta={pregunta}
          numero={indice + 1}
          valor={respuestas[pregunta.id]}
          alCambiar={cambiar}
          bloqueada={ocupado}
        />
      ))}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="boton principal" disabled={ocupado} onClick={terminar}>
        {ocupado ? 'Guardando…' : 'Terminar examen'}
      </button>
    </main>
  );
}
