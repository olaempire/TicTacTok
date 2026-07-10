import type { Board, Mark, MoveResult } from '../types.js';

export const WIN_PATTERNS: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],            // diagonals
];

export function emptyBoard(): Board {
  return ['', '', '', '', '', '', '', '', ''];
}

export function checkWinner(board: Board): { winner: Mark | null; line: number[] | null } {
  for (const line of WIN_PATTERNS) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Mark, line };
    }
  }
  return { winner: null, line: null };
}

export function applyMove(board: Board, index: number, mark: Mark): MoveResult {
  const next = [...board];
  next[index] = mark;

  const { winner, line } = checkWinner(next);
  const isFull = next.every((c) => c !== '');

  return {
    board: next,
    currentTurn: mark === 'X' ? 'O' : 'X',
    winner: winner ?? (isFull ? 'draw' : null),
    winningLine: line,
  };
}
