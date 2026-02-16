-- Create ENUM types
CREATE TYPE user_status AS ENUM ('Active', 'Suspended', 'Banned', 'Inactive');
CREATE TYPE admin_role AS ENUM ('admin', 'moderator', 'support');
CREATE TYPE kyc_level AS ENUM ('None', 'Basic', 'Intermediate', 'Full');
CREATE TYPE transaction_type AS ENUM ('Deposit', 'Withdrawal', 'Win', 'Loss', 'Bonus', 'Transfer', 'Refund');
CREATE TYPE game_category AS ENUM ('Slots', 'Poker', 'Bingo', 'Sportsbook', 'Other');
CREATE TYPE game_provider AS ENUM ('Internal', 'External');
CREATE TYPE bonus_type AS ENUM ('Deposit', 'Reload', 'Free Spins', 'Free Bet', 'Cashback');
CREATE TYPE bingo_pattern AS ENUM ('5-line', 'Full Card', 'Corner', 'Other');
CREATE TYPE sport_type AS ENUM ('NFL', 'NBA', 'Soccer', 'Tennis', 'Other');
CREATE TYPE event_status AS ENUM ('Upcoming', 'Live', 'Closed', 'Settled');
CREATE TYPE achievement_requirement_type AS ENUM ('wins', 'wagered', 'streak', 'games_played', 'balance', 'referrals', 'level');
CREATE TYPE security_alert_type AS ENUM ('Login', 'Withdrawal', 'Unusual Activity', 'Chargeback', 'Fraud', 'Other');

-- ===== ADMIN USERS TABLE =====
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role admin_role DEFAULT 'moderator',
  status user_status DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- ===== PLAYERS TABLE =====
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  gc_balance DECIMAL(15, 2) DEFAULT 0,
  sc_balance DECIMAL(15, 2) DEFAULT 0,
  status user_status DEFAULT 'Active',
  kyc_level kyc_level DEFAULT 'None',
  kyc_verified BOOLEAN DEFAULT FALSE,
  phone VARCHAR(20),
  country VARCHAR(100),
  date_of_birth DATE,
  preferred_language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  total_deposits DECIMAL(15, 2) DEFAULT 0,
  total_withdrawals DECIMAL(15, 2) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);
CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);
CREATE INDEX IF NOT EXISTS idx_players_status ON players(status);

-- ===== WALLET TRANSACTIONS TABLE =====
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  balance_before DECIMAL(15, 2),
  balance_after DECIMAL(15, 2),
  game_session_id VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_player_id ON wallet_transactions(player_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);

-- ===== GAMES TABLE =====
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category game_category NOT NULL,
  provider game_provider NOT NULL,
  rtp DECIMAL(5, 2) DEFAULT 95.0,
  volatility VARCHAR(50),
  enabled BOOLEAN DEFAULT TRUE,
  description TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_games_category ON games(category);
CREATE INDEX IF NOT EXISTS idx_games_enabled ON games(enabled);

