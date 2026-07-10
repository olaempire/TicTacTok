-- Tic-Tac-Tok: players + stats + leaderboard
-- Run this in the Supabase SQL editor for your project.

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  device_id text unique not null,
  display_name text not null default 'Player',
  games_played int not null default 0,
  wins int not null default 0,
  losses int not null default 0,
  draws int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists players_device_id_idx on players (device_id);

-- Keep updated_at fresh on every change
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists players_set_updated_at on players;
create trigger players_set_updated_at
before update on players
for each row execute function set_updated_at();

-- Leaderboard: top players by wins, tie-broken by win rate
create or replace view leaderboard as
select
  display_name,
  wins,
  losses,
  draws,
  games_played,
  case when games_played > 0
    then round((wins::numeric / games_played) * 100, 1)
    else 0
  end as win_rate
from players
where games_played > 0
order by wins desc, win_rate desc
limit 100;

-- Row Level Security: allow anyone to read leaderboard + their own row,
-- writes only happen via the backend using the service role key.
alter table players enable row level security;

create policy "Public read for leaderboard"
  on players for select
  using (true);

-- No insert/update/delete policies for anon/authenticated:
-- the API server uses the Supabase service role key, which bypasses RLS.
