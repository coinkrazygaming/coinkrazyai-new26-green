import { getIO } from '../socket';

type Hand = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
type Suit = '♠' | '♥' | '♦' | '♣';

interface Card {
  rank: Hand;
  suit: Suit;
}

interface PokerPlayer {
  playerId: number;
  username: string;
  balance: number;
  bet: number;
  holeCards: Card[];
  isFolded: boolean;
  isActive: boolean;
  isButton?: boolean;
  isSmallBlind?: boolean;
  isBigBlind?: boolean;
  lastAction?: 'check' | 'bet' | 'raise' | 'fold' | 'call';
  lastActionTime?: number;
}

interface PokerGame {
  tableId: number;
  name: string;
  status: 'waiting' | 'betting' | 'showdown' | 'finished';
  players: Map<number, PokerPlayer>;
  deck: Card[];
  communityCards: Card[];
  pot: number;
  currentBet: number;
  currentPlayerIndex: number;
  button: number;
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
  maxBuyIn: number;
  maxPlayers: number;
  createdAt: Date;
  roundTimer?: NodeJS.Timeout;
}

const activeTables: Map<number, PokerGame> = new Map();

const CARD_RANKS: Hand[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];

export class PokerService {
  /**
   * Initialize a poker table
   */
  static initializeTable(
    tableId: number,
    name: string,
    smallBlind: number,
    bigBlind: number,
    minBuyIn: number,
    maxBuyIn: number,
    maxPlayers: number = 6
  ): PokerGame {
    const table: PokerGame = {
      tableId,
      name,
      status: 'waiting',
      players: new Map(),
      deck: this.createDeck(),
      communityCards: [],
      pot: 0,
      currentBet: 0,
      currentPlayerIndex: 0,
      button: 0,
      smallBlind,
      bigBlind,
      minBuyIn,
      maxBuyIn,
      maxPlayers,
      createdAt: new Date()
    };

    activeTables.set(tableId, table);
    return table;
  }

