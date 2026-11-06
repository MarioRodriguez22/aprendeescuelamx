import dotenv from 'dotenv';

dotenv.config();

function enteroPositivo(valor, predeterminado, nombre) {
  const numero = Number(valor ?? predeterminado);
  if (!Number.isInteger(numero) || numero < 1) {
    throw new Error(`${nombre} debe ser un entero positivo.`);
  }
  return numero;
}

export const env = Object.freeze({
  port: enteroPositivo(process.env.PORT, 3000, 'PORT'),
  dbPath: process.env.DB_PATH || './data/aprende-escuela-mx.sqlite',
  aiProvider: (process.env.AI_PROVIDER || 'demo').toLowerCase(),
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  groqVisionModel: process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',
  ollamaEnabled: process.env.OLLAMA_ENABLED === 'true',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
  ollamaVisionModel: process.env.OLLAMA_VISION_MODEL || 'llama3.2-vision',
  allowPaidFallback: process.env.AI_ALLOW_PAID_FALLBACK === 'true',
  maxUploadMb: enteroPositivo(process.env.MAX_UPLOAD_MB, 10, 'MAX_UPLOAD_MB'),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
});
