import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';

export interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Generic hook for fetching data from API
 */
export function useApiData<T>(
  fetchFn: () => Promise<{ success: boolean; data: T }>,
  dependencies: any[] = [],
  autoFetch: boolean = true
) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const result = await fetchFn();
      setState({
        data: result.data,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }, [fetchFn]);

  useEffect(() => {
    if (autoFetch) {
      refetch();
    }
  }, dependencies);

  return { ...state, refetch };
}

/**
 * Hook for games (slots, casino)
 */
export function useGames() {
  const { isAuthenticated } = useAuth();
  return useApiData(
    () => import('./api').then(m => m.games.getGames()),
    [isAuthenticated],
    isAuthenticated
  );
}

/**
 * Hook for poker tables
 */
export function usePokerTables() {
  const { isAuthenticated } = useAuth();
  return useApiData(
    () => import('./api').then(m => m.poker.getTables()),
    [isAuthenticated],
    isAuthenticated
  );
}

/**
 * Hook for bingo rooms
 */
export function useBingoRooms() {
  const { isAuthenticated } = useAuth();
  return useApiData(
    () => import('./api').then(m => m.bingo.getRooms()),
    [isAuthenticated],
    isAuthenticated
  );
}

/**
 * Hook for leaderboards
 */
export function useLeaderboards() {
  const { isAuthenticated } = useAuth();
  return useApiData(
    () => import('./api').then(m => m.leaderboards.getLeaderboard()),
    [isAuthenticated],
    isAuthenticated
  );
}

/**
 * Hook for user's rank
 */
export function useMyRank() {
  const { isAuthenticated } = useAuth();
  return useApiData(
    () => import('./api').then(m => m.leaderboards.getMyRank()),
    [isAuthenticated],
    isAuthenticated
  );
}

/**
 * Hook for achievements
 */
export function useAchievements() {
  const { isAuthenticated } = useAuth();
  return useApiData(
    () => import('./api').then(m => m.achievements.getAll()),
    [isAuthenticated],
    isAuthenticated
  );
}

/**
 * Hook for user's achievements
 */
export function useMyAchievements() {
  const { isAuthenticated } = useAuth();
  return useApiData(
    () => import('./api').then(m => m.achievements.getMyAchievements()),
    [isAuthenticated],
    isAuthenticated
  );
}

/**
 * Hook for sportsbook games
 */
export function useSportsbookGames() {
  const { isAuthenticated } = useAuth();
  return useApiData(
    () => import('./api').then(m => m.sportsbook.getLiveGames()),
    [isAuthenticated],
    isAuthenticated
  );
}

/**
 * Hook for pull tabs
 */
export function usePullTabs() {
  const { isAuthenticated } = useAuth();
  return useApiData(
    () => import('./api').then(m => m.games.getGames()),
    [isAuthenticated],
    isAuthenticated
  );
}

/**
 * Hook for wallet balance
 */
export function useWallet() {
  const { isAuthenticated } = useAuth();
  return useApiData(
    () => import('./api').then(m => m.wallet.getBalance()),
    [isAuthenticated],
    isAuthenticated
  );
}

/**
 * Hook for wallet transactions
 */
export function useWalletTransactions() {
  const { isAuthenticated } = useAuth();
  return useApiData(
    () => import('./api').then(m => m.wallet.getTransactions()),
    [isAuthenticated],
    isAuthenticated
  );
}
