# API Endpoints Documentation

This document provides comprehensive documentation for all API endpoints in the Huginn External Services application.

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `http://129.212.143.6:3000`

**Connection Details:**

- **Port**: 3000
- **Protocol**: HTTP
- **IPv4 Address**: Use the IPv4 address (129.212.143.6) for production connections
- **Reserved IP**: Not applicable - use the public IPv4 address

**Example Usage:**

```bash
# Production
curl http://129.212.143.6:3000/health

# Development
curl http://localhost:3000/health
```

## Authentication

All Binance API endpoints require valid API keys configured in the environment variables. The service handles authentication with Binance automatically.

## Response Format

All API endpoints return responses in a consistent format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "timestamp": 1640995200000
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message description",
  "timestamp": 1640995200000
}
```

## Health Check

### GET /health

Get service health status and connection information.

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "services": {
      "spot": {
        "isConnected": true,
        "clientCount": 0
      },
      "usdm": {
        "isConnected": false,
        "clientCount": 0
      },
      "coinm": {
        "isConnected": false,
        "clientCount": 0
      },
      "isInitialized": true
    },
    "uptime": 123.456,
    "memory": {
      "rss": 54521856,
      "heapTotal": 13934592,
      "heapUsed": 12321456,
      "external": 3436045,
      "arrayBuffers": 77828
    },
    "version": "1.0.0"
  },
  "timestamp": 1640995200000
}
```

## Spot Trading API

Base path: `/api/binance/spot`

### Account & Balance Endpoints

#### GET /api/binance/spot/account

Get spot account information.

**Response:**

```json
{
  "success": true,
  "data": {
    "makerCommission": 15,
    "takerCommission": 15,
    "buyerCommission": 0,
    "sellerCommission": 0,
    "canTrade": true,
    "canWithdraw": true,
    "canDeposit": true,
    "balances": [
      {
        "asset": "BTC",
        "free": "4723846.89208129",
        "locked": "0.00000000"
      }
    ]
  },
  "timestamp": 1640995200000
}
```

#### GET /api/binance/spot/balances

Get all spot balances.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "asset": "BTC",
      "free": "4723846.89208129",
      "locked": "0.00000000"
    },
    {
      "asset": "USDT",
      "free": "1000.00000000",
      "locked": "0.00000000"
    }
  ],
  "timestamp": 1640995200000
}
```

#### GET /api/binance/spot/balance/:asset

Get balance for a specific asset.

**Parameters:**

- `asset` (path, optional): Asset symbol (e.g., BTC, USDT)

**Example:** `GET /api/binance/spot/balance/BTC`

**Response:**

```json
{
  "success": true,
  "data": {
    "asset": "BTC",
    "free": "4723846.89208129",
    "locked": "0.00000000"
  },
  "timestamp": 1640995200000
}
```

### Order Management Endpoints

#### GET /api/binance/spot/orders

Get open spot orders.

**Query Parameters:**

- `symbol` (optional): Trading pair symbol (e.g., BTCUSDT)
- `limit` (optional): Number of orders to return (default: 500, max: 1000)
- `offset` (optional): Pagination offset (default: 0)

**Example:** `GET /api/binance/spot/orders?symbol=BTCUSDT&limit=10`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "symbol": "BTCUSDT",
      "orderId": 28,
      "orderListId": -1,
      "clientOrderId": "6gCrw2kRUAF9CvJDGP16IP",
      "price": "10.00000000",
      "origQty": "10.00000000",
      "executedQty": "10.00000000",
      "cummulativeQuoteQty": "10.00000000",
      "status": "FILLED",
      "timeInForce": "GTC",
      "type": "LIMIT",
      "side": "SELL",
      "stopPrice": "0.00000000",
      "icebergQty": "0.00000000",
      "time": 1499827319559,
      "updateTime": 1499827319559,
      "isWorking": true,
      "origQuoteOrderQty": "0.00000000"
    }
  ],
  "timestamp": 1640995200000
}
```

#### POST /api/binance/spot/orders

Place a new spot order.

**Request Body:**

```json
{
  "symbol": "BTCUSDT",
  "side": "BUY",
  "type": "LIMIT",
  "quantity": 0.001,
  "price": 50000.0,
  "timeInForce": "GTC"
}
```

**Request Body Parameters:**

