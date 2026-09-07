const express = require('express');
const watchlistController = require('../controllers/watchlistController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// All watchlist routes are protected by verifyToken middleware
router.use(verifyToken);

/**
 * @route   POST /watchlists
 * @desc    Create a new watchlist for the logged-in user
 * @access  Protected
 */
router.post('/', (req, res) => watchlistController.createWatchlist(req, res));

/**
 * @route   GET /watchlists
 * @desc    List all watchlists for the logged-in user with symbolCount
 * @returns [{ id, name, symbolCount }]
 * @access  Protected
 */
router.get('/', (req, res) => watchlistController.getWatchlists(req, res));

/**
 * @route   GET /watchlists/:id/live
 * @desc    Return live quotes and attention scores for a watchlist
 * @access  Protected
 */
router.get('/:id/live', (req, res) => watchlistController.getLiveWatchlist(req, res));

router.post('/:id/diff/mark-checked', (req, res) => watchlistController.markWatchlistChecked(req, res));

/**
 * @route   GET /watchlists/:id/diff
 * @desc    Compare cached quotes against temporary 24-hour reference prices
 * @access  Protected
 */
router.get('/:id/diff', (req, res) => watchlistController.getWatchlistDiff(req, res));

/**
 * @route   POST /watchlists/:id/symbols
 * @desc    Add a symbol to a specific watchlist (1-5 chars, uppercase, no duplicates)
 * @access  Protected
 */
router.post('/:id/symbols', (req, res) => watchlistController.addSymbol(req, res));

/**
 * @route   DELETE /watchlists/:id/symbols/:symbol
 * @desc    Remove a symbol from a specific watchlist
 * @access  Protected
 */
router.delete('/:id/symbols/:symbol', (req, res) => watchlistController.removeSymbol(req, res));

/**
 * @route   DELETE /watchlists/:id
 * @desc    Delete an entire watchlist belonging to the logged-in user
 * @access  Protected
 */
router.delete('/:id', (req, res) => watchlistController.deleteWatchlist(req, res));

module.exports = router;

