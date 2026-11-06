export default function Resultados({ resultado, ir }) {
  if (!resultado) {
    return (
      <main className="pantalla">
        <h1>Aún no hay resultados</h1>
        <button className="boton principal" onClick={() => ir('inicio')}>Ir al inicio</button>
      </main>
    );
  }

  const nota = Number(resultado.calificacion);
  const mensaje = nota >= 9
    ? '¡Excelente trabajo!'
    : nota >= 6
      ? '¡Muy bien! Sigue practicando.'
      : '¡No te rindas! Aprender toma práctica.';
  const aciertos = resultado.respuestas.filter((respuesta) => respuesta.correcta).length;

  return (
    <main className="pantalla">
      <section className="centrado resultado-principal">
        <div className="marca" aria-hidden="true">{nota >= 6 ? '🏆' : '🌟'}</div>
        <h1>{mensaje}</h1>
        <p className="calificacion">{nota.toFixed(1)} <small>/ 10</small></p>
        <p>Tuviste {aciertos} respuestas correctas de {resultado.respuestas.length}.</p>
        <button className="boton principal" onClick={() => ir('inicio')}>Hacer otro examen</button>
      </section>
      <h2>Repasa tus respuestas</h2>
      <div className="lista-resultados">
        {resultado.respuestas.map((respuesta, indice) => (
          <article className={`tarjeta revision ${respuesta.correcta ? 'acierto' : 'error-respuesta'}`} key={respuesta.pregunta_id}>
            <h3>{indice + 1}. {respuesta.correcta ? '¡Correcto!' : 'Vamos a repasar'}</h3>
            {!respuesta.correcta && <p>Respuesta correcta: <strong>{respuesta.respuesta_correcta}</strong></p>}
            {respuesta.explicacion && <p>{respuesta.explicacion}</p>}
          </article>
        ))}
      </div>
    </main>
  );
}
