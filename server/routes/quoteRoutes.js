const express = require('express');
const quoteController = require('../controllers/quoteController');

const router = express.Router();

/**
 * @route   GET /quotes/:symbol
 * @desc    Fetch normalized stock quote (checks Redis cache first, fetches on miss, 60s TTL)
 * @access  Public
 */
router.get('/:symbol', (req, res) => quoteController.getQuote(req, res));

module.exports = router;
