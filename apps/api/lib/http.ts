import type { VercelRequest, VercelResponse } from '@vercel/node';

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void>;

export function withErrorHandling(method: 'GET' | 'POST', handler: Handler): Handler {
  return async (req, res) => {
    // The web build of the mobile app runs on a different origin/port than this API
    // (e.g. localhost:8081 vs localhost:3000), so browser requests need CORS headers.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    if (req.method !== method) {
      res.status(405).json({ error: `Method not allowed, expected ${method}` });
      return;
    }
    try {
      await handler(req, res);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
    }
  };
}

export async function fetchImageBuffer(url: string): Promise<Buffer> {
  if (url.startsWith('data:')) {
    return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch image from ${url}: ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}
