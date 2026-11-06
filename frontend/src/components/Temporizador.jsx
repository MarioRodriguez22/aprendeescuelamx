import { useEffect, useRef, useState } from 'react';

export default function Temporizador({ minutos, alTerminar }) {
  const [segundos, setSegundos] = useState(Math.max(1, Number(minutos) || 1) * 60);
  const terminarRef = useRef(alTerminar);
  const finalizadoRef = useRef(false);

  useEffect(() => {
    terminarRef.current = alTerminar;
  }, [alTerminar]);

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setSegundos((actuales) => Math.max(0, actuales - 1));
    }, 1000);
    return () => window.clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (segundos === 0 && !finalizadoRef.current) {
      finalizadoRef.current = true;
      terminarRef.current();
    }
  }, [segundos]);

  const formato = `${Math.floor(segundos / 60).toString().padStart(2, '0')}:${(segundos % 60).toString().padStart(2, '0')}`;
  return <strong className="temporizador" aria-live="polite">⏰ {formato}</strong>;
}
