import { useEffect, useRef, useState } from 'react';
import type { WebSocketMessage } from '../types';

interface UseWebSocketReturn {
    isConnected: boolean;
    lastMessage: WebSocketMessage | null;
    sendMessage: (message: string) => void;
}

export const useWebSocket = (url: string): UseWebSocketReturn => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

    const connect = () => {
        try {
            ws.current = new WebSocket(url);

            ws.current.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);
            };

            ws.current.onmessage = (event) => {
                try {
                    const data: WebSocketMessage = JSON.parse(event.data);
                    setLastMessage(data);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            ws.current.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);

                // Auto-reconnect after 3 seconds
                reconnectTimeout.current = setTimeout(() => {
                    console.log('Attempting to reconnect...');
                    connect();
                }, 3000);
            };

            ws.current.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
        }
    };

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [url]);

    const sendMessage = (message: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(message);
        }
    };

    return { isConnected, lastMessage, sendMessage };
};