-- ===== PLAYER STATS TABLE =====
CREATE TABLE IF NOT EXISTS player_stats (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE,
  total_wagered DECIMAL(15, 2) DEFAULT 0,
  total_won DECIMAL(15, 2) DEFAULT 0,
  total_lost DECIMAL(15, 2) DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  favorite_game VARCHAR(255),
  last_game_played TIMESTAMP,
  weekly_wagered DECIMAL(15, 2) DEFAULT 0,
  monthly_wagered DECIMAL(15, 2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== BONUSES TABLE =====
CREATE TABLE IF NOT EXISTS bonuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type bonus_type NOT NULL,
  amount VARCHAR(100),
  percentage DECIMAL(5, 2),
  min_deposit DECIMAL(15, 2) DEFAULT 0,
  max_claims INTEGER DEFAULT 1,
  wagering_multiplier DECIMAL(5, 2) DEFAULT 35.0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== STORE PACKS TABLE =====
CREATE TABLE IF NOT EXISTS store_packs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price_usd DECIMAL(8, 2) NOT NULL,
  gold_coins INTEGER NOT NULL,
  sweeps_coins INTEGER DEFAULT 0,
  bonus_sc DECIMAL(15, 2) DEFAULT 0,
  bonus_percentage DECIMAL(5, 2) DEFAULT 0,
  is_popular BOOLEAN DEFAULT FALSE,
  is_best_value BOOLEAN DEFAULT FALSE,
  enabled BOOLEAN DEFAULT TRUE,
  display_order INTEGER,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== PURCHASE HISTORY TABLE =====
CREATE TABLE IF NOT EXISTS purchase_history (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  store_pack_id INTEGER REFERENCES store_packs(id),
  amount_usd DECIMAL(8, 2) NOT NULL,
  gold_coins INTEGER,
  sweeps_coins INTEGER,
  payment_method VARCHAR(100),
  transaction_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchase_history_player_id ON purchase_history(player_id);

-- ===== POKER TABLES TABLE =====
CREATE TABLE IF NOT EXISTS poker_tables (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  stakes VARCHAR(50) NOT NULL,
  max_players INTEGER NOT NULL,
  current_players INTEGER DEFAULT 0,
  buy_in_min DECIMAL(15, 2) NOT NULL,
  buy_in_max DECIMAL(15, 2) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== POKER SESSIONS TABLE =====
CREATE TABLE IF NOT EXISTS poker_sessions (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  table_id INTEGER NOT NULL REFERENCES poker_tables(id),
  buy_in DECIMAL(15, 2) NOT NULL,
  cash_out DECIMAL(15, 2),
  status VARCHAR(50) DEFAULT 'active',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

-- ===== BINGO GAMES TABLE =====
CREATE TABLE IF NOT EXISTS bingo_games (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  pattern bingo_pattern NOT NULL,
  players INTEGER DEFAULT 0,
  ticket_price DECIMAL(8, 2) NOT NULL,
  jackpot DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== BINGO TICKETS TABLE =====
CREATE TABLE IF NOT EXISTS bingo_tickets (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL REFERENCES bingo_games(id),
  ticket_number VARCHAR(100) UNIQUE,
  numbers INTEGER[],
  marked_numbers INTEGER[],
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== SPORTS EVENTS TABLE =====
CREATE TABLE IF NOT EXISTS sports_events (
  id SERIAL PRIMARY KEY,
  sport sport_type NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  status event_status DEFAULT 'Upcoming',
  total_bets DECIMAL(15, 2) DEFAULT 0,
  line_movement VARCHAR(50),
  odds_update TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== BETS TABLE =====
CREATE TABLE IF NOT EXISTS bets (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  event_id INTEGER REFERENCES sports_events(id),
  bet_type VARCHAR(50) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  odds DECIMAL(8, 4),
  potential_win DECIMAL(15, 2),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  settled_at TIMESTAMP
);

-- ===== ACHIEVEMENTS TABLE =====
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  badge_name VARCHAR(100) UNIQUE,
  requirement_type achievement_requirement_type NOT NULL,
  requirement_value INTEGER NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== PLAYER ACHIEVEMENTS TABLE =====
CREATE TABLE IF NOT EXISTS player_achievements (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_player_achievements_player_id ON player_achievements(player_id);

-- ===== KYC DOCUMENTS TABLE =====
CREATE TABLE IF NOT EXISTS kyc_documents (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  document_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending',
  verified_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== SECURITY ALERTS TABLE =====
CREATE TABLE IF NOT EXISTS security_alerts (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  alert_type security_alert_type NOT NULL,
  description TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

-- ===== LEADERBOARD TABLE =====
CREATE TABLE IF NOT EXISTS leaderboards (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  rank INTEGER,
  score DECIMAL(15, 2) NOT NULL,
  period VARCHAR(50),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leaderboards_player_id ON leaderboards(player_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_rank ON leaderboards(rank);

-- ===== GAME CONFIG TABLE =====
CREATE TABLE IF NOT EXISTS game_config (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id),
  config_key VARCHAR(255) NOT NULL,
  config_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create views for common queries
CREATE OR REPLACE VIEW player_summary AS
SELECT 
  p.id,
  p.username,
  p.email,
  p.gc_balance,
  p.sc_balance,
  p.status,
  ps.total_wagered,
  ps.total_won,
  ps.games_played,
  p.created_at,
  p.last_login
FROM players p
LEFT JOIN player_stats ps ON p.id = ps.player_id;

CREATE OR REPLACE VIEW active_games AS
SELECT * FROM games WHERE enabled = TRUE;

-- ===== PLAYER SESSIONS TABLE =====
CREATE TABLE IF NOT EXISTS player_sessions (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_player_sessions_player_id ON player_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_player_sessions_token ON player_sessions(token);

-- ===== SLOTS RESULTS TABLE =====
CREATE TABLE IF NOT EXISTS slots_results (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id),
  bet_amount DECIMAL(15, 2) NOT NULL,
  winnings DECIMAL(15, 2) NOT NULL,
  symbols VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_slots_results_player_id ON slots_results(player_id);
CREATE INDEX IF NOT EXISTS idx_slots_results_game_id ON slots_results(game_id);

-- ===== POKER RESULTS TABLE =====
CREATE TABLE IF NOT EXISTS poker_results (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  table_id INTEGER REFERENCES poker_tables(id),
  buy_in DECIMAL(15, 2) NOT NULL,
  cash_out DECIMAL(15, 2),
  hands_played INTEGER,
  duration_minutes INTEGER,
  profit DECIMAL(15, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_poker_results_player_id ON poker_results(player_id);
CREATE INDEX IF NOT EXISTS idx_poker_results_table_id ON poker_results(table_id);

-- ===== BINGO RESULTS TABLE =====
CREATE TABLE IF NOT EXISTS bingo_results (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES bingo_games(id),
  ticket_price DECIMAL(8, 2) NOT NULL,
  winnings DECIMAL(15, 2),
  pattern_matched VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bingo_results_player_id ON bingo_results(player_id);
CREATE INDEX IF NOT EXISTS idx_bingo_results_game_id ON bingo_results(game_id);

-- ===== TRANSACTIONS TABLE =====
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'Completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_player_id ON transactions(player_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- ===== LEADERBOARD ENTRIES TABLE =====
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  leaderboard_type VARCHAR(100) NOT NULL,
  rank INTEGER,
  score DECIMAL(15, 2) NOT NULL,
  period VARCHAR(50),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_id, leaderboard_type, period)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_type ON leaderboard_entries(leaderboard_type);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_period ON leaderboard_entries(period);

-- ===== SPORTS BETS TABLE =====
CREATE TABLE IF NOT EXISTS sports_bets (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  event_id INTEGER REFERENCES sports_events(id),
  bet_type VARCHAR(50) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  odds DECIMAL(8, 4),
  potential_winnings DECIMAL(15, 2),
  actual_winnings DECIMAL(15, 2),
  status VARCHAR(50) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  settled_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sports_bets_player_id ON sports_bets(player_id);
CREATE INDEX IF NOT EXISTS idx_sports_bets_event_id ON sports_bets(event_id);

-- ===== WALLET LEDGER TABLE =====
CREATE TABLE IF NOT EXISTS wallet_ledger (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  transaction_type VARCHAR(100) NOT NULL,
  gc_amount DECIMAL(15, 2) DEFAULT 0,
  sc_amount DECIMAL(15, 2) DEFAULT 0,
  gc_balance_after DECIMAL(15, 2),
  sc_balance_after DECIMAL(15, 2),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_ledger_player_id ON wallet_ledger(player_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_created_at ON wallet_ledger(created_at);

-- ===== PURCHASES TABLE =====
CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  pack_id INTEGER REFERENCES store_packs(id),
  amount_usd DECIMAL(8, 2) NOT NULL,
  gold_coins INTEGER,
  sweeps_coins INTEGER,
  payment_method VARCHAR(50),
  payment_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'Completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchases_player_id ON purchases(player_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_bets_player_id ON bets(player_id);
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_player_id ON kyc_documents(player_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_player_id ON security_alerts(player_id);
CREATE INDEX IF NOT EXISTS idx_bingo_tickets_player_id ON bingo_tickets(player_id);
CREATE INDEX IF NOT EXISTS idx_poker_sessions_player_id ON poker_sessions(player_id);

-- ===== JACKPOT MANAGEMENT =====
CREATE TABLE IF NOT EXISTS jackpots (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  game_id INTEGER REFERENCES games(id),
  current_amount DECIMAL(15, 2) NOT NULL,
  base_amount DECIMAL(15, 2) NOT NULL,
  max_amount DECIMAL(15, 2),
  increment_percentage DECIMAL(5, 2) DEFAULT 0.1,
  status VARCHAR(50) DEFAULT 'active',
  last_won_by INTEGER REFERENCES players(id),
  last_won_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jackpot_wins (
  id SERIAL PRIMARY KEY,
  jackpot_id INTEGER NOT NULL REFERENCES jackpots(id),
  player_id INTEGER NOT NULL REFERENCES players(id),
  amount_won DECIMAL(15, 2) NOT NULL,
  game_session_id VARCHAR(255),
  won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jackpot_wins_jackpot_id ON jackpot_wins(jackpot_id);
CREATE INDEX IF NOT EXISTS idx_jackpot_wins_player_id ON jackpot_wins(player_id);

-- ===== MAKE IT RAIN CAMPAIGNS =====
CREATE TABLE IF NOT EXISTS make_it_rain_campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  total_amount DECIMAL(15, 2) NOT NULL,
  amount_distributed DECIMAL(15, 2) DEFAULT 0,
  target_players INTEGER,
  players_participating INTEGER DEFAULT 0,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_by INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS make_it_rain_rewards (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES make_it_rain_campaigns(id),
  player_id INTEGER NOT NULL REFERENCES players(id),
  amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_make_it_rain_rewards_campaign_id ON make_it_rain_rewards(campaign_id);
CREATE INDEX IF NOT EXISTS idx_make_it_rain_rewards_player_id ON make_it_rain_rewards(player_id);

-- ===== VIP MANAGEMENT =====
CREATE TABLE IF NOT EXISTS vip_tiers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  level INTEGER NOT NULL,
  min_wagered DECIMAL(15, 2),
  monthly_cashback_percentage DECIMAL(5, 2),
  reload_bonus_percentage DECIMAL(5, 2),
  birthday_bonus DECIMAL(15, 2),
  priority_support BOOLEAN DEFAULT TRUE,
  exclusive_games BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS player_vip (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE,
  vip_tier_id INTEGER REFERENCES vip_tiers(id),
  vip_points DECIMAL(15, 2) DEFAULT 0,
  month_wagered DECIMAL(15, 2) DEFAULT 0,
  promoted_at TIMESTAMP,
  last_cashback_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_player_vip_player_id ON player_vip(player_id);

-- ===== REDEMPTION APPROVALS =====
CREATE TABLE IF NOT EXISTS redemption_requests (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id),
  amount DECIMAL(15, 2) NOT NULL,
  method VARCHAR(50) NOT NULL,
  bank_details JSONB,
  crypto_wallet VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_by INTEGER REFERENCES admin_users(id),
  approved_at TIMESTAMP,
  rejected_reason TEXT,
  processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_redemption_requests_player_id ON redemption_requests(player_id);
CREATE INDEX IF NOT EXISTS idx_redemption_requests_status ON redemption_requests(status);

-- ===== FRAUD DETECTION =====
CREATE TABLE IF NOT EXISTS fraud_patterns (
  id SERIAL PRIMARY KEY,
  pattern_name VARCHAR(255) NOT NULL,
  description TEXT,
  rule_type VARCHAR(100),
  threshold_value DECIMAL(15, 2),
  enabled BOOLEAN DEFAULT TRUE,
  action VARCHAR(50) DEFAULT 'flag',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fraud_flags (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id),
  pattern_id INTEGER REFERENCES fraud_patterns(id),
  description TEXT,
  severity VARCHAR(50) DEFAULT 'low',
  status VARCHAR(50) DEFAULT 'open',
  resolved_by INTEGER REFERENCES admin_users(id),
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fraud_flags_player_id ON fraud_flags(player_id);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_status ON fraud_flags(status);

-- ===== AFFILIATE MANAGEMENT =====
CREATE TABLE IF NOT EXISTS affiliate_partners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  website VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending',
  commission_percentage DECIMAL(5, 2) DEFAULT 20.0,
  total_referrals INTEGER DEFAULT 0,
  total_commissions DECIMAL(15, 2) DEFAULT 0,
  last_payment_date TIMESTAMP,
  approved_by INTEGER REFERENCES admin_users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS affiliate_links (
  id SERIAL PRIMARY KEY,
  affiliate_id INTEGER NOT NULL REFERENCES affiliate_partners(id),
  unique_code VARCHAR(100) UNIQUE NOT NULL,
  link_url VARCHAR(500),
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id SERIAL PRIMARY KEY,
  affiliate_id INTEGER NOT NULL REFERENCES affiliate_partners(id),
  player_id INTEGER NOT NULL REFERENCES players(id),
  referred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  first_deposit DECIMAL(15, 2),
  total_wagered DECIMAL(15, 2) DEFAULT 0,
  commission_earned DECIMAL(15, 2) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_affiliate_links_affiliate_id ON affiliate_links(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON affiliate_referrals(affiliate_id);

-- ===== SUPPORT & TICKETS =====
CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id),
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  priority VARCHAR(50) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'open',
  assigned_to INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type VARCHAR(50) NOT NULL,
  sender_id INTEGER,
  message TEXT NOT NULL,
  attachments JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_player_id ON support_tickets(player_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);

-- ===== SYSTEM LOGS =====
CREATE TABLE IF NOT EXISTS system_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES admin_users(id),
  player_id INTEGER REFERENCES players(id),
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_logs_admin_id ON system_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- ===== API MANAGEMENT =====
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  admin_id INTEGER NOT NULL REFERENCES admin_users(id),
  permissions JSONB DEFAULT '[]',
  rate_limit INTEGER DEFAULT 1000,
  status VARCHAR(50) DEFAULT 'active',
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_usage (
  id SERIAL PRIMARY KEY,
  api_key_id INTEGER NOT NULL REFERENCES api_keys(id),
  endpoint VARCHAR(255),
  method VARCHAR(10),
  response_code INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_keys_admin_id ON api_keys(admin_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_api_key_id ON api_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at);

-- ===== CONTENT MANAGEMENT =====
CREATE TABLE IF NOT EXISTS cms_pages (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT,
  page_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'draft',
  featured_image VARCHAR(500),
  meta_description TEXT,
  published_at TIMESTAMP,
  created_by INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cms_banners (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image_url VARCHAR(500),
  link_url VARCHAR(500),
  placement VARCHAR(100),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  enabled BOOLEAN DEFAULT TRUE,
  display_order INTEGER,
  created_by INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cms_promotions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  code VARCHAR(100) UNIQUE,
  discount_percentage DECIMAL(5, 2),
  discount_amount DECIMAL(15, 2),
  max_uses INTEGER,
  usage_count INTEGER DEFAULT 0,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  enabled BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_banners_placement ON cms_banners(placement);

-- ===== CASINO SETTINGS =====
CREATE TABLE IF NOT EXISTS casino_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  data_type VARCHAR(50),
  description TEXT,
  updated_by INTEGER REFERENCES admin_users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== SOCIAL MANAGEMENT =====
CREATE TABLE IF NOT EXISTS social_messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES players(id),
  recipient_id INTEGER NOT NULL REFERENCES players(id),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS social_friends (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id),
  friend_id INTEGER NOT NULL REFERENCES players(id),
  status VARCHAR(50) DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  UNIQUE(player_id, friend_id)
);

CREATE TABLE IF NOT EXISTS social_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  creator_id INTEGER NOT NULL REFERENCES players(id),
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS social_group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES social_groups(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_social_messages_sender_id ON social_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_social_messages_recipient_id ON social_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_social_friends_player_id ON social_friends(player_id);
CREATE INDEX IF NOT EXISTS idx_social_group_members_group_id ON social_group_members(group_id);

-- ===== PLAYER RETENTION =====
CREATE TABLE IF NOT EXISTS retention_campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  trigger_event VARCHAR(100),
  description TEXT,
  reward_type VARCHAR(100),
  reward_amount DECIMAL(15, 2),
  enabled BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS retention_campaign_recipients (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES retention_campaigns(id),
  player_id INTEGER NOT NULL REFERENCES players(id),
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMP,
  claimed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_retention_campaign_recipients_campaign_id ON retention_campaign_recipients(campaign_id);

-- ===== COMPLIANCE =====
CREATE TABLE IF NOT EXISTS compliance_logs (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id),
  compliance_rule VARCHAR(255) NOT NULL,
  status VARCHAR(50),
  details JSONB,
  verified_at TIMESTAMP,
  verified_by INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aml_checks (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id),
  check_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50),
  risk_level VARCHAR(50),
  verification_documents JSONB,
  verified_by INTEGER REFERENCES admin_users(id),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_compliance_logs_player_id ON compliance_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_aml_checks_player_id ON aml_checks(player_id);

-- ===== NOTIFICATIONS =====
CREATE TABLE IF NOT EXISTS notification_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  subject VARCHAR(255),
  template TEXT NOT NULL,
  variables JSONB,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id),
  template_id INTEGER REFERENCES notification_templates(id),
  title VARCHAR(255),
  message TEXT NOT NULL,
  type VARCHAR(100),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_player_id ON notifications(player_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ===== ANALYTICS EVENTS =====
CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id),
  event_type VARCHAR(100) NOT NULL,
  game_id INTEGER REFERENCES games(id),
  event_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_player_id ON analytics_events(player_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- ===== BACKUP & DATABASE MANAGEMENT =====
CREATE TABLE IF NOT EXISTS database_backups (
  id SERIAL PRIMARY KEY,
  backup_name VARCHAR(255) NOT NULL,
  backup_type VARCHAR(50),
  backup_size BIGINT,
  status VARCHAR(50),
  backup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== PERFORMANCE METRICS =====
CREATE TABLE IF NOT EXISTS performance_metrics (
  id SERIAL PRIMARY KEY,
  metric_name VARCHAR(255) NOT NULL,
  metric_value DECIMAL(15, 2),
  unit VARCHAR(50),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded_at ON performance_metrics(recorded_at);

-- ===== COINKRIAZY SCRATCH TICKETS =====
-- Ticket design templates created by admins
CREATE TABLE IF NOT EXISTS scratch_ticket_designs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cost_sc DECIMAL(8, 2) NOT NULL,
  slot_count INTEGER NOT NULL DEFAULT 6,
  win_probability DECIMAL(5, 2) NOT NULL DEFAULT 16.67,
  prize_min_sc DECIMAL(8, 2) NOT NULL DEFAULT 1,
  prize_max_sc DECIMAL(8, 2) NOT NULL DEFAULT 10,
  image_url VARCHAR(500),
  background_color VARCHAR(7) DEFAULT '#FFD700',
  enabled BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scratch_ticket_designs_enabled ON scratch_ticket_designs(enabled);

-- Purchased scratch tickets for individual players
CREATE TABLE IF NOT EXISTS scratch_tickets (
  id SERIAL PRIMARY KEY,
  design_id INTEGER NOT NULL REFERENCES scratch_ticket_designs(id),
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  slots JSONB NOT NULL,
  revealed_slots INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  status VARCHAR(50) DEFAULT 'active',
  claim_status VARCHAR(50) DEFAULT 'unclaimed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  claimed_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scratch_tickets_player_id ON scratch_tickets(player_id);
CREATE INDEX IF NOT EXISTS idx_scratch_tickets_design_id ON scratch_tickets(design_id);
CREATE INDEX IF NOT EXISTS idx_scratch_tickets_status ON scratch_tickets(status);
CREATE INDEX IF NOT EXISTS idx_scratch_tickets_ticket_number ON scratch_tickets(ticket_number);

-- Detailed results of scratch ticket outcomes
CREATE TABLE IF NOT EXISTS scratch_ticket_results (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL UNIQUE REFERENCES scratch_tickets(id) ON DELETE CASCADE,
  design_id INTEGER NOT NULL REFERENCES scratch_ticket_designs(id),
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  won BOOLEAN NOT NULL,
  prize_amount DECIMAL(8, 2),
  winning_slot_index INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scratch_ticket_results_player_id ON scratch_ticket_results(player_id);
CREATE INDEX IF NOT EXISTS idx_scratch_ticket_results_design_id ON scratch_ticket_results(design_id);
CREATE INDEX IF NOT EXISTS idx_scratch_ticket_results_won ON scratch_ticket_results(won);

-- Transaction history for purchases and claims
CREATE TABLE IF NOT EXISTS scratch_ticket_transactions (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  ticket_id INTEGER REFERENCES scratch_tickets(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL,
  amount_sc DECIMAL(8, 2) NOT NULL,
  balance_before DECIMAL(15, 2),
  balance_after DECIMAL(15, 2),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scratch_ticket_transactions_player_id ON scratch_ticket_transactions(player_id);
CREATE INDEX IF NOT EXISTS idx_scratch_ticket_transactions_ticket_id ON scratch_ticket_transactions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_scratch_ticket_transactions_type ON scratch_ticket_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_scratch_ticket_transactions_created_at ON scratch_ticket_transactions(created_at);

-- ===== COINKRAZY PULL TAB LOTTERY TICKETS =====
-- Ticket design templates created by admins
CREATE TABLE IF NOT EXISTS pull_tab_designs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cost_sc DECIMAL(8, 2) NOT NULL,
  tab_count INTEGER NOT NULL DEFAULT 3,
  win_probability DECIMAL(5, 2) NOT NULL DEFAULT 20,
  prize_min_sc DECIMAL(8, 2) NOT NULL DEFAULT 1,
  prize_max_sc DECIMAL(8, 2) NOT NULL DEFAULT 20,
  image_url VARCHAR(500),
  background_color VARCHAR(7) DEFAULT '#FF6B35',
  winning_tab_text VARCHAR(100) DEFAULT 'WINNER!',
  losing_tab_text VARCHAR(100) DEFAULT 'TRY AGAIN',
  enabled BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pull_tab_designs_enabled ON pull_tab_designs(enabled);

-- Purchased pull tab tickets for individual players
CREATE TABLE IF NOT EXISTS pull_tab_tickets (
  id SERIAL PRIMARY KEY,
  design_id INTEGER NOT NULL REFERENCES pull_tab_designs(id),
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  tabs JSONB NOT NULL,
  revealed_tabs INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  winning_tab_index INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  claim_status VARCHAR(50) DEFAULT 'unclaimed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  claimed_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pull_tab_tickets_player_id ON pull_tab_tickets(player_id);
CREATE INDEX IF NOT EXISTS idx_pull_tab_tickets_design_id ON pull_tab_tickets(design_id);
CREATE INDEX IF NOT EXISTS idx_pull_tab_tickets_status ON pull_tab_tickets(status);
CREATE INDEX IF NOT EXISTS idx_pull_tab_tickets_ticket_number ON pull_tab_tickets(ticket_number);

-- Detailed results of pull tab outcomes
CREATE TABLE IF NOT EXISTS pull_tab_results (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL UNIQUE REFERENCES pull_tab_tickets(id) ON DELETE CASCADE,
  design_id INTEGER NOT NULL REFERENCES pull_tab_designs(id),
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  won BOOLEAN NOT NULL,
  prize_amount DECIMAL(8, 2),
  winning_tab_index INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pull_tab_results_player_id ON pull_tab_results(player_id);
CREATE INDEX IF NOT EXISTS idx_pull_tab_results_design_id ON pull_tab_results(design_id);
CREATE INDEX IF NOT EXISTS idx_pull_tab_results_won ON pull_tab_results(won);

-- Transaction history for purchases and claims
CREATE TABLE IF NOT EXISTS pull_tab_transactions (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  ticket_id INTEGER REFERENCES pull_tab_tickets(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL,
  amount_sc DECIMAL(8, 2) NOT NULL,
  balance_before DECIMAL(15, 2),
  balance_after DECIMAL(15, 2),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pull_tab_transactions_player_id ON pull_tab_transactions(player_id);
CREATE INDEX IF NOT EXISTS idx_pull_tab_transactions_ticket_id ON pull_tab_transactions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_pull_tab_transactions_type ON pull_tab_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_pull_tab_transactions_created_at ON pull_tab_transactions(created_at);

-- ===== CASINO GAME SPINS TRACKING =====
CREATE TABLE IF NOT EXISTS casino_game_spins (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_id VARCHAR(255) NOT NULL,
  game_name VARCHAR(255) NOT NULL,
  provider VARCHAR(100),
  bet_amount DECIMAL(15, 2) NOT NULL,
  winnings DECIMAL(15, 2) NOT NULL,
  balance_before DECIMAL(15, 2),
  balance_after DECIMAL(15, 2),
  result VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_casino_game_spins_player_id ON casino_game_spins(player_id);
CREATE INDEX IF NOT EXISTS idx_casino_game_spins_game_id ON casino_game_spins(game_id);
CREATE INDEX IF NOT EXISTS idx_casino_game_spins_created_at ON casino_game_spins(created_at);
CREATE INDEX IF NOT EXISTS idx_casino_game_spins_result ON casino_game_spins(result);
