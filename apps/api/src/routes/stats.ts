import { Router } from 'express';
import { getPlayerStats } from '../config/supabase.js';

export const statsRouter = Router();

// GET /api/stats/:deviceId
statsRouter.get('/:deviceId', async (req, res) => {
  try {
    const stats = await getPlayerStats(req.params.deviceId);
    res.json(
      stats ?? {
        display_name: 'Player',
        games_played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      },
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});
