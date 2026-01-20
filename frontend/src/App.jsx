import React, { useEffect, useRef, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useQueueStore } from './store/queueStore';
import { useAutomationStore } from './store/automationStore';
import AnimatedBackground from './components/UI/AnimatedBackground';
import ThemeToggle from './components/UI/ThemeToggle';
import DragDropZone from './components/Queue/DragDropZone';
import QueueList from './components/Queue/QueueList';
import QueueControls from './components/Queue/QueueControls';
import AutomationControls from './components/Automation/AutomationControls';
import ConfirmationModal from './components/Automation/ConfirmationModal';
import LogPanel from './components/Logs/LogPanel';
import BannerUploader from './components/Image/BannerUploader';

function App() {
    const fetchQueue = useQueueStore(state => state.fetchQueue);
    const fetchStatus = useAutomationStore(state => state.fetchStatus);
    const setStatus = useAutomationStore(state => state.setStatus);
    const [connected, setConnected] = useState(false);
    const eventSourceRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const isConnectingRef = useRef(false);

    // SSE bağlantısı - ayrı useEffect
    useEffect(() => {
        let isMounted = true;

        const connectSSE = () => {
            // Zaten bağlanıyorsa veya bağlıysa çık
            if (isConnectingRef.current) return;
            if (eventSourceRef.current?.readyState === EventSource.OPEN) return;

            isConnectingRef.current = true;

            // Önceki bağlantıyı temizle
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }

            console.log('SSE connecting...');
            // Doğrudan backend'e bağlan (Vite proxy SSE için sorunlu olabilir)
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                (import.meta.env.DEV ? 'http://localhost:3001' : 'https://mebk12-production.up.railway.app');
            const sseUrl = `${API_BASE_URL}/api/automation/stream`;
            const es = new EventSource(sseUrl);
            eventSourceRef.current = es;

            es.onopen = () => {
                console.log('SSE connected');
                isConnectingRef.current = false;
                if (isMounted) setConnected(true);
            };

            es.onmessage = (event) => {
                if (!isMounted) return;

                // Heartbeat kontrolü
                if (!event.data || event.data.startsWith(':')) return;

                try {
                    const data = JSON.parse(event.data);
                    console.log('SSE received:', data.status, 'waiting:', data.waitingForConfirmation);
                    setStatus(data);
                } catch (e) {
                    // Parse hatası - yoksay
                }
            };

            es.onerror = (e) => {
                console.log('SSE error, reconnecting in 3s');
                isConnectingRef.current = false;
                if (isMounted) setConnected(false);

                es.close();
                eventSourceRef.current = null;

                // Clear existing timeout
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }

                // 3 saniye sonra yeniden bağlan
                if (isMounted) {
                    reconnectTimeoutRef.current = setTimeout(connectSSE, 3000);
                }
            };
        };

        // İlk bağlantı
        connectSSE();

        // Cleanup
        return () => {
            isMounted = false;
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
    }, []); // Boş deps - sadece mount/unmount

    // İlk yükleme - ayrı useEffect
    useEffect(() => {
        fetchQueue();
        fetchStatus();
    }, []);

    return (
        <div className="min-h-screen relative">
            <AnimatedBackground />

            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid var(--glass-border)'
                    }
                }}
            />

            <ConfirmationModal />

            <div className="relative z-10 container mx-auto px-4 py-6">
                <header className="glass-card !p-4 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                            M
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">MEB İçerik Otomasyon</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Okul web sitesi içerik yönetimi
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div
                            className={`w-2 h-2 rounded-full transition-colors ${connected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}
                            title={connected ? 'Sunucuya bağlı' : 'Bağlantı kesildi - yeniden bağlanıyor...'}
                        />
                        <ThemeToggle />
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <DragDropZone />

                        <div className="glass-card">
                            <h3 className="font-semibold mb-3">Manşet Resmi</h3>
                            <BannerUploader />
                        </div>

                        <QueueControls />

                        <div className="glass-card">
                            <h3 className="font-semibold mb-4">İçerik Kuyruğu</h3>
                            <QueueList />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <AutomationControls />

                        <div className="h-96">
                            <LogPanel />
                        </div>
                    </div>
                </div>

                <footer className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8 pb-4">
                    MEB İçerik Otomasyon Sistemi © 2025
                </footer>
            </div>
        </div>
    );
}

export default App;
