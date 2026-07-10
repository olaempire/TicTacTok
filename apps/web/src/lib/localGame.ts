import type { Board, Mark } from '../types';

export const WIN_PATTERNS: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
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

function checkWinnerForPlayer(board: Board, player: Mark): boolean {
  return WIN_PATTERNS.some(([a, b, c]) => board[a] === player && board[b] === player && board[c] === player);
}

/** Simple heuristic AI: win if possible, block if needed, else center/corner/random. */
export function getBestMove(board: Board): number | null {
  const test = [...board];

  for (let i = 0; i < 9; i++) {
    if (test[i] === '') {
      test[i] = 'O';
      if (checkWinnerForPlayer(test, 'O')) return i;
      test[i] = '';
    }
  }

  for (let i = 0; i < 9; i++) {
    if (test[i] === '') {
      test[i] = 'X';
      if (checkWinnerForPlayer(test, 'X')) return i;
      test[i] = '';
    }
  }

  if (test[4] === '') return 4;

  const corners = [0, 2, 6, 8].filter((i) => test[i] === '');
  if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];

  const available = test.map((v, i) => (v === '' ? i : null)).filter((v): v is number => v !== null);
  return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
}
