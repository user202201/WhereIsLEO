import type {
  CartoonizeTargetRequest,
  CartoonizeTargetResponse,
  CreateGameRequest,
  CreateGameResponse,
  GenerateSceneRequest,
  GenerateSceneResponse,
  GuessRequest,
  GuessResponse,
  ListPresetTargetsResponse,
  RevealResponse,
} from '@whereisleo/shared';
import { API_BASE_URL } from '../config';

async function request<TRes>(path: string, init?: RequestInit): Promise<TRes> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request to ${path} failed with status ${res.status}`);
  }
  return res.json() as Promise<TRes>;
}

export function listPresetTargets(): Promise<ListPresetTargetsResponse> {
  return request('/api/targets/presets');
}

export function cartoonizeTarget(body: CartoonizeTargetRequest): Promise<CartoonizeTargetResponse> {
  return request('/api/targets/cartoonize', { method: 'POST', body: JSON.stringify(body) });
}

export function generateScene(body: GenerateSceneRequest): Promise<GenerateSceneResponse> {
  return request('/api/scenes/generate', { method: 'POST', body: JSON.stringify(body) });
}

export function createGame(body: CreateGameRequest): Promise<CreateGameResponse> {
  return request('/api/games/create', { method: 'POST', body: JSON.stringify(body) });
}

export function guessGame(gameId: string, body: GuessRequest): Promise<GuessResponse> {
  return request(`/api/games/${gameId}/guess`, { method: 'POST', body: JSON.stringify(body) });
}

export function revealGame(gameId: string): Promise<RevealResponse> {
  return request(`/api/games/${gameId}/reveal`);
}
