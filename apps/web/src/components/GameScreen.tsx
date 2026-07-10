import Board from './Board';
import type { Board as BoardType, Mark } from '../types';

interface Props {
  board: BoardType;
  winningLine: number[] | null;
  currentTurn: Mark;
  boardDisabled: boolean;
  player1Label: string;
  player2Label: string;
  score1: number;
  score2: number;
  showTurnFor: 1 | 2 | 'both';
  onCellClick: (index: number) => void;
  onRestart: () => void;
  onHome: () => void;
}

export default function GameScreen({
  board,
  winningLine,
  currentTurn,
  boardDisabled,
  player1Label,
  player2Label,
  score1,
  score2,
  showTurnFor,
  onCellClick,
  onRestart,
  onHome,
}: Props) {
  const player1Turn = currentTurn === 'X';
  const player2Turn = currentTurn === 'O';

  return (
    <div className="game-screen">
      <button type="button" className="restart-btn" onClick={onRestart}>
        Restart
      </button>

      <div className="game-container">
        <div className="player-section">
          <div className="player-title">{player1Label}</div>
          <div className="score-display">{score1}</div>
          <div className={`${player1Turn && showTurnFor !== 2 ? '' : 'hidden'} turn-indicator`}>
            Your Turn
          </div>
        </div>

        <Board board={board} winningLine={winningLine} disabled={boardDisabled} onCellClick={onCellClick} />

        <div className="player-section">
          <div className="player-title">{player2Label}</div>
          <div className="score-display">{score2}</div>
          <div className={`${player2Turn && showTurnFor !== 1 ? '' : 'hidden'} turn-indicator`}>
            Your Turn
          </div>
        </div>
      </div>

      <button type="button" className="home-btn" onClick={onHome}>
        Go Home
      </button>
    </div>
  );
}
