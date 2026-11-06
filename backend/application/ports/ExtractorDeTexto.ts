export interface ExtractorDeTexto {
  extraer(imagen: Uint8Array): Promise<string>;
}
