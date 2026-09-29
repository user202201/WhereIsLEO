import type { Location } from '@whereisleo/shared';
import { table } from './supabase';

const SCENE_POOL_SIZE = 6;

interface SceneRow {
  id: string;
  location: Location;
  image_url: string;
  width: number;
  height: number;
  times_used: number;
}

export async function getCachedScene(location: Location): Promise<SceneRow | null> {
  const { count } = await table('scenes')
    .select('id', { count: 'exact', head: true })
    .eq('location', location);

  if (!count || count < SCENE_POOL_SIZE) {
    return null;
  }

  const { data, error } = await table('scenes')
    .select('*')
    .eq('location', location)
    .order('times_used', { ascending: true })
    .limit(SCENE_POOL_SIZE);

  if (error || !data || data.length === 0) {
    return null;
  }

  const row = data[Math.floor(Math.random() * data.length)] as SceneRow;

  await table('scenes')
    .update({ times_used: row.times_used + 1, last_used_at: new Date().toISOString() })
    .eq('id', row.id);

  return row;
}

export async function insertScene(location: Location, imageUrl: string, width: number, height: number): Promise<SceneRow> {
  const { data, error } = await table('scenes')
    .insert({ location, image_url: imageUrl, width, height, times_used: 1, last_used_at: new Date().toISOString() })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert scene: ${error?.message}`);
  }
  return data as SceneRow;
}

export async function getScene(id: string): Promise<SceneRow | null> {
  const { data } = await table('scenes').select('*').eq('id', id).single();
  return (data as SceneRow) ?? null;
}

interface TargetRow {
  id: string;
  source: 'preset' | 'upload';
  sprite_url: string;
  preset_key: string | null;
}

export async function insertTarget(source: 'preset' | 'upload', spriteUrl: string, presetKey?: string): Promise<TargetRow> {
  const { data, error } = await table('targets')
    .insert({ source, sprite_url: spriteUrl, preset_key: presetKey ?? null })
    .select()
    .single();
  if (error || !data) {
    throw new Error(`Failed to insert target: ${error?.message}`);
  }
  return data as TargetRow;
}

export async function getTarget(id: string): Promise<TargetRow | null> {
  const { data } = await table('targets').select('*').eq('id', id).single();
  return (data as TargetRow) ?? null;
}

export async function getTargetByPresetKey(presetKey: string): Promise<TargetRow | null> {
  const { data } = await table('targets').select('*').eq('preset_key', presetKey).limit(1).maybeSingle();
  return (data as TargetRow) ?? null;
}

interface GameRow {
  id: string;
  scene_id: string;
  target_id: string;
  true_x: number;
  true_y: number;
  tolerance_radius: number;
  composite_image_url: string;
  width: number;
  height: number;
  started_at: string;
  completed_at: string | null;
}

export async function insertGame(params: {
  sceneId: string;
  targetId: string;
  trueX: number;
  trueY: number;
  toleranceRadius: number;
  compositeImageUrl: string;
  width: number;
  height: number;
}): Promise<GameRow> {
  const { data, error } = await table('games')
    .insert({
      scene_id: params.sceneId,
      target_id: params.targetId,
      true_x: params.trueX,
      true_y: params.trueY,
      tolerance_radius: params.toleranceRadius,
      composite_image_url: params.compositeImageUrl,
      width: params.width,
      height: params.height,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert game: ${error?.message}`);
  }
  return data as GameRow;
}

export async function getGame(id: string): Promise<GameRow | null> {
  const { data } = await table('games').select('*').eq('id', id).single();
  return (data as GameRow) ?? null;
}

export async function markGameCompleted(id: string): Promise<void> {
  await table('games').update({ completed_at: new Date().toISOString() }).eq('id', id);
}
