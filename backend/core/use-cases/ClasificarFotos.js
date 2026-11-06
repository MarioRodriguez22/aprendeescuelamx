const MATERIAS_VALIDAS = new Set([
  'Español',
  'Matemáticas',
  'Ciencias Naturales',
  'Historia',
  'Geografía',
  'Formación Cívica y Ética',
  'No identificada'
]);

function materiaCanonica(materia) {
  const normalizar = (valor) => valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es-MX');
  return [...MATERIAS_VALIDAS].find((valida) => normalizar(valida) === normalizar(materia));
}

export class ClasificarFotos {
  constructor(ocrService, clasificadorMateria, fotoRepository) {
    this.ocrService = ocrService;
    this.clasificador = clasificadorMateria;
    this.repository = fotoRepository;
  }

  async ejecutar(archivos, materiaPersonalizada = '', usuarioId) {
    if (!Array.isArray(archivos) || archivos.length === 0) {
      throw new Error('Selecciona al menos una foto.');
    }
    const nombreMateria = String(materiaPersonalizada || '').trim();
    if (nombreMateria.length > 100) {
      throw new Error('El nombre de la materia no puede superar 100 caracteres.');
    }

    const reconocidas = await Promise.all(archivos.map((archivo) =>
      this.clasificarArchivo(archivo, nombreMateria, usuarioId)
    ));
    await this.repository.guardarFotosClasificadas(reconocidas);
    return { fotos: await this.repository.listarFotos(usuarioId) };
  }

  async ejecutarUna(archivo, materiaPersonalizada = '', usuarioId) {
    if (!archivo) throw new Error('Selecciona una foto.');
    const nombreMateria = String(materiaPersonalizada || '').trim();
    if (nombreMateria.length > 100) {
      throw new Error('El nombre de la materia no puede superar 100 caracteres.');
    }
    const [foto] = await this.repository.guardarFotosClasificadas([
      await this.clasificarArchivo(archivo, nombreMateria, usuarioId)
    ]);
    return { foto };
  }

  async clasificarArchivo(archivo, nombreMateria, usuarioId) {
    const texto = (await this.ocrService.extraerTexto(archivo)).trim();
    const analisis = await this.clasificador.analizarImagen({
      texto,
      imagen: archivo.bytes,
      mimeType: archivo.mimeType
    });
    const materiaDetectada = analisis.materia;
    const materiaDetectadaCanonica = typeof materiaDetectada === 'string'
      ? materiaCanonica(materiaDetectada)
      : null;
    if (!MATERIAS_VALIDAS.has(materiaDetectadaCanonica)) {
      throw new Error(`El clasificador devolvió una materia no válida: ${materiaDetectada}`);
    }
    return {
      nombre: archivo.nombre || archivo.originalname,
      materia: nombreMateria || materiaDetectadaCanonica,
      materia_detectada: materiaDetectadaCanonica,
      descripcion_visual: String(analisis.descripcion_visual || '').trim(),
      texto,
      usuario_id: usuarioId,
      imagen: Buffer.from(archivo.bytes),
      mime_type: archivo.mimeType,
      fecha: new Date().toISOString()
    };
  }
}
