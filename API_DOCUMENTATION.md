# CoinKrazy AI2 Admin API Documentation

## Overview
This document provides comprehensive documentation for all admin API endpoints available in the CoinKrazy AI2 platform. All endpoints require admin authentication via `admin_token`.

## Base URL
```
/api/admin/v2
```

## Authentication
All requests must include the admin token in the Authorization header:
```
Authorization: Bearer <admin_token>
```

---

## Dashboard APIs

### Get Dashboard Statistics
**GET** `/dashboard/stats`

Returns overall platform statistics including player counts, revenue, wagering metrics, and pending actions.

**Response:**
```json
{
  "totalPlayers": 1500,
  "activePlayers": 450,
  "totalRevenue": 125000.50,
  "totalWagered": 500000,
  "totalWon": 450000,
  "averagePlayerValue": 250.75,
  "gamesToday": 1200,
  "newPlayersToday": 45,
  "pendingKyc": 12,
  "pendingWithdrawals": 8,
  "pendingWithdrawalAmount": 5000,
  "openTickets": 23,
  "activeAlerts": 3
}
```

### Get Daily Metrics
**GET** `/dashboard/metrics?days=30`

Returns daily engagement and financial metrics for the specified period.

**Parameters:**
- `days` (query): Number of days to retrieve (default: 30)

**Response:**
```json
[
  {
    "date": "2024-01-15",
    "deposits": 25,
    "withdrawals": 10,
    "active_users": 350,
    "deposit_volume": 15000.00
  }
]
```

### Get System Health
**GET** `/dashboard/health`

Returns system health status and performance metrics.

**Response:**
```json
{
  "databaseStatus": "healthy",
  "averageResponseTime": 145,
  "recentErrors": 2,
  "timestamp": "2024-01-15T10:30:00Z",
  "status": "healthy"
}
```

### Get Revenue Analytics
**GET** `/dashboard/revenue?timeframe=month`

Returns detailed revenue analytics for the specified timeframe.

**Parameters:**
- `timeframe` (query): 'week', 'month', or 'year' (default: 'month')

### Get Player Demographics
**GET** `/dashboard/demographics`

Returns player demographic distribution by country, status, KYC level, etc.

---

## Player Management APIs

### List Players
**GET** `/players?page=1&limit=20&search=&status=&kycLevel=`

Lists all players with filtering and pagination.

**Parameters:**
- `page` (query): Page number (default: 1)
- `limit` (query): Items per page (default: 20)
- `search` (query): Search by username, email, or name
- `status` (query): Filter by status (Active, Suspended, Banned, Inactive)
- `kycLevel` (query): Filter by KYC level (None, Basic, Intermediate, Full)

**Response:**
```json
{
  "players": [
    {
      "id": 1,
      "username": "player1",
      "email": "player1@example.com",
      "name": "John Doe",
      "gc_balance": 5000,
      "sc_balance": 1500.50,
      "status": "Active",
      "kyc_level": "Full",
      "created_at": "2024-01-01T00:00:00Z",
      "last_login": "2024-01-15T10:00:00Z",
      "phone": "+1234567890",
      "country": "US",
      "total_wagered": 50000,
      "total_won": 45000,
      "games_played": 250
    }
  ],
  "total": 1500,
  "page": 1,
  "limit": 20
}
```

### Get Player Details
**GET** `/players/{playerId}`

Retrieves detailed information about a specific player.

**Response:**
```json
{
  "player": { /* player object */ },
  "stats": { /* player stats */ },
  "transactions": [ /* transaction history */ ],
  "achievements": [ /* achievements */ ],
  "kycDocuments": [ /* KYC documents */ ]
}
```

### Update Player Status
**PUT** `/players/{playerId}/status`

Updates a player's account status.

**Request Body:**
```json
{
  "status": "Suspended",
  "reason": "Suspicious activity detected"
}
```

### Update Player Balance
**PUT** `/players/{playerId}/balance`

Adjusts a player's GC and SC balance.

**Request Body:**
```json
{
  "gcAmount": 500,
  "scAmount": -100,
  "reason": "Manual adjustment for refund"
}
```

