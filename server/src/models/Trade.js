const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    symbol: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['BUY', 'SELL'],
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    total: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Trade', tradeSchema);
