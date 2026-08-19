import type { Server, Socket } from 'socket.io';
import { nanoid } from 'nanoid';
import { applyMove, emptyBoard } from '../game/logic.js';
import type { Mark, Player, Room } from '../types.js';
import { recordGameResult } from '../config/supabase.js';

const rooms = new Map<string, Room>();
const waitingQueue: { socketId: string; deviceId: string; displayName: string }[] = [];

function normalizeDisplayName(displayName: string): string {
  const normalized = displayName.trim().replace(/\s+/g, ' ');
  return normalized.slice(0, 20) || 'Player';
}

function otherMark(mark: Mark): Mark {
  return mark === 'X' ? 'O' : 'X';
}

function roomStateForClient(room: Room) {
  return {
    roomId: room.id,
    board: room.board,
    currentTurn: room.currentTurn,
    active: room.active,
    scores: room.scores,
    players: room.players.map((p) => ({ mark: p.mark, displayName: p.displayName })),
  };
}

export function registerGameSocket(io: Server, socket: Socket) {
  socket.on('online:join', ({ deviceId, displayName }: { deviceId: string; displayName: string }) => {
    // Prevent duplicate queue entries on reconnect/re-emit
    const alreadyQueued = waitingQueue.find((w) => w.socketId === socket.id);
    if (alreadyQueued) return;
    if ([...rooms.values()].some((room) => room.players.some((p) => p.socketId === socket.id))) return;

    const safeDisplayName = normalizeDisplayName(displayName || '');

    const opponent = waitingQueue.shift();

    if (!opponent) {
      waitingQueue.push({ socketId: socket.id, deviceId, displayName: safeDisplayName });
      socket.emit('online:waiting');
      return;
    }

    // Create a room for the two matched players
    const roomId = nanoid(8);
    const players: Player[] = [
      { socketId: opponent.socketId, deviceId: opponent.deviceId, displayName: opponent.displayName, mark: 'X' },
      { socketId: socket.id, deviceId, displayName: safeDisplayName, mark: 'O' },
    ];

    const room: Room = {
      id: roomId,
      board: emptyBoard(),
      currentTurn: 'X',
      players,
      active: true,
      scores: { X: 0, O: 0 },
      rematchVotes: new Set(),
    };
    rooms.set(roomId, room);

    for (const p of players) {
      const s = io.sockets.sockets.get(p.socketId);
      s?.join(roomId);
      s?.emit('online:matched', { ...roomStateForClient(room), yourMark: p.mark });
    }
  });

  socket.on('online:leaveQueue', () => {
    const idx = waitingQueue.findIndex((w) => w.socketId === socket.id);
    if (idx !== -1) waitingQueue.splice(idx, 1);
  });

  socket.on('online:move', ({ roomId, index }: { roomId: string; index: number }) => {
    const room = rooms.get(roomId);
    if (!room || !room.active) return;
    if (!Number.isInteger(index) || index < 0 || index >= room.board.length) return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;
    if (player.mark !== room.currentTurn) return; // not your turn
    if (room.board[index] !== '') return; // cell taken

    const result = applyMove(room.board, index, player.mark);
    room.board = result.board;
    room.currentTurn = result.currentTurn;

    if (result.winner) {
      room.active = false;
      if (result.winner !== 'draw') {
        room.scores[result.winner] += 1;
      }
      // Persist stats for both players (fire and forget)
      for (const p of room.players) {
        const outcome =
          result.winner === 'draw' ? 'draw' : result.winner === p.mark ? 'win' : 'loss';
        recordGameResult(p.deviceId, p.displayName, outcome).catch((err) =>
          console.error('Failed to record game result:', err),
        );
      }
    }

    io.to(roomId).emit('online:update', {
      board: room.board,
      currentTurn: room.currentTurn,
      winner: result.winner,
      winningLine: result.winningLine,
      scores: room.scores,
    });
  });

  socket.on('online:rematch', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (!room || room.active || !room.players.some((p) => p.socketId === socket.id)) return;

    room.rematchVotes.add(socket.id);

    if (room.rematchVotes.size >= 2) {
      room.board = emptyBoard();
      room.currentTurn = 'X';
      room.active = true;
      room.rematchVotes.clear();
      io.to(roomId).emit('online:update', {
        board: room.board,
        currentTurn: room.currentTurn,
        winner: null,
        winningLine: null,
        scores: room.scores,
      });
    } else {
      socket.to(roomId).emit('online:rematchRequested');
    }
  });

  socket.on('online:leaveRoom', ({ roomId }: { roomId: string }) => {
    leaveRoom(io, socket, roomId);
  });

  socket.on('disconnect', () => {
    const idx = waitingQueue.findIndex((w) => w.socketId === socket.id);
    if (idx !== -1) waitingQueue.splice(idx, 1);

    for (const [roomId, room] of rooms) {
      if (room.players.some((p) => p.socketId === socket.id)) {
        leaveRoom(io, socket, roomId);
      }
    }
  });
}

function leaveRoom(io: Server, socket: Socket, roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  if (!room.players.some((p) => p.socketId === socket.id)) return;

  socket.to(roomId).emit('online:opponentLeft');
  rooms.delete(roomId);
}
