import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useWebSocket } from './hooks/useWebSocket';
import { TradingView } from './components/TradingView';
import type { Trade, AuthFormData, User, PriceData } from './types';
import './App.css';

const API_URL = 'http://localhost:8000/api';
const WS_URL = 'ws://localhost:8000';

function AppContent() {
    const { user, login, logout, isAuthenticated } = useAuth();
    const { isConnected, lastMessage } = useWebSocket(WS_URL);

    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [priceHistory, setPriceHistory] = useState<number[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [authForm, setAuthForm] = useState<AuthFormData>({ username: '', password: '' });

    // Fetch historical prices on mount
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data } = await axios.get<PriceData[]>(`${API_URL}/prices/history?symbol=BTCUSDT&limit=50`);
                const prices = data.map((p) => p.price);
                setPriceHistory(prices);
                if (prices.length > 0) {
                    setCurrentPrice(prices[prices.length - 1]);
                }
            } catch (error) {
                console.error('Failed to fetch price history:', error);
            }
        };
        fetchHistory();
    }, []);

    // Handle WebSocket price updates
    useEffect(() => {
        if (lastMessage && lastMessage.price) {
            setCurrentPrice(lastMessage.price);
            setPriceHistory(prev => {
                const newHistory = [...prev, lastMessage.price];
                return newHistory.slice(-50); // Keep last 50 prices
            });
        }
    }, [lastMessage]);

    // Fetch trades when user logs in
    useEffect(() => {
        if (isAuthenticated && user) {
            fetchTrades();
        } else {
            setTrades([]);
        }
    }, [isAuthenticated, user]);

    const fetchTrades = async () => {
        if (!user) return;
        try {
            const { data } = await axios.get<Trade[]>(`${API_URL}/trade`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setTrades(data);
        } catch (error) {
            console.error('Failed to fetch trades:', error);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
            const { data } = await axios.post<User>(`${API_URL}${endpoint}`, authForm);
            login(data);
            setShowAuthModal(false);
            setAuthForm({ username: '', password: '' });
        } catch (error: any) {
            alert(error.response?.data?.message || 'Authentication failed');
        }
    };

    const handleExecuteTrade = async (type: 'BUY' | 'SELL', amount: number, price: number) => {
        if (!user) return;
        try {
            await axios.post(
                `${API_URL}/trade`,
                {
                    symbol: 'BTCUSDT',
                    type,
                    price,
                    amount
                },
                {
                    headers: { Authorization: `Bearer ${user.token}` }
                }
            );
            fetchTrades();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Trade execution failed');
        }
    };

    return (
        <div className="app">
            {/* Header */}
            <header className="app-header">
                <div className="header-left">
                    <div className="logo">
                        <Activity size={24} />
                        <span>CryptTrader</span>
                    </div>
                    <div className="market-info">
                        <span className="pair">BTC/USDT</span>
                        {currentPrice && (
                            <span className="price">${currentPrice.toFixed(2)}</span>
                        )}
                    </div>
                </div>

                <div className="header-right">
                    <div className="connection-status">
                        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
                        <span>{isConnected ? 'Live' : 'Connecting...'}</span>
                    </div>

                    {isAuthenticated && user ? (
                        <div className="user-menu">
                            <UserIcon size={18} />
                            <span>{user.username}</span>
                            <button onClick={logout} className="btn-logout">
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setShowAuthModal(true)} className="btn-login">
                            <LogIn size={16} />
                            <span>Login</span>
                        </button>
                    )}
                </div>
            </header>

            {/* Main Trading View */}
            <main className="app-main">
                <TradingView
                    currentPrice={currentPrice}
                    priceHistory={priceHistory}
                    trades={trades}
                    onExecuteTrade={handleExecuteTrade}
                    isAuthenticated={isAuthenticated}
                />
            </main>

            {/* Auth Modal */}
            {showAuthModal && (
                <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{authMode === 'login' ? 'Login' : 'Register'}</h2>
                        <form onSubmit={handleAuth}>
                            <input
                                type="text"
                                placeholder="Username"
                                value={authForm.username}
                                onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={authForm.password}
                                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                                required
                            />
                            <button type="submit" className="btn-primary">
                                {authMode === 'login' ? 'Login' : 'Create Account'}
                            </button>
                        </form>
                        <p className="auth-switch">
                            {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                            <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
                                {authMode === 'login' ? 'Register' : 'Login'}
                            </button>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
