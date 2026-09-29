import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { CartoonizeTargetRequest, CartoonizeTargetResponse } from '@whereisleo/shared';
import { withErrorHandling } from '../../lib/http';
import { getTarget, insertTarget } from '../../lib/db';
import { editImage } from '../../lib/openai';
import { CARTOONIZE_PROMPT } from '../../lib/prompts';
import { SPRITES_BUCKET, uploadImage } from '../../lib/supabase';

export default withErrorHandling('POST', async (req: VercelRequest, res: VercelResponse) => {
  const { presetTargetId, photoBase64 } = req.body as CartoonizeTargetRequest;

  if (presetTargetId) {
    const target = await getTarget(presetTargetId);
    if (!target) {
      res.status(404).json({ error: 'Unknown presetTargetId' });
      return;
    }
    const response: CartoonizeTargetResponse = { id: target.id, source: target.source, spriteUrl: target.sprite_url };
    res.status(200).json(response);
    return;
  }

  if (!photoBase64) {
    res.status(400).json({ error: 'Either presetTargetId or photoBase64 is required' });
    return;
  }

  const photoBuffer = Buffer.from(photoBase64, 'base64');
  const spriteBuffer = await editImage(CARTOONIZE_PROMPT, photoBuffer, 'photo.png');
  const spriteUrl = await uploadImage(SPRITES_BUCKET, spriteBuffer, 'image/png', 'png');
  const target = await insertTarget('upload', spriteUrl);

  const response: CartoonizeTargetResponse = { id: target.id, source: target.source, spriteUrl: target.sprite_url };
  res.status(200).json(response);
});
