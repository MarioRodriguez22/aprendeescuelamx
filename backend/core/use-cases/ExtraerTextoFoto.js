export class ExtraerTextoFoto {
  constructor(ocrService) {
    this.ocrService = ocrService;
  }

  async ejecutar(archivos) {
    if (!Array.isArray(archivos) || archivos.length === 0) {
      throw new Error('Selecciona al menos una foto.');
    }
    const textos = await Promise.all(archivos.map((archivo) => this.ocrService.extraerTexto(archivo)));
    const texto = textos.map((item) => item.trim()).filter(Boolean).join('\n\n');
    if (!texto) throw new Error('No se pudo leer texto en las fotos. Intenta con imágenes más claras.');
    return { texto };
  }
}
