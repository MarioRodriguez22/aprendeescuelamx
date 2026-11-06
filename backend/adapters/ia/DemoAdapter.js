import { IGeneradorPreguntas } from '../../core/ports/IGeneradorPreguntas.js';

export class DemoAdapter extends IGeneradorPreguntas {
  constructor() {
    super();
    this.permiteReutilizarPreguntas = false;
  }

  async analizarImagen() {
    throw new Error('El modo demo no puede interpretar ilustraciones. Configura OpenAI o Anthropic para usar análisis visual.');
  }

  async clasificarMateria(texto) {
    const contenido = texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const palabras = {
      'Matemáticas': ['matematicas', 'suma', 'resta', 'multiplicacion', 'division', 'fraccion', 'decimal', 'perimetro', 'geometria', 'ecuacion'],
      'Español': ['espanol', 'sustantivo', 'verbo', 'adjetivo', 'oracion', 'silaba', 'acento', 'lectura', 'cuento', 'gramatica'],
      'Ciencias Naturales': ['ciencias naturales', 'ecosistema', 'celula', 'fotosintesis', 'planeta', 'energia', 'organos', 'naturaleza'],
      'Historia': ['historia', 'revolucion', 'independencia', 'virreinato', 'civilizacion', 'constitucion', 'siglo'],
      'Geografía': ['geografia', 'mapa', 'continente', 'territorio', 'relieve', 'poblacion', 'clima', 'montana'],
      'Formación Cívica y Ética': ['civica', 'etica', 'derechos', 'convivencia', 'respeto', 'responsabilidad', 'democracia', 'igualdad']
    };
    const resultados = Object.entries(palabras).map(([materia, terminos]) => ({
      materia,
      puntos: terminos.reduce((total, termino) => total + (contenido.includes(termino) ? 1 : 0), 0)
    })).sort((a, b) => b.puntos - a.puntos);

    if (resultados[0].puntos === 0 || resultados[0].puntos === resultados[1].puntos) {
      return 'No identificada';
    }
    return resultados[0].materia;
  }

  async generarPreguntas({ materia, grado, tipos, texto = '' }) {
    if (String(texto).trim()) {
      throw new Error(
        'El modo demo no puede crear preguntas basadas en tus fotos y no usará ejercicios inventados. Configura OpenAI o Anthropic y vuelve a clasificar las fotos para analizar sus imágenes.'
      );
    }

    return tipos.map((tipo, indice) => {
      const numero = indice + 1;
      const contexto = `Demostración de ${materia}, ${grado}°`;

      if (tipo === 'opcion_multiple') {
        const primero = indice + 2;
        const segundo = indice + 3;
        const correcta = String(primero + segundo);
        return {
          tipo,
          enunciado: `${contexto}: ¿cuánto es ${primero} + ${segundo}?`,
          opciones: [correcta, String(primero + segundo + 1), String(primero + segundo - 1)],
          respuesta_correcta: correcta,
          explicacion: `En modo de demostración, ${primero} + ${segundo} = ${correcta}.`,
          dificultad: 'facil'
        };
      }

      if (tipo === 'verdadero_falso') {
        const esVerdadera = indice % 2 === 0;
        return {
          tipo,
          enunciado: esVerdadera
            ? `${contexto}: la Tierra es un planeta.`
            : `${contexto}: el Sol es un planeta.`,
          opciones: ['Verdadero', 'Falso'],
          respuesta_correcta: esVerdadera ? 'Verdadero' : 'Falso',
          explicacion: esVerdadera
            ? 'La Tierra es uno de los planetas que giran alrededor del Sol.'
            : 'El Sol es una estrella, no un planeta.',
          dificultad: 'facil'
        };
      }

      if (tipo === 'completar') {
        const resultado = numero + 4;
        return {
          tipo,
          enunciado: `${contexto}: completa la suma ${numero} + 4 = ____.`,
          opciones: [],
          respuesta_correcta: String(resultado),
          explicacion: `La suma de ${numero} más 4 es ${resultado}.`,
          dificultad: 'facil'
        };
      }

      return {
        tipo,
        enunciado: `${contexto}: escribe la palabra SOL para comprobar que puedes responder una pregunta abierta.`,
        opciones: [],
        respuesta_correcta: 'SOL',
        explicacion: 'Esta pregunta abierta sirve para probar cómo se guardan y califican las respuestas.',
        dificultad: 'facil'
      };
    });
  }
}
