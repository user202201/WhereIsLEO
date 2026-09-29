import sharp from 'sharp';

const EDGE_MARGIN_RATIO = 0.06;
const CENTER_EXCLUSION_RATIO = 0.16;
const SPRITE_WIDTH_RATIO_MIN = 0.02;
const SPRITE_WIDTH_RATIO_MAX = 0.035;
const DEFAULT_TOLERANCE_RATIO = 0.035;

/** Turns a near-white background into transparency, with a soft feathered edge. */
async function removeWhiteBackground(buffer: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const WHITE_THRESHOLD = 245;
  const FEATHER_START = 225;

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const min = Math.min(r, g, b);
    if (min >= WHITE_THRESHOLD) {
      data[i + 3] = 0;
    } else if (min >= FEATHER_START) {
      const t = (min - FEATHER_START) / (WHITE_THRESHOLD - FEATHER_START);
      data[i + 3] = Math.round(data[i + 3] * (1 - t));
    }
  }

  return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels as 4 } })
    .png()
    .toBuffer();
}

/** Builds a soft blurred black silhouette of the sprite, for a grounding drop shadow. */
async function buildShadow(spriteRgba: Buffer, width: number, height: number): Promise<Buffer> {
  return sharp(spriteRgba, { raw: { width, height, channels: 4 } })
    .extractChannel('alpha')
    .toColourspace('b-w')
    .blur(4)
    .png()
    .toBuffer()
    .then((mask) =>
      sharp({
        create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
      })
        .composite([{ input: mask, blend: 'dest-in' }])
        .png()
        .toBuffer()
    );
}

function pickHiddenPosition(sceneWidth: number, sceneHeight: number, spriteWidth: number, spriteHeight: number) {
  const marginX = Math.round(sceneWidth * EDGE_MARGIN_RATIO);
  const marginY = Math.round(sceneHeight * EDGE_MARGIN_RATIO);
  const centerBoxW = sceneWidth * CENTER_EXCLUSION_RATIO;
  const centerBoxH = sceneHeight * CENTER_EXCLUSION_RATIO;
  const centerX = sceneWidth / 2;
  const centerY = sceneHeight / 2;

  let x: number;
  let y: number;
  do {
    x = marginX + Math.random() * (sceneWidth - 2 * marginX - spriteWidth);
    y = marginY + Math.random() * (sceneHeight - 2 * marginY - spriteHeight);
  } while (Math.abs(x + spriteWidth / 2 - centerX) < centerBoxW / 2 && Math.abs(y + spriteHeight / 2 - centerY) < centerBoxH / 2);

  return { x: Math.round(x), y: Math.round(y) };
}

export interface CompositeResult {
  buffer: Buffer;
  targetX: number;
  targetY: number;
  toleranceRadius: number;
}

export async function compositeTargetIntoScene(sceneBuffer: Buffer, rawSpriteBuffer: Buffer): Promise<CompositeResult> {
  const sceneMeta = await sharp(sceneBuffer).metadata();
  const sceneWidth = sceneMeta.width!;
  const sceneHeight = sceneMeta.height!;

  const spriteTargetWidth = Math.round(sceneWidth * (SPRITE_WIDTH_RATIO_MIN + Math.random() * (SPRITE_WIDTH_RATIO_MAX - SPRITE_WIDTH_RATIO_MIN)));

  const cutoutPng = await removeWhiteBackground(rawSpriteBuffer);
  const resizedSprite = await sharp(cutoutPng).resize({ width: spriteTargetWidth }).png().toBuffer();
  const spriteMeta = await sharp(resizedSprite).metadata();
  const spriteWidth = spriteMeta.width!;
  const spriteHeight = spriteMeta.height!;

  const spriteRaw = await sharp(resizedSprite).ensureAlpha().raw().toBuffer();
  const shadow = await buildShadow(spriteRaw, spriteWidth, spriteHeight);

  const { x, y } = pickHiddenPosition(sceneWidth, sceneHeight, spriteWidth, spriteHeight);
  const shadowOffset = Math.max(2, Math.round(spriteHeight * 0.04));

  const composited = await sharp(sceneBuffer)
    .composite([
      { input: shadow, left: x + shadowOffset, top: y + shadowOffset, blend: 'over' },
      { input: resizedSprite, left: x, top: y, blend: 'over' },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  const toleranceRadius = Math.round(Math.max(spriteWidth, spriteHeight) * 0.9 + sceneWidth * DEFAULT_TOLERANCE_RATIO * 0.15);

  return {
    buffer: composited,
    targetX: Math.round(x + spriteWidth / 2),
    targetY: Math.round(y + spriteHeight / 2),
    toleranceRadius,
  };
}
