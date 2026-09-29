import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { RevealResponse } from '@whereisleo/shared';
import { withErrorHandling } from '../../../lib/http';
import { getGame } from '../../../lib/db';

export default withErrorHandling('GET', async (req: VercelRequest, res: VercelResponse) => {
  const gameId = req.query.id as string;

  const game = await getGame(gameId);
  if (!game) {
    res.status(404).json({ error: 'Unknown game id' });
    return;
  }

  const response: RevealResponse = { x: game.true_x, y: game.true_y };
  res.status(200).json(response);
});