- `symbol` (required): Trading pair symbol
- `side` (required): Order side ("BUY" or "SELL")
- `type` (required): Order type ("MARKET", "LIMIT", "STOP_LOSS", "STOP_LOSS_LIMIT", "TAKE_PROFIT", "TAKE_PROFIT_LIMIT", "LIMIT_MAKER")
- `quantity` (required): Order quantity
- `price` (optional): Order price (required for LIMIT orders)
- `stopPrice` (optional): Stop price (required for stop orders)
- `timeInForce` (optional): Time in force ("GTC", "IOC", "FOK")

**Response:**

```json
{
  "success": true,
  "data": {
    "symbol": "BTCUSDT",
    "orderId": 28,
    "orderListId": -1,
    "clientOrderId": "6gCrw2kRUAF9CvJDGP16IP",
    "transactTime": 1507725176595,
    "price": "50000.00000000",
    "origQty": "0.00100000",
    "executedQty": "0.00000000",
    "cummulativeQuoteQty": "0.00000000",
    "status": "NEW",
    "timeInForce": "GTC",
    "type": "LIMIT",
    "side": "BUY"
  },
  "timestamp": 1640995200000
}
```

#### DELETE /api/binance/spot/orders/:symbol/:orderId

Cancel a specific spot order.

**Parameters:**

- `symbol` (path, required): Trading pair symbol
- `orderId` (path, required): Order ID to cancel

**Example:** `DELETE /api/binance/spot/orders/BTCUSDT/28`

**Response:**

```json
{
  "success": true,
  "data": {
    "symbol": "BTCUSDT",
    "orderId": 28,
    "orderListId": -1,
    "clientOrderId": "6gCrw2kRUAF9CvJDGP16IP",
    "price": "50000.00000000",
    "origQty": "0.00100000",
    "executedQty": "0.00000000",
    "cummulativeQuoteQty": "0.00000000",
    "status": "CANCELED",
    "timeInForce": "GTC",
    "type": "LIMIT",
    "side": "BUY"
  },
  "timestamp": 1640995200000
}
```

#### DELETE /api/binance/spot/orders/:symbol

Cancel all open orders for a symbol.

**Parameters:**

- `symbol` (path, required): Trading pair symbol

**Example:** `DELETE /api/binance/spot/orders/BTCUSDT`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "symbol": "BTCUSDT",
      "orderId": 28,
      "orderListId": -1,
      "clientOrderId": "6gCrw2kRUAF9CvJDGP16IP",
      "price": "50000.00000000",
      "origQty": "0.00100000",
      "executedQty": "0.00000000",
      "cummulativeQuoteQty": "0.00000000",
      "status": "CANCELED",
      "timeInForce": "GTC",
      "type": "LIMIT",
      "side": "BUY"
    }
  ],
  "timestamp": 1640995200000
}
```

### Market Data Endpoints

#### GET /api/binance/spot/price/:symbol

Get current price for a symbol or all symbols.

**Parameters:**

- `symbol` (path, optional): Trading pair symbol

**Example:** `GET /api/binance/spot/price/BTCUSDT`

**Response (single symbol):**

```json
{
  "success": true,
  "data": {
    "symbol": "BTCUSDT",
    "price": "50000.00000000"
  },
  "timestamp": 1640995200000
}
```

**Example:** `GET /api/binance/spot/price`

**Response (all symbols):**

```json
{
  "success": true,
  "data": [
    {
      "symbol": "BTCUSDT",
      "price": "50000.00000000"
    },
    {
      "symbol": "ETHUSDT",
      "price": "3000.00000000"
    }
  ],
  "timestamp": 1640995200000
}
```

#### GET /api/binance/spot/ticker/:symbol

Get 24hr ticker statistics.

**Parameters:**

- `symbol` (path, optional): Trading pair symbol

**Example:** `GET /api/binance/spot/ticker/BTCUSDT`

**Response:**

```json
{
  "success": true,
  "data": {
    "symbol": "BTCUSDT",
    "priceChange": "-94.99999800",
    "priceChangePercent": "-95.960",
    "weightedAvgPrice": "0.29628482",
    "prevClosePrice": "0.10002000",
    "lastPrice": "4.00000200",
    "lastQty": "200.00000000",
    "bidPrice": "4.00000000",
    "askPrice": "4.00000200",
    "openPrice": "99.00000000",
    "highPrice": "100.00000000",
    "lowPrice": "0.10000000",
    "volume": "8913.30000000",
    "quoteVolume": "15.30000000",
    "openTime": 1499783499040,
    "closeTime": 1499869899040,
    "firstId": 28385,
    "lastId": 28460,
    "count": 76
  },
  "timestamp": 1640995200000
}
```

#### GET /api/binance/spot/depth/:symbol

Get order book depth.

**Parameters:**

- `symbol` (path, required): Trading pair symbol
- `limit` (query, optional): Number of entries to return (default: 100, max: 5000)

**Example:** `GET /api/binance/spot/depth/BTCUSDT?limit=10`

**Response:**

```json
{
  "success": true,
  "data": {
    "lastUpdateId": 1027024,
    "bids": [
      ["4.00000000", "431.00000000"],
      ["3.99000000", "100.00000000"]
    ],
    "asks": [
      ["4.00000200", "12.00000000"],
      ["5.10000000", "28.00000000"]
    ]
  },
  "timestamp": 1640995200000
}
```

#### GET /api/binance/spot/trades/:symbol

Get recent trades.

**Parameters:**

- `symbol` (path, required): Trading pair symbol
- `limit` (query, optional): Number of trades to return (default: 500, max: 1000)

**Example:** `GET /api/binance/spot/trades/BTCUSDT?limit=5`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 28457,
      "price": "4.00000100",
      "qty": "12.00000000",
      "quoteQty": "48.000012",
      "time": 1499865549590,
      "isBuyerMaker": true,
      "isBestMatch": true
    }
  ],
  "timestamp": 1640995200000
}
```

