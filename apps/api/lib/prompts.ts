import type { Location } from '@whereisleo/shared';

const STYLE = [
  'vibrant bande dessinée (Franco-Belgian) comic book illustration style',
  'bold clean outlines, flat vivid colors, dynamic isometric high-angle view',
  'in the tradition of classic hidden-object puzzle books like "Where\'s Waldo"',
  'extremely crowded and busy, packed with as many distinct small characters and sight gags as possible',
  'each character wearing different clothing and doing a different tiny activity',
  'complex overlapping patterns and layered depth, chaotic but carefully organized composition',
  'no text, no logos, no watermark, no speech bubbles',
  'ultra-detailed, maximum hidden-object difficulty, 4k illustration quality',
].join(', ');

const LOCATION_PROMPTS: Record<Location, string> = {
  space: 'A sprawling isometric cutaway of a bustling space station, astronauts, aliens, robots, cargo drones, market stalls between airlocks, control rooms and observation domes crowded with tiny figures',
  theater: 'A grand isometric cutaway of a packed theater during a play, orchestra pit, backstage crew, costumed actors, a full crowd in the balconies and stalls, lobby and concession area all bustling with tiny figures',
  stadium: 'A sprawling isometric cutaway of a packed sports stadium on match day, stands full of fans in team colors, vendors, mascots, the pitch/field, concourses and parking lots all bustling with tiny figures',
  mall: 'A sprawling isometric cutaway of a multi-level shopping mall on a busy weekend, shoppers, storefronts, a food court, an escalator crowd, a play area and a parking garage all bustling with tiny figures',
};

export function sceneGenerationPrompt(location: Location): string {
  return `${LOCATION_PROMPTS[location]}. ${STYLE}`;
}

export const CARTOONIZE_PROMPT =
  'Redraw the person in this photo as a small full-body character in a vibrant bande dessinée (Franco-Belgian) comic book illustration style: bold clean outlines, flat vivid colors, simplified but recognizable likeness, standing pose, facing forward, on a plain flat white background with no shadow. This will be used as a sprite composited into a busy isometric scene, so keep the linework and color palette clean and consistent, no text, no watermark.';

export function presetSpritePrompt(appearancePrompt: string): string {
  return `A small full-body character illustration of ${appearancePrompt}, standing pose, facing forward, in a vibrant bande dessinée (Franco-Belgian) comic book illustration style: bold clean outlines, flat vivid colors. On a plain flat white background with no shadow. This will be used as a sprite composited into a busy isometric scene, so keep the linework and color palette clean and consistent, no text, no watermark.`;
}
