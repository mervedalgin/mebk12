import React from 'react';
import { motion } from 'framer-motion';
import { useAutomationStore } from '../../store/automationStore';
import { useQueueStore } from '../../store/queueStore';
import toast from 'react-hot-toast';

const AutomationControls = () => {
    const {
        status,
        isRunning,
        isPaused,
        progress,
        currentItem,
        start,
        pause,
        resume,
        stop,
        skip
    } = useAutomationStore();

    // Kuyruk durumunu al
    const { queue } = useQueueStore();
    const pendingCount = queue.filter(item => item.status === 'pending' || item.status === 'retrying').length;
    const hasQueueItems = pendingCount > 0;

    const handleStart = async () => {
        if (!hasQueueItems) {
            toast.error('Kuyrukta bekleyen içerik yok');
            return;
        }
        try {
            await start();
            toast.success('Otomasyon başlatıldı');
        } catch (error) {
            toast.error('Başlatma hatası: ' + error.message);
        }
    };

    const handlePause = async () => {
        try {
            await pause();
            toast.success('Otomasyon duraklatıldı');
        } catch (error) {
            toast.error('Duraklama hatası');
        }
    };

    const handleResume = async () => {
        try {
            await resume();
            toast.success('Otomasyon devam ediyor');
        } catch (error) {
            toast.error('Devam hatası');
        }
    };

    const handleStop = async () => {
        if (confirm('Otomasyon durdurulacak. Emin misiniz?')) {
            try {
                await stop();
                toast.success('Otomasyon durduruldu');
            } catch (error) {
                toast.error('Durdurma hatası');
            }
        }
    };

    const handleSkip = async () => {
        try {
            await skip();
            toast.success('Öğe atlandı');
        } catch (error) {
            toast.error('Atlama hatası');
        }
    };

    const progressPercent = progress.total > 0
        ? Math.round((progress.processed / progress.total) * 100)
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
        >
            <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' :
                    isPaused ? 'bg-yellow-500' :
                        'bg-gray-400'
                    }`}></span>
                Otomasyon Kontrolü
            </h3>

            {/* Butonlar */}
            <div className="flex flex-wrap gap-2 mb-4">
                {!isRunning ? (
                    <button
                        onClick={handleStart}
                        disabled={!hasQueueItems}
                        className={`btn btn-primary ${!hasQueueItems ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={!hasQueueItems ? 'Kuyrukta bekleyen içerik yok' : 'Otomasyonu başlat'}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                        Başlat {hasQueueItems && `(${pendingCount})`}
                    </button>
                ) : (
                    <>
                        {!isPaused ? (
                            <button onClick={handlePause} className="btn btn-warning">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                </svg>
                                Duraklat
                            </button>
                        ) : (
                            <button onClick={handleResume} className="btn btn-success">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                Devam
                            </button>
                        )}

                        <button onClick={handleSkip} className="btn btn-ghost">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                            </svg>
                            Atla
                        </button>

                        <button onClick={handleStop} className="btn btn-danger">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 6h12v12H6z" />
                            </svg>
                            Durdur
                        </button>
                    </>
                )}
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                    <span>İlerleme</span>
                    <span>{progressPercent}% ({progress.processed}/{progress.total})</span>
                </div>
                <div className="progress-bar">
                    <motion.div
                        className="progress-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* İstatistikler */}
            <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
                <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2">
                    <div className="font-semibold text-green-600">{progress.processed}</div>
                    <div className="text-xs text-green-500">Başarılı</div>
                </div>
                <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-2">
                    <div className="font-semibold text-red-600">{progress.failed}</div>
                    <div className="text-xs text-red-500">Başarısız</div>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2">
                    <div className="font-semibold text-blue-600">{progress.pending}</div>
                    <div className="text-xs text-blue-500">Bekleyen</div>
                </div>
            </div>

            {/* Mevcut öğe */}
            {currentItem && (
                <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                    <span className="text-gray-500">Şu an:</span>{' '}
                    <span className="font-medium">{currentItem.title}</span>
                </div>
            )}
        </motion.div>
    );
};

export default AutomationControls;
