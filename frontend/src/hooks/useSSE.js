import { useEffect, useRef, useState, useCallback } from 'react';

export const useSSE = (options = {}) => {
    const [logs, setLogs] = useState([]);
    const [connected, setConnected] = useState(false);
    const eventSourceRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const isConnectingRef = useRef(false);
    const maxLogs = options.maxLogs || 200;

    const connect = useCallback(() => {
        // Zaten bağlanıyorsa veya bağlıysa çık
        if (isConnectingRef.current) return;
        if (eventSourceRef.current?.readyState === EventSource.OPEN) return;

        isConnectingRef.current = true;

        // Önceki bağlantıyı temizle
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        try {
            const es = new EventSource('/api/logs/stream');
            eventSourceRef.current = es;

            es.onopen = () => {
                console.log('Log SSE connected');
                isConnectingRef.current = false;
                setConnected(true);
            };

            es.onmessage = (event) => {
                // Heartbeat kontrolü
                if (!event.data || event.data.startsWith(':')) return;

                try {
                    const log = JSON.parse(event.data);
                    if (log && log.message) {
                        setLogs(prev => {
                            const newLogs = [...prev, log];
                            return newLogs.length > maxLogs ? newLogs.slice(-maxLogs) : newLogs;
                        });
                    }
                } catch (e) {
                    // Parse hatası - yoksay
                }
            };

            es.onerror = () => {
                console.log('Log SSE error, reconnecting...');
                isConnectingRef.current = false;
                setConnected(false);
                es.close();
                eventSourceRef.current = null;

                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }
                reconnectTimeoutRef.current = setTimeout(connect, 3000);
            };
        } catch (error) {
            console.error('Log SSE failed:', error);
            isConnectingRef.current = false;
            setConnected(false);
        }
    }, [maxLogs]);

    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    useEffect(() => {
        connect();

        return () => {
            isConnectingRef.current = false;

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }

            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [connect]);

    return { logs, connected, clearLogs };
};

export default useSSE;
