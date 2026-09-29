import sharp from 'sharp';

// Lets the app run fully free/offline: with no OPENAI_API_KEY set, image generation
// is replaced with cheap procedural placeholders instead of calling OpenAI.
export function isMockImageMode(): boolean {
  return !process.env.OPENAI_API_KEY;
}

const LOCATION_COLORS: Record<string, string> = {
  space: '#161a40',
  theater: '#3a1030',
  stadium: '#0f3a22',
  mall: '#3a2a10',
};

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function mockSceneImage(promptOrLocation: string, width: number, height: number): Promise<Buffer> {
  const location = Object.keys(LOCATION_COLORS).find((key) => promptOrLocation.toLowerCase().includes(key));
  const background = LOCATION_COLORS[location ?? ''] ?? '#222222';

  const dots = Array.from({ length: 260 }, () => {
    const cx = Math.round(Math.random() * width);
    const cy = Math.round(Math.random() * height);
    const r = 5 + Math.random() * 9;
    const hue = Math.floor(Math.random() * 360);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="hsl(${hue},70%,65%)" />`;
  }).join('');

  const label = escapeXml(`MOCK SCENE — ${(location ?? 'unknown').toUpperCase()} (no OPENAI_API_KEY set)`);
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${background}" />
    ${dots}
    <text x="50%" y="34" text-anchor="middle" font-size="22" fill="white" font-family="sans-serif">${label}</text>
  </svg>`;

  console.warn('[mock] generated placeholder scene instead of calling OpenAI:', location ?? promptOrLocation);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

const SPRITE_COLORS = ['#ff5a5f', '#2ecc71', '#3498db', '#f1c40f', '#9b59b6'];

export async function mockSpriteImage(): Promise<Buffer> {
  const color = SPRITE_COLORS[Math.floor(Math.random() * SPRITE_COLORS.length)];
  const svg = `<svg width="200" height="260" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="white" />
    <circle cx="100" cy="75" r="55" fill="${color}" />
    <rect x="55" y="135" width="90" height="100" rx="20" fill="${color}" />
  </svg>`;

  console.warn('[mock] generated placeholder sprite instead of calling OpenAI');
  return sharp(Buffer.from(svg)).png().toBuffer();
}
