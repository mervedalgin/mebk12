import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSSE } from '../../hooks/useSSE';
import { useUIStore } from '../../store/uiStore';

const logConfig = {
    info: { icon: 'ℹ️', class: 'log-info' },
    success: { icon: '✓', class: 'log-success' },
    warning: { icon: '⚠️', class: 'log-warning' },
    error: { icon: '✗', class: 'log-error' },
    debug: { icon: '🔧', class: 'log-debug' }
};

const LogPanel = () => {
    // useSSE artık URL almıyor, sabit olarak /api/logs/stream kullanıyor
    const { logs, connected, clearLogs } = useSSE({ maxLogs: 200 });
    const { logFilter, setLogFilter, isLogPanelOpen, toggleLogPanel } = useUIStore();
    const [autoScroll, setAutoScroll] = useState(true);
    const logsEndRef = useRef(null);

    const filteredLogs = logFilter === 'all'
        ? logs
        : logs.filter(log => log.level === logFilter);

    useEffect(() => {
        if (autoScroll && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [filteredLogs, autoScroll]);

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    if (!isLogPanelOpen) {
        return (
            <button
                onClick={toggleLogPanel}
                className="fixed bottom-4 right-4 btn btn-primary shadow-lg"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                </svg>
                Loglar ({logs.length})
            </button>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card h-full flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Log Paneli</h3>
                    <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'
                        }`} title={connected ? 'Bağlı' : 'Bağlantı kesildi'}></span>
                </div>
                <button
                    onClick={toggleLogPanel}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
                {['all', 'info', 'success', 'warning', 'error'].map(filter => (
                    <button
                        key={filter}
                        onClick={() => setLogFilter(filter)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${logFilter === filter
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        {filter === 'all' ? 'Tümü' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                ))}
            </div>

            {/* Logs */}
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0 font-mono text-sm">
                <AnimatePresence initial={false}>
                    {filteredLogs.map((log) => {
                        const config = logConfig[log.level] || logConfig.info;
                        return (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className={`py-1 px-2 rounded ${config.class} hover:bg-gray-100 dark:hover:bg-gray-800/50`}
                            >
                                <span className="text-gray-500 mr-2">[{formatTime(log.timestamp)}]</span>
                                <span className="mr-1">{config.icon}</span>
                                <span>{log.message}</span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                <div ref={logsEndRef} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-500">
                    {filteredLogs.length} log gösteriliyor
                </span>
                <div className="flex gap-2">
                    <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoScroll}
                            onChange={(e) => setAutoScroll(e.target.checked)}
                            className="rounded"
                        />
                        Otomatik kaydır
                    </label>
                    <button
                        onClick={clearLogs}
                        className="text-xs text-red-500 hover:text-red-600"
                    >
                        Temizle
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default LogPanel;
