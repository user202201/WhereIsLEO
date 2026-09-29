import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { CreateGameRequest, CreateGameResponse } from '@whereisleo/shared';
import { withErrorHandling, fetchImageBuffer } from '../../lib/http';
import { getScene, getTarget, insertGame } from '../../lib/db';
import { compositeTargetIntoScene } from '../../lib/compositing';
import { COMPOSITES_BUCKET, uploadImage } from '../../lib/supabase';

export default withErrorHandling('POST', async (req: VercelRequest, res: VercelResponse) => {
  const { sceneId, targetId } = req.body as CreateGameRequest;

  if (!sceneId || !targetId) {
    res.status(400).json({ error: 'sceneId and targetId are required' });
    return;
  }

  const [scene, target] = await Promise.all([getScene(sceneId), getTarget(targetId)]);
  if (!scene) {
    res.status(404).json({ error: 'Unknown sceneId' });
    return;
  }
  if (!target) {
    res.status(404).json({ error: 'Unknown targetId' });
    return;
  }

  const [sceneBuffer, spriteBuffer] = await Promise.all([
    fetchImageBuffer(scene.image_url),
    fetchImageBuffer(target.sprite_url),
  ]);

  const { buffer, targetX, targetY, toleranceRadius } = await compositeTargetIntoScene(sceneBuffer, spriteBuffer);
  const compositeImageUrl = await uploadImage(COMPOSITES_BUCKET, buffer, 'image/jpeg', 'jpg');

  const game = await insertGame({
    sceneId: scene.id,
    targetId: target.id,
    trueX: targetX,
    trueY: targetY,
    toleranceRadius,
    compositeImageUrl,
    width: scene.width,
    height: scene.height,
  });

  const response: CreateGameResponse = {
    id: game.id,
    compositeImageUrl: game.composite_image_url,
    targetThumbnailUrl: target.sprite_url,
    width: game.width,
    height: game.height,
  };
  res.status(200).json(response);
});
