// Local dev server with no external dependency (no Vercel CLI, no login, no account).
// Routes requests directly to the same handler modules Vercel would call in production,
// via a minimal shim over Node's http module.
import 'dotenv/config';
import http from 'node:http';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import scenesGenerate from './api/scenes/generate';
import targetsPresets from './api/targets/presets';
import targetsCartoonize from './api/targets/cartoonize';
import gamesCreate from './api/games/create';
import gamesGuess from './api/games/[id]/guess';
import gamesReveal from './api/games/[id]/reveal';

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void>;

const routes: { pattern: RegExp; handler: Handler }[] = [
  { pattern: /^\/api\/scenes\/generate$/, handler: scenesGenerate },
  { pattern: /^\/api\/targets\/presets$/, handler: targetsPresets },
  { pattern: /^\/api\/targets\/cartoonize$/, handler: targetsCartoonize },
  { pattern: /^\/api\/games\/create$/, handler: gamesCreate },
  { pattern: /^\/api\/games\/([^/]+)\/guess$/, handler: gamesGuess },
  { pattern: /^\/api\/games\/([^/]+)\/reveal$/, handler: gamesReveal },
];

function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function asVercelResponse(res: http.ServerResponse): VercelResponse {
  const shim = res as unknown as VercelResponse;
  shim.status = (code: number) => {
    res.statusCode = code;
    return shim;
  };
  shim.json = (body: unknown) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
    return shim;
  };
  return shim;
}

const server = http.createServer(async (rawReq, rawRes) => {
  const url = new URL(rawReq.url ?? '/', 'http://localhost');
  const res = asVercelResponse(rawRes);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const match = routes.find((route) => route.pattern.test(url.pathname));
  if (!match) {
    res.status(404).json({ error: `No route for ${url.pathname}` });
    return;
  }

  const idMatch = match.pattern.exec(url.pathname);
  const query: Record<string, string> = idMatch?.[1] ? { id: idMatch[1] } : {};

  let body: unknown;
  try {
    body = rawReq.method === 'GET' || rawReq.method === 'OPTIONS' ? undefined : await readJsonBody(rawReq);
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const req = Object.assign(rawReq, { query, body }) as unknown as VercelRequest;
  await match.handler(req, res);
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => {
  console.log(`API dev server listening on http://localhost:${port} (no Vercel CLI/login needed)`);
});
