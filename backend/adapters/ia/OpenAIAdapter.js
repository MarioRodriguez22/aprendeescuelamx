import OpenAI from 'openai';
import { IGeneradorPreguntas } from '../../core/ports/IGeneradorPreguntas.js';

export class OpenAIAdapter extends IGeneradorPreguntas {
  constructor({ apiKey, model }) {
    super();
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
    this.model = model;
  }

  async generarPreguntas({ materia, grado, texto, tipos }) {
    if (!this.client) throw new Error('Configura OPENAI_API_KEY para generar preguntas.');
    const respuesta = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Responde únicamente con JSON válido. Crea preguntas apropiadas para estudiantes de primaria en México.'
        },
        {
          role: 'user',
          content: `Genera exactamente ${tipos.length} preguntas de ${materia} para ${grado}° de primaria. Los tipos, en orden, son ${JSON.stringify(tipos)}. Usa como fuente el texto y las descripciones visuales de las fotos: ${String(texto || 'conocimientos generales de la materia').slice(0, 18000)}. Si hay descripciones de mapas, ilustraciones, gráficas o diagramas, crea preguntas sobre lo que muestran y sus relaciones; no inventes detalles que no estén descritos. Responde con {"tema":"string","preguntas":[{"tipo":"opcion_multiple|verdadero_falso|completar|abierta","enunciado":"string","opciones":["A","B","C"],"respuesta_correcta":"A","explicacion":"string","dificultad":"facil|media|dificil"}]}. Para verdadero_falso usa "Verdadero" o "Falso".`
        }
      ]
    });
    const salida = respuesta.choices[0]?.message?.content;
    if (!salida) throw new Error('OpenAI no devolvió contenido.');
    try {
      const json = JSON.parse(salida);
      if (!Array.isArray(json.preguntas)) throw new Error('Falta el arreglo preguntas.');
      return json.preguntas;
    } catch (error) {
      throw new Error(`La respuesta de OpenAI no contiene JSON válido: ${error.message}`);
    }
  }

  async clasificarMateria(texto) {
    if (!this.client) throw new Error('Configura OPENAI_API_KEY para clasificar fotos.');
    const respuesta = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Identifica la materia escolar principal de un texto de primaria en México. Elige exactamente una de estas opciones: Español, Matemáticas, Ciencias Naturales, Historia, Geografía, Formación Cívica y Ética, No identificada. Responde JSON con la propiedad materia.'
        },
        { role: 'user', content: texto.slice(0, 10000) }
      ]
    });
    const salida = respuesta.choices[0]?.message?.content;
    if (!salida) throw new Error('OpenAI no devolvió una materia.');
    return leerMateria(salida);
  }

  async analizarImagen({ texto, imagen, mimeType }) {
    if (!this.client) throw new Error('Configura OPENAI_API_KEY para analizar imágenes y sus ilustraciones.');
    validarImagen(imagen, mimeType);
    const contenido = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Analiza la foto completa de material escolar de primaria en México, no solo el texto. Identifica la materia y describe con precisión las ilustraciones, mapas, gráficas, diagramas, objetos y relaciones que realmente se observan. No inventes detalles. Responde únicamente JSON con las propiedades materia y descripcion_visual. materia debe ser una de: Español, Matemáticas, Ciencias Naturales, Historia, Geografía, Formación Cívica y Ética, No identificada. Si no hay ilustraciones, indícalo en descripcion_visual.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Texto reconocido por OCR: ${String(texto || 'No se reconoció texto.').slice(0, 8000)}` },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${Buffer.from(imagen).toString('base64')}`,
                detail: 'high'
              }
            }
          ]
        }
      ]
    });
    const salida = contenido.choices[0]?.message?.content;
    if (!salida) throw new Error('OpenAI no devolvió el análisis visual de la foto.');
    return leerAnalisisImagen(salida);
  }
}

function validarImagen(imagen, mimeType) {
  if (!imagen || !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    throw new Error('La foto debe ser JPG, PNG o WebP para analizar su contenido visual.');
  }
}

function leerAnalisisImagen(salida) {
  try {
    const json = JSON.parse(salida);
    if (typeof json.materia !== 'string' || typeof json.descripcion_visual !== 'string') {
      throw new Error('Faltan las propiedades materia o descripcion_visual.');
    }
    return {
      materia: json.materia.trim(),
      descripcion_visual: json.descripcion_visual.trim()
    };
  } catch (error) {
    throw new Error(`OpenAI no devolvió un análisis de imagen válido: ${error.message}`);
  }
}

function leerMateria(salida) {
  try {
    const json = JSON.parse(salida);
    if (typeof json.materia !== 'string' || !json.materia.trim()) {
      throw new Error('Falta la propiedad materia.');
    }
    return json.materia.trim();
  } catch (error) {
    throw new Error(`La respuesta de OpenAI no contiene una materia válida: ${error.message}`);
  }
}
