const express = require('express');
const authRoutes = require('./authRoutes');
const watchlistRoutes = require('./watchlistRoutes');
const quoteRoutes = require('./quoteRoutes');

const router = express.Router();

// Mount authentication routes
router.use('/auth', authRoutes);

// Mount watchlist management routes
router.use('/watchlists', watchlistRoutes);

// Mount market data quote routes
router.use('/quotes', quoteRoutes);

module.exports = router;