### Get Player Transactions
**GET** `/players/{playerId}/transactions?page=1&limit=50`

Retrieves transaction history for a player.

---

## KYC Management APIs

### Submit KYC Document
**POST** `/kyc/submit`

Uploads a KYC document for verification.

**Request Body:**
```json
{
  "playerId": 123,
  "documentType": "id_card",
  "documentUrl": "https://s3.amazonaws.com/..."
}
```

### Approve KYC Document
**POST** `/kyc/{documentId}/approve`

Approves a KYC document.

**Request Body:**
```json
{
  "notes": "Document verified successfully"
}
```

### Reject KYC Document
**POST** `/kyc/{documentId}/reject`

Rejects a KYC document.

**Request Body:**
```json
{
  "reason": "Document quality is too low"
}
```

---

## Financial Management APIs

### Bonuses

#### List Bonuses
**GET** `/bonuses`

#### Create Bonus
**POST** `/bonuses`

**Request Body:**
```json
{
  "name": "Welcome Bonus",
  "type": "Deposit",
  "amount": "100",
  "percentage": 50.00,
  "minDeposit": 10.00,
  "maxClaims": 1,
  "wageringMultiplier": 35.00
}
```

#### Update Bonus
**PUT** `/bonuses/{bonusId}`

#### Delete Bonus
**DELETE** `/bonuses/{bonusId}`

### Jackpots

#### List Jackpots
**GET** `/jackpots`

Returns all progressive jackpots with current amounts.

#### Create Jackpot
**POST** `/jackpots`

**Request Body:**
```json
{
  "name": "Mega Jackpot",
  "gameId": 5,
  "baseAmount": 10000,
  "maxAmount": 500000,
  "incrementPercentage": 0.1
}
```

#### Update Jackpot Amount
**PUT** `/jackpots/{jackpotId}`

**Request Body:**
```json
{
  "newAmount": 45000
}
```

#### Record Jackpot Win
**POST** `/jackpots/win`

**Request Body:**
```json
{
  "jackpotId": 1,
  "playerId": 123,
  "amountWon": 50000
}
```

### Make It Rain

#### List Campaigns
**GET** `/make-it-rain`

#### Create Campaign
**POST** `/make-it-rain`

**Request Body:**
```json
{
  "name": "New Year Promotion",
  "description": "Special bonus for all active players",
  "totalAmount": 50000,
  "targetPlayers": 500,
  "startDate": "2024-01-20T00:00:00Z",
  "endDate": "2024-01-27T23:59:59Z"
}
```

#### Distribute Rewards
**POST** `/make-it-rain/{campaignId}/distribute`

**Request Body:**
```json
{
  "playerIds": [1, 2, 3, 4, 5],
  "amountPerPlayer": 100
}
```

### Redemptions

#### List Redemption Requests
**GET** `/redemptions?status=pending`

**Parameters:**
- `status` (query): Filter by status (pending, approved, rejected)

#### Approve Redemption
**POST** `/redemptions/{requestId}/approve`

**Request Body:**
```json
{
  "notes": "Approved and processed"
}
```

#### Reject Redemption
**POST** `/redemptions/{requestId}/reject`

**Request Body:**
```json
{
  "reason": "Insufficient balance"
}
```

---

## Games & Sports APIs

### Games

#### List Games
**GET** `/games?category=Slots`

**Parameters:**
- `category` (query): Filter by category (Slots, Poker, Bingo, Sportsbook, Other)

#### Create Game
**POST** `/games`

**Request Body:**
```json
{
  "name": "Dragon's Gold",
  "category": "Slots",
  "provider": "Internal",
  "rtp": 95.5,
  "volatility": "High",
  "description": "Exciting slot game with dragons",
  "imageUrl": "https://s3.amazonaws.com/..."
}
```

#### Update Game
**PUT** `/games/{gameId}`

#### Delete Game
**DELETE** `/games/{gameId}`

#### Ingest Game Data
**POST** `/games/{gameId}/ingest`

