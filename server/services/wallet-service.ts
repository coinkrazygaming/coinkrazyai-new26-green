import { Wallet } from "@shared/api";
import { emitWalletUpdate } from "../socket";

/**
 * WalletService is now a utility service for wallet operations and socket emissions.
 * The primary wallet data is stored in the database and managed through db/queries.ts
 * This service handles real-time notifications and socket emissions only.
 */
export class WalletService {
  /**
   * Emit a wallet update via Socket.IO to notify connected clients of balance changes
   * @param userId The player ID
   * @param wallet The updated wallet data
   */
  static notifyWalletUpdate(userId: string | number, wallet: Wallet): void {
    emitWalletUpdate(userId.toString(), {
      goldCoins: wallet.goldCoins,
      sweepsCoins: wallet.sweepsCoins,
      lastUpdated: new Date().toISOString()
    });
  }

  /**
   * Broadcast wallet update to all connected clients
   * @param wallet The wallet data to broadcast
   */
  static broadcastWalletUpdate(wallet: Wallet): void {
    emitWalletUpdate('broadcast', {
      goldCoins: wallet.goldCoins,
      sweepsCoins: wallet.sweepsCoins,
      lastUpdated: new Date().toISOString()
    });
  }
}
