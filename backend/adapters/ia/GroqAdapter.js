import { OpenAICompatibleAdapter } from './OpenAICompatibleAdapter.js';

export class GroqAdapter extends OpenAICompatibleAdapter {
  constructor({ apiKey, model, visionModel }) {
    super({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
      model,
      visionModel,
      providerName: 'Groq'
    });
  }
}
