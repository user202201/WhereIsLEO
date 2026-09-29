import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { GenerateSceneRequest, GenerateSceneResponse, Location } from '@whereisleo/shared';
import { withErrorHandling } from '../../lib/http';
import { getCachedScene, insertScene } from '../../lib/db';
import { generateImage } from '../../lib/openai';
import { sceneGenerationPrompt } from '../../lib/prompts';
import { SCENES_BUCKET, uploadImage } from '../../lib/supabase';

const VALID_LOCATIONS: Location[] = ['space', 'theater', 'stadium', 'mall'];
const SCENE_SIZE = '1536x1024';

export default withErrorHandling('POST', async (req: VercelRequest, res: VercelResponse) => {
  const { location } = req.body as GenerateSceneRequest;

  if (!location || !VALID_LOCATIONS.includes(location)) {
    res.status(400).json({ error: `location must be one of ${VALID_LOCATIONS.join(', ')}` });
    return;
  }

  const cached = await getCachedScene(location);
  if (cached) {
    const response: GenerateSceneResponse = {
      id: cached.id,
      location: cached.location,
      imageUrl: cached.image_url,
      width: cached.width,
      height: cached.height,
    };
    res.status(200).json(response);
    return;
  }

  const imageBuffer = await generateImage(sceneGenerationPrompt(location), SCENE_SIZE);
  const [width, height] = SCENE_SIZE.split('x').map(Number);
  const imageUrl = await uploadImage(SCENES_BUCKET, imageBuffer, 'image/png', 'png');
  const scene = await insertScene(location, imageUrl, width, height);

  const response: GenerateSceneResponse = {
    id: scene.id,
    location: scene.location,
    imageUrl: scene.image_url,
    width: scene.width,
    height: scene.height,
  };
  res.status(200).json(response);
});
