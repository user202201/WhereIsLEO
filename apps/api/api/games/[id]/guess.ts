import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { GuessRequest, GuessResponse } from '@whereisleo/shared';
import { withErrorHandling } from '../../../lib/http';
import { getGame, markGameCompleted } from '../../../lib/db';

export default withErrorHandling('POST', async (req: VercelRequest, res: VercelResponse) => {
  const gameId = req.query.id as string;
  const { x, y } = req.body as GuessRequest;

  if (typeof x !== 'number' || typeof y !== 'number') {
    res.status(400).json({ error: 'x and y must be numbers' });
    return;
  }

  const game = await getGame(gameId);
  if (!game) {
    res.status(404).json({ error: 'Unknown game id' });
    return;
  }

  const distance = Math.hypot(x - game.true_x, y - game.true_y);
  const hit = distance <= game.tolerance_radius;

  const response: GuessResponse = { hit };

  if (hit && !game.completed_at) {
    await markGameCompleted(game.id);
    response.elapsedMs = Date.now() - new Date(game.started_at).getTime();
  }

  res.status(200).json(response);
});
