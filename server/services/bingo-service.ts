import { getIO } from '../socket';

// Game state management
interface BingoCard {
  numbers: number[][];
  marked: boolean[][];
}

interface BingoPlayer {
  playerId: number;
  username: string;
  card: BingoCard;
  hasBingo: boolean;
  winAmount?: number;
}

interface BingoGameRoom {
  id: number;
  name: string;
  status: 'waiting' | 'calling' | 'finished';
  calledNumbers: number[];
  players: Map<number, BingoPlayer>;
  jackpot: number;
  ticketPrice: number;
  createdAt: Date;
  callerInterval?: NodeJS.Timeout;
}

const activeGames: Map<number, BingoGameRoom> = new Map();

export class BingoService {
  /**
   * Initialize a bingo game room
   */
  static initializeGame(
    gameId: number,
    name: string,
    jackpot: number,
    ticketPrice: number
  ): BingoGameRoom {
    const room: BingoGameRoom = {
      id: gameId,
      name,
      status: 'waiting',
      calledNumbers: [],
      players: new Map(),
      jackpot,
      ticketPrice,
      createdAt: new Date()
    };

    activeGames.set(gameId, room);
    return room;
  }

  /**
   * Add a player to a bingo game
   */
  static addPlayerToGame(
    gameId: number,
    playerId: number,
    username: string,
    card: number[][]
  ): BingoPlayer | null {
    const game = activeGames.get(gameId);
    if (!game) {
      return null;
    }

    const bingoCard: BingoCard = {
      numbers: card,
      marked: Array(5)
        .fill(null)
        .map(() =>
          Array(5)
            .fill(false)
            .map((_, colIdx, col) => {
              // Mark center as always marked (free space)
              return colIdx === 2 && col.length === 5 ? true : false;
            })
        )
    };

    const player: BingoPlayer = {
      playerId,
      username,
      card: bingoCard,
      hasBingo: false
    };

    game.players.set(playerId, player);

    // Emit player joined event
    const io = getIO();
    io.to(`bingo_${gameId}`).emit('player_joined', {
      playerId,
      username,
      totalPlayers: game.players.size
    });

    return player;
  }

  /**
   * Start calling numbers for a game
   */
  static startCalling(gameId: number): boolean {
    const game = activeGames.get(gameId);
    if (!game || game.status === 'calling') {
      return false;
    }

    game.status = 'calling';
    const io = getIO();

    io.to(`bingo_${gameId}`).emit('game_started', {
      gameId,
      playerCount: game.players.size
    });

    // Call a number every 3 seconds
    game.callerInterval = setInterval(() => {
      const nextNumber = this.callNextNumber(gameId);
      if (nextNumber === null) {
        // All numbers called
        this.endGame(gameId);
      }
    }, 3000);

    return true;
  }

  /**
   * Call the next number
   */
  static callNextNumber(gameId: number): number | null {
    const game = activeGames.get(gameId);
    if (!game) {
      return null;
    }

    // Generate random number between 1-75
    let nextNumber: number;
    let attempts = 0;

    do {
      nextNumber = Math.floor(Math.random() * 75) + 1;
      attempts++;
    } while (
      game.calledNumbers.includes(nextNumber) &&
      game.calledNumbers.length < 75 &&
      attempts < 100
    );

    if (game.calledNumbers.includes(nextNumber)) {
      // All numbers have been called
      return null;
    }

    game.calledNumbers.push(nextNumber);

    // Determine which column (B, I, N, G, O)
    const column = Math.floor((nextNumber - 1) / 15);
    const columnLetters = ['B', 'I', 'N', 'G', 'O'];

    const io = getIO();
    io.to(`bingo_${gameId}`).emit('number_called', {
      number: nextNumber,
      column: columnLetters[column],
      columnIndex: column,
      totalCalled: game.calledNumbers.length
    });

    return nextNumber;
  }

