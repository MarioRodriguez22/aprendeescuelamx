const BASE = '/api';

async function solicitar(ruta, opciones = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${BASE}${ruta}`, { credentials: 'include', ...opciones });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('No se pudo conectar con el servidor. Verifica que backend y frontend estén iniciados e inténtalo de nuevo.');
    }
    throw error;
  }
  const contenido = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    const error = new Error(contenido.error || 'No se pudo completar la solicitud.');
    error.status = respuesta.status;
    throw error;
  }
  return contenido;
}

export const api = {
  clasificarFoto(archivo, materia = '', alProgresar = () => {}) {
    return new Promise((resolve, reject) => {
      const datos = new FormData();
      datos.append('foto', archivo);
      datos.append('materia', materia);
      const solicitud = new XMLHttpRequest();
      solicitud.open('POST', `${BASE}/preguntas/clasificar-foto`);
      solicitud.withCredentials = true;
      solicitud.upload.addEventListener('progress', (evento) => {
        if (evento.lengthComputable) {
          alProgresar(Math.round((evento.loaded / evento.total) * 100));
        }
      });
      solicitud.addEventListener('load', () => {
        let contenido = {};
        try {
          contenido = JSON.parse(solicitud.responseText);
        } catch (error) {
          reject(new Error(`El servidor devolvió una respuesta inválida: ${error.message}`));
          return;
        }
        if (solicitud.status < 200 || solicitud.status >= 300) {
          reject(new Error(contenido.error || 'No se pudo procesar la foto.'));
          return;
        }
        resolve(contenido);
      });
      solicitud.addEventListener('error', () => reject(new Error('Se perdió la conexión mientras se subía la foto.')));
      solicitud.addEventListener('abort', () => reject(new Error('Se canceló la subida de la foto.')));
      solicitud.send(datos);
    });
  },
  clasificarFotos(archivos, materia = '') {
    const datos = new FormData();
    archivos.forEach((archivo) => datos.append('fotos', archivo));
    datos.append('materia', materia);
    return solicitar('/preguntas/clasificar-fotos', { method: 'POST', body: datos });
  },
  fotosDeHoy() {
    return solicitar('/preguntas/fotos');
  },
  usuarioActual() {
    return solicitar('/autenticacion/yo');
  },
  registrar(datos) {
    return solicitar('/autenticacion/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
  },
  iniciarSesion(datos) {
    return solicitar('/autenticacion/iniciar-sesion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
  },
  cerrarSesion() {
    return solicitar('/autenticacion/cerrar-sesion', { method: 'POST' });
  },
  extraerTexto(archivos) {
    const datos = new FormData();
    archivos.forEach((archivo) => datos.append('fotos', archivo));
    return solicitar('/preguntas/extraer-texto', { method: 'POST', body: datos });
  },
  generarExamen(datos) {
    return solicitar('/examenes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
  },
  obtenerExamen(id) {
    return solicitar(`/examenes/${id}`);
  },
  calificar(id, respuestas, tiempo_usado) {
    return solicitar(`/examenes/${id}/calificar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ respuestas, tiempo_usado })
    });
  }
};
