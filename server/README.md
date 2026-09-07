# fieldnote — Backend Service

Backend API for **fieldnote**, built with **Node.js**, **Express**, and **MongoDB (Mongoose)** with secure JWT authentication and watchlist management.

---

## Project Structure

```
server/
├── config/
│   └── db.js                 # MongoDB connection manager (mongoose)
├── controllers/
│   ├── authController.js     # Handlers for auth endpoints
│   └── watchlistController.js# Handlers for watchlist management
├── middleware/
│   └── verifyToken.js        # Bearer JWT verification middleware (attaches req.userId)
├── models/
│   ├── User.js               # Schema: email, passwordHash, createdAt
│   ├── Watchlist.js          # Schema: userId, name, symbols, createdAt
│   └── Snapshot.js           # Schema: userId, watchlistId, symbol, priceAtSnapshot, timestamp
├── routes/
│   ├── authRoutes.js         # /auth/register, /auth/login, /auth/me
│   ├── watchlistRoutes.js    # /watchlists CRUD (protected by verifyToken)
│   └── index.js              # Route aggregation
├── services/
│   ├── authService.js        # Bcrypt hashing, password check, JWT issuance
│   └── watchlistService.js   # Watchlist creation, symbol validation, ownership rules
├── .env.example              # Environment variables template
├── .env                      # Local environment configuration
├── package.json              # Node dependencies & scripts
├── server.js                 # Server entrypoint with CORS & error handling
├── testAuth.js               # Automated verification suite for auth logic
└── testWatchlists.js         # Automated verification suite for watchlist logic
```

---

## Prerequisites & Installation

1. **Install dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Configure environment variables** in `.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/fieldnote
   JWT_SECRET=fieldnote_super_secret_jwt_key_2026_growth
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:5173
  REDIS_URL=redis://127.0.0.1:6379
  MARKET_DATA_PROVIDER=twelvedata
  TWELVEDATA_API_KEY=your_twelvedata_api_key
   ```

3. **Start MongoDB**:
   Ensure MongoDB is running locally (`mongod` / Windows Service `MongoDB`) or provide a MongoDB Atlas connection string in `MONGO_URI`.

4. **Start the server**:
   ```bash
   # Production / standard mode
   npm start

   # Development mode with hot-reload
   npm run dev
   ```

---

## API Endpoints Reference

### Authentication (Public)
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Server health check | `200` |
| `POST` | `/auth/register` | Register new user & issue JWT | `201` |
| `POST` | `/auth/login` | Authenticate credentials & issue JWT | `200` |
| `GET` | `/auth/me` | Current user profile (*requires JWT*) | `200` |

### Watchlists (Protected by `verifyToken`)
All endpoints below require header: `Authorization: Bearer <token>`

| Method | Endpoint | Description | Contract / Response |
| :--- | :--- | :--- | :--- |
| `POST` | `/watchlists` | Create watchlist for logged-in user | `{ id, name, symbols, symbolCount }` (`201`) |
| `GET` | `/watchlists` | List user watchlists with count | `[{ id, name, symbolCount }]` (`200`) |
| `POST` | `/watchlists/:id/symbols` | Add symbol (1-5 chars, uppercase) | `{ id, name, symbol, symbols, symbolCount }` (`200`) |
| `DELETE`| `/watchlists/:id/symbols/:symbol` | Remove symbol from watchlist | `{ message, id, symbols, symbolCount }` (`200`) |
| `DELETE`| `/watchlists/:id` | Delete entire watchlist | `{ message, id }` (`200`) |
| `GET` | `/watchlists/:id/live` | Return quotes and attention scores for every symbol | `[{ symbol, companyName, price, changePct, volumeRatio, attentionScore, why, tags, dataStatus }]` (`200`) |
| `GET` | `/watchlists/:id/diff` | Compare live prices against the user's last snapshots and write the current snapshot | `[{ symbol, companyName, priceAtLastCheck, priceNow, changePct, changeAbs, why, tags, flagged, lastCheckedAt, attentionScore }]` (`200`) |
| `POST` | `/watchlists/:id/diff/mark-checked` | Write a new price snapshot baseline | `{ lastCheckedAt, symbolCount }` (`200`) |

### Quotes (Public)
| Method | Endpoint | Description | Contract / Response |
| :--- | :--- | :--- | :--- |
| `GET` | `/quotes/:symbol` | Read a cached quote or fetch it from the configured provider | `{ symbol, price, volume, timestamp, source }` (`200`) |

Quotes are cached in Redis under `quote:{SYMBOL}` for 60 seconds. Symbols currently used by any watchlist are tracked in the Redis set `active_symbols`.

---

## Testing with cURL

### 1. Register or Login to obtain JWT Token
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"investor@fieldnote.io\",\"password\":\"GrowwSecret2026!\"}"
```
*Save the returned `token` string for the steps below.*

---

### 2. Create a Watchlist (`POST /watchlists`)
```bash
curl -X POST http://localhost:5000/watchlists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{\"name\":\"Semiconductor Leaders\"}"
```
*Response (`201 Created`):*
```json
{
  "id": "67ca412...",
  "name": "Semiconductor Leaders",
  "symbols": [],
  "symbolCount": 0,
  "createdAt": "2026-09-05T13:40:00.000Z"
}
```

---

### 3. List Watchlists (`GET /watchlists`)
Matching the exact frontend contract:
```bash
curl -X GET http://localhost:5000/watchlists \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
*Response (`200 OK`):*
```json
[
  {
    "id": "67ca412...",
    "name": "Semiconductor Leaders",
    "symbolCount": 0
  }
]
```

