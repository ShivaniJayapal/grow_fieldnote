const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables before importing modules that initialize external clients.
dotenv.config();

const connectDB = require('./config/db');
const routes = require('./routes');
const { startQuoteRefreshJob } = require('./services/quoteRefreshJob');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB and rebuild Redis membership after the database is ready.
connectDB().then(() => {
  const watchlistService = require('./services/watchlistService');
  return watchlistService.syncActiveSymbols();
}).catch((error) => {
  console.error('[Redis] Failed to synchronize active_symbols at startup:', error.message);
});
startQuoteRefreshJob();

// CORS Configuration - allow frontend origin
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev mode
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'fieldnote-backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Mount Routes (supports both /auth and /api/auth)
app.use('/', routes);
app.use('/api', routes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start Express Server
const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Fieldnote backend server running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 JWT Auth: Enabled`);
  console.log(`🌐 Allowed Origins: ${allowedOrigins.join(', ')}`);
  console.log(`=========================================`);
});

module.exports = { app, server };

