import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api.js';

const MATERIAS = ['Español', 'Matemáticas', 'Ciencias Naturales', 'Historia', 'Geografía', 'Formación Cívica y Ética'];
const MAX_FOTOS = 50;
const TIPOS_FOTO = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_LADO_IMAGEN = 1800;
const CALIDAD_JPEG = 0.82;

async function optimizarFoto(archivo) {
  if (!globalThis.createImageBitmap) return archivo;
  const imagen = await createImageBitmap(archivo);
  try {
    const escala = Math.min(1, MAX_LADO_IMAGEN / Math.max(imagen.width, imagen.height));
    if (escala === 1 && archivo.type === 'image/jpeg' && archivo.size <= 900 * 1024) return archivo;

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(imagen.width * escala));
    canvas.height = Math.max(1, Math.round(imagen.height * escala));
    const contexto = canvas.getContext('2d');
    if (!contexto) throw new Error('No se pudo preparar la foto para subir.');
    contexto.fillStyle = '#ffffff';
    contexto.fillRect(0, 0, canvas.width, canvas.height);
    contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (resultado) => resultado ? resolve(resultado) : reject(new Error('No se pudo comprimir la foto.')),
        'image/jpeg',
        CALIDAD_JPEG
      );
    });
    const nombre = archivo.name.replace(/\.[^.]+$/, '') || 'foto';
    return new File([blob], `${nombre}.jpg`, { type: 'image/jpeg', lastModified: archivo.lastModified });
  } finally {
    imagen.close();
  }
}

