import type { GameMode } from '../types';

interface Props {
  onSelectMode: (mode: Exclude<GameMode, null>) => void;
  onOpenTutorial: () => void;
  onOpenStats: () => void;
  onOpenLeaderboard: () => void;
  musicOn: boolean;
  onToggleMusic: () => void;
}

export default function MainMenu({
  onSelectMode,
  onOpenTutorial,
  onOpenStats,
  onOpenLeaderboard,
  musicOn,
  onToggleMusic,
}: Props) {
  return (
    <div className="main-menu">
      <div className="left-panel">
        <div className="logo">
          <div className="logo-text">X/O</div>
        </div>
      </div>

      <div className="right-panel">
        <button className="menu-btn orange" type="button" onClick={() => onSelectMode('online')}>
          Play Online
        </button>
        <button className="menu-btn blue" type="button" onClick={onOpenTutorial}>
          How To Play
        </button>
        <button className="menu-btn purple" type="button" onClick={() => onSelectMode('ai')}>
          Play Vs AI
        </button>
        <button className="menu-btn gray" type="button" onClick={onOpenStats}>
          My Stats
        </button>
        <button className="menu-btn yellow" type="button" onClick={() => onSelectMode('local')}>
          Play Local
        </button>
        <button className="menu-btn green" type="button" onClick={onOpenLeaderboard}>
          Leaderboards
        </button>
      </div>

      <button className={`music-toggle ${musicOn ? 'active' : ''}`} type="button" onClick={onToggleMusic}>
        <div className="music-icon">♪</div>
      </button>
    </div>
  );
}
