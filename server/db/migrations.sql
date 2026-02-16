-- ===== SOCIAL SHARING TABLE =====
CREATE TABLE IF NOT EXISTS social_shares (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id),
  win_amount DECIMAL(15, 2) NOT NULL,
  game_name VARCHAR(255),
  platform VARCHAR(50) NOT NULL, -- 'facebook', 'twitter', 'instagram', etc
  message TEXT,
  shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  share_link VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_social_shares_player_id ON social_shares(player_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_platform ON social_shares(platform);
CREATE INDEX IF NOT EXISTS idx_social_shares_created_at ON social_shares(created_at);

-- ===== SOCIAL SHARE RESPONSES TABLE =====
CREATE TABLE IF NOT EXISTS social_share_responses (
  id SERIAL PRIMARY KEY,
  social_share_id INTEGER NOT NULL REFERENCES social_shares(id) ON DELETE CASCADE,
  response_type VARCHAR(50) NOT NULL, -- 'like', 'comment', 'share', 'click'
  response_data JSONB,
  respondent_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_social_share_responses_share_id ON social_share_responses(social_share_id);

-- ===== DAILY LOGIN BONUS TABLE =====
CREATE TABLE IF NOT EXISTS daily_login_bonuses (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  bonus_day INTEGER DEFAULT 1, -- Day 1, 2, 3, etc
  amount_sc DECIMAL(15, 2) NOT NULL,
  amount_gc INTEGER DEFAULT 0,
  claimed_at TIMESTAMP,
  next_available_at TIMESTAMP,
  streak_count INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'available', -- 'available', 'claimed', 'expired'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_login_bonuses_player_id ON daily_login_bonuses(player_id);
CREATE INDEX IF NOT EXISTS idx_daily_login_bonuses_next_available ON daily_login_bonuses(next_available_at);

-- ===== REFERRAL LINKS TABLE =====
CREATE TABLE IF NOT EXISTS referral_links (
  id SERIAL PRIMARY KEY,
  referrer_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  unique_code VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  total_referral_bonus DECIMAL(15, 2) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_referral_links_referrer_id ON referral_links(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON referral_links(unique_code);

-- ===== REFERRAL CLAIMS TABLE =====
CREATE TABLE IF NOT EXISTS referral_claims (
  id SERIAL PRIMARY KEY,
  referrer_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  referred_player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  referral_code VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  referral_bonus_sc DECIMAL(15, 2) DEFAULT 0,
  referral_bonus_gc INTEGER DEFAULT 0,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(referrer_id, referred_player_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_claims_referrer_id ON referral_claims(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_claims_referred_player_id ON referral_claims(referred_player_id);

-- ===== PAYMENT METHODS TABLE =====
CREATE TABLE IF NOT EXISTS player_payment_methods (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  method_type VARCHAR(50) NOT NULL, -- 'bank', 'paypal', 'cashapp'
  is_primary BOOLEAN DEFAULT FALSE,
  -- Bank details (encrypted)
  bank_account_holder VARCHAR(255),
  bank_name VARCHAR(255),
  account_number VARCHAR(255), -- encrypted
  routing_number VARCHAR(255), -- encrypted
  account_type VARCHAR(50), -- 'checking', 'savings'
  -- PayPal
  paypal_email VARCHAR(255),
  -- Cash App
  cashapp_handle VARCHAR(255),
  -- General
  is_verified BOOLEAN DEFAULT FALSE,
  verification_method VARCHAR(100), -- 'microdeposit', 'email', 'phone'
  verified_at TIMESTAMP,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_player_payment_methods_player_id ON player_payment_methods(player_id);
CREATE INDEX IF NOT EXISTS idx_player_payment_methods_primary ON player_payment_methods(player_id, is_primary);

-- ===== SALES TRANSACTIONS TABLE =====
CREATE TABLE IF NOT EXISTS sales_transactions (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_type VARCHAR(50) NOT NULL, -- 'scratch_ticket', 'pull_tab'
  design_id INTEGER,
  purchase_cost_sc DECIMAL(15, 2) NOT NULL,
  win_amount_sc DECIMAL(15, 2) DEFAULT 0,
  net_amount_sc DECIMAL(15, 2), -- purchase_cost - win_amount
  transaction_status VARCHAR(50) DEFAULT 'completed', -- 'completed', 'cancelled', 'refunded'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_transactions_player_id ON sales_transactions(player_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_game_type ON sales_transactions(game_type);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_created_at ON sales_transactions(created_at);

-- ===== SALES SUMMARY VIEW =====
CREATE OR REPLACE VIEW sales_summary AS
SELECT 
  DATE(created_at) as sale_date,
  game_type,
  COUNT(*) as total_sales,
  SUM(purchase_cost_sc) as total_revenue_sc,
  SUM(win_amount_sc) as total_payouts_sc,
  SUM(net_amount_sc) as net_profit_sc,
  AVG(purchase_cost_sc) as avg_purchase_cost,
  AVG(win_amount_sc) as avg_win_amount
FROM sales_transactions
GROUP BY DATE(created_at), game_type;

-- ===== ADMIN NOTIFICATIONS TABLE =====
CREATE TABLE IF NOT EXISTS admin_notifications (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  ai_employee_id VARCHAR(255), -- 'LuckyAI', 'SlotsAI', etc
  message_type VARCHAR(50) NOT NULL, -- 'alert', 'request', 'report', 'task'
  subject VARCHAR(255),
  message TEXT NOT NULL,
  related_player_id INTEGER REFERENCES players(id),
  related_game_id INTEGER REFERENCES games(id),
  priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'denied', 'in_progress', 'completed'
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin_id ON admin_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON admin_notifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);

-- ===== NOTIFICATION ACTIONS TABLE =====
CREATE TABLE IF NOT EXISTS notification_actions (
  id SERIAL PRIMARY KEY,
  notification_id INTEGER NOT NULL REFERENCES admin_notifications(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- 'approve', 'deny', 'assign', 'answer', 'resolve'
  action_data JSONB, -- stores which AI employee assigned, answer text, etc
  taken_by_admin_id INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_actions_notification_id ON notification_actions(notification_id);

-- ===== USER MESSAGES TABLE =====
CREATE TABLE IF NOT EXISTS user_messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  recipient_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  admin_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'general', -- 'general', 'support', 'notification', 'system'
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_messages_sender_id ON user_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_recipient_id ON user_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_is_read ON user_messages(is_read);

-- ===== BETTING LIMITS CONFIG TABLE =====
CREATE TABLE IF NOT EXISTS betting_limits_config (
  id SERIAL PRIMARY KEY,
  game_type VARCHAR(50) NOT NULL, -- 'slots', 'casino', 'scratch', 'pull_tabs', 'sportsbook'
  min_bet_sc DECIMAL(8, 2) NOT NULL,
  max_bet_sc DECIMAL(8, 2) NOT NULL,
  max_win_per_spin_sc DECIMAL(8, 2) NOT NULL,
  min_redemption_sc DECIMAL(15, 2) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default limits
INSERT INTO betting_limits_config (game_type, min_bet_sc, max_bet_sc, max_win_per_spin_sc, min_redemption_sc)
VALUES 
  ('slots', 0.01, 5.00, 20.00, 100.00),
  ('casino', 0.01, 5.00, 20.00, 100.00),
  ('scratch', 0.01, 5.00, 20.00, 100.00),
  ('pull_tabs', 0.01, 5.00, 20.00, 100.00),
  ('sportsbook', 0.01, 5.00, 20.00, 100.00)
ON CONFLICT DO NOTHING;

-- ===== KYC ONBOARDING STATUS TABLE =====
CREATE TABLE IF NOT EXISTS kyc_onboarding_progress (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1, -- 1, 2, 3, etc
  identity_verified BOOLEAN DEFAULT FALSE,
  address_verified BOOLEAN DEFAULT FALSE,
  payment_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  last_prompted_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kyc_onboarding_player_id ON kyc_onboarding_progress(player_id);
