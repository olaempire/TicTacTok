import type { LeaderboardEntry, Stats } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function fetchStats(deviceId: string): Promise<Stats> {
  const res = await fetch(`${API_URL}/api/stats/${deviceId}`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await fetch(`${API_URL}/api/leaderboard`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}
