const express = require('express');
const router = express.Router();
const { getHistoricalPrices } = require('../controllers/priceController');
const { executeTrade, getTrades } = require('../controllers/tradeController');
const { protect } = require('../middleware/authMiddleware'); // Need to create this!

router.get('/prices/history', getHistoricalPrices);
router.post('/trade', protect, executeTrade);
router.get('/trade', protect, getTrades);

module.exports = router;
