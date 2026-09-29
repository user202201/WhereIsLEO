create table if not exists scenes (
  id uuid primary key default gen_random_uuid(),
  location text not null check (location in ('space', 'theater', 'stadium', 'mall')),
  image_url text not null,
  width integer not null,
  height integer not null,
  times_used integer not null default 0,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists scenes_location_idx on scenes (location);

create table if not exists targets (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('preset', 'upload')),
  sprite_url text not null,
  preset_key text unique,
  created_at timestamptz not null default now()
);

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid not null references scenes (id),
  target_id uuid not null references targets (id),
  true_x integer not null,
  true_y integer not null,
  tolerance_radius integer not null,
  composite_image_url text not null,
  width integer not null,
  height integer not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Run once in the Supabase dashboard (Storage) or via the API, all public-read:
--   create bucket "scenes"     (public)
--   create bucket "sprites"    (public)
--   create bucket "composites" (public)
