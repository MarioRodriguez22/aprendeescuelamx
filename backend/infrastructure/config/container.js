import { env } from './env.js';
import { db } from './db.js';
import { SQLiteRepository } from '../../adapters/db/SQLiteRepository.js';
import { SQLiteAuthRepository } from '../../adapters/db/SQLiteAuthRepository.js';
import { CryptoSeguridadAutenticacion } from '../../adapters/security/CryptoSeguridadAutenticacion.js';
import { TesseractAdapter } from '../../adapters/ocr/TesseractAdapter.js';
import { OpenAIAdapter } from '../../adapters/ia/OpenAIAdapter.js';
import { AnthropicAdapter } from '../../adapters/ia/AnthropicAdapter.js';
import { GeneradorGeminiAdapter } from '../../adapters/ia/GeneradorGeminiAdapter.js';
import { GroqAdapter } from '../../adapters/ia/GroqAdapter.js';
import { OllamaAdapter } from '../../adapters/ia/OllamaAdapter.js';
import { DemoAdapter } from '../../adapters/ia/DemoAdapter.js';
import { FallbackGeneradorPreguntas } from '../../adapters/ia/FallbackGeneradorPreguntas.js';
import { BancoPreguntas } from '../../core/use-cases/BancoPreguntas.js';
import { ExtraerTextoFoto } from '../../core/use-cases/ExtraerTextoFoto.js';
import { GenerarExamen } from '../../core/use-cases/GenerarExamen.js';
import { CalificarExamen } from '../../core/use-cases/CalificarExamen.js';
import { ClasificarFotos } from '../../core/use-cases/ClasificarFotos.js';
import { AutenticarUsuario } from '../../core/use-cases/AutenticarUsuario.js';

export const repositorio = new SQLiteRepository(db);
const repositorioAutenticacion = new SQLiteAuthRepository(db);
export const autenticacion = new AutenticarUsuario(
  repositorioAutenticacion,
  repositorioAutenticacion.repositorioSesiones,
  new CryptoSeguridadAutenticacion()
);

function crearGenerador() {
  if (env.aiProvider === 'demo') return new DemoAdapter();

  const openai = env.openaiApiKey
    ? new OpenAIAdapter({ apiKey: env.openaiApiKey, model: env.openaiModel })
    : null;
  const anthropic = env.anthropicApiKey
    ? new AnthropicAdapter({ apiKey: env.anthropicApiKey, model: env.anthropicModel })
    : null;
  const gemini = env.geminiApiKey
    ? new GeneradorGeminiAdapter({ apiKey: env.geminiApiKey, model: env.geminiModel })
    : null;
  const groq = env.groqApiKey
    ? new GroqAdapter({
      apiKey: env.groqApiKey,
      model: env.groqModel,
      visionModel: env.groqVisionModel
    })
    : null;
  const ollama = env.ollamaEnabled
    ? new OllamaAdapter({
      baseURL: env.ollamaBaseUrl,
      model: env.ollamaModel,
      visionModel: env.ollamaVisionModel
    })
    : null;

  if (env.aiProvider === 'openai') {
    if (!openai) throw new Error('AI_PROVIDER=openai requiere OPENAI_API_KEY en backend/.env.');
    return openai;
  }
  if (env.aiProvider === 'anthropic') {
    if (!anthropic) throw new Error('AI_PROVIDER=anthropic requiere ANTHROPIC_API_KEY en backend/.env.');
    return anthropic;
  }
  if (env.aiProvider === 'gemini') {
    if (!gemini) throw new Error('AI_PROVIDER=gemini requiere GEMINI_API_KEY en backend/.env.');
    return gemini;
  }
  if (env.aiProvider === 'groq') {
    if (!groq) throw new Error('AI_PROVIDER=groq requiere GROQ_API_KEY en backend/.env.');
    return groq;
  }
  if (env.aiProvider === 'ollama') {
    if (!ollama) throw new Error('AI_PROVIDER=ollama requiere OLLAMA_ENABLED=true y Ollama ejecutándose localmente.');
    return ollama;
  }
  if (env.aiProvider === 'auto') {
    const gratuitos = [
      ...(gemini ? [{ nombre: 'Gemini', adapter: gemini }] : []),
      ...(groq ? [{ nombre: 'Groq', adapter: groq }] : []),
      ...(ollama ? [{ nombre: 'Ollama', adapter: ollama }] : [])
    ];
    const dePago = env.allowPaidFallback
      ? [
        ...(openai ? [{ nombre: 'OpenAI', adapter: openai }] : []),
        ...(anthropic ? [{ nombre: 'Anthropic', adapter: anthropic }] : [])
      ]
      : [];
    return new FallbackGeneradorPreguntas([
      ...gratuitos,
      ...dePago
    ]);
  }

  throw new Error('AI_PROVIDER debe ser demo, auto, gemini, groq, ollama, openai o anthropic.');
}

const generador = crearGenerador();

export const casosUso = {
  extraerTexto: new ExtraerTextoFoto(new TesseractAdapter()),
  clasificarFotos: new ClasificarFotos(new TesseractAdapter(), generador, repositorio),
  generarExamen: new GenerarExamen(new BancoPreguntas(repositorio, generador), repositorio, repositorio),
  calificarExamen: new CalificarExamen(repositorio)
};
