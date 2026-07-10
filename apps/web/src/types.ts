export type Mark = 'X' | 'O';
export type Cell = Mark | '';
export type Board = Cell[];

export type GameMode = 'local' | 'ai' | 'online' | null;

export interface Stats {
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
  display_name?: string;
}

export interface LeaderboardEntry {
  display_name: string;
  wins: number;
  losses: number;
  draws: number;
  games_played: number;
  win_rate: number;
}

export interface OnlineUpdatePayload {
  board: Board;
  currentTurn: Mark;
  winner: Mark | 'draw' | null;
  winningLine: number[] | null;
  scores: Record<Mark, number>;
}
