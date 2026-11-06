import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { env } from './env.js';

const archivo = resolve(env.dbPath);
mkdirSync(dirname(archivo), { recursive: true });

export const db = new Database(archivo);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_usuario TEXT NOT NULL,
    nombre_normalizado TEXT NOT NULL UNIQUE,
    hash_contrasena TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'usuario' CHECK (rol IN ('usuario', 'admin')),
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sesiones (
    token_hash TEXT PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    expira_en TEXT NOT NULL,
    creada_en DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS preguntas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
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
    creada_en DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS examenes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    materia TEXT NOT NULL,
    grado INTEGER NOT NULL,
    tiempo_lim INTEGER,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS examen_preguntas (
    examen_id INTEGER NOT NULL REFERENCES examenes(id) ON DELETE CASCADE,
    pregunta_id INTEGER NOT NULL REFERENCES preguntas(id),
    orden INTEGER NOT NULL,
    PRIMARY KEY (examen_id, pregunta_id)
  );
  CREATE TABLE IF NOT EXISTS resultados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    examen_id INTEGER NOT NULL REFERENCES examenes(id) ON DELETE CASCADE,
    calificacion REAL NOT NULL,
    respuestas TEXT NOT NULL,
    tiempo_usado INTEGER NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS fotos_cargadas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    materia TEXT NOT NULL,
    materia_detectada TEXT NOT NULL DEFAULT '',
    tema TEXT NOT NULL DEFAULT '',
    descripcion_visual TEXT NOT NULL DEFAULT '',
    texto TEXT NOT NULL,
    imagen BLOB,
    mime_type TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_fotos_cargadas_fecha
    ON fotos_cargadas(fecha);
  CREATE INDEX IF NOT EXISTS idx_preguntas_materia_grado_hash
    ON preguntas(materia, grado, hash_texto);
`);

const columnasUsuarios = db.pragma('table_info(usuarios)');
if (!columnasUsuarios.some((columna) => columna.name === 'rol')) {
  db.exec("ALTER TABLE usuarios ADD COLUMN rol TEXT NOT NULL DEFAULT 'usuario'");
}
const columnasPreguntas = db.pragma('table_info(preguntas)');
if (!columnasPreguntas.some((columna) => columna.name === 'usuario_id')) {
  db.exec('ALTER TABLE preguntas ADD COLUMN usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE');
}
const columnasExamenes = db.pragma('table_info(examenes)');
if (!columnasExamenes.some((columna) => columna.name === 'usuario_id')) {
  db.exec('ALTER TABLE examenes ADD COLUMN usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE');
}
const columnasFotos = db.pragma('table_info(fotos_cargadas)');
if (!columnasFotos.some((columna) => columna.name === 'usuario_id')) {
  db.exec('ALTER TABLE fotos_cargadas ADD COLUMN usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE');
}
if (!columnasFotos.some((columna) => columna.name === 'imagen')) {
  db.exec('ALTER TABLE fotos_cargadas ADD COLUMN imagen BLOB');
}
if (!columnasFotos.some((columna) => columna.name === 'mime_type')) {
  db.exec('ALTER TABLE fotos_cargadas ADD COLUMN mime_type TEXT');
}
if (!columnasFotos.some((columna) => columna.name === 'materia_detectada')) {
  db.exec("ALTER TABLE fotos_cargadas ADD COLUMN materia_detectada TEXT NOT NULL DEFAULT ''");
  if (columnasFotos.some((columna) => columna.name === 'tema')) {
    db.exec(`
      UPDATE fotos_cargadas
      SET materia_detectada = materia, materia = tema
      WHERE trim(tema) != ''
    `);
  }
}
if (!columnasFotos.some((columna) => columna.name === 'tema')) {
  db.exec("ALTER TABLE fotos_cargadas ADD COLUMN tema TEXT NOT NULL DEFAULT ''");
}
if (!columnasFotos.some((columna) => columna.name === 'descripcion_visual')) {
  db.exec("ALTER TABLE fotos_cargadas ADD COLUMN descripcion_visual TEXT NOT NULL DEFAULT ''");
}
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_fotos_cargadas_usuario_materia
  ON fotos_cargadas(usuario_id, materia, fecha);
  CREATE INDEX IF NOT EXISTS idx_preguntas_usuario_materia_grado_hash
  ON preguntas(usuario_id, materia, grado, hash_texto);
  CREATE INDEX IF NOT EXISTS idx_examenes_usuario
  ON examenes(usuario_id, id)
`);
