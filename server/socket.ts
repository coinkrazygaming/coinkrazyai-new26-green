import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { BingoService } from "./services/bingo-service";

let io: SocketIOServer | null = null;

export function setupSocketIO(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // ===== BINGO EVENTS =====
    socket.on("bingo:join_room", (data: { gameId: number; playerId: number; username: string; card: number[][] }) => {
      const room = `bingo_${data.gameId}`;
      socket.join(room);

      // Add player to game in service
      BingoService.addPlayerToGame(data.gameId, data.playerId, data.username, data.card);

      console.log(`Player ${data.playerId} joined bingo game ${data.gameId}`);
    });

    socket.on("bingo:start_game", (data: { gameId: number }) => {
      const started = BingoService.startCalling(data.gameId);
      if (started) {
        console.log(`Bingo game ${data.gameId} started`);
      }
    });

    socket.on("bingo:leave_room", (data: { gameId: number; playerId: number }) => {
      const room = `bingo_${data.gameId}`;
      socket.leave(room);
      BingoService.removePlayerFromGame(data.gameId, data.playerId);
      console.log(`Player ${data.playerId} left bingo game ${data.gameId}`);
    });

    // ===== POKER EVENTS =====
    socket.on("poker:join_table", (data: { tableId: number; playerId: number }) => {
      const room = `poker_${data.tableId}`;
      socket.join(room);
      console.log(`Player ${data.playerId} joined poker table ${data.tableId}`);
    });

    socket.on("poker:leave_table", (data: { tableId: number; playerId: number }) => {
      const room = `poker_${data.tableId}`;
      socket.leave(room);
      console.log(`Player ${data.playerId} left poker table ${data.tableId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }
  return io;
}

export function emitWalletUpdate(userId: string, data: any) {
  if (io) {
    io.emit(`wallet:${userId}`, data);
    // For demo/simplicity, also emit global for the single user case
    io.emit("wallet:update", data);
  }
}

export function emitGameUpdate(gameType: string, data: any) {
  if (io) {
    io.emit(`${gameType}:update`, data);
  }
}
