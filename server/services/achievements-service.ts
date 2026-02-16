import * as dbQueries from '../db/queries';
import { query } from '../db/connection';

export class AchievementsService {
  /**
   * Check if a player meets a specific achievement requirement
   */
  static async checkAchievementRequirement(
    playerId: number,
    requirementType: string,
    requirementValue: number
  ): Promise<boolean> {
    try {
      switch (requirementType) {
        case 'balance':
          return await this.checkBalance(playerId, requirementValue);

        case 'gc_balance':
          return await this.checkGoldCoinBalance(playerId, requirementValue);

        case 'sc_balance':
          return await this.checkSweepsCoinBalance(playerId, requirementValue);

        case 'games_played':
          return await this.checkGamesPlayed(playerId, requirementValue);

        case 'slots_games':
          return await this.checkSlotsGamesPlayed(playerId, requirementValue);

        case 'poker_games':
          return await this.checkPokerGamesPlayed(playerId, requirementValue);

        case 'bingo_games':
          return await this.checkBingoGamesPlayed(playerId, requirementValue);

        case 'wins':
          return await this.checkWins(playerId, requirementValue);

        case 'slots_wins':
          return await this.checkSlotsWins(playerId, requirementValue);

        case 'bingo_wins':
          return await this.checkBingoWins(playerId, requirementValue);

        case 'poker_wins':
          return await this.checkPokerWins(playerId, requirementValue);

        case 'total_wagered':
          return await this.checkTotalWagered(playerId, requirementValue);

        case 'total_winnings':
          return await this.checkTotalWinnings(playerId, requirementValue);

        case 'kyc_verified':
          return await this.checkKYCVerified(playerId);

        case 'consecutive_days':
          return await this.checkConsecutiveDays(playerId, requirementValue);

        default:
          return false;
      }
    } catch (error) {
      console.error('[Achievements] Check requirement error:', error);
      return false;
    }
  }

  private static async checkBalance(playerId: number, amount: number): Promise<boolean> {
    const player = await dbQueries.getPlayerById(playerId);
    if (player.rows.length === 0) return false;
    const totalBalance = player.rows[0].gc_balance + player.rows[0].sc_balance;
    return totalBalance >= amount;
  }

  private static async checkGoldCoinBalance(playerId: number, amount: number): Promise<boolean> {
    const player = await dbQueries.getPlayerById(playerId);
    if (player.rows.length === 0) return false;
    return player.rows[0].gc_balance >= amount;
  }

  private static async checkSweepsCoinBalance(playerId: number, amount: number): Promise<boolean> {
    const player = await dbQueries.getPlayerById(playerId);
    if (player.rows.length === 0) return false;
    return player.rows[0].sc_balance >= amount;
  }

  private static async checkGamesPlayed(playerId: number, count: number): Promise<boolean> {
    // Total games across all types
    const slots = await query(
      'SELECT COUNT(*) as count FROM slots_results WHERE player_id = $1',
      [playerId]
    );
    const poker = await query(
      'SELECT COUNT(*) as count FROM poker_results WHERE player_id = $1',
      [playerId]
    );
    const bingo = await query(
      'SELECT COUNT(*) as count FROM bingo_results WHERE player_id = $1',
      [playerId]
    );
    const sports = await query(
      'SELECT COUNT(*) as count FROM sports_bets WHERE player_id = $1',
      [playerId]
    );

    const total =
      (slots.rows[0]?.count || 0) +
      (poker.rows[0]?.count || 0) +
      (bingo.rows[0]?.count || 0) +
      (sports.rows[0]?.count || 0);

    return total >= count;
  }

  private static async checkSlotsGamesPlayed(playerId: number, count: number): Promise<boolean> {
    const result = await query(
      'SELECT COUNT(*) as count FROM slots_results WHERE player_id = $1',
      [playerId]
    );
    return (result.rows[0]?.count || 0) >= count;
  }

  private static async checkPokerGamesPlayed(playerId: number, count: number): Promise<boolean> {
    const result = await query(
      'SELECT COUNT(*) as count FROM poker_results WHERE player_id = $1',
      [playerId]
    );
    return (result.rows[0]?.count || 0) >= count;
  }

  private static async checkBingoGamesPlayed(playerId: number, count: number): Promise<boolean> {
    const result = await query(
      'SELECT COUNT(*) as count FROM bingo_results WHERE player_id = $1',
      [playerId]
    );
    return (result.rows[0]?.count || 0) >= count;
  }

