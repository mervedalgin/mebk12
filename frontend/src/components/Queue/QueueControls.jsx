import React from 'react';
import { useQueueStore } from '../../store/queueStore';
import toast from 'react-hot-toast';

const QueueControls = () => {
    // Tüm fonksiyonları queueStore'dan al
    const {
        queue,
        selectedItems,
        selectAll,
        clearSelection,
        bulkDelete,
        retryAllFailed,
        clearQueue
    } = useQueueStore();

    const handleSelectAll = () => {
        if (selectedItems.size === queue.length && queue.length > 0) {
            clearSelection();
        } else {
            selectAll();
        }
    };

    const handleBulkDelete = async () => {
        if (selectedItems.size === 0) {
            toast.error('Önce öğe seçin');
            return;
        }

        if (confirm(`${selectedItems.size} öğe silinecek. Emin misiniz?`)) {
            const success = await bulkDelete(selectedItems);
            if (success) {
                toast.success('Öğeler silindi');
            } else {
                toast.error('Silme hatası');
            }
        }
    };

    const handleRetryFailed = async () => {
        const failedCount = queue.filter(item => item.status === 'failed').length;
        if (failedCount === 0) {
            toast.error('Başarısız öğe yok');
            return;
        }

        const success = await retryAllFailed();
        if (success) {
            toast.success(`${failedCount} öğe tekrar denenecek`);
        }
    };

    const handleClearQueue = async () => {
        if (queue.length === 0) {
            toast.error('Kuyruk zaten boş');
            return;
        }

        if (confirm('Tüm kuyruk temizlenecek. Emin misiniz?')) {
            const success = await clearQueue();
            if (success) {
                toast.success('Kuyruk temizlendi');
            } else {
                toast.error('Temizleme hatası');
            }
        }
    };

    const stats = {
        total: queue.length,
        pending: queue.filter(i => i.status === 'pending').length,
        completed: queue.filter(i => i.status === 'completed').length,
        failed: queue.filter(i => i.status === 'failed').length
    };

    return (
        <div className="glass-card !p-4 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                    <div className="font-semibold">{stats.total}</div>
                    <div className="text-xs text-gray-500">Toplam</div>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2">
                    <div className="font-semibold text-blue-600">{stats.pending}</div>
                    <div className="text-xs text-blue-500">Bekleyen</div>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2">
                    <div className="font-semibold text-green-600">{stats.completed}</div>
                    <div className="text-xs text-green-500">Tamamlanan</div>
                </div>
                <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-2">
                    <div className="font-semibold text-red-600">{stats.failed}</div>
                    <div className="text-xs text-red-500">Başarısız</div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={handleSelectAll}
                    className="btn btn-ghost text-sm"
                    disabled={queue.length === 0}
                >
                    {selectedItems.size === queue.length && queue.length > 0 ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                </button>

                {selectedItems.size > 0 && (
                    <button
                        onClick={handleBulkDelete}
                        className="btn btn-danger text-sm"
                    >
                        Seçilenleri Sil ({selectedItems.size})
                    </button>
                )}

                {stats.failed > 0 && (
                    <button
                        onClick={handleRetryFailed}
                        className="btn btn-warning text-sm"
                    >
                        Başarısızları Dene
                    </button>
                )}

                {queue.length > 0 && (
                    <button
                        onClick={handleClearQueue}
                        className="btn btn-ghost text-sm text-red-500 ml-auto"
                    >
                        Kuyruğu Temizle
                    </button>
                )}
            </div>
        </div>
    );
};

export default QueueControls;