export default function SubirFotos({ alSeleccionar, ir }) {
  const [fotos, setFotos] = useState([]);
  const [indiceActual, setIndiceActual] = useState(-1);
  const [progresoLote, setProgresoLote] = useState(0);
  const [fotosDeHoy, setFotosDeHoy] = useState([]);
  const [materiaPersonalizada, setMateriaPersonalizada] = useState('');
  const [materiaManual, setMateriaManual] = useState('Español');
  const [ocupado, setOcupado] = useState(false);
  const [cargandoHoy, setCargandoHoy] = useState(true);
  const [error, setError] = useState('');
  const fotosActuales = useRef(fotos);
  fotosActuales.current = fotos;

  useEffect(() => () => {
    fotosActuales.current.forEach((foto) => URL.revokeObjectURL(foto.vista));
  }, []);

  useEffect(() => {
    let activa = true;
    api.fotosDeHoy()
      .then((resultado) => {
        if (activa) setFotosDeHoy(resultado.fotos);
      })
      .catch((fallo) => {
        if (activa) setError(fallo.message);
      })
      .finally(() => {
        if (activa) setCargandoHoy(false);
      });
    return () => { activa = false; };
  }, []);

  const grupos = useMemo(() => {
    const agrupados = new Map();
    for (const foto of fotosDeHoy) {
      if (!agrupados.has(foto.materia)) agrupados.set(foto.materia, []);
      agrupados.get(foto.materia).push(foto);
    }
    return [...agrupados.entries()];
  }, [fotosDeHoy]);

  function agregarFotos(archivos) {
    const seleccionadas = Array.from(archivos || []);
    setError('');
    if (fotos.length + seleccionadas.length > MAX_FOTOS) {
      setError(`Puedes agregar hasta ${MAX_FOTOS} fotos por tanda. Quita alguna foto o clasifica las que ya elegiste.`);
      return;
    }

    const noPermitidas = seleccionadas.filter((archivo) => !TIPOS_FOTO.has(archivo.type));
    if (noPermitidas.length) {
      setError('Solo puedes agregar imágenes JPG, PNG o WebP.');
      return;
    }

    setFotos((actuales) => [
      ...actuales,
      ...seleccionadas.map((archivo) => ({
        id: `${archivo.name}-${archivo.lastModified}-${Math.random()}`,
        archivo,
        vista: URL.createObjectURL(archivo),
        estado: 'pendiente',
        progreso: 0,
        error: ''
      }))
    ]);
  }

  function quitarFoto(id) {
    const foto = fotos.find((seleccionada) => seleccionada.id === id);
    if (foto) URL.revokeObjectURL(foto.vista);
    setFotos((actuales) => actuales.filter((seleccionada) => seleccionada.id !== id));
  }

  async function leerFotos() {
    setError('');
    const pendientes = fotos.filter((foto) => foto.estado !== 'lista');
    if (!pendientes.length) {
      setError('Elige al menos una foto para continuar.');
      return;
    }
    setOcupado(true);
    setProgresoLote(0);
    let completadas = 0;
    let errores = 0;
    for (let indice = 0; indice < pendientes.length; indice += 1) {
      const foto = pendientes[indice];
      setIndiceActual(fotos.findIndex((seleccionada) => seleccionada.id === foto.id));
      setFotos((actuales) => actuales.map((seleccionada) =>
        seleccionada.id === foto.id
          ? { ...seleccionada, estado: 'preparando', progreso: 0, error: '' }
          : seleccionada
      ));

      try {
        const optimizada = await optimizarFoto(foto.archivo);
        setFotos((actuales) => actuales.map((seleccionada) =>
          seleccionada.id === foto.id ? { ...seleccionada, estado: 'subiendo' } : seleccionada
        ));
        const resultado = await api.clasificarFoto(optimizada, materiaPersonalizada, (progreso) => {
          setFotos((actuales) => actuales.map((seleccionada) =>
            seleccionada.id === foto.id ? { ...seleccionada, progreso } : seleccionada
          ));
          setProgresoLote(Math.round(((completadas + progreso / 100) / pendientes.length) * 100));
        });
        setFotosDeHoy((actuales) => [resultado.foto, ...actuales]);
        setFotos((actuales) => actuales.map((seleccionada) =>
          seleccionada.id === foto.id
            ? { ...seleccionada, estado: 'lista', progreso: 100, error: '' }
            : seleccionada
        ));
      } catch (fallo) {
        errores += 1;
        setFotos((actuales) => actuales.map((seleccionada) =>
          seleccionada.id === foto.id
            ? { ...seleccionada, estado: 'error', error: fallo.message }
            : seleccionada
        ));
      }

      completadas += 1;
      setProgresoLote(Math.round((completadas / pendientes.length) * 100));
    }
    setIndiceActual(-1);
    setOcupado(false);
    if (errores) setError(`${errores} foto(s) no se pudieron procesar. Puedes reintentarlas sin volver a subir las que ya quedaron listas.`);
  }

  function continuarSinFotos() {
    alSeleccionar('', '');
    ir('configurar');
  }

  function usarFotos(materia, grupo) {
    const texto = grupo.map((foto) => [
      foto.texto && `Texto reconocido: ${foto.texto}`,
      foto.descripcion_visual && `Descripción de la ilustración o imagen: ${foto.descripcion_visual}`
    ].filter(Boolean).join('\n')).filter(Boolean).join('\n\n');
    alSeleccionar(texto, materia);
    ir('configurar');
  }

  return (
    <main className="pantalla">
      <button className="enlace" onClick={() => ir('inicio')}>← Volver</button>
      <h1>📸 Clasifica tus fotos de hoy</h1>
      <p>Sube una o varias fotos. Leeremos cada una, identificaremos su materia y las agruparemos para ti.</p>
      <p>Puedes elegir varias imágenes a la vez o agregarlas en varias tandas. Máximo {MAX_FOTOS} fotos por clasificación.</p>
      <label className="campo-materia">
        Nombre de la materia (opcional)
        <input
          type="text"
          value={materiaPersonalizada}
          maxLength={100}
          placeholder="Ejemplo: Proyectos"
          onChange={(evento) => setMateriaPersonalizada(evento.target.value)}
        />
        <span>Si escribes un nombre, se asignará a todas las fotos de esta tanda. Si lo dejas vacío, detectaremos la materia automáticamente.</span>
      </label>
      <p className="nota-privacidad">El OCR se hace en el equipo que ejecuta el servidor. La foto se envía al proveedor de IA configurado para analizar sus ilustraciones y se guarda en tu cuenta para que puedas verla después. Tus fotos no aparecen en las cuentas de otras personas.</p>
      <label className="selector-fotos">
        <span>Elegir varias fotos de tus apuntes</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(evento) => {
            agregarFotos(evento.target.files);
            evento.target.value = '';
          }}
        />
      </label>
      <label className="selector-camara">
        <span>📷 Tomar una foto con la cámara</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={(evento) => {
            agregarFotos(evento.target.files);
            evento.target.value = '';
          }}
        />
      </label>
      {fotos.length > 0 && (
        <section className="seleccion-fotos">
          <div className="estado-lote">
            <h2>{fotos.length} de {MAX_FOTOS} foto(s)</h2>
            {ocupado && (
              <>
                <p>Procesando foto {indiceActual + 1} de {fotos.length}. Avance del lote: {progresoLote}%</p>
                <div className="progreso-subida" role="progressbar" aria-valuenow={progresoLote} aria-valuemin="0" aria-valuemax="100">
                  <div style={{ width: `${progresoLote}%` }} />
                </div>
              </>
            )}
          </div>
          <div className="previsualizaciones-fotos">
            {fotos.map((foto) => (
              <article className="previsualizacion-foto" key={foto.id}>
                <img src={foto.vista} alt={`Vista previa de ${foto.archivo.name}`} />
                <span title={foto.archivo.name}>{foto.archivo.name}</span>
                <span className={`estado-foto estado-${foto.estado}`} aria-live="polite">
                  {foto.estado === 'pendiente' && 'En espera'}
                  {foto.estado === 'preparando' && 'Optimizando imagen…'}
                  {foto.estado === 'subiendo' && `Subiendo ${foto.progreso}% · OCR y análisis visual en curso`}
                  {foto.estado === 'lista' && '✓ Lista'}
                  {foto.estado === 'error' && 'No se pudo procesar'}
                </span>
                {foto.estado === 'error' && <span className="error-foto">{foto.error}</span>}
                <button
                  type="button"
                  className="quitar-foto"
                  onClick={() => quitarFoto(foto.id)}
                  disabled={ocupado}
                  aria-label={`Quitar ${foto.archivo.name}`}
                >
                  Quitar
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="boton principal" disabled={ocupado || !fotos.some((foto) => foto.estado !== 'lista')} onClick={leerFotos}>
        {ocupado ? `Procesando foto ${indiceActual + 1} de ${fotos.length}…` : fotos.some((foto) => foto.estado === 'error') ? 'Reintentar fotos con error' : 'Clasificar fotos'}
      </button>
      {fotos.length > 0 && !ocupado && fotos.every((foto) => foto.estado === 'lista') && (
        <button className="boton secundario" onClick={() => {
          fotos.forEach((foto) => URL.revokeObjectURL(foto.vista));
          setFotos([]);
        }}>
          Limpiar selección de fotos
        </button>
      )}
      <button className="boton secundario" onClick={continuarSinFotos}>Crear examen sin fotos</button>

      <section className="fotos-del-dia">
        <h2>Mis fotos clasificadas</h2>
        {cargandoHoy && <p>Cargando tus fotos…</p>}
        {!cargandoHoy && fotosDeHoy.length === 0 && <p>Aún no tienes fotos clasificadas en esta cuenta.</p>}
        {!cargandoHoy && fotosDeHoy.length > 0 && (
          <>
            <p>{fotosDeHoy.length} foto(s) guardadas en tu cuenta, agrupadas por materia.</p>
            {grupos.map(([materia, grupo]) => {
              return (
              <article className="grupo-materia" key={materia}>
                <h3>{materia} <span>({grupo.length} foto(s))</span></h3>
                <div className="previsualizaciones-fotos">
                  {grupo.map((foto) => (
                    <article className="foto-guardada" key={foto.id}>
                      {foto.tiene_imagen
                        ? <img src={`/api/preguntas/fotos/${foto.id}/imagen`} alt={`Foto ${foto.nombre}`} loading="lazy" />
                        : <div className="foto-sin-archivo">Esta foto se guardó antes de activar la vista previa. Vuelve a cargarla para verla.</div>}
                      <strong>{foto.nombre}</strong>
                      {foto.materia_detectada && foto.materia_detectada !== materia && (
                        <p>Materia detectada: {foto.materia_detectada}</p>
                      )}
                      {foto.descripcion_visual && (
                        <details className="descripcion-visual">
                          <summary>Ver análisis de la ilustración</summary>
                          <p>{foto.descripcion_visual}</p>
                        </details>
                      )}
                      {foto.texto
                        ? <details className="descripcion-visual">
                          <summary>Ver texto reconocido</summary>
                          <p className="texto-foto-guardada">{foto.texto}</p>
                        </details>
                        : <p className="texto-no-leido">No se pudo leer el texto.</p>}
                    </article>
                  ))}
                </div>
                {materia === 'No identificada' ? (
                  <div className="materia-manual">
                    <label>Elige la materia de estas fotos
                      <select value={materiaManual} onChange={(evento) => setMateriaManual(evento.target.value)}>
                        {MATERIAS.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </label>
                    <button className="boton boton-grupo" onClick={() => usarFotos(materiaManual, grupo)}>
                      Crear examen de {materiaManual} · {grupo.length} foto(s)
                    </button>
                  </div>
                ) : (
                  <button className="boton boton-grupo" onClick={() => usarFotos(materia, grupo)}>
                    Crear examen de {materia} · {grupo.length} foto(s)
                  </button>
                )}
              </article>
            );})}
          </>
        )}
      </section>
    </main>
  );
}
