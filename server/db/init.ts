import { query } from './connection';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

export const initializeDatabase = async () => {
  try {
    console.log('[DB] Initializing database...');

    // Read and execute schema
    const __dirname = import.meta.dirname;
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement);
        } catch (err: any) {
          // Log but don't fail on schema errors - the table might already exist with different schema
          // 42703 = column does not exist, 42701 = duplicate column, 42P07 = table exists, 42710 = type exists
          if (err.code === '42703' || err.code === '42701' || err.code === '42P07' || err.code === '42710') {
            console.log('[DB] Skipping schema statement (already exists):', err.message?.substring(0, 80));
          } else {
            throw err;
          }
        }
      }
    }

    console.log('[DB] Schema initialized successfully');

    // Read and execute migrations
    const migrationsPath = path.join(__dirname, 'migrations.sql');
    const migrations = fs.readFileSync(migrationsPath, 'utf-8');

    // Split and execute each statement
    const migrationStatements = migrations.split(';').filter(stmt => stmt.trim());

    for (const statement of migrationStatements) {
      if (statement.trim()) {
        try {
          await query(statement);
        } catch (err: any) {
          // Log but don't fail on migration errors - tables might already exist
          // 42703 = column does not exist, 42701 = duplicate column, 42P07 = table exists, 42710 = type exists
          if (err.code === '42703' || err.code === '42701' || err.code === '42P07' || err.code === '42710') {
            console.log('[DB] Skipping migration statement (already exists):', err.message?.substring(0, 80));
          } else {
            throw err;
          }
        }
      }
    }

    console.log('[DB] Migrations applied successfully');

    // Add description column to games table if it doesn't exist
    try {
      await query(`ALTER TABLE games ADD COLUMN description TEXT`);
      console.log('[DB] Added description column to games table');
    } catch (err: any) {
      if (err.code === '42701') {
        console.log('[DB] Description column already exists in games');
      } else {
        console.log('[DB] Schema check for games.description:', err.message?.substring(0, 100));
      }
    }

    // Add image_url column to games table if it doesn't exist
    try {
      await query(`ALTER TABLE games ADD COLUMN image_url VARCHAR(500)`);
      console.log('[DB] Added image_url column to games table');
    } catch (err: any) {
      if (err.code === '42701') {
        console.log('[DB] image_url column already exists in games');
      } else {
        console.log('[DB] Schema check for games.image_url:', err.message?.substring(0, 100));
      }
    }

    // Add bonus_sc column to store_packs table if it doesn't exist
    try {
      await query(`ALTER TABLE store_packs ADD COLUMN bonus_sc DECIMAL(15, 2) DEFAULT 0`);
      console.log('[DB] Added bonus_sc column to store_packs table');
    } catch (err: any) {
      if (err.code === '42701') {
        console.log('[DB] bonus_sc column already exists in store_packs');
      } else {
        console.log('[DB] Schema check for store_packs.bonus_sc:', err.message?.substring(0, 100));
      }
    }

    // Note: store_packs table uses 'display_order' column for sorting
    // No column rename needed - column names are consistent

    // Seed data if tables are empty
    await seedDatabase();
  } catch (error) {
    console.error('[DB] Initialization failed:', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    // Add password_hash column to players table if it doesn't exist
    console.log('[DB] Checking players table schema...');
    try {
      await query(`ALTER TABLE players ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT ''`);
      console.log('[DB] Added password_hash column to players table');
    } catch (err: any) {
      if (err.code === '42701') {
        // Column already exists
        console.log('[DB] Password hash column already exists');
      } else {
        console.log('[DB] Schema check for password_hash:', err.message?.substring(0, 100));
      }
    }

    // Add username column to players table if it doesn't exist
    try {
      await query(`ALTER TABLE players ADD COLUMN username VARCHAR(255) UNIQUE`);
      console.log('[DB] Added username column to players table');
    } catch (err: any) {
      if (err.code === '42701') {
        // Column already exists
        console.log('[DB] Username column already exists');
      } else {
        console.log('[DB] Schema check:', err.message?.substring(0, 100));
      }
    }

    // Update existing players to have usernames if they don't
    console.log('[DB] Ensuring players have usernames...');
    try {
      const playersWithoutUsername = await query(
        `SELECT id, name FROM players WHERE username IS NULL LIMIT 100`
      );

      for (const player of playersWithoutUsername.rows) {
        const username = player.name.toLowerCase().replace(/\s+/g, '') + player.id;
        await query(
          `UPDATE players SET username = $1 WHERE id = $2`,
          [username, player.id]
        );
      }

      if (playersWithoutUsername.rows.length > 0) {
        console.log(`[DB] Updated ${playersWithoutUsername.rows.length} players with usernames`);
      }
    } catch (err: any) {
      console.log('[DB] Username update:', err.message?.substring(0, 100));
    }

    // Apply welcome bonus to all players
    console.log('[DB] Applying welcome bonus to all players...');
    try {
      const bonusResult = await query(
        `UPDATE players SET gc_balance = GREATEST(gc_balance, 10000), sc_balance = GREATEST(sc_balance, 5) WHERE status = 'Active'`
      );
      console.log('[DB] Welcome bonus applied to players');
    } catch (err: any) {
      console.log('[DB] Welcome bonus update:', err.message?.substring(0, 100));
    }

    // Always ensure admin user exists
    console.log('[DB] Ensuring admin user exists...');
    const adminPassword = await bcrypt.hash('admin123', 10);

    try {
      await query(
        `INSERT INTO admin_users (email, password_hash, name, role, status)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
        ['coinkrazy26@gmail.com', adminPassword, 'CoinKrazy Admin', 'admin', 'Active']
      );
      console.log('[DB] Admin user coinkrazy26@gmail.com ensured');
    } catch (err: any) {
      console.log('[DB] Admin user setup:', err.message?.substring(0, 100));
    }

    // Check if players table has data
    const result = await query('SELECT COUNT(*) as count FROM players');

    if (result.rows[0].count === 0) {
      console.log('[DB] Seeding database with sample data...');

      // Seed players with proper bcrypt hashes (password: testpass123)
      const playerPassword = await bcrypt.hash('testpass123', 10);
      const players = [
        ['johndoe', 'John Doe', 'john@example.com', playerPassword, 5250, 125, 'Active', 'Full', true],
        ['janesmith', 'Jane Smith', 'jane@example.com', playerPassword, 12000, 340, 'Active', 'Full', true],
        ['mikejohnson', 'Mike Johnson', 'mike@example.com', playerPassword, 2100, 89, 'Active', 'Intermediate', true],
        ['sarahwilson', 'Sarah Wilson', 'sarah@example.com', playerPassword, 8500, 215, 'Active', 'Full', true],
        ['tombrown', 'Tom Brown', 'tom@example.com', playerPassword, 3200, 95, 'Suspended', 'Basic', false],
      ];

      for (const player of players) {
        try {
          await query(
            `INSERT INTO players (username, name, email, password_hash, gc_balance, sc_balance, status, kyc_level, kyc_verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            player
          );
        } catch (err: any) {
          // Player might already exist, that's okay
          if (err.code !== '23505') {
            throw err;
          }
        }
      }

      // Seed games
      const games = [
        ['Mega Spin Slots', 'Slots', 'Internal', 96.5, 'Medium', 'Classic 5-reel slot game with high payouts.', true],
        ['Diamond Poker Pro', 'Poker', 'Internal', 98.2, 'Low', 'Professional poker experience with high stakes.', true],
        ['Bingo Bonanza', 'Bingo', 'Internal', 94.8, 'High', 'Fast-paced bingo action with multiple rooms.', true],
        ['Fruit Frenzy', 'Slots', 'Internal', 95.0, 'Medium', 'Colorful fruit-themed slot machine.', false],
      ];

      for (const game of games) {
        await query(
          `INSERT INTO games (name, category, provider, rtp, volatility, description, enabled)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          game
        );
      }

      // Seed bonuses
      const bonuses = [
        ['Welcome Bonus 100%', 'Deposit', '$100', 100, 10, 1200],
        ['VIP Reload Bonus', 'Reload', '$50', 50, 50, 500],
        ['Free Spins 50', 'Free Spins', '50 Spins', null, 0, 2000],
      ];

      for (const bonus of bonuses) {
        await query(
          `INSERT INTO bonuses (name, type, amount, percentage, min_deposit, max_claims) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          bonus
        );
      }

      // Seed poker tables
      const pokerTables = [
        ['Diamond Table 1', '$1/$2', 8, 6, 20, 200],
        ['Ruby Table 2', '$5/$10', 8, 5, 100, 1000],
        ['Gold Table 1', '$10/$20', 6, 0, 200, 2000],
        ['Platinum VIP', '$50/$100', 6, 4, 1000, 10000],
      ];

      for (const table of pokerTables) {
        await query(
          `INSERT INTO poker_tables (name, stakes, max_players, current_players, buy_in_min, buy_in_max) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          table
        );
      }

      // Seed bingo games
      const bingoGames = [
        ['Morning Bonanza', '5-line', 42, 1, 500],
        ['Afternoon Special', 'Full Card', 28, 2, 1200],
        ['Evening Rush', '5-line', 0, 1.5, 750],
        ['Night Party', 'Corner', 0, 3, 2000],
      ];

      for (const game of bingoGames) {
        await query(
          `INSERT INTO bingo_games (name, pattern, players, ticket_price, jackpot) 
           VALUES ($1, $2, $3, $4, $5)`,
          game
        );
      }

      // Seed sports events
      const sportsEvents = [
        ['NFL', 'Chiefs vs 49ers', 'Live', 124500, '+2.5'],
        ['NBA', 'Lakers vs Celtics', 'Live', 89200, '-1.5'],
        ['Soccer', 'Manchester United vs Liverpool', 'Upcoming', 234100, '+0.5'],
        ['Tennis', 'Australian Open Final', 'Upcoming', 56800, null],
      ];

      for (const event of sportsEvents) {
        await query(
          `INSERT INTO sports_events (sport, event_name, status, total_bets, line_movement)
           VALUES ($1, $2, $3, $4, $5)`,
          event
        );
      }

      // Seed store packs
      const storePacks = [
        ['Starter Pack', 'Perfect for new players', 9.99, 1000, 0, 0, false, false, true, 1],
        ['Gold Bundle', 'Popular choice', 24.99, 3000, 500, 10, true, false, true, 2],
        ['Platinum Pack', 'Best value offer', 49.99, 7000, 2000, 20, false, true, true, 3],
        ['VIP Elite', 'Premium experience', 99.99, 15000, 5000, 30, false, false, true, 4],
        ['Mega Bonus', 'Limited time offer', 14.99, 2000, 200, 15, false, false, true, 5],
      ];

      for (const pack of storePacks) {
        await query(
          `INSERT INTO store_packs (title, description, price_usd, gold_coins, sweeps_coins, bonus_percentage, is_popular, is_best_value, enabled, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          pack
        );
      }

      // Seed achievements
      const achievements = [
        ['First Win', 'Win your first game', 'trophy', 'first_win', 'wins', 1, true],
        ['Big Winner', 'Win 100 times', 'crown', 'big_winner', 'wins', 100, true],
        ['High Roller', 'Wager 10,000 gold coins', 'gem', 'high_roller', 'wagered', 10000, true],
        ['Streaker', 'Get a 10 game winning streak', 'fire', 'streaker', 'streak', 10, true],
        ['Rich Player', 'Accumulate 50,000 gold coins', 'diamond', 'rich_player', 'balance', 50000, true],
        ['Slots Master', 'Play slots 500 times', 'star', 'slots_master', 'games_played', 500, true],
        ['Poker Pro', 'Play 100 poker hands', 'spade', 'poker_pro', 'games_played', 100, true],
      ];

      for (const achievement of achievements) {
        await query(
          `INSERT INTO achievements (name, description, icon_url, badge_name, requirement_type, requirement_value, enabled)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          achievement
        );
      }

      // Seed player stats (for seeded players)
      const playerIds = [1, 2, 3, 4];
      for (const playerId of playerIds) {
        await query(
          `INSERT INTO player_stats (player_id, total_wagered, total_won, games_played, favorite_game)
           VALUES ($1, $2, $3, $4, $5)`,
          [playerId, Math.random() * 50000, Math.random() * 25000, Math.floor(Math.random() * 500), 'Slots']
        );
      }

      // Seed scratch ticket designs
      const scratchDesigns = [
        ['Gold Rush', 'Scratch to find hidden gold!', 5, 6, 16.67, 1, 10, null, '#FFD700'],
        ['Lucky Clover', 'Find the 4-leaf clover and win big!', 2, 4, 20, 1, 5, null, '#4CAF50'],
        ['Diamond Dazzle', 'Diamonds are a player\'s best friend!', 10, 9, 15, 5, 10, null, '#00BCD4'],
      ];

      for (const design of scratchDesigns) {
        await query(
          `INSERT INTO scratch_ticket_designs (name, description, cost_sc, slot_count, win_probability, prize_min_sc, prize_max_sc, image_url, background_color)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          design
        );
      }

      // Seed pull tab designs
      const pullTabDesigns = [
        ['Orange Heat', 'Traditional pull tabs with big wins!', 5, 3, 20, 1, 10, null, '#FF6B35'],
        ['Midnight Stars', 'Pull the stars and reach for the moon!', 1, 3, 25, 1, 5, null, '#3F51B5'],
        ['Royal Jackpot', 'Only for the elite - massive prizes await!', 25, 5, 15, 5, 10, null, '#9C27B0'],
      ];

      for (const design of pullTabDesigns) {
        await query(
          `INSERT INTO pull_tab_designs (name, description, cost_sc, tab_count, win_probability, prize_min_sc, prize_max_sc, image_url, background_color)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          design
        );
      }

      console.log('[DB] Sample data seeded successfully');
    } else {
      console.log('[DB] Database already contains data, skipping main seed');
    }

    // Always ensure some designs exist for testing if table is empty
    const scratchCount = await query('SELECT COUNT(*) as count FROM scratch_ticket_designs');
    if (parseInt(scratchCount.rows[0].count) === 0) {
      console.log('[DB] Seeding scratch ticket designs...');
      const scratchDesigns = [
        ['Gold Rush', 'Scratch to find hidden gold!', 5, 6, 16.67, 1, 10, null, '#FFD700'],
        ['Lucky Clover', 'Find the 4-leaf clover and win big!', 2, 4, 20, 1, 5, null, '#4CAF50'],
        ['Diamond Dazzle', 'Diamonds are a player\'s best friend!', 10, 9, 15, 5, 10, null, '#00BCD4'],
      ];
      for (const design of scratchDesigns) {
        await query(
          `INSERT INTO scratch_ticket_designs (name, description, cost_sc, slot_count, win_probability, prize_min_sc, prize_max_sc, image_url, background_color)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          design
        );
      }
    }

    const pullTabCount = await query('SELECT COUNT(*) as count FROM pull_tab_designs');
    if (parseInt(pullTabCount.rows[0].count) === 0) {
      console.log('[DB] Seeding pull tab designs...');
      const pullTabDesigns = [
        ['Orange Heat', 'Traditional pull tabs with big wins!', 5, 3, 20, 1, 10, null, '#FF6B35'],
        ['Midnight Stars', 'Pull the stars and reach for the moon!', 1, 3, 25, 1, 5, null, '#3F51B5'],
        ['Royal Jackpot', 'Only for the elite - massive prizes await!', 25, 5, 15, 5, 10, null, '#9C27B0'],
      ];
      for (const design of pullTabDesigns) {
        await query(
          `INSERT INTO pull_tab_designs (name, description, cost_sc, tab_count, win_probability, prize_min_sc, prize_max_sc, image_url, background_color)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          design
        );
      }
    }

    const storePacksCount = await query('SELECT COUNT(*) as count FROM store_packs');
    if (parseInt(storePacksCount.rows[0].count) === 0) {
      console.log('[DB] Seeding store packs...');
      const storePacks = [
        ['Starter Pack', 'Perfect for new players', 9.99, 1000, 0, 0, false, false, true, 1],
        ['Gold Bundle', 'Popular choice', 24.99, 3000, 500, 10, true, false, true, 2],
        ['Platinum Pack', 'Best value offer', 49.99, 7000, 2000, 20, false, true, true, 3],
        ['VIP Elite', 'Premium experience', 99.99, 15000, 5000, 30, false, false, true, 4],
        ['Mega Bonus', 'Limited time offer', 14.99, 2000, 200, 15, false, false, true, 5],
      ];

      for (const pack of storePacks) {
        await query(
          `INSERT INTO store_packs (title, description, price_usd, gold_coins, sweeps_coins, bonus_percentage, is_popular, is_best_value, enabled, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          pack
        );
      }
    }

    // Ensure Pragmatic Play games exist
    const pragmaticCount = await query(
      'SELECT COUNT(*) as count FROM games WHERE provider = $1',
      ['Pragmatic']
    );

    if (parseInt(pragmaticCount.rows[0].count) === 0) {
      console.log('[DB] Seeding Pragmatic Play games...');
      const pragmaticGames = [
        ['Zeus vs Hades - Gods of War 250', 'Slots', 'Pragmatic', 96.5, 'High', 'Epic battle-themed slot with massive payouts', true],
        ['3 Magic Eggs', 'Slots', 'Pragmatic', 96.0, 'Medium', 'Magical eggs reveal hidden treasures', true],
        ['Cyber Heist City', 'Slots', 'Pragmatic', 96.7, 'High', 'High-tech heist adventure slot game', true],
        ['Big Bass Bonanza', 'Slots', 'Pragmatic', 96.7, 'High', 'Fishing-themed slot with big bonuses', true],
        ['Sweet Bonanza', 'Slots', 'Pragmatic', 96.48, 'High', 'Candy-filled slot with sweet wins', true],
        ['The Dog House', 'Slots', 'Pragmatic', 96.55, 'High', 'Dog-themed slot with expanding reels', true],
        ['Gates of Olympus', 'Slots', 'Pragmatic', 96.5, 'High', 'Greek mythology themed with multiplier features', true],
        ['Sugar Rush', 'Slots', 'Pragmatic', 96.0, 'Medium', 'Fast-paced sweet adventure slot', true],
        ['Bigger Bass Bonanza', 'Slots', 'Pragmatic', 96.7, 'High', 'Enhanced fishing experience with bigger rewards', true],
        ['Gates of Olympus 1000', 'Slots', 'Pragmatic', 96.5, 'High', 'Maximum multiplier version of Gates of Olympus', true],
        ['Lucky\'s Wild Pub 2', 'Slots', 'Pragmatic', 96.5, 'High', 'Irish pub adventure with wild features', true],
        ['Big Bass Raceday Repeat', 'Slots', 'Pragmatic', 96.7, 'High', 'Racing and fishing combined', true],
        ['Wild Skullz', 'Slots', 'Pragmatic', 96.0, 'Medium', 'Pirate-themed skull hunt slot', true],
        ['Tut\'s Treasure Tower', 'Slots', 'Pragmatic', 96.6, 'High', 'Egyptian tomb exploration with tower feature', true],
        ['Haunted Crypt', 'Slots', 'Pragmatic', 96.5, 'High', 'Spooky crypt with ghostly features', true],
        ['Rolling in Treasures', 'Slots', 'Pragmatic', 96.0, 'Medium', 'Treasure hunt themed slot game', true],
        ['Mummy\'s Jewels 100', 'Slots', 'Pragmatic', 96.2, 'Medium', 'Ancient mummy jewel collection', true],
        ['Smoke\'Em', 'Slots', 'Pragmatic', 96.5, 'Medium', 'Classic western slot with smoking wins', true],
        ['Treasures of Osiris', 'Slots', 'Pragmatic', 96.3, 'High', 'Ancient Egyptian treasure hunt', true],
        ['Emerald King - Wheel of Wealth', 'Slots', 'Pragmatic', 96.5, 'High', 'Royal emerald treasure with wheel bonus', true],
        ['Chests of Cai Shen', 'Slots', 'Pragmatic', 96.0, 'High', 'Asian-themed wealth slot game', true],
        ['Oodles of Noodles', 'Slots', 'Pragmatic', 96.0, 'Medium', 'Asian noodle-themed slot adventure', true],
        ['1GO Rush 1000', 'Slots', 'Pragmatic', 96.5, 'High', 'High-speed action slot', true],
        ['3 Buzzing Wilds', 'Slots', 'Pragmatic', 96.2, 'Medium', 'Bee-themed slot with wild features', true],
        ['3 Genie Wishes', 'Slots', 'Pragmatic', 96.5, 'High', 'Magical genie treasure slot', true],
        ['3 Kingdoms - Battle of Red Cliffs', 'Slots', 'Pragmatic', 96.3, 'High', 'Historical battle-themed slot', true],
        ['5 Frozen Charms Megaways', 'Slots', 'Pragmatic', 96.6, 'High', 'Frozen magic megaways adventure', true],
        ['5 Lions', 'Slots', 'Pragmatic', 96.8, 'High', 'Five lions symbol premium slot', true],
        ['5 Lions Dance', 'Slots', 'Pragmatic', 96.5, 'High', 'Dancing lions with bonus features', true],
        ['5 Lions Gold', 'Slots', 'Pragmatic', 96.7, 'High', 'Golden lions premium experience', true],
        ['5 Lions Megaways', 'Slots', 'Pragmatic', 96.8, 'High', 'Lions with megaways mechanic', true],
        ['5 Lions Megaways 2', 'Slots', 'Pragmatic', 96.8, 'High', 'Enhanced megaways sequel', true],
        ['5 Lions Reborn', 'Slots', 'Pragmatic', 96.5, 'High', 'Reborn lions with new features', true],
        ['5 Rabbits Megaways', 'Slots', 'Pragmatic', 96.2, 'High', 'Lucky rabbits megaways slot', true],
        ['6 Jokers', 'Slots', 'Pragmatic', 96.0, 'Medium', 'Classic joker-themed slot', true],
        ['7 Clovers of Fortune', 'Slots', 'Pragmatic', 96.3, 'Medium', 'Lucky clover fortune slot', true],
        ['7 Monkeys', 'Slots', 'Pragmatic', 96.5, 'High', 'Seven monkeys adventure slot', true],
        ['7 Piggies', 'Slots', 'Pragmatic', 96.0, 'Medium', 'Cute piggies themed slot', true],
        ['777 Rush', 'Slots', 'Pragmatic', 96.5, 'High', 'Triple sevens fast-paced action', true],
        ['8 Dragons', 'Slots', 'Pragmatic', 96.8, 'High', 'Eight dragons premium slot', true],
        ['8 Golden Dragon Challenge', 'Slots', 'Pragmatic', 96.7, 'High', 'Golden dragon challenge game', true],
        ['888 Big Bass Bonanza', 'Slots', 'Pragmatic', 96.7, 'High', 'Enhanced fishing bonanza', true],
        ['888 Bonanza', 'Slots', 'Pragmatic', 96.5, 'High', 'Triple eight bonanza slot', true],
        ['888 Dragons', 'Slots', 'Pragmatic', 96.8, 'High', 'Triple eight dragon slot', true],
        ['888 Gold', 'Slots', 'Pragmatic', 96.5, 'High', 'Triple eight gold premium', true],
        ['888 of Olympus', 'Slots', 'Pragmatic', 96.6, 'High', 'Olympus mythology with 888 theme', true],
        ['African Elephant', 'Slots', 'Pragmatic', 96.0, 'Medium', 'African wildlife adventure', true],
        ['Aladdin and the Sorcerer', 'Slots', 'Pragmatic', 96.4, 'High', 'Aladdin fantasy adventure slot', true],
        ['Aladdin\'s Treasure', 'Slots', 'Pragmatic', 96.2, 'High', 'Magical treasure hunt', true],
        ['Alien Invaders', 'Slots', 'Pragmatic', 96.3, 'Medium', 'Sci-fi alien invasion slot', true],
        ['Anaconda Gold', 'Slots', 'Pragmatic', 96.5, 'High', 'Snake-themed gold slot', true],
        ['Ancient Egypt', 'Slots', 'Pragmatic', 96.5, 'High', 'Classic Egyptian pyramid slot', true],
        ['Ancient Egypt Classic', 'Slots', 'Pragmatic', 96.0, 'Medium', 'Traditional Egyptian theme', true],
        ['Ancient Island Megaways', 'Slots', 'Pragmatic', 96.6, 'High', 'Island adventure megaways', true],
        ['Angel vs Sinner', 'Slots', 'Pragmatic', 96.4, 'High', 'Good vs evil battle slot', true],
        ['Angel vs Sinner Eternal Battle', 'Slots', 'Pragmatic', 96.5, 'High', 'Eternal battle premium', true],
        ['Animal Magic 1000', 'Slots', 'Pragmatic', 96.2, 'Medium', 'Animal magic transformation slot', true],
        ['Anime Cosplay VS', 'Slots', 'Pragmatic', 96.3, 'High', 'Anime character battle slot', true],
        ['Anime Mecha Megaways', 'Slots', 'Pragmatic', 96.7, 'High', 'Anime mecha megaways adventure', true],
        ['Argonauts', 'Slots', 'Pragmatic', 96.5, 'High', 'Greek mythology adventure', true],
        ['Asgard', 'Slots', 'Pragmatic', 96.4, 'High', 'Norse mythology Asgard slot', true],
        ['Aztec Blaze', 'Slots', 'Pragmatic', 96.5, 'High', 'Aztec fire and gold', true],
        ['Aztec Bonanza', 'Slots', 'Pragmatic', 96.3, 'High', 'Aztec treasure bonanza', true],
        ['Aztec Gems', 'Slots', 'Pragmatic', 96.5, 'Medium', 'Aztec precious gems', true],
        ['Aztec Gems Deluxe', 'Slots', 'Pragmatic', 96.6, 'Medium', 'Deluxe gem version', true],
        ['Aztec Gems Megaways', 'Slots', 'Pragmatic', 96.7, 'High', 'Megaways gem adventure', true],
        ['Aztec Powernudge', 'Slots', 'Pragmatic', 96.4, 'High', 'Aztec power nudge mechanics', true],
        ['Aztec Smash', 'Slots', 'Pragmatic', 96.5, 'High', 'Aztec smashing wins', true],
        ['Aztec Treasure Hunt', 'Slots', 'Pragmatic', 96.3, 'High', 'Treasure hunting adventure', true],
        ['Badge Blitz', 'Slots', 'Pragmatic', 96.2, 'Medium', 'Badge-themed fast action', true],
        ['Bali Dragon', 'Slots', 'Pragmatic', 96.5, 'High', 'Bali island dragon', true],
        ['Bandit Megaways', 'Slots', 'Pragmatic', 96.6, 'High', 'Outlaw bandit megaways', true],
        ['Barbar', 'Slots', 'Pragmatic', 96.0, 'Medium', 'Barbarian warrior slot', true],
        ['Barn Festival', 'Slots', 'Pragmatic', 96.3, 'Medium', 'Farm celebration slot', true],
        ['Barnyard Megahays Megaways', 'Slots', 'Pragmatic', 96.7, 'High', 'Farm megaways adventure', true],
        ['Barong Rico', 'Slots', 'Pragmatic', 96.4, 'High', 'Barong dance rich experience', true],
        ['Battle Ground Zero Megaways', 'Slots', 'Pragmatic', 96.8, 'High', 'Battlefield megaways battle', true],
        ['Bee Keeper', 'Slots', 'Pragmatic', 96.2, 'Medium', 'Beekeeping adventure slot', true],
        ['Beowulf', 'Slots', 'Pragmatic', 96.5, 'High', 'Epic Beowulf tale', true],
        ['Bets10 Bonanza', 'Slots', 'Pragmatic', 96.3, 'High', 'Betting bonanza features', true],
        ['Beware The Deep Megaways', 'Slots', 'Pragmatic', 96.6, 'High', 'Ocean depths megaways', true],
        ['Big Bass - Hold & Spinner', 'Slots', 'Pragmatic', 96.7, 'High', 'Hold and spin fishing', true],
        ['Big Bass - Secrets of the Golden Lake', 'Slots', 'Pragmatic', 96.7, 'High', 'Lake treasure secrets', true],
        ['Big Bass 3 Little Fish – Big Bass Jackpot Bonanza', 'Slots', 'Pragmatic', 96.7, 'High', 'Combined fishing adventure', true],
        ['Big Bass Amazon Xtreme', 'Slots', 'Pragmatic', 96.7, 'High', 'Extreme Amazon fishing', true],
      ];

      for (const game of pragmaticGames) {
        try {
          await query(
            `INSERT INTO games (name, category, provider, rtp, volatility, description, enabled)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            game
          );
        } catch (err: any) {
          // Game might already exist, that's okay
          if (err.code !== '23505') {
            console.log('[DB] Error seeding game:', err.message?.substring(0, 100));
          }
        }
      }
      console.log('[DB] Pragmatic Play games seeded successfully');
    } else {
      console.log('[DB] Pragmatic games already exist, skipping seed');
    }
  } catch (error) {
    console.error('[DB] Seeding failed:', error);
    throw error;
  }
};

// Export initialization for manual run if needed
export default initializeDatabase;