## USD-M Futures API

Base path: `/api/binance/futures`

### Account & Position Endpoints

#### GET /api/binance/futures/account

Get USD-M futures account information.

**Response:**

```json
{
  "success": true,
  "data": {
    "feeTier": 0,
    "canTrade": true,
    "canDeposit": true,
    "canWithdraw": true,
    "updateTime": 0,
    "totalInitialMargin": "0.00000000",
    "totalMaintMargin": "0.00000000",
    "totalWalletBalance": "23.72469206",
    "totalUnrealizedProfit": "0.00000000",
    "totalMarginBalance": "23.72469206",
    "totalPositionInitialMargin": "0.00000000",
    "totalOpenOrderInitialMargin": "0.00000000",
    "totalCrossWalletBalance": "23.72469206",
    "totalCrossUnPnl": "0.00000000",
    "availableBalance": "23.72469206",
    "maxWithdrawAmount": "23.72469206",
    "assets": [
      {
        "asset": "USDT",
        "walletBalance": "23.72469206",
        "unrealizedProfit": "0.00000000",
        "marginBalance": "23.72469206",
        "maintMargin": "0.00000000",
        "initialMargin": "0.00000000",
        "positionInitialMargin": "0.00000000",
        "openOrderInitialMargin": "0.00000000",
        "crossWalletBalance": "23.72469206",
        "crossUnPnl": "0.00000000",
        "availableBalance": "23.72469206",
        "maxWithdrawAmount": "23.72469206",
        "marginAvailable": true,
        "updateTime": 1625474304765
      }
    ],
    "positions": [
      {
        "symbol": "BTCUSDT",
        "initialMargin": "0",
        "maintMargin": "0",
        "unrealizedProfit": "0.00000000",
        "positionInitialMargin": "0",
        "openOrderInitialMargin": "0",
        "leverage": "100",
        "isolated": false,
        "entryPrice": "0.00000",
        "maxNotional": "250000",
        "positionSide": "BOTH",
        "positionAmt": "0",
        "notional": "0",
        "isolatedWallet": "0",
        "updateTime": 0,
        "bidNotional": "0",
        "askNotional": "0"
      }
    ]
  },
  "timestamp": 1640995200000
}
```

#### GET /api/binance/futures/positions

