import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { SQLiteRepository } from '../adapters/db/SQLiteRepository.js';
import { ClasificarFotos } from '../core/use-cases/ClasificarFotos.js';

test('cada cuenta solo lista y recupera las imágenes que le pertenecen', async () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE preguntas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      materia TEXT NOT NULL,
      grado INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      enunciado TEXT NOT NULL,
      opciones TEXT,
      respuesta TEXT NOT NULL,
      explicacion TEXT,
      dificultad TEXT,
      hash_texto TEXT,
      veces_usada INTEGER DEFAULT 0,
      creada_en TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE examenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      materia TEXT NOT NULL,
      grado INTEGER NOT NULL,
      tiempo_lim INTEGER
    );
    CREATE TABLE examen_preguntas (
      examen_id INTEGER NOT NULL,
      pregunta_id INTEGER NOT NULL,
      orden INTEGER NOT NULL,
      PRIMARY KEY (examen_id, pregunta_id)
    );
    CREATE TABLE fotos_cargadas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      materia TEXT NOT NULL,
      materia_detectada TEXT NOT NULL,
      descripcion_visual TEXT,
      texto TEXT,
      imagen BLOB,
      mime_type TEXT,
      fecha TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const repositorio = new SQLiteRepository(db);
  const datos = (usuario_id, nombre) => ({
    usuario_id,
    nombre,
    materia: 'Ciencias Naturales',
    materia_detectada: 'Ciencias Naturales',
    descripcion_visual: '',
    texto: 'Una planta',
    imagen: Buffer.from(nombre),
    mime_type: 'image/jpeg'
  });

  const [fotoA] = await repositorio.guardarFotosClasificadas([datos(1, 'planta-a.jpg')]);
  const [fotoB] = await repositorio.guardarFotosClasificadas([datos(2, 'planta-b.jpg')]);

  assert.equal((await repositorio.listarFotos(1)).length, 1);
  assert.equal((await repositorio.listarFotos(1))[0].nombre, 'planta-a.jpg');
  assert.equal((await repositorio.obtenerImagenFoto(fotoA.id, 1)).bytes.toString(), 'planta-a.jpg');
  assert.equal(await repositorio.obtenerImagenFoto(fotoB.id, 1), null);
  assert.equal((await repositorio.obtenerImagenFoto(fotoB.id, 2)).bytes.toString(), 'planta-b.jpg');

  const pregunta = (materia) => ({
    materia,
    grado: 4,
    tipo: 'opcion_multiple',
    enunciado: `Pregunta de ${materia}`,
    opciones: ['A', 'B', 'C', 'D'],
    respuesta: 'A',
    explicacion: '',
    dificultad: 'media'
  });
  await repositorio.guardarMuchas([pregunta('Ciencias Naturales')], 'hash-a', 1);
  await repositorio.guardarMuchas([pregunta('Historia')], 'hash-b', 2);
  const preguntasA = await repositorio.buscarPorMateriaGradoHash('Ciencias Naturales', 4, 'hash-a', 1);
  assert.equal(preguntasA.length, 1);
  assert.equal(
    (await repositorio.buscarPorMateriaGradoHash('Historia', 4, 'hash-b', 1)).length,
    0
  );
  const examen = await repositorio.crear({
    materia: 'Ciencias Naturales',
    grado: 4,
    tiempo_lim: 30,
    preguntas: preguntasA
  }, 1);
  assert.ok(examen);
  assert.equal(await repositorio.obtenerPorId(examen.id, 2), null);
  assert.ok(await repositorio.obtenerPorId(examen.id, 1));

  const clasificarFotos = new ClasificarFotos(
    { async extraerTexto() { return 'Un dibujo de una planta'; } },
    { async analizarImagen() {
      return { materia: 'Ciencias Naturales', descripcion_visual: 'Una planta con tres hojas.' };
    } },
    repositorio
  );
  const resultado = await clasificarFotos.ejecutarUna({
    nombre: 'planta-nueva.jpg',
    mimeType: 'image/jpeg',
    bytes: Buffer.from('imagen-prueba')
  }, '', 3);
  assert.equal(resultado.foto.tiene_imagen, true);
  assert.equal('imagen' in resultado.foto, false);
  assert.equal('usuario_id' in resultado.foto, false);
  assert.equal((await repositorio.listarFotos(3))[0].materia, 'Ciencias Naturales');
  assert.equal(
    (await repositorio.obtenerImagenFoto(resultado.foto.id, 3)).bytes.toString(),
    'imagen-prueba'
  );

  db.close();
});
