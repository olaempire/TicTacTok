import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { statsRouter } from './routes/stats.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { registerGameSocket } from './sockets/gameSocket.js';

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/stats', statsRouter);
app.use('/api/leaderboard', leaderboardRouter);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN },
});

io.on('connection', (socket) => {
  registerGameSocket(io, socket);
});

httpServer.listen(PORT, () => {
  console.log(`Tic-Tac-Tok API listening on http://localhost:${PORT}`);
});
