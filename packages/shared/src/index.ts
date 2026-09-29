export type Location = 'space' | 'theater' | 'stadium' | 'mall';

export interface LocationOption {
  id: Location;
  label: string;
}

export const LOCATIONS: LocationOption[] = [
  { id: 'space', label: 'Space Station' },
  { id: 'theater', label: 'Theater' },
  { id: 'stadium', label: 'Stadium' },
  { id: 'mall', label: 'Shopping Mall' },
];

export interface PresetTargetDefinition {
  key: string;
  name: string;
  /** Text-to-image prompt describing the character's appearance, used to render its sprite. */
  appearancePrompt: string;
}

export const PRESET_TARGETS: PresetTargetDefinition[] = [
  {
    key: 'astro-kid',
    name: 'Astro Kid',
    appearancePrompt: 'a cheerful kid astronaut with a red-striped white spacesuit, round helmet under one arm, freckles, and a big grin',
  },
  {
    key: 'detective-mia',
    name: 'Detective Mia',
    appearancePrompt: 'a sharp detective with a tan trench coat, purple beret, oversized magnifying glass, and curly red hair',
  },
  {
    key: 'robo-rex',
    name: 'Robo Rex',
    appearancePrompt: 'a friendly boxy green robot with an antenna, round glowing blue eyes, and a wrench in one hand',
  },
  {
    key: 'captain-nell',
    name: 'Captain Nell',
    appearancePrompt: 'a confident ship captain with a navy blue coat, gold buttons, an eyepatch, and a small parrot on one shoulder',
  },
  {
    key: 'chef-tomo',
    name: 'Chef Tomo',
    appearancePrompt: 'a cheerful chef with a tall white hat, a red-and-white checkered apron, a bushy mustache, and a wooden spoon',
  },
];

export interface PresetTargetOption extends PresetTargetDefinition {
  targetId: string;
  spriteUrl: string;
}

export interface Scene {
  id: string;
  location: Location;
  imageUrl: string;
  width: number;
  height: number;
}

export interface Target {
  id: string;
  source: 'preset' | 'upload';
  spriteUrl: string;
}

export interface GameSummary {
  id: string;
  compositeImageUrl: string;
  targetThumbnailUrl: string;
  width: number;
  height: number;
}

export interface GenerateSceneRequest {
  location: Location;
}

export type GenerateSceneResponse = Scene;

export interface CartoonizeTargetRequest {
  presetTargetId?: string;
  photoBase64?: string;
}

export type CartoonizeTargetResponse = Target;

export type ListPresetTargetsResponse = PresetTargetOption[];

export interface CreateGameRequest {
  sceneId: string;
  targetId: string;
}

export type CreateGameResponse = GameSummary;

export interface GuessRequest {
  x: number;
  y: number;
}

export interface GuessResponse {
  hit: boolean;
  elapsedMs?: number;
}

export interface RevealResponse {
  x: number;
  y: number;
}

export interface ApiErrorResponse {
  error: string;
}
