export default function BarraProgreso({ actual, total }) {
  const porcentaje = total ? Math.round((actual / total) * 100) : 0;
  return (
    <div
      className="progreso"
      role="progressbar"
      aria-label="Preguntas contestadas"
      aria-valuenow={actual}
      aria-valuemin="0"
      aria-valuemax={total}
    >
      <div className="progreso-relleno" style={{ width: `${porcentaje}%` }} />
      <span>{actual} de {total} preguntas</span>
    </div>
  );
}
