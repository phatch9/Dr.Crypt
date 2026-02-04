import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Activity, Lock, Unlock, History, TrendingUp } from 'lucide-react'
import './App.css'

function App() {
    const [user, setUser] = useState(null);
    const [price, setPrice] = useState(null);
    const [priceHistory, setPriceHistory] = useState([]);
    const [trades, setTrades] = useState([]);
    const [tradeAmount, setTradeAmount] = useState('');
    const [wsConnected, setWsConnected] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [formData, setFormData] = useState({ username: '', password: '' });

    const API_URL = 'http://localhost:8000/api';
    const ws = useRef(null);

    // Initial Data Fetch
    useEffect(() => {
        // Fetch historical prices
        const fetchHistory = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/prices/history?symbol=BTCUSDT`);
                setPriceHistory(data.map(p => p.price));
                if (data.length > 0) setPrice(data[data.length - 1].price);
            } catch (err) {
                console.error("Failed to fetch history", err);
            }
        };
        fetchHistory();

        // Connect WS
        const connectWs = () => {
            ws.current = new WebSocket('ws://localhost:8000');

            ws.current.onopen = () => {
                console.log('WebSocket connected');
                setWsConnected(true);
            };

            ws.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.price) {
                    setPrice(data.price);
                    setPriceHistory(prev => {
                        const newHist = [...prev, data.price];
                        return newHist.slice(-50); // Keep last 50 for chart
                    });
                }
            };

            ws.current.onclose = () => {
                console.log('WebSocket disconnected');
                setWsConnected(false);
                setTimeout(connectWs, 3000);
            };

            ws.current.onerror = (err) => console.error("WS Error", err);
        };
        connectWs();

        return () => {
            if (ws.current) ws.current.close();
        };
    }, []);

    // Load User & Trades
    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            const userData = JSON.parse(stored);
            setUser(userData);
            fetchTrades(userData.token);
        }
    }, []);

    const fetchTrades = async (token) => {
        try {
            const { data } = await axios.get(`${API_URL}/trade`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTrades(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        try {
            const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
            const { data } = await axios.post(`${API_URL}${endpoint}`, formData);
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
            fetchTrades(data.token);
        } catch (err) {
            alert(err.response?.data?.message || 'Auth failed');
        }
    };

    const handleTrade = async (type) => {
        if (!user || !price || !tradeAmount) return;
        try {
            await axios.post(`${API_URL}/trade`, {
                symbol: 'BTCUSDT',
                type,
                price,
                amount: parseFloat(tradeAmount)
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setTradeAmount('');
            fetchTrades(user.token);
        } catch (err) {
            alert(err.response?.data?.message || 'Trade failed');
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        setTrades([]);
    }

    return (
        <div className="app-container">
            <nav className="navbar">
                <div className="logo">
                    <Activity className="icon" /> <span>Dr.Crypt</span>
                </div>
                <div className="status">
                    <span className={`indicator ${wsConnected ? 'online' : 'offline'}`}></span>
                    {wsConnected ? 'System Operational' : 'Connecting...'}
                </div>
                <div className="user-section">
                    {user ? (
                        <div className="user-info">
                            <span>{user.username}</span>
                            <button onClick={logout} className="btn-secondary">Logout</button>
                        </div>
                    ) : (
                        <span className="guest-badge">Guest Access</span>
                    )}
                </div>
            </nav>

            <main className="dashboard">
                {/* Market Data Section */}
                <section className="market-card">
                    <div className="card-header">
                        <h2>BTC / USDT</h2>
                        <span className="live-tag">LIVE</span>
                    </div>

                    <div className="price-display">
                        <h1 className={priceHistory[priceHistory.length - 1] > priceHistory[priceHistory.length - 2] ? 'green' : 'red'}>
                            ${price ? price.toFixed(2) : 'Loading...'}
                        </h1>
                    </div>

                    <div className="chart-placeholder">
                        <div className="bars">
                            {priceHistory.map((p, i) => (
                                <div key={i} className="bar" style={{ height: `${((p - Math.min(...priceHistory)) / (Math.max(...priceHistory) - Math.min(...priceHistory) || 1)) * 100}%` }}></div>
                            ))}
                        </div>
                    </div>

                    {user && (
                        <div className="trade-controls">
                            <input
                                type="number"
                                className="trade-input"
                                placeholder="Amount BTC"
                                value={tradeAmount}
                                onChange={(e) => setTradeAmount(e.target.value)}
                            />
                            <button className="btn-buy" onClick={() => handleTrade('BUY')}>BUY</button>
                            <button className="btn-sell" onClick={() => handleTrade('SELL')}>SELL</button>
                        </div>
                    )}
                </section>

                {/* Trades History or Auth */}
                {user ? (
                    <section className="market-card history-card">
                        <div className="card-header">
                            <h3><History className="icon" /> Trade History</h3>
                        </div>
                        <div className="trade-list">
                            {trades.map(t => (
                                <div key={t._id} className={`trade-item ${t.type.toLowerCase()}`}>
                                    <div className="trade-info">
                                        <strong>{t.type}</strong>
                                        <span>{t.amount} BTC</span>
                                    </div>
                                    <div className="trade-details">
                                        <span>@ ${t.price.toFixed(2)}</span>
                                        <span className="trade-time"> {new Date(t.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            ))}
                            {trades.length === 0 && <p className="text-muted">No trades execute yet.</p>}
                        </div>
                    </section>
                ) : (
                    <section className="auth-card">
                        <div className="auth-header">
                            {authMode === 'login' ? <Lock className="icon" /> : <Unlock className="icon" />}
                            <h3>{authMode === 'login' ? 'Secure Login' : 'Join Platform'}</h3>
                        </div>
                        <form onSubmit={handleAuth}>
                            <input
                                type="text"
                                placeholder="Username"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button type="submit" className="btn-primary">
                                {authMode === 'login' ? 'Access Terminal' : 'Create Account'}
                            </button>
                        </form>
                        <p className="auth-switch" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
                            {authMode === 'login' ? 'Need an account?' : 'Already have access?'}
                        </p>
                    </section>
                )}
            </main>
        </div>
    )
}

export default App
