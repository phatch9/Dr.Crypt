const mongoose = require('mongoose');
const { performance } = require('perf_hooks');
const Price = require('../src/models/Price');
const { redisClient, connectRedis } = require('../src/config/redis');
const connectDB = require('../src/config/db');
require('dotenv').config();

const runQueryBenchmark = async () => {
    await connectDB();
    await connectRedis();

    const symbol = 'BTCUSDT';

    // Seed some data if needed (optional, assuming data exists from streaming)

    // 1. Uncached Query (Simulated by clearing cache key)
    const cacheKey = `history:${symbol}:100`;
    await redisClient.del(cacheKey);

    console.log('--- Benchmarking Query Performance ---');

    const startDb = performance.now();
    // Simulate DB fetch
    const pricesDb = await Price.find({ symbol }).sort({ timestamp: -1 }).limit(100);
    const endDb = performance.now();
    const dbTime = (endDb - startDb).toFixed(2);
    console.log(`MongoDB Fetch Time: ${dbTime}ms`);

    // Cache it manually for the test
    await redisClient.setEx(cacheKey, 60, JSON.stringify(pricesDb));

    // 2. Cached Query
    const startCache = performance.now();
    const cachedData = await redisClient.get(cacheKey);
    const _parsed = JSON.parse(cachedData);
    const endCache = performance.now();
    const cacheTime = (endCache - startCache).toFixed(2);
    console.log(`Redis Cache Fetch Time: ${cacheTime}ms`);

    const improvement = ((dbTime - cacheTime) / dbTime) * 100;
    console.log(`\nPerformance Improvement: ${improvement.toFixed(2)}%`);

    if (improvement > 36) {
        console.log('✅ SUCCESS: Query performance improved by > 36%');
    }

    process.exit(0);
};

runQueryBenchmark();
