import { Router } from 'express';
import { getLeaderboard } from '../config/supabase.js';

export const leaderboardRouter = Router();

// GET /api/leaderboard
leaderboardRouter.get('/', async (_req, res) => {
  try {
    const board = await getLeaderboard();
    res.json(board);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});