**Request Body:**
```json
{
  "gameId": 5,
  "data": {
    "paylines": 25,
    "min_bet": 0.01,
    "max_bet": 100,
    "bonus_features": ["Free Spins", "Wild Symbols"]
  }
}
```

### Poker

#### List Poker Tables
**GET** `/poker/tables`

#### Create Poker Table
**POST** `/poker/tables`

**Request Body:**
```json
{
  "name": "High Stakes Table",
  "stakes": "$10/$20",
  "maxPlayers": 8,
  "buyInMin": 100,
  "buyInMax": 5000
}
```

#### Update Poker Table
**PUT** `/poker/tables/{tableId}`

#### Get Poker Stats
**GET** `/poker/stats`

### Bingo

#### List Bingo Games
**GET** `/bingo/games`

#### Create Bingo Game
**POST** `/bingo/games`

**Request Body:**
```json
{
  "name": "Daily Bingo",
  "pattern": "5-line",
  "ticketPrice": 1.00,
  "jackpot": 5000
}
```

#### Update Bingo Game
**PUT** `/bingo/games/{gameId}`

#### Get Bingo Stats
**GET** `/bingo/stats`

### Sportsbook

#### List Sports Events
**GET** `/sportsbook/events?status=Live`

**Parameters:**
- `status` (query): Filter by status (Upcoming, Live, Closed, Settled)

#### Create Sports Event
**POST** `/sportsbook/events`

#### Update Sports Event
**PUT** `/sportsbook/events/{eventId}`

#### Get Sportsbook Stats
**GET** `/sportsbook/stats`

---

## Operations APIs

### Security Management

#### List Security Alerts
**GET** `/security/alerts?status=pending`

#### Resolve Security Alert
**POST** `/security/alerts/{alertId}/resolve`

**Request Body:**
```json
{
  "resolution": "False positive - no action taken"
}
```

### Content Management

#### List CMS Pages
**GET** `/cms/pages?status=published`

#### Create CMS Page
**POST** `/cms/pages`

**Request Body:**
```json
{
  "title": "Terms and Conditions",
  "slug": "terms-and-conditions",
  "content": "HTML content here...",
  "pageType": "legal",
  "metaDescription": "Our terms and conditions",
  "featuredImage": "https://s3.amazonaws.com/..."
}
```

#### Update CMS Page
**PUT** `/cms/pages/{pageId}`

#### Delete CMS Page
**DELETE** `/cms/pages/{pageId}`

#### List CMS Banners
**GET** `/cms/banners`

#### Create CMS Banner
**POST** `/cms/banners`

### Casino Settings

#### Get Casino Settings
**GET** `/casino/settings`

Returns all casino configuration settings.

#### Update Casino Settings
**PUT** `/casino/settings`

**Request Body:**
```json
{
  "max_withdrawal_amount": 100000,
  "min_deposit_amount": 1,
  "daily_withdrawal_limit": 3,
  "maintenance_mode": false
}
```

### Social Management

#### List Social Groups
**GET** `/social/groups`

#### Get Group Members
**GET** `/social/groups/{groupId}/members`

### Player Retention

#### List Retention Campaigns
**GET** `/retention/campaigns`

#### Create Retention Campaign
**POST** `/retention/campaigns`

**Request Body:**
```json
{
  "name": "Comeback Bonus",
  "triggerEvent": "player_inactive_7_days",
  "description": "Offer bonus to inactive players",
  "rewardType": "bonus",
  "rewardAmount": 50
}
```

#### Update Retention Campaign
**PUT** `/retention/campaigns/{campaignId}`

---

## Advanced APIs

### VIP Management

#### List VIP Tiers
**GET** `/vip/tiers`

#### Create VIP Tier
**POST** `/vip/tiers`

**Request Body:**
```json
{
  "name": "Platinum",
  "level": 3,
  "minWagered": 50000,
  "monthlyReload": 25,
  "birthday": 100,
  "exclusiveGames": true,
  "prioritySupport": true
}
```

#### Promote Player to VIP
**POST** `/vip/promote`

