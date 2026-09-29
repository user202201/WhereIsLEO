import OpenAI from 'openai';
import { env } from './env';

let client: OpenAI | undefined;

export function openai() {
  if (!client) {
    client = new OpenAI({ apiKey: env.openaiApiKey });
  }
  return client;
}

export async function generateImage(prompt: string, size: '1024x1024' | '1536x1024' | '1024x1536'): Promise<Buffer> {
  const result = await openai().images.generate({
    model: 'gpt-image-1',
    prompt,
    size,
    quality: 'high',
  });
  const b64 = result.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error('OpenAI image generation returned no image data');
  }
  return Buffer.from(b64, 'base64');
}

export async function editImage(prompt: string, imageBuffer: Buffer, filename: string): Promise<Buffer> {
  const file = await OpenAI.toFile(imageBuffer, filename);
  const result = await openai().images.edit({
    model: 'gpt-image-1',
    image: file,
    prompt,
    size: '1024x1024',
  });
  const b64 = result.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error('OpenAI image edit returned no image data');
  }
  return Buffer.from(b64, 'base64');
}
