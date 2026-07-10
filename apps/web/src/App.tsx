import { useCallback, useEffect, useRef, useState } from 'react';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import TutorialModal from './components/TutorialModal';
import StatsModal from './components/StatsModal';
import LeaderboardModal from './components/LeaderboardModal';
import OnlineLobby from './components/OnlineLobby';
import Notification from './components/Notification';
import { playClickSound, playWinSound } from './lib/sound';
import { checkWinner, emptyBoard, getBestMove } from './lib/localGame';
import { getSocket } from './lib/socket';
import { getDeviceId, getDisplayName, setDisplayName } from './lib/deviceId';
import type { Board, GameMode, Mark, OnlineUpdatePayload } from './types';

type Screen = 'menu' | 'onlineLobby' | 'game';
type NotifType = 'winner-x' | 'winner-o' | 'tie' | '';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [mode, setMode] = useState<GameMode>(null);

  const [board, setBoard] = useState<Board>(emptyBoard());
  const [currentTurn, setCurrentTurn] = useState<Mark>('X');
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [gameActive, setGameActive] = useState(false);

  const currentTurnRef = useRef(currentTurn);
  const gameActiveRef = useRef(gameActive);
  const movePendingRef = useRef(false);
  const aiTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    currentTurnRef.current = currentTurn;
  }, [currentTurn]);

  useEffect(() => {
    gameActiveRef.current = gameActive;
  }, [gameActive]);

  useEffect(() => {
    return () => {
      clearPendingAiMove();
    };
  }, []);

  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);

  const [musicOn, setMusicOn] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const [notif, setNotif] = useState<{ message: string; type: NotifType; show: boolean }>({
    message: '',
    type: '',
    show: false,
  });

  // Online-specific state
  const [waitingOnline, setWaitingOnline] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [yourMark, setYourMark] = useState<Mark>('X');
  const [opponentName, setOpponentName] = useState('Opponent');
  const [opponentLeftMsg, setOpponentLeftMsg] = useState(false);

  const musicOnRef = useRef(musicOn);
  useEffect(() => {
    musicOnRef.current = musicOn;
  }, [musicOn]);

  const notifTimeout = useRef<number | null>(null);
  const winRecordedRef = useRef(false);
  const aiPendingRef = useRef(false);

  const showNotification = useCallback((message: string, type: NotifType) => {
    if (notifTimeout.current) window.clearTimeout(notifTimeout.current);
    setNotif({ message, type, show: true });
    notifTimeout.current = window.setTimeout(() => {
      setNotif((n) => ({ ...n, show: false }));
    }, 3000);
  }, []);

  function clearPendingAiMove() {
    if (aiTimeoutRef.current !== null) {
      window.clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    aiPendingRef.current = false;
  }

  function resetRoundState() {
    winRecordedRef.current = false;
    movePendingRef.current = false;
    clearPendingAiMove();
  }

  // ---------- Local / AI mode ----------

  function startLocalOrAi(selected: 'local' | 'ai') {
    resetRoundState();
    setMode(selected);
    setBoard(emptyBoard());
    setCurrentTurn('X');
    setWinningLine(null);
    setGameActive(true);
    setScore1(0);
    setScore2(0);
    setScreen('game');
  }

  function handleLocalCellClick(index: number) {
    if (
      !gameActive ||
      board[index] !== '' ||
      movePendingRef.current ||
      (mode === 'ai' && aiPendingRef.current) ||
      currentTurn !== 'X'
    ) {
      return;
    }
    makeLocalMove(index, currentTurn, board);
  }

  function makeLocalMove(index: number, mark: Mark, boardState: Board = board) {
    if (!gameActiveRef.current || movePendingRef.current) return;
    if (boardState[index] !== '') return;

    movePendingRef.current = true;
    playClickSound(musicOnRef.current);

    const next = [...boardState];
    next[index] = mark;
    const { winner, line } = checkWinner(next);
    const isFull = next.every((c) => c !== '');

    if (winner) {
      if (!winRecordedRef.current) {
        winRecordedRef.current = true;
        clearPendingAiMove();
        setWinningLine(line);
        setGameActive(false);
        playWinSound(musicOnRef.current);
        if (winner === 'X') {
          setScore1((s) => s + 1);
          showNotification('Player 1 won this round!', 'winner-x');
        } else {
          setScore2((s) => s + 1);
          showNotification(mode === 'ai' ? 'AI won this round!' : 'Player 2 won this round!', 'winner-o');
        }
      }
    } else if (isFull) {
      if (!winRecordedRef.current) {
        winRecordedRef.current = true;
        clearPendingAiMove();
        setGameActive(false);
        playWinSound(musicOnRef.current);
        showNotification('This round ended in a tie!', 'tie');
      }
    } else {
      const nextTurn: Mark = mark === 'X' ? 'O' : 'X';
      setCurrentTurn(nextTurn);

      if (mode === 'ai' && nextTurn === 'O') {
        clearPendingAiMove();
        aiPendingRef.current = true;
        aiTimeoutRef.current = window.setTimeout(() => {
          aiPendingRef.current = false;
          aiMove(next);
        }, 500);
      }
    }

    setBoard(next);
    movePendingRef.current = false;
  }

  function aiMove(currentBoard: Board) {
    if (!gameActiveRef.current || currentTurnRef.current !== 'O') return;
    const move = getBestMove(currentBoard);
    if (move !== null) makeLocalMove(move, 'O', currentBoard);
  }

  // ---------- Online mode ----------

  useEffect(() => {
    const socket = getSocket();

    socket.on('online:waiting', () => setWaitingOnline(true));

    socket.on('online:matched', (payload: any) => {
      setWaitingOnline(false);
      setRoomId(payload.roomId);
      setYourMark(payload.yourMark);
      setBoard(payload.board);
      setCurrentTurn(payload.currentTurn);
      setScore1(payload.scores.X);
      setScore2(payload.scores.O);
      setWinningLine(null);
      setGameActive(true);
      setOpponentLeftMsg(false);

      const opponent = payload.players.find((p: any) => p.mark !== payload.yourMark);
      setOpponentName(opponent?.displayName || 'Opponent');
      setScreen('game');
    });

    socket.on('online:update', (payload: OnlineUpdatePayload) => {
      setBoard(payload.board);
      setCurrentTurn(payload.currentTurn);
      setWinningLine(payload.winningLine);
      setScore1(payload.scores.X);
      setScore2(payload.scores.O);

      if (payload.winner) {
        setGameActive(false);
        playWinSound(musicOnRef.current);

        if (payload.winner === 'draw') {
          showNotification("It's a tie!", 'tie');
        } else if (payload.winner === yourMark) {
          showNotification('You won this round!', payload.winner === 'X' ? 'winner-x' : 'winner-o');
        } else {
          showNotification(`${opponentName} won this round!`, payload.winner === 'X' ? 'winner-x' : 'winner-o');
        }
      } else {
        setGameActive(true);
        playClickSound(musicOnRef.current);
      }
    });

    socket.on('online:opponentLeft', () => {
      setOpponentLeftMsg(true);
      setGameActive(false);
      showNotification('Your opponent left the match.', 'tie');
    });

    socket.on('online:rematchRequested', () => {
      showNotification(`${opponentName} wants a rematch — click Restart!`, 'tie');
    });

    return () => {
      socket.off('online:waiting');
      socket.off('online:matched');
      socket.off('online:update');
      socket.off('online:opponentLeft');
      socket.off('online:rematchRequested');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yourMark, opponentName]);

  function startOnline() {
    setMode('online');
    setScreen('onlineLobby');
    setWaitingOnline(false);
  }

  function findMatch(name: string) {
    setDisplayName(name);
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socket.emit('online:join', { deviceId: getDeviceId(), displayName: name || getDisplayName() });
    setWaitingOnline(true);
  }

  function cancelOnlineSearch() {
    const socket = getSocket();
    socket.emit('online:leaveQueue');
    setWaitingOnline(false);
    setScreen('menu');
    setMode(null);
  }

  function handleOnlineCellClick(index: number) {
    if (!gameActive || !roomId || board[index] !== '' || currentTurn !== yourMark) return;
    const socket = getSocket();
    socket.emit('online:move', { roomId, index });
  }

  function handleOnlineRestart() {
    if (!roomId) return;
    const socket = getSocket();
    socket.emit('online:rematch', { roomId });
  }

  function leaveOnlineRoom() {
    if (roomId) {
      const socket = getSocket();
      socket.emit('online:leaveRoom', { roomId });
    }
    setRoomId(null);
  }

  // ---------- Navigation ----------

  function handleSelectMode(selected: Exclude<GameMode, null>) {
    if (selected === 'online') {
      startOnline();
    } else {
      startLocalOrAi(selected);
    }
  }

  function handleRestart() {
    if (mode === 'online') {
      handleOnlineRestart();
      return;
    }
    resetRoundState();
    setBoard(emptyBoard());
    setCurrentTurn('X');
    setWinningLine(null);
    setGameActive(true);
    setNotif((n) => ({ ...n, show: false }));
  }

  function handleHome() {
    if (mode === 'online') leaveOnlineRoom();
    setScreen('menu');
    setMode(null);
    setScore1(0);
    setScore2(0);
    setNotif((n) => ({ ...n, show: false }));
  }

  function toggleMusic() {
    setMusicOn((m) => !m);
  }

  // ---------- Render ----------

  const player1Label = mode === 'online' ? (yourMark === 'X' ? 'You' : opponentName) : 'Player 1';
  const player2Label =
    mode === 'ai' ? 'AI' : mode === 'online' ? (yourMark === 'O' ? 'You' : opponentName) : 'Player 2';

  const boardDisabled =
    !gameActive ||
    (mode === 'ai' && currentTurn === 'O') ||
    (mode === 'online' && currentTurn !== yourMark);

  const showTurnFor: 1 | 2 | 'both' = mode === 'local' ? 'both' : mode === 'ai' ? 1 : yourMark === 'X' ? 1 : 2;

  return (
    <>
      {screen === 'menu' && (
        <MainMenu
          onSelectMode={handleSelectMode}
          onOpenTutorial={() => setShowTutorial(true)}
          onOpenStats={() => setShowStats(true)}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          musicOn={musicOn}
          onToggleMusic={toggleMusic}
        />
      )}

      {screen === 'onlineLobby' && (
        <OnlineLobby waiting={waitingOnline} onFindMatch={findMatch} onCancel={cancelOnlineSearch} />
      )}

      {screen === 'game' && (
        <GameScreen
          board={board}
          winningLine={winningLine}
          currentTurn={currentTurn}
          boardDisabled={boardDisabled || opponentLeftMsg}
          player1Label={player1Label}
          player2Label={player2Label}
          score1={score1}
          score2={score2}
          showTurnFor={showTurnFor}
          onCellClick={mode === 'online' ? handleOnlineCellClick : handleLocalCellClick}
          onRestart={handleRestart}
          onHome={handleHome}
          musicOn={musicOn}
          onToggleMusic={toggleMusic}
        />
      )}

      <Notification message={notif.message} type={notif.type} show={notif.show} />

      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
      {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}
    </>
  );
}
