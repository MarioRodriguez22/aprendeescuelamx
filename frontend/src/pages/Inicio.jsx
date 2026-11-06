export default function Inicio({ ir }) {
  return (
    <main className="pantalla centrado">
      <div className="marca" aria-hidden="true">📚</div>
      <h1>¡Aprender puede ser divertido!</h1>
      <p>Practica para tu examen con preguntas hechas para ti.</p>
      <button className="boton principal" onClick={() => ir('configurar')}>Empezar</button>
      <button className="boton secundario" onClick={() => ir('subir')}>📸 Usar fotos de mis apuntes</button>
    </main>
  );
}