Get USD-M futures position information.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "symbol": "BTCUSDT",
      "positionAmt": "0.001",
      "entryPrice": "50000.0",
      "markPrice": "50100.0",
      "unRealizedProfit": "0.1",
      "liquidationPrice": "0",
      "leverage": "100",
      "maxNotionalValue": "250000",
      "marginType": "cross",
      "isolatedMargin": "0.00000000",
      "isAutoAddMargin": "false",
      "positionSide": "BOTH",
      "notional": "50.1",
      "isolatedWallet": "0",
      "updateTime": 1625474304765
    }
  ],
  "timestamp": 1640995200000
}
```

#### GET /api/binance/futures/balance/:asset

Get USD-M futures balance.

**Parameters:**

- `asset` (path, optional): Asset symbol (default: USDT)

**Example:** `GET /api/binance/futures/balance/USDT`

**Response:**

```json
{
  "success": true,
  "data": {
    "asset": "USDT",
    "walletBalance": "23.72469206",
    "unrealizedProfit": "0.00000000",
    "marginBalance": "23.72469206",
    "maintMargin": "0.00000000",
    "initialMargin": "0.00000000",
    "positionInitialMargin": "0.00000000",
    "openOrderInitialMargin": "0.00000000",
    "maxWithdrawAmount": "23.72469206",
    "crossWalletBalance": "23.72469206",
    "crossUnPnl": "0.00000000",
    "availableBalance": "23.72469206"
  },
  "timestamp": 1640995200000
}
```

### Order Management Endpoints

#### GET /api/binance/futures/orders

Get USD-M futures open orders.

**Query Parameters:**

- `symbol` (optional): Trading pair symbol
- `limit` (optional): Number of orders to return
- `offset` (optional): Pagination offset

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "avgPrice": "0.00000",
      "clientOrderId": "abc",
      "cumQuote": "0",
      "executedQty": "0",
      "orderId": 1917641,
      "origQty": "0.40",
      "origType": "TRAILING_STOP_MARKET",
      "price": "0",
      "reduceOnly": false,
      "side": "BUY",
      "positionSide": "SHORT",
      "status": "NEW",
      "stopPrice": "9300",
      "closePosition": false,
      "symbol": "BTCUSDT",
      "time": 1579276756075,
      "timeInForce": "GTC",
      "type": "TRAILING_STOP_MARKET",
      "activatePrice": "9020",
      "priceRate": "0.3",
      "updateTime": 1579276756075,
      "workingType": "CONTRACT_PRICE",
      "priceProtect": false
    }
  ],
  "timestamp": 1640995200000
}
```

#### POST /api/binance/futures/orders

Place a new USD-M futures order.

**Request Body:**

```json
{
  "symbol": "BTCUSDT",
  "side": "BUY",
  "type": "LIMIT",
  "quantity": 0.001,
  "price": 50000.0,
  "timeInForce": "GTC",
  "reduceOnly": false,
  "positionSide": "BOTH"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "clientOrderId": "testOrder",
    "cumQty": "0",
    "cumQuote": "0",
    "executedQty": "0",
    "orderId": 22542179,
    "avgPrice": "0.00000",
    "origQty": "0.001",
    "price": "50000",
    "reduceOnly": false,
    "side": "BUY",
    "positionSide": "BOTH",
    "status": "NEW",
    "stopPrice": "0",
    "closePosition": false,
    "symbol": "BTCUSDT",
    "timeInForce": "GTC",
    "type": "LIMIT",
    "origType": "LIMIT",
    "activatePrice": "0",
    "priceRate": "0",
    "updateTime": 1566818724722,
    "workingType": "CONTRACT_PRICE",
    "priceProtect": false
  },
  "timestamp": 1640995200000
}
```

#### DELETE /api/binance/futures/orders/:symbol/:orderId

Cancel a specific USD-M futures order.

**Parameters:**

- `symbol` (path, required): Trading pair symbol
- `orderId` (path, required): Order ID to cancel

#### DELETE /api/binance/futures/orders/:symbol

Cancel all USD-M futures orders for a symbol.

**Parameters:**

- `symbol` (path, required): Trading pair symbol

#### POST /api/binance/futures/tpsl

Set Take Profit and Stop Loss for USD-M futures.

**Request Body:**

```json
{
  "symbol": "BTCUSDT",
  "side": "BUY",
  "takeProfitPrice": 55000.0,
  "stopLossPrice": 45000.0,
  "quantity": 0.001
}
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "clientOrderId": "testOrder1",
      "cumQty": "0",
      "cumQuote": "0",
      "executedQty": "0",
      "orderId": 22542180,
      "avgPrice": "0.00000",
      "origQty": "0.001",
      "price": "55000",
      "reduceOnly": true,
      "side": "SELL",
      "positionSide": "BOTH",
      "status": "NEW",
      "stopPrice": "0",
      "closePosition": false,
      "symbol": "BTCUSDT",
      "timeInForce": "GTC",
      "type": "TAKE_PROFIT_MARKET",
      "origType": "TAKE_PROFIT_MARKET",
      "activatePrice": "55000",
      "priceRate": "0",
      "updateTime": 1566818724722,
      "workingType": "CONTRACT_PRICE",
      "priceProtect": false
    }
  ],
  "timestamp": 1640995200000
}
```

