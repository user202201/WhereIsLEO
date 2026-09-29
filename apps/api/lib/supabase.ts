import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { env } from './env';
import { isLocalStorageMode, localTable } from './localStore';

export const SCENES_BUCKET = 'scenes';
export const SPRITES_BUCKET = 'sprites';
export const COMPOSITES_BUCKET = 'composites';

// No generated Database types (no codegen step in this project), so the client
// is untyped here; lib/db.ts casts each table's rows to its own Row interfaces.
let client: ReturnType<typeof createClient> | undefined;

export function supabase() {
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });
  }
  return client;
}

/**
 * supabase().from(name) without the generated Database generic, so callers can pass plain
 * objects. Without SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY set, transparently swaps in an
 * in-memory store implementing the same small chain of calls (see lib/localStore.ts).
 */
export function table(name: string) {
  if (isLocalStorageMode()) {
    return localTable(name) as any;
  }
  return supabase().from(name) as any;
}

export async function uploadImage(
  bucket: string,
  bytes: Buffer,
  contentType: string,
  extension: string
): Promise<string> {
  if (isLocalStorageMode()) {
    return `data:${contentType};base64,${bytes.toString('base64')}`;
  }

  const path = `${randomUUID()}.${extension}`;
  const { error } = await supabase().storage.from(bucket).upload(path, bytes, {
    contentType,
    upsert: false,
  });
  if (error) {
    throw new Error(`Failed to upload image to ${bucket}: ${error.message}`);
  }
  const { data } = supabase().storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
