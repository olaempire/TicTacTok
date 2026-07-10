import type { Board as BoardType } from '../types';

interface Props {
  board: BoardType;
  winningLine: number[] | null;
  disabled: boolean;
  onCellClick: (index: number) => void;
}

export default function Board({ board, winningLine, disabled, onCellClick }: Props) {
  return (
    <div className="board-container">
      <div className="board">
        {board.map((value, index) => {
          const isWinner = winningLine?.includes(index);
          return (
            <button
              key={index}
              type="button"
              className={`cell ${value ? 'taken' : ''} ${value === 'X' ? 'x' : value === 'O' ? 'o' : ''} ${
                isWinner ? 'winner' : ''
              }`}
              disabled={disabled || Boolean(value)}
              onClick={() => {
                if (!disabled && !value) onCellClick(index);
              }}
            >
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );
}
