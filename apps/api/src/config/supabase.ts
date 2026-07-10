import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing — stats/leaderboard will fail until set in apps/api/.env',
  );
}

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseServiceKey ?? '',
  {
    realtime: {
      transport: ws,
    },
  },
);

type Outcome = 'win' | 'loss' | 'draw';

/** Upserts a player row and increments the relevant counters. */
export async function recordGameResult(deviceId: string, displayName: string, outcome: Outcome) {
  const { data: existing, error: fetchError } = await supabase
    .from('players')
    .select('*')
    .eq('device_id', deviceId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const base = existing ?? {
    device_id: deviceId,
    display_name: displayName,
    games_played: 0,
    wins: 0,
    losses: 0,
    draws: 0,
  };

  const updated = {
    device_id: deviceId,
    display_name: displayName || base.display_name,
    games_played: base.games_played + 1,
    wins: base.wins + (outcome === 'win' ? 1 : 0),
    losses: base.losses + (outcome === 'loss' ? 1 : 0),
    draws: base.draws + (outcome === 'draw' ? 1 : 0),
  };

  const { error: upsertError } = await supabase
    .from('players')
    .upsert(updated, { onConflict: 'device_id' });

  if (upsertError) throw upsertError;
}

export async function getPlayerStats(deviceId: string) {
  const { data, error } = await supabase
    .from('players')
    .select('display_name, games_played, wins, losses, draws')
    .eq('device_id', deviceId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getLeaderboard() {
  const { data, error } = await supabase.from('leaderboard').select('*');
  if (error) throw error;
  return data;
}
