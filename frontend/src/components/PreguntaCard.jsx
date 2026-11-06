export default function PreguntaCard({ pregunta, numero, valor, alCambiar, bloqueada = false }) {
  const opciones = pregunta.tipo === 'verdadero_falso'
    ? ['Verdadero', 'Falso']
    : pregunta.opciones || [];

  return (
    <article className="tarjeta pregunta">
      <h2>{numero}. {pregunta.enunciado}</h2>
      {opciones.length > 0 ? (
        <div className="opciones">
          {opciones.map((opcion, indice) => (
            <label className="opcion" key={`${opcion}-${indice}`}>
              <input
                type="radio"
                name={`pregunta-${pregunta.id}`}
                value={opcion}
                checked={valor === opcion}
                onChange={() => alCambiar(pregunta.id, opcion)}
                disabled={bloqueada}
              />
              <span>{opcion}</span>
            </label>
          ))}
        </div>
      ) : (
        <textarea
          rows={pregunta.tipo === 'abierta' ? 4 : 2}
          value={valor || ''}
          onChange={(evento) => alCambiar(pregunta.id, evento.target.value)}
          disabled={bloqueada}
          placeholder="Escribe tu respuesta aquí"
          aria-label={`Respuesta de la pregunta ${numero}`}
        />
      )}
    </article>
  );
}
