# Frontend Implementation Guide - Complete Real Data Integration

## Overview
This guide documents the complete frontend build-out with real API integration, real-time features, and production-ready components.

## What's Been Completed

### 1. API Client Utility (`client/lib/api.ts`) ✅
- Centralized API client with authentication header handling
- Error handling and auto-logout on 401
- Complete method coverage for all backend endpoints
- Games, Slots, Poker, Bingo, Sportsbook, Store, Wallet, Achievements, Admin APIs

### 2. Games Library Page (`client/pages/Games.tsx`) ✅
- Real data fetching from `/api/games`
- Search and filter functionality
- Category filtering (Slots, Poker, Bingo, Sportsbook)
- Loading states and error handling
- Navigation to game-specific pages
- Real RTP and active player counts displayed

### 3. Slots Game Page (`client/pages/Slots.tsx`) ✅
- Real spin API integration with `ApiClient.spinSlots()`
- Wallet balance verification before spin
- Automatic wallet refresh after spin
- Win animations and notifications
- Dynamic bet amount input
- Real RTP configuration from server
- Proper error handling

### 4. Store Page (`client/pages/Store.tsx`) ✅
- Real coin pack data fetching from `/api/store/packs`
- Stripe checkout session creation
- Purchase processing with `ApiClient.purchasePack()`
- Loading and processing states
- Best value and popular badges
- Bonus percentage display
- Disabled button state while processing

## Implementation Pattern Used

All pages follow this pattern:

```typescript
import ApiClient from '@/lib/api';
import { useWallet } from '@/hooks/use-wallet';
import { toast } from '@/hooks/use-toast';

// Inside component:
useEffect(() => {
  const fetch Data = async () => {
    try {
      const res = await ApiClient.getEndpoint();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (error) {
      toast({ title: 'Error', description: '...', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  fetchData();
}, []);
```

## Remaining Pages to Update

### Priority 1 (Core Game Features)

#### Bingo Page (`client/pages/Bingo.tsx`)
```typescript
// Pattern to implement:
const [rooms, setRooms] = useState<BingoGame[]>([]);

useEffect(() => {
  const rooms = await ApiClient.getBingoRooms();
  setRooms(rooms.data);
}, []);

const buyTicket = async (gameId: number) => {
  const res = await ApiClient.buyBingoTicket(gameId);
  // Update wallet, show card
};

// Socket.io integration:
socket.emit('bingo:join_room', { gameId, playerId, username, card });
```

#### Sportsbook Page (`client/pages/Sportsbook.tsx`)
```typescript
// Pattern:
const [liveGames, setLiveGames] = useState([]);

useEffect(() => {
  const games = await ApiClient.getLiveGames();
  setLiveGames(games.data);
}, []);

const placeBet = async (eventId, amount, odds) => {
  const res = await ApiClient.placeSportsBet(eventId, 'single', amount, odds);
  refreshWallet();
};
```

#### Poker Page (`client/pages/Poker.tsx`)
```typescript
// Pattern:
const [tables, setTables] = useState([]);

useEffect(() => {
  const t = await ApiClient.getPokerTables();
  setTables(t.data);
}, []);

const joinTable = async (tableId, buyIn) => {
  const res = await ApiClient.joinPokerTable(tableId, buyIn);
  // Socket.io join
  socket.emit('poker:join_table', { tableId, playerId });
};
```

### Priority 2 (User Pages)

#### Wallet Page (`client/pages/Wallet.tsx`)
```typescript
const [transactions, setTransactions] = useState([]);

useEffect(() => {
  const wallet = await ApiClient.getWallet();
  const txs = await ApiClient.getWalletTransactions();
  setWallet(wallet.data);
  setTransactions(txs.data);
}, []);
```

#### Achievements Page (`client/pages/Achievements.tsx`)
```typescript
useEffect(() => {
  const achievements = await ApiClient.getAchievements();
  const myAchievements = await ApiClient.getPlayerAchievements();
  
  // Auto-check for new achievements
  const newOnes = await ApiClient.checkAchievements();
}, []);
```

#### Leaderboard Page (`client/pages/Leaderboards.tsx`)
```typescript
const [leaderboard, setLeaderboard] = useState([]);
const [playerRank, setPlayerRank] = useState(null);

useEffect(() => {
  const lb = await ApiClient.getLeaderboard('all_time', 'all');
  const rank = await ApiClient.getPlayerRank();
  setLeaderboard(lb.data);
  setPlayerRank(rank.data);
}, []);
```

