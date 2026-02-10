const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    timestamp: {
        type: Date,
        required: true,
    }
}, {
    timeseries: {
        timeField: 'timestamp',
        metaField: 'symbol',
        granularity: 'seconds'
    }
});

// Explicitly Indexing for performance (though TimeSeries does this automatically for metaField + timeField)
// Adding compounding if we query by time range often
priceSchema.index({ symbol: 1, timestamp: -1 });

module.exports = mongoose.model('Price', priceSchema);
