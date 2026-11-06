import { IGeneradorPreguntas } from '../../core/ports/IGeneradorPreguntas.js';

const SYSTEM_PROMPT = 'Responde únicamente con JSON válido, sin bloques markdown. Crea preguntas apropiadas para estudiantes de primaria en México.';
const SYSTEM_VISION = 'Analiza la foto completa de material escolar de primaria en México. Identifica la materia y describe con precisión las ilustraciones, mapas, gráficas, diagramas, objetos y relaciones que realmente se observan. No inventes detalles. Responde únicamente JSON con las propiedades materia y descripcion_visual. materia debe ser una de: Español, Matemáticas, Ciencias Naturales, Historia, Geografía, Formación Cívica y Ética, No identificada. Si no hay ilustraciones, indícalo en descripcion_visual.';

export class GeneradorGeminiAdapter extends IGeneradorPreguntas {
  constructor({ apiKey, model }) {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  async generarPreguntas({ materia, grado, texto, tipos }) {
    const prompt = `Genera exactamente ${tipos.length} preguntas de ${materia} para ${grado}° de primaria. Los tipos, en orden, son ${JSON.stringify(tipos)}. Usa exclusivamente como fuente el texto y las descripciones visuales de las fotos: ${String(texto || '').slice(0, 18000)}. Si hay descripciones de mapas, ilustraciones, gráficas o diagramas, crea preguntas sobre lo que muestran y sus relaciones; no inventes detalles. Responde con {"tema":"string","preguntas":[{"tipo":"opcion_multiple|verdadero_falso|completar|abierta","enunciado":"string","opciones":["A","B","C"],"respuesta_correcta":"A","explicacion":"string","dificultad":"facil|media|dificil"}]}. Para verdadero_falso usa "Verdadero" o "Falso".`;
    const salida = await this.solicitar({
      system: SYSTEM_PROMPT,
      parts: [{ text: prompt }],
      temperature: 0.4
    });
    const json = leerJson(salida, 'Gemini');
    if (!Array.isArray(json.preguntas)) throw new Error('Gemini no devolvió el arreglo preguntas.');
    return json.preguntas;
  }

  async clasificarMateria(texto) {
    const salida = await this.solicitar({
      system: 'Identifica la materia escolar principal de este texto de primaria en México. Elige exactamente una: Español, Matemáticas, Ciencias Naturales, Historia, Geografía, Formación Cívica y Ética, No identificada. Responde JSON con la propiedad materia.',
      parts: [{ text: String(texto || '').slice(0, 10000) }],
      temperature: 0
    });
    const json = leerJson(salida, 'Gemini');
    if (typeof json.materia !== 'string' || !json.materia.trim()) {
      throw new Error('Gemini no devolvió una materia válida.');
    }
    return json.materia.trim();
  }

  async analizarImagen({ texto, imagen, mimeType }) {
    if (!imagen || !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      throw new Error('La foto debe ser JPG, PNG o WebP para analizar su contenido visual.');
    }
    const salida = await this.solicitar({
      system: SYSTEM_VISION,
      parts: [
        { text: `Texto reconocido por OCR: ${String(texto || 'No se reconoció texto.').slice(0, 8000)}` },
        { inlineData: { mimeType, data: Buffer.from(imagen).toString('base64') } }
      ],
      temperature: 0
    });
    const json = leerJson(salida, 'Gemini');
    if (typeof json.materia !== 'string' || typeof json.descripcion_visual !== 'string') {
      throw new Error('Gemini no devolvió materia y descripción visual.');
    }
    return { materia: json.materia.trim(), descripcion_visual: json.descripcion_visual.trim() };
  }

  async solicitar({ system, parts, temperature }) {
    if (!this.apiKey) throw new Error('Configura GEMINI_API_KEY en backend/.env.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    let respuesta;
    try {
      respuesta = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts }],
            generationConfig: { temperature, responseMimeType: 'application/json' }
          }),
          signal: controller.signal
        }
      );
    } finally {
      clearTimeout(timeout);
    }
    const cuerpo = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      const error = new Error(
        cuerpo?.error?.message || `Gemini respondió con HTTP ${respuesta.status}.`
      );
      error.status = respuesta.status;
      error.code = cuerpo?.error?.status || cuerpo?.error?.code;
      error.error = cuerpo?.error;
      throw error;
    }
    const salida = cuerpo?.candidates?.[0]?.content?.parts
      ?.map((parte) => parte.text || '')
      .join('');
    if (!salida) {
      const motivo = cuerpo?.promptFeedback?.blockReason;
      throw new Error(motivo
        ? `Gemini no pudo procesar la solicitud: ${motivo}.`
        : 'Gemini no devolvió contenido.');
    }
    return salida;
  }
}

function leerJson(salida, proveedor) {
  try {
    return JSON.parse(salida);
  } catch (error) {
    throw new Error(`${proveedor} no devolvió JSON válido: ${error.message}`);
  }
}
