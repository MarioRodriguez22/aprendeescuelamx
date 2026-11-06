export class SQLiteRepository {
  constructor(db) {
    this.db = db;
  }

  mapPregunta(row) {
    let opciones = [];
    try {
      opciones = row.opciones ? JSON.parse(row.opciones) : [];
    } catch (error) {
      throw new Error(`Las opciones de la pregunta ${row.id} no son JSON válido: ${error.message}`);
    }
    return {
      id: row.id,
      materia: row.materia,
      grado: row.grado,
      tipo: row.tipo,
      enunciado: row.enunciado,
      opciones,
      respuesta: row.respuesta,
      explicacion: row.explicacion || '',
      dificultad: row.dificultad || 'media'
    };
  }

  async buscarPorMateriaGradoHash(materia, grado, hashTexto, usuarioId) {
    const filas = this.db.prepare(`
      SELECT * FROM preguntas
      WHERE usuario_id = ? AND materia = ? AND grado = ? AND COALESCE(hash_texto, '') = ?
      ORDER BY veces_usada ASC, RANDOM()
    `).all(usuarioId, materia, grado, hashTexto);
    return filas.map((fila) => this.mapPregunta(fila));
  }

  async guardarMuchas(preguntas, hashTexto, usuarioId) {
    const insertar = this.db.prepare(`
      INSERT INTO preguntas
      (usuario_id, materia, grado, tipo, enunciado, opciones, respuesta, explicacion, dificultad, hash_texto)
      VALUES (@usuario_id, @materia, @grado, @tipo, @enunciado, @opciones, @respuesta, @explicacion, @dificultad, @hash_texto)
    `);
    this.db.transaction((items) => {
      for (const item of items) {
        insertar.run({
          ...item,
          usuario_id: usuarioId,
          opciones: JSON.stringify(item.opciones || []),
          hash_texto: hashTexto || ''
        });
      }
    })(preguntas);
  }

  async incrementarUsos(ids, usuarioId) {
    const actualizar = this.db.prepare(`
      UPDATE preguntas SET veces_usada = veces_usada + 1
      WHERE id = ? AND usuario_id = ?
    `);
    this.db.transaction((items) => items.forEach((id) => actualizar.run(id, usuarioId)))(ids);
  }

  async crear(examen, usuarioId) {
    const insertar = this.db.prepare(`
      INSERT INTO examenes (usuario_id, materia, grado, tiempo_lim)
      VALUES (?, ?, ?, ?)
    `);
    const insertarPregunta = this.db.prepare(
      'INSERT INTO examen_preguntas (examen_id, pregunta_id, orden) VALUES (?, ?, ?)'
    );
    const crearExamen = this.db.transaction(() => {
      const resultado = insertar.run(usuarioId, examen.materia, examen.grado, examen.tiempo_lim);
      examen.preguntas.forEach((pregunta, indice) => insertarPregunta.run(resultado.lastInsertRowid, pregunta.id, indice));
      return Number(resultado.lastInsertRowid);
    });
    return this.obtenerPorId(crearExamen(), usuarioId);
  }

  async obtenerPorId(id, usuarioId) {
    const fila = this.db.prepare(`
      SELECT * FROM examenes WHERE id = ? AND usuario_id = ?
    `).get(Number(id), Number(usuarioId));
    if (!fila) return null;
    const preguntas = this.db.prepare(`
      SELECT p.* FROM preguntas p
      INNER JOIN examen_preguntas ep ON ep.pregunta_id = p.id
      WHERE ep.examen_id = ?
      ORDER BY ep.orden
    `).all(fila.id).map((pregunta) => this.mapPregunta(pregunta));
    return { id: fila.id, materia: fila.materia, grado: fila.grado, tiempo_lim: fila.tiempo_lim, preguntas };
  }

  async guardarResultado(resultado) {
    const insertar = this.db.prepare(`
      INSERT INTO resultados (examen_id, calificacion, respuestas, tiempo_usado)
      VALUES (?, ?, ?, ?)
    `);
    const guardado = insertar.run(
      resultado.examen_id,
      resultado.calificacion,
      JSON.stringify(resultado.respuestas),
      resultado.tiempo_usado
    );
    const fila = this.db.prepare('SELECT * FROM resultados WHERE id = ?').get(guardado.lastInsertRowid);
    return {
      id: fila.id,
      examen_id: fila.examen_id,
      calificacion: fila.calificacion,
      respuestas: JSON.parse(fila.respuestas),
      tiempo_usado: fila.tiempo_usado,
      fecha: fila.fecha
    };
  }

  async listarPreguntas({ materia, grado, usuarioId }) {
    const filas = this.db.prepare(`
      SELECT * FROM preguntas
      WHERE usuario_id = ? AND materia = ? AND grado = ?
      ORDER BY creada_en DESC
    `).all(usuarioId, materia, grado);
    return filas.map((fila) => this.mapPregunta(fila));
  }

  async guardarFotosClasificadas(fotos) {
    const insertar = this.db.prepare(`
      INSERT INTO fotos_cargadas
      (usuario_id, nombre, materia, materia_detectada, descripcion_visual, texto, imagen, mime_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return this.db.transaction((items) => {
      const guardadas = [];
      for (const foto of items) {
        const resultado = insertar.run(
          foto.usuario_id,
          foto.nombre,
          foto.materia,
          foto.materia_detectada,
          foto.descripcion_visual || '',
          foto.texto,
          foto.imagen,
          foto.mime_type
        );
        const { imagen, mime_type, usuario_id, ...datosPublicos } = foto;
        guardadas.push({ ...datosPublicos, tiene_imagen: Boolean(imagen), id: Number(resultado.lastInsertRowid) });
      }
      return guardadas;
    })(fotos);
  }

  async listarFotos(usuarioId) {
    return this.db.prepare(`
      SELECT id, nombre, materia, materia_detectada, descripcion_visual, texto, fecha,
        CASE WHEN imagen IS NOT NULL THEN 1 ELSE 0 END AS tiene_imagen
      FROM fotos_cargadas
      WHERE usuario_id = ?
      ORDER BY id DESC
    `).all(usuarioId).map((foto) => ({
      id: foto.id,
      nombre: foto.nombre,
      materia: foto.materia,
      materia_detectada: foto.materia_detectada || foto.materia,
      descripcion_visual: foto.descripcion_visual || '',
      texto: foto.texto,
      fecha: foto.fecha,
      tiene_imagen: Boolean(foto.tiene_imagen)
    }));
  }

  async obtenerImagenFoto(id, usuarioId) {
    const fila = this.db.prepare(`
      SELECT imagen, mime_type FROM fotos_cargadas
      WHERE id = ? AND usuario_id = ?
    `).get(Number(id), Number(usuarioId));
    return fila?.imagen ? { bytes: fila.imagen, mimeType: fila.mime_type } : null;
  }
}
