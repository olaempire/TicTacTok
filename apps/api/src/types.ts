export type Mark = 'X' | 'O';
export type Cell = Mark | '';
export type Board = Cell[]; // length 9

export interface Player {
  socketId: string;
  deviceId: string;
  displayName: string;
  mark: Mark;
}

export interface Room {
  id: string;
  board: Board;
  currentTurn: Mark;
  players: Player[]; // max 2
  active: boolean;
  scores: Record<Mark, number>;
  rematchVotes: Set<string>; // socketIds who voted to play again
}

export interface MoveResult {
  board: Board;
  currentTurn: Mark;
  winner: Mark | 'draw' | null;
  winningLine: number[] | null;
}