**Request Body:**
```json
{
  "playerId": 123,
  "vipTierId": 2
}
```

#### List VIP Players
**GET** `/vip/players`

### Fraud Detection

#### List Fraud Patterns
**GET** `/fraud/patterns`

#### Create Fraud Pattern
**POST** `/fraud/patterns`

**Request Body:**
```json
{
  "patternName": "Multiple Large Deposits",
  "description": "Flag accounts with multiple large deposits in 24 hours",
  "ruleType": "deposit_amount",
  "thresholdValue": 10000,
  "action": "flag"
}
```

#### List Fraud Flags
**GET** `/fraud/flags?status=open`

#### Resolve Fraud Flag
**POST** `/fraud/flags/{flagId}/resolve`

**Request Body:**
```json
{
  "resolution": "Account verified - legitimate player"
}
```

### Affiliate Management

#### List Affiliate Partners
**GET** `/affiliates?status=approved`

#### Create Affiliate Partner
**POST** `/affiliates`

**Request Body:**
```json
{
  "name": "Gaming Promotions Inc",
  "email": "contact@gamingpromo.com",
  "phone": "+1234567890",
  "website": "https://gamingpromo.com",
  "commissionPercentage": 15
}
```

#### Approve Affiliate Partner
**POST** `/affiliates/{partnerId}/approve`

Generates unique affiliate code and activates partner.

#### Get Affiliate Stats
**GET** `/affiliates/{partnerId}/stats`

**Response:**
```json
{
  "totalReferrals": 45,
  "totalWagered": 125000,
  "totalEarned": 18750,
  "totalClicks": 1500,
  "totalConversions": 45
}
```

### Support & Tickets

#### List Support Tickets
**GET** `/support/tickets?status=open&priority=high`

#### Get Ticket Messages
**GET** `/support/tickets/{ticketId}/messages`

#### Assign Ticket
**POST** `/support/tickets/{ticketId}/assign`

**Request Body:**
```json
{
  "adminId": 5
}
```

#### Close Ticket
**POST** `/support/tickets/{ticketId}/close`

### System Logs

#### List System Logs
**GET** `/system/logs?page=1&limit=50&action=&adminId=`

Returns audit trail of all admin actions.

### API Management

#### List API Keys
**GET** `/api/keys`

#### Create API Key
**POST** `/api/keys`

**Request Body:**
```json
{
  "keyName": "Mobile App Integration",
  "permissions": ["read:players", "read:games", "write:bets"],
  "rateLimit": 10000
}
```

**Response:**
```json
{
  "success": true,
  "keyId": 12,
  "apiKey": "sk_live_abc123def456...",
  "message": "Save this API key securely, it will not be shown again"
}
```

#### Revoke API Key
**POST** `/api/keys/{keyId}/revoke`

### Notifications

#### List Notification Templates
**GET** `/notifications/templates`

#### Create Notification Template
**POST** `/notifications/templates`

**Request Body:**
```json
{
  "name": "Withdrawal Confirmation",
  "type": "withdrawal",
  "subject": "Your Withdrawal Request",
  "template": "Dear {{playerName}}, your withdrawal of {{amount}} has been approved...",
  "variables": ["playerName", "amount"]
}
```

### Compliance

#### List Compliance Logs
**GET** `/compliance/logs`

#### List AML Checks
**GET** `/compliance/aml-checks`

#### Verify AML Check
**POST** `/compliance/aml-checks/{checkId}/verify`

**Request Body:**
```json
{
  "status": "approved",
  "riskLevel": "low"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Error Codes

- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Rate Limiting

API requests are rate limited based on the API key's configured limit. Default limit is 1000 requests per hour.

---

## Testing Endpoints

You can test all endpoints using:

1. **Postman** - Import the endpoint definitions
2. **curl** - Command line requests
3. **Client SDK** - Use the provided JavaScript/TypeScript client

Example curl request:
```bash
curl -X GET "http://localhost:8080/api/admin/v2/dashboard/stats" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json"
```

---

## Support

For API issues or questions, contact the development team or create a support ticket through the admin panel.