---

### 4. Add a Symbol (`POST /watchlists/:id/symbols`)
Adds symbol (auto-uppercased, validated 1-5 chars, duplicate checked):
```bash
curl -X POST http://localhost:5000/watchlists/67ca412.../symbols \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{\"symbol\":\"nvda\"}"
```
*Response (`200 OK`):*
```json
{
  "id": "67ca412...",
  "name": "Semiconductor Leaders",
  "symbol": "NVDA",
  "symbols": ["NVDA"],
  "symbolCount": 1
}
```

**Testing Duplicate Rejection (`400 Bad Request`):**
Running the exact same command again yields:
```json
{
  "error": "Symbol 'NVDA' is already in this watchlist"
}
```

---

### 5. Remove a Symbol (`DELETE /watchlists/:id/symbols/:symbol`)
```bash
curl -X DELETE http://localhost:5000/watchlists/67ca412.../symbols/NVDA \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
*Response (`200 OK`):*
```json
{
  "message": "Symbol 'NVDA' removed successfully",
  "id": "67ca412...",
  "symbols": [],
  "symbolCount": 0
}
```

---

### 6. Delete a Watchlist (`DELETE /watchlists/:id`)
```bash
curl -X DELETE http://localhost:5000/watchlists/67ca412... \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
*Response (`200 OK`):*
```json
{
  "message": "Watchlist 'Semiconductor Leaders' deleted successfully",
  "id": "67ca412..."
}
```

---

## Postman Collection v2.1

Copy and save the JSON below as `fieldnote_api.postman_collection.json` and import it into Postman:

```json
{
  "info": {
    "name": "Fieldnote API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register User",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"trader@fieldnote.io\",\n  \"password\": \"GrowwSecret2026!\"\n}"
            },
            "url": { "raw": "http://localhost:5000/auth/register", "protocol": "http", "host": ["localhost"], "port": "5000", "path": ["auth", "register"] }
          }
        },
        {
          "name": "Login User",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "var jsonData = pm.response.json();",
                  "if (jsonData.data && jsonData.data.token) {",
                  "    pm.environment.set(\"fieldnote_token\", jsonData.data.token);",
                  "}"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"trader@fieldnote.io\",\n  \"password\": \"GrowwSecret2026!\"\n}"
            },
            "url": { "raw": "http://localhost:5000/auth/login", "protocol": "http", "host": ["localhost"], "port": "5000", "path": ["auth", "login"] }
          }
        },
        {
          "name": "Get Authenticated User",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{fieldnote_token}}" }],
            "url": { "raw": "http://localhost:5000/auth/me", "protocol": "http", "host": ["localhost"], "port": "5000", "path": ["auth", "me"] }
          }
        }
      ]
    },
    {
      "name": "Watchlists",
      "item": [
        {
          "name": "Create Watchlist",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "var jsonData = pm.response.json();",
                  "if (jsonData.id) {",
                  "    pm.environment.set(\"fieldnote_watchlist_id\", jsonData.id);",
                  "}"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "Authorization", "value": "Bearer {{fieldnote_token}}" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Core Tech & Semis\"\n}"
            },
            "url": { "raw": "http://localhost:5000/watchlists", "protocol": "http", "host": ["localhost"], "port": "5000", "path": ["watchlists"] }
          }
        },
        {
          "name": "List Watchlists",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{fieldnote_token}}" }],
            "url": { "raw": "http://localhost:5000/watchlists", "protocol": "http", "host": ["localhost"], "port": "5000", "path": ["watchlists"] }
          }
        },
        {
          "name": "Add Symbol",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "Authorization", "value": "Bearer {{fieldnote_token}}" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"symbol\": \"NVDA\"\n}"
            },
            "url": { "raw": "http://localhost:5000/watchlists/{{fieldnote_watchlist_id}}/symbols", "protocol": "http", "host": ["localhost"], "port": "5000", "path": ["watchlists", "{{fieldnote_watchlist_id}}", "symbols"] }
          }
        },
        {
          "name": "Remove Symbol",
          "request": {
            "method": "DELETE",
            "header": [{ "key": "Authorization", "value": "Bearer {{fieldnote_token}}" }],
            "url": { "raw": "http://localhost:5000/watchlists/{{fieldnote_watchlist_id}}/symbols/NVDA", "protocol": "http", "host": ["localhost"], "port": "5000", "path": ["watchlists", "{{fieldnote_watchlist_id}}", "symbols", "NVDA"] }
          }
        },
        {
          "name": "Delete Watchlist",
          "request": {
            "method": "DELETE",
            "header": [{ "key": "Authorization", "value": "Bearer {{fieldnote_token}}" }],
            "url": { "raw": "http://localhost:5000/watchlists/{{fieldnote_watchlist_id}}", "protocol": "http", "host": ["localhost"], "port": "5000", "path": ["watchlists", "{{fieldnote_watchlist_id}}"] }
          }
        }
      ]
    }
  ]
}
```
