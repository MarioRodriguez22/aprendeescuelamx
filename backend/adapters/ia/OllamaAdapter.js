import { OpenAICompatibleAdapter } from './OpenAICompatibleAdapter.js';

export class OllamaAdapter extends OpenAICompatibleAdapter {
  constructor({ baseURL, model, visionModel }) {
    super({
      apiKey: 'ollama',
      baseURL: `${baseURL.replace(/\/+$/, '')}/v1`,
      model,
      visionModel,
      providerName: 'Ollama'
    });
  }
}