### Market Data Endpoints

#### GET /api/binance/futures/price/:symbol

Get USD-M futures price information.

**Parameters:**

- `symbol` (path, optional): Trading pair symbol

**Response (single symbol):**

```json
{
  "success": true,
  "data": {
    "symbol": "BTCUSDT",
    "price": "50000.00000000",
    "time": 1640995200000
  },
  "timestamp": 1640995200000
}
```

**Response (all symbols):**

```json
{
  "success": true,
  "data": [
    {
      "symbol": "BTCUSDT",
      "price": "50000.00000000",
      "time": 1640995200000
    },
    {
      "symbol": "ETHUSDT",
      "price": "3000.00000000",
      "time": 1640995200000
    }
  ],
  "timestamp": 1640995200000
}
```

## COIN-M Futures API

Base path: `/api/binance/coinm`

The COIN-M Futures API endpoints follow the same structure as USD-M Futures but operate on COIN-M contracts.

### Account & Position Endpoints

#### GET /api/binance/coinm/account

#### GET /api/binance/coinm/positions

#### GET /api/binance/coinm/balance/:asset

### Order Management Endpoints

#### GET /api/binance/coinm/orders

#### POST /api/binance/coinm/orders

#### DELETE /api/binance/coinm/orders/:symbol/:orderId

#### DELETE /api/binance/coinm/orders/:symbol

#### POST /api/binance/coinm/tpsl

### Market Data Endpoints

#### GET /api/binance/coinm/price/:symbol

## WebSocket Subscription API

Base path: `/api/binance`

### Spot WebSocket Subscriptions

#### POST /api/binance/spot/subscribe/ticker/:symbol

Subscribe to spot ticker updates.

**Parameters:**

- `symbol` (path, required): Trading pair symbol

**Request:** `POST /api/binance/spot/subscribe/ticker/BTCUSDT`

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Subscribed to spot ticker for BTCUSDT"
  },
  "timestamp": 1640995200000
}
```

#### POST /api/binance/spot/subscribe/depth/:symbol

Subscribe to spot order book depth updates.

**Parameters:**

- `symbol` (path, required): Trading pair symbol
- `levels` (query, optional): Depth levels (5, 10, 20)

**Request:** `POST /api/binance/spot/subscribe/depth/BTCUSDT?levels=10`

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Subscribed to spot depth for BTCUSDT"
  },
  "timestamp": 1640995200000
}
```

#### POST /api/binance/spot/subscribe/trades/:symbol

Subscribe to spot trade updates.

**Parameters:**

- `symbol` (path, required): Trading pair symbol

**Request:** `POST /api/binance/spot/subscribe/trades/BTCUSDT`

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Subscribed to spot trades for BTCUSDT"
  },
  "timestamp": 1640995200000
}
```

### WebSocket Management

#### GET /api/binance/websocket/status

Get WebSocket connection status.

**Response:**

```json
{
  "success": true,
  "data": {
    "spot": {
      "isConnected": true,
      "clientCount": 0
    },
    "usdm": {
      "isConnected": false,
      "clientCount": 0
    },
    "coinm": {
      "isConnected": false,
      "clientCount": 0
    },
    "isInitialized": true
  },
  "timestamp": 1640995200000
}
```

## WebSocket Real-time API

Connect to `ws://localhost:3000` (or your production WebSocket URL) for real-time updates.

### Connection

```javascript
const ws = new WebSocket("ws://localhost:3000");

ws.onopen = function (event) {
  console.log("Connected to WebSocket");
};

ws.onmessage = function (event) {
  const data = JSON.parse(event.data);
  console.log("Received:", data);
};
```

### Message Types

#### Welcome Message

Sent when connection is established:

```json
{
  "type": "welcome",
  "message": "Connected to Binance Trading API WebSocket",
  "timestamp": 1640995200000
}
```

#### Ticker Updates

Real-time price ticker updates:

```json
{
  "type": "ticker",
  "data": {
    "symbol": "BTCUSDT",
    "price": "50000.00",
    "change": "2.5%",
    "volume": "1234.56"
  },
  "timestamp": 1640995200000
}
```

