import React, { useState } from 'react';

interface OrderPanelProps {
    currentPrice: number | null;
    onExecuteTrade: (type: 'BUY' | 'SELL', amount: number, price: number) => void;
    isAuthenticated: boolean;
}

export const OrderPanel: React.FC<OrderPanelProps> = ({
    currentPrice,
    onExecuteTrade,
    isAuthenticated
}) => {
    const [activeTab, setActiveTab] = useState<'BUY' | 'SELL'>('BUY');
    const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
    const [amount, setAmount] = useState('');
    const [price, setPrice] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAuthenticated) {
            alert('Please login to trade');
            return;
        }

        const tradeAmount = parseFloat(amount);
        const tradePrice = orderType === 'MARKET' && currentPrice
            ? currentPrice
            : parseFloat(price);

        if (isNaN(tradeAmount) || tradeAmount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (isNaN(tradePrice) || tradePrice <= 0) {
            alert('Please enter a valid price');
            return;
        }

        onExecuteTrade(activeTab, tradeAmount, tradePrice);
        setAmount('');
        setPrice('');
    };

    const calculateTotal = (): string => {
        const amountNum = parseFloat(amount) || 0;
        const priceNum = orderType === 'MARKET' && currentPrice
            ? currentPrice
            : parseFloat(price) || 0;
        return (amountNum * priceNum).toFixed(2);
    };

    return (
        <div className="order-panel">
            <div className="order-panel-header">
                <button
                    className={`tab ${activeTab === 'BUY' ? 'active' : ''}`}
                    onClick={() => setActiveTab('BUY')}
                >
                    Buy
                </button>
                <button
                    className={`tab ${activeTab === 'SELL' ? 'active' : ''}`}
                    onClick={() => setActiveTab('SELL')}
                >
                    Sell
                </button>
            </div>

            <div className="order-type-selector">
                <button
                    className={`order-type-btn ${orderType === 'MARKET' ? 'active' : ''}`}
                    onClick={() => setOrderType('MARKET')}
                >
                    Market
                </button>
                <button
                    className={`order-type-btn ${orderType === 'LIMIT' ? 'active' : ''}`}
                    onClick={() => setOrderType('LIMIT')}
                >
                    Limit
                </button>
            </div>

            <form onSubmit={handleSubmit} className="order-form">
                {orderType === 'LIMIT' && (
                    <div className="form-group">
                        <label>Price (USDT)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0.00"
                            className="form-input"
                        />
                    </div>
                )}

                <div className="form-group">
                    <label>Amount (BTC)</label>
                    <input
                        type="number"
                        step="0.0001"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.0000"
                        className="form-input"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Total (USDT)</label>
                    <div className="total-display">{calculateTotal()}</div>
                </div>

                <button
                    type="submit"
                    className={`submit-btn ${activeTab.toLowerCase()}`}
                    disabled={!isAuthenticated}
                >
                    {isAuthenticated
                        ? `${activeTab} BTC`
                        : 'Login to Trade'
                    }
                </button>
            </form>

            {!isAuthenticated && (
                <div className="auth-notice">
                    <p>Please login to start trading</p>
                </div>
            )}
        </div>
    );
};
