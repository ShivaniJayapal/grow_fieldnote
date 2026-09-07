# fieldnote

A smart market watchlist that tells you what changed and what deserves your attention — not just another stock ticker.

## The Problem

Most watchlists are passive. They show every tracked stock's price and percentage change, all the time, with no distinction between a stock that moved 0.3% on normal daily noise and one that moved 6% because of a real catalyst. The user is left to interpret the numbers themselves, scanning a wall of data to figure out what matters. This gets worse as a watchlist grows.

## The Solution

fieldnote decides what is worth your attention, instead of just displaying raw numbers and leaving the interpretation to you.

Every tracked symbol is scored with an attention score from 0 to 100, computed from:

- Price change relative to the stock's own typical volatility, since a 2% move means something different for a utility stock than for a biotech
- Trading volume relative to its 20-day average, since unusual volume is often more meaningful than the price move itself
- Contextual tags explaining what triggered the flag, such as Volatility, Downside, or Breakout

The dashboard separates flagged, high-signal moves from routine noise, so a watchlist of any size can be scanned in seconds instead of requiring the user to compare every number manually.

The second core feature is the Diff Engine, a dedicated view that answers "what changed since I last checked" rather than only "what is the price right now." The system snapshots every symbol's price at each session and, on return, shows a clear before-and-after comparison with the computed change and reasoning, then resets the baseline for the next visit.

## Features

- Create and manage multiple watchlists per account
- Add and remove symbols with ticker validation
- Live price data with an attention score per symbol
- Flagged versus routine classification based on a configurable threshold
- Diff Engine: session-to-session comparison of price and status
- Manual "mark as checked" to reset the comparison baseline
- Live and delayed data status indicators per symbol
- Account-based persistence so watchlists follow the user across devices

## Architecture

**Frontend**
- React with Vite
- Tailwind CSS
- TanStack React Query for data fetching and caching
- Recharts for intraday sparklines
- Socket.io client for live update handling

**Backend**
- Node.js with Express
- MongoDB with Mongoose for users, watchlists, and price snapshots
- JWT-based authentication
- node-cron for scheduled market data refresh
- An in-memory cache layer for quote lookups, structured so it can be swapped for Redis in production

**Market data**
- Live quotes from the Finnhub API
- Quotes are timestamped on fetch, and the UI distinguishes live from delayed data rather than presenting all prices as equally current

## How Meaningful Change Is Defined

A raw percentage change is not enough to decide what deserves attention. fieldnote combines three signals into a single attention score:

1. Price delta normalized against the symbol's own historical volatility, rather than a flat threshold applied to every stock equally
2. Volume compared to its 20-day average, since a large move on unusually high volume carries more weight than the same move on ordinary volume
3. A same-day catalyst flag where available, such as an earnings release or analyst rating change

A symbol crossing the attention threshold, currently set at 60, is surfaced as flagged. Everything else is grouped as routine movement.

## How State Persists

Watchlists, symbols, and session snapshots are stored in MongoDB against the authenticated user's account, not in browser local storage. A user can log in from a different device and see the same watchlists and the same session history.

## How Staleness and Data Issues Are Handled

- Every cached quote carries a timestamp. If a quote is older than the expected refresh interval, it is marked delayed in the UI instead of being shown as live.
- If the market data provider is unavailable, the last known good quote is served from cache rather than failing the page.
- Symbol validation happens at add time, rejecting unknown or malformed tickers before they are saved to a watchlist.

## Scaling Considerations

- Market data is polled per unique symbol across all users rather than per user per symbol, so a single quote fetch for a widely watched stock serves every user tracking it.
- The cache layer sits between the application and the external market data API to reduce redundant calls as the number of tracked symbols grows.
- The cache is architected as a swappable layer. The current build uses an in-memory fallback for local development; Redis is the intended production cache and requires no application-level changes to adopt.

## Project Structure

```
fieldnote/
├── frontend/
│   ├── src/
│   │   ├── api/          # API client and React Query hooks
│   │   ├── components/   # Layout, hero, table, and modal components
│   │   ├── sockets/       # Live update handling
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── server/
│   ├── models/           # User, Watchlist, Snapshot schemas
│   ├── routes/            # Auth, watchlist, and quote endpoints
│   ├── controllers/
│   ├── services/          # Market data fetching, attention scoring, caching
│   ├── middleware/        # JWT verification
│   └── server.js
└── README.md
```

## Setup

### Prerequisites

- Node.js 18 or later
- MongoDB running locally or a connection string to a hosted instance
- A Finnhub API key

### Backend

```
cd server
npm install
```

Create a `.env` file in `server/` with the following:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/fieldnote
JWT_SECRET=your_jwt_secret
FINNHUB_API_KEY=your_finnhub_api_key
```

Start the server:

```
npm run dev
```

### Frontend

```
cd frontend
npm install
```

Create a `.env` file in `frontend/` with the following:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the frontend:

```
npm run dev
```

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | /auth/register | Create a new account |
| POST | /auth/login | Authenticate and receive a JWT |
| GET | /watchlists | List the authenticated user's watchlists |
| POST | /watchlists | Create a new watchlist |
| POST | /watchlists/:id/symbols | Add a symbol to a watchlist |
| DELETE | /watchlists/:id/symbols/:symbol | Remove a symbol from a watchlist |
| GET | /watchlists/:id/live | Live quotes and attention scores for all symbols in a watchlist |
| GET | /watchlists/:id/diff | Comparison of current prices against the last recorded snapshot |

## What Makes This Different

Anyone can display a price. The harder problem is deciding, on the user's behalf, what actually changed in a way that matters, and explaining why. fieldnote is built around that problem rather than around displaying data, so that returning to the app after time away is useful within seconds instead of requiring the user to compare numbers manually.

## Status and Known Limitations

- Redis caching is not yet enabled in this build; an in-memory fallback is used for local development.
- Volume-versus-20-day-average is currently computed from a static per-symbol baseline rather than a live historical data pipeline.
- News and catalyst tagging is derived from available signals at the time of the request rather than a dedicated news feed integration.
