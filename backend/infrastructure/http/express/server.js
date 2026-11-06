import express from 'express';
import cors from 'cors';
import { env } from '../../config/env.js';
import { examenRouter } from './routes/examen.routes.js';
import { preguntaRouter } from './routes/pregunta.routes.js';
import { crearRouterAutenticacion } from './routes/autenticacion.routes.js';
import { crearMiddlewareAutenticacion } from './middlewares/autenticacion.js';
import { autenticacion } from '../../config/container.js';

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: env.frontendOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/salud', (_req, res) => res.json({ estado: 'listo' }));
app.use('/api/autenticacion', crearRouterAutenticacion(autenticacion, {
  cookiesSeguras: process.env.NODE_ENV === 'production'
}));
const requiereSesion = crearMiddlewareAutenticacion(autenticacion);
app.use('/api/examenes', requiereSesion, examenRouter);
app.use('/api/preguntas', requiereSesion, preguntaRouter);

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'El contenido enviado no es JSON válido.' });
  }
  if (error instanceof Error && (error.name === 'MulterError' || /foto|archivo|MB|imagen|JPG|PNG|WebP/i.test(error.message))) {
    return res.status(400).json({ error: error.message });
  }
  console.error(error);
  res.status(500).json({ error: error.message || 'Ocurrió un error inesperado.' });
});

app.listen(env.port, () => {
  console.log(`AprendeEscuelaMx disponible en http://localhost:${env.port}`);
});