#### Depth Updates

Order book depth updates:

```json
{
  "type": "depth",
  "data": {
    "symbol": "BTCUSDT",
    "bids": [["50000.00", "0.001"]],
    "asks": [["50001.00", "0.002"]]
  },
  "timestamp": 1640995200000
}
```

#### Trade Updates

Real-time trade execution updates:

```json
{
  "type": "trade",
  "data": {
    "symbol": "BTCUSDT",
    "price": "50000.00",
    "quantity": "0.001",
    "side": "BUY"
  },
  "timestamp": 1640995200000
}
```

#### Ping/Pong

Send ping to maintain connection:

```json
{
  "type": "ping",
  "timestamp": 1640995200000
}
```

Server responds with pong:

```json
{
  "type": "pong",
  "timestamp": 1640995200000
}
```

## Error Codes

### HTTP Status Codes

- `200` - Success
- `201` - Created (for successful order placement)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication errors)
- `404` - Not Found
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

### Custom Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - API authentication failed
- `ORDER_ERROR` - Trading order error
- `WEBSOCKET_ERROR` - WebSocket connection error
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded

### Error Response Examples

#### Validation Error

```json
{
  "success": false,
  "error": "Validation failed: symbol is required",
  "code": "VALIDATION_ERROR",
  "timestamp": 1640995200000
}
```

#### Authentication Error

```json
{
  "success": false,
  "error": "Invalid API key",
  "code": "AUTHENTICATION_ERROR",
  "timestamp": 1640995200000
}
```

#### Rate Limit Error

```json
{
  "success": false,
  "error": "Too many requests, please try again later",
  "code": "RATE_LIMIT_EXCEEDED",
  "timestamp": 1640995200000
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Default**: 100 requests per 15 minutes per IP
- **Burst**: Short bursts allowed up to limit
- **Headers**: Rate limit information included in response headers

Rate limit headers:

- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when rate limit resets

## Testing

### Health Check

```bash
curl http://localhost:3000/health
```

### Get Spot Account

```bash
curl http://localhost:3000/api/binance/spot/account
```

### Place Spot Order

```bash
curl -X POST http://localhost:3000/api/binance/spot/orders \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "side": "BUY",
    "type": "MARKET",
    "quantity": 0.001
  }'
```

### WebSocket Test

```javascript
const ws = new WebSocket("ws://localhost:3000");
ws.onmessage = (event) => console.log(JSON.parse(event.data));
```

## SDK Examples

### Node.js/JavaScript

```javascript
const axios = require("axios");

const api = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 30000,
});

// Get account info
const account = await api.get("/api/binance/spot/account");
console.log(account.data);

// Place order
const order = await api.post("/api/binance/spot/orders", {
  symbol: "BTCUSDT",
  side: "BUY",
  type: "MARKET",
  quantity: 0.001,
});
console.log(order.data);
```

### Python

```python
import requests
import json

base_url = 'http://localhost:3000'

# Get account info
response = requests.get(f'{base_url}/api/binance/spot/account')
account = response.json()
print(account)

# Place order
order_data = {
    'symbol': 'BTCUSDT',
    'side': 'BUY',
    'type': 'MARKET',
    'quantity': 0.001
}
response = requests.post(f'{base_url}/api/binance/spot/orders', json=order_data)
order = response.json()
print(order)
```

### cURL Examples

```bash
# Health check
curl http://localhost:3000/health

# Get account
curl http://localhost:3000/api/binance/spot/account

# Get positions
curl http://localhost:3000/api/binance/futures/positions

# Place order
curl -X POST http://localhost:3000/api/binance/spot/orders \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","side":"BUY","type":"MARKET","quantity":0.001}'

# Cancel order
curl -X DELETE http://localhost:3000/api/binance/spot/orders/BTCUSDT/12345