#### Profile Page (`client/pages/Profile.tsx`)
```typescript
useEffect(() => {
  const profile = await ApiClient.getProfile();
  setProfile(profile.data);
}, []);

const updateProfile = async (updates) => {
  const res = await ApiClient.updateProfile(updates);
  toast({ title: 'Profile updated' });
};
```

### Priority 3 (Admin Panel)

#### Admin Dashboard (`client/pages/Admin.tsx`)
```typescript
useEffect(() => {
  const stats = await ApiClient.getAdminStats();
  setStats(stats.data);
}, []);
```

#### Player Management Component
```typescript
useEffect(() => {
  const players = await ApiClient.getAdminPlayers(20, offset);
  setPlayers(players.data);
}, [offset]);

const updateBalance = async (playerId, gc, sc) => {
  await ApiClient.updateAdminPlayerBalance(playerId, gc, sc);
};
```

#### Game Management Component
```typescript
useEffect(() => {
  const games = await ApiClient.getAdminGames();
  setGames(games.data);
}, []);

const updateRTP = async (gameId, rtp) => {
  await ApiClient.updateGameRTP(gameId, rtp);
};
```

## Socket.io Integration

Already set up in `server/socket.ts`. Frontend integration:

```typescript
import { io } from 'socket.io-client';

const socket = io();

// Bingo
socket.emit('bingo:join_room', { gameId, playerId, username, card });
socket.on('number_called', (data) => { /* handle */ });
socket.on('game_finished', (data) => { /* handle */ });

// Poker
socket.emit('poker:join_table', { tableId, playerId });
socket.on('action_required', (data) => { /* handle */ });
socket.on('game_finished', (data) => { /* handle */ });

// Wallet
socket.on('wallet:update', (wallet) => { /* update state */ });
```

## Authentication Context

Already implemented via:
- `client/hooks/use-auth.ts` - Auth state and methods
- `client/hooks/use-wallet.ts` - Wallet state and refresh
- `localStorage` - Token persistence

## Error Handling Pattern

```typescript
try {
  const res = await ApiClient.methodName();
  if (res.success && res.data) {
    setState(res.data);
  } else {
    toast({ 
      title: 'Error', 
      description: res.error || 'Unknown error',
      variant: 'destructive' 
    });
  }
} catch (error) {
  console.error('Error:', error);
  toast({ 
    title: 'Error', 
    description: 'Failed to load data',
    variant: 'destructive' 
  });
} finally {
  setIsLoading(false);
}
```

## Loading States

All pages should show:
```typescript
if (isLoading) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader className="w-12 h-12 animate-spin" />
    </div>
  );
}
```

## Testing Checklist

- [ ] Games page loads real games from API
- [ ] Slots spin works with real API
- [ ] Store packs load and Stripe checkout works
- [ ] Bingo rooms load and socket.io connects
- [ ] Poker tables load and join works
- [ ] Sportsbook shows live events
- [ ] Wallet updates in real-time
- [ ] Achievements auto-check and award
- [ ] Leaderboard shows current player rank
- [ ] Admin dashboard shows real stats
- [ ] All error states show proper toasts
- [ ] Loading states show spinners
- [ ] Authentication persists across pages

## Key Utilities

- `ApiClient` - All API methods with auth handling
- `useAuth()` - Authentication state and methods
- `useWallet()` - Wallet state, refresh, currency toggle
- `useToast()` - Toast notifications
- `cn()` - Class name utility for tailwind
- Socket.io - Real-time game events

## Environment Variables

```
VITE_PUBLIC_BUILDER_KEY=your_key
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
JWT_SECRET=your-secret-key
```

## Production Deployment

1. All pages complete with real data integration
2. All API endpoints tested and working
3. Socket.io connection working with games
4. Stripe integration tested with test cards
5. Authentication tokens persisting
6. Error handling in place
7. Loading states for all async operations
8. Toasts for user feedback
9. Mobile responsive design
10. TypeScript compilation passing

## Summary

The frontend is structured with:
- **API Client**: Centralized, authenticated requests to backend
- **Custom Hooks**: Auth, wallet, and toast for reusable logic
- **Component Pattern**: Consistent loading → data fetch → render pattern
- **Real-Time**: Socket.io integrated for Bingo, Poker, and wallet updates
- **Error Handling**: Try-catch with user-friendly toasts
- **Responsive Design**: TailwindCSS responsive grids and layouts
- **Type Safety**: TypeScript interfaces from shared API types

All components follow the same patterns for consistency and maintainability.