  /**
   * Mark a number on a player's card
   */
  static markNumber(gameId: number, playerId: number, number: number): boolean {
    const game = activeGames.get(gameId);
    const player = game?.players.get(playerId);

    if (!game || !player) {
      return false;
    }

    // Find the number on the card and mark it
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < 5; row++) {
        if (player.card.numbers[col][row] === number) {
          player.card.marked[col][row] = true;

          // Check if player has bingo
          if (this.checkBingo(player.card)) {
            player.hasBingo = true;
            return true;
          }
          break;
        }
      }
    }

    return false;
  }

  /**
   * Check if a card has bingo (5 in a row/column/diagonal)
   */
  static checkBingo(card: BingoCard): boolean {
    const marked = card.marked;

    // Check rows
    for (let row = 0; row < 5; row++) {
      if (marked[row].every((m) => m)) {
        return true;
      }
    }

    // Check columns
    for (let col = 0; col < 5; col++) {
      let allMarked = true;
      for (let row = 0; row < 5; row++) {
        if (!marked[row][col]) {
          allMarked = false;
          break;
        }
      }
      if (allMarked) {
        return true;
      }
    }

    // Check diagonal (top-left to bottom-right)
    let diagonalWin = true;
    for (let i = 0; i < 5; i++) {
      if (!marked[i][i]) {
        diagonalWin = false;
        break;
      }
    }
    if (diagonalWin) {
      return true;
    }

    // Check anti-diagonal (top-right to bottom-left)
    let antiDiagonalWin = true;
    for (let i = 0; i < 5; i++) {
      if (!marked[i][4 - i]) {
        antiDiagonalWin = false;
        break;
      }
    }
    if (antiDiagonalWin) {
      return true;
    }

    return false;
  }

  /**
   * End a game and determine winners
   */
  static endGame(gameId: number): BingoPlayer[] {
    const game = activeGames.get(gameId);
    if (!game) {
      return [];
    }

    game.status = 'finished';

    // Get all winners
    const winners = Array.from(game.players.values()).filter((p) => p.hasBingo);

    const io = getIO();

    if (winners.length > 0) {
      // Split jackpot among winners
      const winAmount = game.jackpot / winners.length;

      winners.forEach((winner) => {
        winner.winAmount = winAmount;
      });

      io.to(`bingo_${gameId}`).emit('game_finished', {
        winners: winners.map((w) => ({
          playerId: w.playerId,
          username: w.username,
          winAmount: w.winAmount
        })),
        totalWinners: winners.length
      });
    } else {
      io.to(`bingo_${gameId}`).emit('game_finished', {
        winners: [],
        totalWinners: 0,
        message: 'No winners this round'
      });
    }

    // Clean up
    if (game.callerInterval) {
      clearInterval(game.callerInterval);
    }

    // Remove game after a delay
    setTimeout(() => {
      activeGames.delete(gameId);
    }, 5000);

    return winners;
  }

  /**
   * Get active game state
   */
  static getGameState(gameId: number) {
    const game = activeGames.get(gameId);
    if (!game) {
      return null;
    }

    return {
      id: game.id,
      name: game.name,
      status: game.status,
      calledNumbers: game.calledNumbers,
      playerCount: game.players.size,
      jackpot: game.jackpot,
      ticketPrice: game.ticketPrice
    };
  }

  /**
   * Remove a player from a game
   */
  static removePlayerFromGame(gameId: number, playerId: number): boolean {
    const game = activeGames.get(gameId);
    if (!game) {
      return false;
    }

    const removed = game.players.delete(playerId);

    if (removed) {
      const io = getIO();
      io.to(`bingo_${gameId}`).emit('player_left', {
        playerId,
        totalPlayers: game.players.size
      });
    }

    return removed;
  }

  /**
   * Get all active games
   */
  static getActiveGames() {
    return Array.from(activeGames.values()).map((game) => ({
      id: game.id,
      name: game.name,
      status: game.status,
      playerCount: game.players.size,
      jackpot: game.jackpot,
      ticketPrice: game.ticketPrice
    }));
  }
}
