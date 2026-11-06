import OpenAI from 'openai';
import { IGeneradorPreguntas } from '../../core/ports/IGeneradorPreguntas.js';

const SYSTEM_PROMPT = 'Responde únicamente con JSON válido, sin bloques markdown. Crea preguntas apropiadas para estudiantes de primaria en México.';
const SYSTEM_VISION = 'Analiza la foto completa de material escolar de primaria en México. Identifica la materia y describe con precisión las ilustraciones, mapas, gráficas, diagramas, objetos y relaciones que realmente se observan. No inventes detalles. Responde únicamente JSON con las propiedades materia y descripcion_visual. materia debe ser una de: Español, Matemáticas, Ciencias Naturales, Historia, Geografía, Formación Cívica y Ética, No identificada. Si no hay ilustraciones, indícalo en descripcion_visual.';

export class OpenAICompatibleAdapter extends IGeneradorPreguntas {
  constructor({ apiKey, baseURL, model, visionModel, providerName }) {
    super();
    this.client = new OpenAI({
      apiKey,
      baseURL,
      timeout: 60000,
      maxRetries: 0
    });
    this.model = model;
    this.visionModel = visionModel || model;
    this.providerName = providerName;
  }

  async generarPreguntas({ materia, grado, texto, tipos }) {
    const prompt = `Genera exactamente ${tipos.length} preguntas de ${materia} para ${grado}° de primaria. Los tipos, en orden, son ${JSON.stringify(tipos)}. Usa exclusivamente como fuente el texto y las descripciones visuales de las fotos: ${String(texto || '').slice(0, 18000)}. Si hay descripciones de mapas, ilustraciones, gráficas o diagramas, crea preguntas sobre lo que muestran y sus relaciones; no inventes detalles. Responde con {"tema":"string","preguntas":[{"tipo":"opcion_multiple|verdadero_falso|completar|abierta","enunciado":"string","opciones":["A","B","C"],"respuesta_correcta":"A","explicacion":"string","dificultad":"facil|media|dificil"}]}. Para verdadero_falso usa "Verdadero" o "Falso".`;
    const salida = await this.completar({
      model: this.model,
      system: SYSTEM_PROMPT,
      content: prompt,
      temperature: 0.4
    });
    const json = leerJson(salida, this.providerName);
    if (!Array.isArray(json.preguntas)) throw new Error(`${this.providerName} no devolvió el arreglo preguntas.`);
    return json.preguntas;
  }

  async clasificarMateria(texto) {
    const salida = await this.completar({
      model: this.model,
      system: 'Identifica la materia escolar principal de este texto de primaria en México. Elige exactamente una: Español, Matemáticas, Ciencias Naturales, Historia, Geografía, Formación Cívica y Ética, No identificada. Responde JSON con la propiedad materia.',
      content: String(texto || '').slice(0, 10000),
      temperature: 0
    });
    const json = leerJson(salida, this.providerName);
    if (typeof json.materia !== 'string' || !json.materia.trim()) {
      throw new Error(`${this.providerName} no devolvió una materia válida.`);
    }
    return json.materia.trim();
  }

  async analizarImagen({ texto, imagen, mimeType }) {
    if (!imagen || !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      throw new Error('La foto debe ser JPG, PNG o WebP para analizar su contenido visual.');
    }
    const salida = await this.completar({
      model: this.visionModel,
      system: SYSTEM_VISION,
      content: [
        { type: 'text', text: `Texto reconocido por OCR: ${String(texto || 'No se reconoció texto.').slice(0, 8000)}` },
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${Buffer.from(imagen).toString('base64')}`,
            detail: 'high'
          }
        }
      ],
      temperature: 0
    });
    const json = leerJson(salida, this.providerName);
    if (typeof json.materia !== 'string' || typeof json.descripcion_visual !== 'string') {
      throw new Error(`${this.providerName} no devolvió materia y descripción visual.`);
    }
    return { materia: json.materia.trim(), descripcion_visual: json.descripcion_visual.trim() };
  }

  async completar({ model, system, content, temperature }) {
    const respuesta = await this.client.chat.completions.create({
      model,
      temperature,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content }
      ]
    });
    const salida = respuesta.choices[0]?.message?.content;
    if (!salida) throw new Error(`${this.providerName} no devolvió contenido.`);
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
