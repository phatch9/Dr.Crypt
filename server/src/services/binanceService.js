const WebSocket = require('ws');
const { redisClient } = require('../config/redis');
const Price = require('../models/Price');

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws/btcusdt@trade'; // Keeping it simple with one pair for now

const connectBinance = () => {
    const ws = new WebSocket(BINANCE_WS_URL);

    ws.on('open', () => {
        console.log('Connected to Binance WebSocket');
    });

    ws.on('message', async (data) => {
        try {
            const trade = JSON.parse(data);
            const price = parseFloat(trade.p);
            const symbol = trade.s;
            const timestamp = new Date(trade.T);

            // 1. Cache in Redis (store latest price)
            if (redisClient.isOpen) {
                await redisClient.set(`price:${symbol}`, price);
                // Publish for real-time frontend updates
                await redisClient.publish('price_updates', JSON.stringify({ symbol, price, timestamp }));
            }

            // 2. Persist to MongoDB TimeSeries (maybe batch this in production, but direct for now)
            // Optimization: Don't await this to avoid blocking the loop too much, or use a queue.
            // For this demo, we'll fire and forget (with error logging)
            Price.create({ symbol, price, timestamp }).catch(err => console.error('Mongo Save Error:', err));

        } catch (err) {
            console.error('Error processing Binance message:', err);
        }
    });

    ws.on('close', () => {
        console.log('Binance Connection Closed. Reconnecting...');
        setTimeout(connectBinance, 5000);
    });

    ws.on('error', (err) => {
        console.error('Binance WS Error:', err);
    });
};

module.exports = connectBinance;