# Subscribe to ticker
curl -X POST http://localhost:3000/api/binance/spot/subscribe/ticker/BTCUSDT
```

# RAG (Retrieval-Augmented Generation) API

Base path: `/api/rag`

The RAG API provides intelligent document storage, retrieval, and question-answering capabilities. It combines vector similarity search with OpenAI for enhanced responses across different domains (fitness, trading, general).

## Core Query Endpoints

### POST /api/rag/query

**Main RAG query endpoint** - Ask questions and get AI-powered answers based on your stored documents.

**Request Body:**

```json
{
  "query": "What are my recent workout stats?",
  "domain": "fitness",
  "options": {
    "topK": 5,
    "minScore": 0.7
  }
}
```

**Parameters:**

- `query` (required): Question or query string (1-2000 characters)
- `domain` (optional): One of `fitness`, `trading`, `general`
- `options.topK` (optional): Number of similar documents to retrieve (1-20, default: 5)
- `options.minScore` (optional): Minimum similarity score (0-1, default: 0.7)

**Response:**

```json
{
  "success": true,
  "data": {
    "answer": "Based on your fitness data, your recent workout stats are...",
    "sources": [
      {
        "documentId": "fitness-doc-123",
        "content": "Document content excerpt...",
        "metadata": {
          "domain": "fitness",
          "docId": "123"
        },
        "similarity": 0.92
      }
    ],
    "confidence": 0.85,
    "metadata": {
      "totalMatches": 15,
      "processedQuery": {
        "query": "recent workout statistics",
        "searchTerms": ["workout", "stats", "fitness", "exercise"]
      },
      "processingTime": 1234
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/rag/status

Get RAG system status and statistics.

**Response:**

```json
{
  "success": true,
  "data": {
    "isInitialized": true,
    "documentCount": 150,
    "namespaces": {
      "fitness": 25,
      "trading": 30,
      "general": 95
    },
    "lastUpdated": "2024-01-01T00:00:00.000Z",
    "vectorDimensions": 1536,
    "embeddingModel": "text-embedding-ada-002"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Document Management Endpoints

### POST /api/rag/documents

Add a single document to the RAG system.

**Request Body:**

```json
{
  "id": "unique-document-id",
  "content": "Document content to be embedded and stored...",
  "metadata": {
    "domain": "general",
    "source": "api",
    "title": "Document Title",
    "tags": ["tag1", "tag2"],
    "contentType": "post"
  }
}
```

**Parameters:**

- `id` (required): Unique document identifier (1-255 characters)
- `content` (required): Document content (1-50000 characters)
- `metadata.domain` (required): One of `fitness`, `trading`, `general`
- `metadata.source` (required): Source identifier
- `metadata.contentType` (required): One of `text`, `post`, `article`, `summary`, `note`

**Response:**

```json
{
  "success": true,
  "data": {
    "documentId": "unique-document-id",
    "status": "added"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### POST /api/rag/documents/batch

Add multiple documents to the RAG system (1-50 documents per request).

**Request Body:**

```json
{
  "documents": [
    {
      "id": "doc-1",
      "content": "First document content...",
      "metadata": {
        "domain": "general",
        "source": "api",
        "contentType": "post"
      }
    },
    {
      "id": "doc-2",
      "content": "Second document content...",
      "metadata": {
        "domain": "general",
        "source": "api",
        "contentType": "post"
      }
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 2,
    "successful": 2,
    "failed": 0,
    "results": [
      {
        "documentId": "doc-1",
        "status": "fulfilled"
      },
      {
        "documentId": "doc-2",
        "status": "fulfilled"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### PUT /api/rag/documents/:id

Update an existing document in the RAG system.

**Parameters:**

- `id` (path): Document ID to update

**Request Body:**

```json
{
  "content": "Updated document content...",
  "metadata": {
    "domain": "general",
    "source": "api",
    "contentType": "post"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "documentId": "document-id",
    "status": "updated"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### DELETE /api/rag/documents/:id

Remove a document from the RAG system.

**Parameters:**

- `id` (path): Document ID to remove
- `domain` (query, optional): Domain filter

**Example:** `DELETE /api/rag/documents/doc-123?domain=general`

**Response:**

```json
{
  "success": true,
  "data": {
    "documentId": "doc-123",
    "status": "removed"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Administrative Endpoints

### DELETE /api/rag/namespace/:namespace

**Clear all data from a specific namespace** - Use with caution! This removes all documents in the specified namespace.

**Parameters:**

- `namespace` (path): Namespace to clear (e.g., `fitness`, `trading`, `general`)

**Example:** `DELETE /api/rag/namespace/fitness`

**Response:**

```json
{
  "success": true,
  "data": {
    "namespace": "fitness",
    "status": "cleared"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/rag/health

Simple health check for the RAG system.

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "ragServiceInitialized": true,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

---

This documentation provides comprehensive coverage of all API endpoints, request/response formats, and usage examples for the Huginn External Services application.

