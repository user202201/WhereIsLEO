import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PRESET_TARGETS, type ListPresetTargetsResponse } from '@whereisleo/shared';
import { withErrorHandling } from '../../lib/http';
import { getTargetByPresetKey, insertTarget } from '../../lib/db';
import { generateImage } from '../../lib/openai';
import { presetSpritePrompt } from '../../lib/prompts';
import { SPRITES_BUCKET, uploadImage } from '../../lib/supabase';

export default withErrorHandling('GET', async (_req: VercelRequest, res: VercelResponse) => {
  const options: ListPresetTargetsResponse = await Promise.all(
    PRESET_TARGETS.map(async (preset) => {
      const cached = await getTargetByPresetKey(preset.key);
      if (cached) {
        return { ...preset, targetId: cached.id, spriteUrl: cached.sprite_url };
      }

      const imageBuffer = await generateImage(presetSpritePrompt(preset.appearancePrompt), '1024x1024');
      const spriteUrl = await uploadImage(SPRITES_BUCKET, imageBuffer, 'image/png', 'png');
      const target = await insertTarget('preset', spriteUrl, preset.key);

      return { ...preset, targetId: target.id, spriteUrl: target.sprite_url };
    })
  );

  res.status(200).json(options);
});
