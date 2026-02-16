/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

// ===== AUTHENTICATION =====
export interface RegisterRequest {
  username: string;
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  player: PlayerProfile;
}

// ===== PLAYER & WALLET =====
export interface PlayerProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  gc_balance: number;
  sc_balance: number;
  status: string;
  kyc_level: string;
  kyc_verified: boolean;
  join_date: string;
  last_login?: string;
  password?: string;
}

export interface Wallet {
  goldCoins: number;
  sweepsCoins: number;
}

export interface GCPack {
  id: number;
  title: string;
  description: string;
  price_usd: number;
  gold_coins: number;
  sweeps_coins: number;
  bonus_sc: number;
  bonus_percentage: number;
  is_popular: boolean;
  is_best_value: boolean;
}

export interface StorePack extends GCPack {
  enabled: boolean;
  display_order: number;
}

export interface PurchaseRequest {
  pack_id: number;
  payment_method: 'stripe' | 'square';
  payment_token?: string;
}

export interface Transaction {
  id: number;
  type: string;
  gc_amount?: number;
  sc_amount?: number;
  gc_balance_after?: number;
  sc_balance_after?: number;
  description?: string;
  created_at: string;
}

// ===== GAMES =====
export type GameType = 'slots' | 'poker' | 'bingo' | 'sportsbook';

export interface GameInfo {
  id: string | number;
  type: GameType;
  name: string;
  title?: string;
  description?: string;
  image?: string;
  icon?: string;
  category?: string;
  rtp?: number;
  volatility?: string;
  active_users?: number;
  activePlayers?: number;
}

// ===== SLOT GAMES =====
export interface SlotGame {
  id: string | number;
  title: string;
  provider: string;
  image: string;
  gameUrl: string;
  badges: ('New' | 'Buy Bonus')[];
  releaseDate?: string;
  slug?: string;
  thumbnail?: string;
}

// ===== SLOTS =====
export interface SlotsSpinRequest {
  game_id: number;
  bet_amount: number;
}

export interface SlotsSpinResult {
  symbols: string[];
  bet_amount: number;
  winnings: number;
  multiplier: number;
  isWin: boolean;
  wallet: Wallet;
}

// ===== CASINO =====
export interface CasinoPlayResponse {
  game_id: string | number;
  bet_amount: number;
  winnings: number;
  result: 'win' | 'loss';
  new_balance: number;
  wallet: Wallet;
}

// ===== POKER =====
export interface PokerTable {
  id: number;
  name: string;
  stakes: string;
  max_players: number;
  current_players: number;
  buy_in_min: number;
  buy_in_max: number;
  status: string;
}

export interface PokerJoinRequest {
  table_id: number;
  buy_in: number;
}

// ===== BINGO =====
export interface BingoGame {
  id: number;
  name: string;
  pattern: string;
  players: number;
  ticket_price: number;
  jackpot: number;
  status: string;
}

export interface BingoBuyTicketRequest {
  game_id: number;
}

// ===== SPORTSBOOK =====
export interface SportsEvent {
  id: number;
  sport: string;
  event_name: string;
  event_date?: string;
  status: string;
  total_bets?: number;
  line_movement?: string;
  locked?: boolean;
  odds?: number;
}

export interface SportsBetRequest {
  event_id: number;
  bet_type: 'single' | 'parlay';
  amount: number;
  odds: number;
}

export interface SportsBet {
  id: number;
  event_id: number;
  bet_type: string;
  amount: number;
  odds: number;
  status: string;
  potential_winnings: number;
  actual_winnings?: number;
  created_at: string;
}

// ===== ACHIEVEMENTS =====
export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon_url?: string;
  badge_name: string;
  requirement_type: string;
  requirement_value: number;
}

// ===== LEADERBOARD =====
export interface LeaderboardEntry {
  player_id: number;
  username: string;
  name: string;
  rank: number;
  score: number;
  period: string;
}

// ===== ADMIN =====
export interface AIEmployee {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'monitoring';
  lastReport: string;
  tasks: string[];
}

// ===== RESPONSES =====
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface WalletResponse {
  gc_balance: number;
  sc_balance: number;
  last_updated: string;
}

// ===== TICKET GAMES =====
export interface TicketPurchaseResponse {
  success: boolean;
  data?: {
    ticket_id: string;
    design_id: number;
    cost_sc: number;
    slots: any[];
  };
  error?: string;
}

export interface TicketRevealResponse {
  success: boolean;
  data?: {
    slot_index: number;
    revealed: any;
    is_winner: boolean;
    prize_sc: number;
  };
  error?: string;
}

export interface TicketClaimResponse {
  success: boolean;
  data?: {
    prize_sc: number;
    new_balance: number;
  };
  error?: string;
}