  /**
   * Create a shuffled deck
   */
  static createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of CARD_RANKS) {
        deck.push({ rank, suit });
      }
    }
    // Shuffle
    return deck.sort(() => Math.random() - 0.5);
  }

  /**
   * Add a player to a table
   */
  static addPlayerToTable(
    tableId: number,
    playerId: number,
    username: string,
    buyIn: number
  ): PokerPlayer | null {
    const table = activeTables.get(tableId);
    if (!table || table.players.size >= table.maxPlayers) {
      return null;
    }

    if (buyIn < table.minBuyIn || buyIn > table.maxBuyIn) {
      return null;
    }

    const player: PokerPlayer = {
      playerId,
      username,
      balance: buyIn,
      bet: 0,
      holeCards: [],
      isFolded: false,
      isActive: true,
      lastAction: undefined,
      lastActionTime: Date.now()
    };

    table.players.set(playerId, player);

    const io = getIO();
    io.to(`poker_${tableId}`).emit('player_joined', {
      playerId,
      username,
      buyIn,
      totalPlayers: table.players.size
    });

    // Start game if enough players
    if (table.players.size >= 2 && table.status === 'waiting') {
      this.startGame(tableId);
    }

    return player;
  }

  /**
   * Start a poker game
   */
  static startGame(tableId: number): boolean {
    const table = activeTables.get(tableId);
    if (!table || table.status !== 'waiting' || table.players.size < 2) {
      return false;
    }

    table.status = 'betting';
    table.pot = 0;
    table.currentBet = table.bigBlind;
    table.currentPlayerIndex = (table.button + 3) % table.players.size;
    table.deck = this.createDeck();
    table.communityCards = [];

    // Deal hole cards
    const players = Array.from(table.players.values());
    for (const player of players) {
      player.holeCards = [table.deck.pop()!, table.deck.pop()!];
      player.isFolded = false;
      player.bet = 0;
    }

    // Post blinds
    const smallBlindPlayer = players[table.button];
    const bigBlindPlayer = players[(table.button + 1) % table.players.size];

    smallBlindPlayer.bet = table.smallBlind;
    bigBlindPlayer.bet = table.bigBlind;
    table.pot = table.smallBlind + table.bigBlind;

    const io = getIO();
    io.to(`poker_${tableId}`).emit('game_started', {
      tableId,
      pot: table.pot,
      currentBet: table.currentBet,
      playersCount: table.players.size
    });

    // Set action timer
    this.setActionTimer(tableId);
    return true;
  }

  /**
   * Player calls current bet
   */
  static playerCall(tableId: number, playerId: number): boolean {
    const table = activeTables.get(tableId);
    const player = table?.players.get(playerId);

    if (!table || !player || player.isFolded) {
      return false;
    }

    const callAmount = Math.min(player.balance, table.currentBet - player.bet);
    player.balance -= callAmount;
    player.bet += callAmount;
    table.pot += callAmount;
    player.lastAction = 'call';
    player.lastActionTime = Date.now();

    this.nextPlayer(tableId);
    return true;
  }

  /**
   * Player raises
   */
  static playerRaise(tableId: number, playerId: number, raiseAmount: number): boolean {
    const table = activeTables.get(tableId);
    const player = table?.players.get(playerId);

    if (!table || !player || player.isFolded || raiseAmount > player.balance) {
      return false;
    }

    const totalBet = (table.currentBet - player.bet) + raiseAmount;
    if (totalBet > player.balance) {
      return false;
    }

    player.balance -= totalBet;
    player.bet += totalBet;
    table.pot += totalBet;
    table.currentBet = player.bet;
    player.lastAction = 'raise';
    player.lastActionTime = Date.now();

    this.nextPlayer(tableId);
    return true;
  }

  /**
   * Player folds
   */
  static playerFold(tableId: number, playerId: number): boolean {
    const table = activeTables.get(tableId);
    const player = table?.players.get(playerId);

    if (!table || !player) {
      return false;
    }

    player.isFolded = true;
    player.lastAction = 'fold';
    player.lastActionTime = Date.now();

    const activePlayers = Array.from(table.players.values()).filter(
      (p) => !p.isFolded && p.isActive
    );

    if (activePlayers.length === 1) {
      // One player left, they win
      this.endGame(tableId, activePlayers[0].playerId);
      return true;
    }

    this.nextPlayer(tableId);
    return true;
  }

  /**
   * Player checks (no bet)
   */
  static playerCheck(tableId: number, playerId: number): boolean {
    const table = activeTables.get(tableId);
    const player = table?.players.get(playerId);

    if (!table || !player || player.isFolded || table.currentBet > player.bet) {
      return false;
    }

    player.lastAction = 'check';
    player.lastActionTime = Date.now();

    this.nextPlayer(tableId);
    return true;
  }

  /**
   * Move to next player
   */
  static nextPlayer(tableId: number): void {
    const table = activeTables.get(tableId);
    if (!table) {
      return;
    }

    const players = Array.from(table.players.values());
    let nextIndex = (table.currentPlayerIndex + 1) % players.length;
    let attempts = 0;

    while (
      (players[nextIndex].isFolded || !players[nextIndex].isActive) &&
      attempts < players.length
    ) {
      nextIndex = (nextIndex + 1) % players.length;
      attempts++;
    }

    table.currentPlayerIndex = nextIndex;

    const io = getIO();
    io.to(`poker_${tableId}`).emit('action_required', {
      playerId: players[nextIndex].playerId,
      currentBet: table.currentBet,
      pot: table.pot
    });

    this.setActionTimer(tableId);
  }

  /**
   * Set timeout for player action
   */
  static setActionTimer(tableId: number): void {
    const table = activeTables.get(tableId);
    if (!table || table.roundTimer) {
      return;
    }

    table.roundTimer = setTimeout(() => {
      // Auto-fold if no action taken
      const players = Array.from(table.players.values());
      const currentPlayer = players[table.currentPlayerIndex];
      if (currentPlayer) {
        this.playerFold(tableId, currentPlayer.playerId);
      }
    }, 30000); // 30 second timeout
  }

  /**
   * Deal community cards (for betting round)
   */
  static dealCommunityCards(tableId: number, count: number): Card[] {
    const table = activeTables.get(tableId);
    if (!table) {
      return [];
    }

    const newCards: Card[] = [];
    for (let i = 0; i < count; i++) {
      const card = table.deck.pop();
      if (card) {
        table.communityCards.push(card);
        newCards.push(card);
      }
    }

    const io = getIO();
    io.to(`poker_${tableId}`).emit('community_cards_dealt', {
      newCards,
      allCommunityCards: table.communityCards
    });

    return newCards;
  }

  /**
   * End a game
   */
  static endGame(tableId: number, winnerId?: number): void {
    const table = activeTables.get(tableId);
    if (!table) {
      return;
    }

    table.status = 'finished';

    if (table.roundTimer) {
      clearTimeout(table.roundTimer);
    }

    const io = getIO();

    if (winnerId) {
      const winner = table.players.get(winnerId);
      if (winner) {
        winner.balance += table.pot;
        io.to(`poker_${tableId}`).emit('game_finished', {
          winnerId,
          winnerUsername: winner.username,
          winAmount: table.pot
        });
      }
    }

    // Reset for next hand after a delay
    setTimeout(() => {
      table.status = 'waiting';
      table.button = (table.button + 1) % table.players.size;
      table.pot = 0;
      table.currentBet = 0;
      table.communityCards = [];

      // Reset player states
      for (const player of table.players.values()) {
        player.holeCards = [];
        player.bet = 0;
        player.isFolded = false;
      }

      io.to(`poker_${tableId}`).emit('ready_for_next_hand', {
        tableId,
        button: table.button
      });
    }, 5000);
  }

  /**
   * Remove a player from a table
   */
  static removePlayerFromTable(tableId: number, playerId: number): boolean {
    const table = activeTables.get(tableId);
    if (!table) {
      return false;
    }

    const removed = table.players.delete(playerId);

    if (removed) {
      const io = getIO();
      io.to(`poker_${tableId}`).emit('player_left', {
        playerId,
        totalPlayers: table.players.size
      });

      // End game if not enough players
      if (table.players.size < 2) {
        this.endGame(tableId);
      }
    }

    return removed;
  }

  /**
   * Get table state
   */
  static getTableState(tableId: number) {
    const table = activeTables.get(tableId);
    if (!table) {
      return null;
    }

    return {
      id: table.tableId,
      name: table.name,
      status: table.status,
      playerCount: table.players.size,
      maxPlayers: table.maxPlayers,
      pot: table.pot,
      currentBet: table.currentBet,
      smallBlind: table.smallBlind,
      bigBlind: table.bigBlind,
      communityCards: table.communityCards
    };
  }

  /**
   * Get all active tables
   */
  static getActiveTables() {
    return Array.from(activeTables.values()).map((table) => ({
      id: table.tableId,
      name: table.name,
      status: table.status,
      playerCount: table.players.size,
      maxPlayers: table.maxPlayers,
      smallBlind: table.smallBlind,
      bigBlind: table.bigBlind,
      minBuyIn: table.minBuyIn,
      maxBuyIn: table.maxBuyIn
    }));
  }
}