  private static async checkWins(playerId: number, count: number): Promise<boolean> {
    // Count wins across all games (winnings > bet)
    const slots = await query(
      'SELECT COUNT(*) as count FROM slots_results WHERE player_id = $1 AND winnings > bet_amount',
      [playerId]
    );
    const poker = await query(
      'SELECT COUNT(*) as count FROM poker_results WHERE player_id = $1 AND profit > 0',
      [playerId]
    );
    const bingo = await query(
      'SELECT COUNT(*) as count FROM bingo_results WHERE player_id = $1 AND winnings > 0',
      [playerId]
    );

    const total =
      (slots.rows[0]?.count || 0) +
      (poker.rows[0]?.count || 0) +
      (bingo.rows[0]?.count || 0);

    return total >= count;
  }

  private static async checkSlotsWins(playerId: number, count: number): Promise<boolean> {
    const result = await query(
      'SELECT COUNT(*) as count FROM slots_results WHERE player_id = $1 AND winnings > bet_amount',
      [playerId]
    );
    return (result.rows[0]?.count || 0) >= count;
  }

  private static async checkBingoWins(playerId: number, count: number): Promise<boolean> {
    const result = await query(
      'SELECT COUNT(*) as count FROM bingo_results WHERE player_id = $1 AND winnings > 0',
      [playerId]
    );
    return (result.rows[0]?.count || 0) >= count;
  }

  private static async checkPokerWins(playerId: number, count: number): Promise<boolean> {
    const result = await query(
      'SELECT COUNT(*) as count FROM poker_results WHERE player_id = $1 AND profit > 0',
      [playerId]
    );
    return (result.rows[0]?.count || 0) >= count;
  }

  private static async checkTotalWagered(playerId: number, amount: number): Promise<boolean> {
    const result = await query(
      `SELECT COALESCE(SUM(bet_amount), 0) as total 
       FROM slots_results 
       WHERE player_id = $1`,
      [playerId]
    );
    return (result.rows[0]?.total || 0) >= amount;
  }

  private static async checkTotalWinnings(playerId: number, amount: number): Promise<boolean> {
    const result = await query(
      `SELECT COALESCE(SUM(winnings), 0) as total 
       FROM slots_results 
       WHERE player_id = $1`,
      [playerId]
    );
    return (result.rows[0]?.total || 0) >= amount;
  }

  private static async checkKYCVerified(playerId: number): Promise<boolean> {
    const player = await dbQueries.getPlayerById(playerId);
    if (player.rows.length === 0) return false;
    return player.rows[0].kyc_verified === true;
  }

  private static async checkConsecutiveDays(playerId: number, days: number): Promise<boolean> {
    // Get player's login dates
    const result = await query(
      `SELECT DISTINCT DATE(last_login) as login_date 
       FROM players 
       WHERE id = $1 AND last_login >= NOW() - INTERVAL '1 day' * $2
       ORDER BY login_date DESC`,
      [playerId, days]
    );

    // Check if there are consecutive days
    if (result.rows.length < days) return false;

    // For simplicity, check if player has logged in in the last N days
    return result.rows.length >= days;
  }

  /**
   * Check and award all achievable achievements for a player
   */
  static async checkAndAwardAchievements(playerId: number): Promise<any[]> {
    try {
      const earnedAchievements = [];

      // Get all enabled achievements
      const achievementsResult = await query(
        'SELECT * FROM achievements WHERE enabled = true'
      );

      // Get player's already earned achievements
      const earnedResult = await query(
        'SELECT achievement_id FROM player_achievements WHERE player_id = $1',
        [playerId]
      );

      const earnedIds = new Set(earnedResult.rows.map((r: any) => r.achievement_id));

      // Check each achievement
      for (const achievement of achievementsResult.rows) {
        // Skip if already earned
        if (earnedIds.has(achievement.id)) {
          continue;
        }

        // Check if requirement is met
        const isMet = await this.checkAchievementRequirement(
          playerId,
          achievement.requirement_type,
          achievement.requirement_value
        );

        if (isMet) {
          // Award the achievement
          const result = await dbQueries.awardAchievement(playerId, achievement.id);
          if (result.rows.length > 0) {
            earnedAchievements.push(achievement);
          }
        }
      }

      return earnedAchievements;
    } catch (error) {
      console.error('[Achievements] Check and award error:', error);
      return [];
    }
  }
}
