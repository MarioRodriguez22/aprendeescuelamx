import { createWorker } from 'tesseract.js';
import { IOcrService } from '../../core/ports/IOcrService.js';

let workerCompartido;
let colaReconocimiento = Promise.resolve();

export class TesseractAdapter extends IOcrService {
  async extraerTexto(archivo) {
    const imagen = archivo?.bytes || archivo?.buffer;
    if (!imagen) throw new Error('La foto recibida no es válida.');
    const reconocer = colaReconocimiento.then(async () => {
      workerCompartido ??= createWorker('spa');
      const worker = await workerCompartido;
      const { data } = await worker.recognize(imagen);
      return data.text || '';
    });
    colaReconocimiento = reconocer.catch(() => {});
    try {
      return await reconocer;
    } catch (error) {
      throw new Error(`No se pudo leer "${archivo.nombre || archivo.originalname || 'la foto'}": ${error.message}`);
    }
  }
}
