const queueManager = require('../services/QueueManager');
const logService = require('../services/LogService');

// Tüm kuyruğu getir
const getQueue = (req, res) => {
    try {
        const queue = queueManager.getQueue();
        const stats = queueManager.getStatistics();

        // Frontend queue dizisini direkt data olarak bekliyor
        res.json({
            success: true,
            data: queue,  // Direkt dizi olarak gönder
            stats: stats
        });
    } catch (error) {
        logService.error('Kuyruk getirilemedi', error);
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// Tek öğe getir
const getQueueItem = (req, res) => {
    try {
        const item = queueManager.getItem(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                error: { message: 'Öğe bulunamadı' }
            });
        }

        res.json({ success: true, data: item });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// Kuyruğa ekle
const addToQueue = (req, res) => {
    try {
        const { jsonData, bannerPath, priority } = req.body;

        if (!jsonData || !jsonData.baslik) {
            return res.status(400).json({
                success: false,
                error: { message: 'JSON verisi ve başlık gerekli' }
            });
        }

        const item = queueManager.addToQueue(jsonData, bannerPath, priority || 0);

        res.status(201).json({
            success: true,
            data: item,
            message: 'Kuyruğa eklendi'
        });
    } catch (error) {
        logService.error('Kuyruğa eklenemedi', error);
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// Öğe güncelle
const updateQueueItem = (req, res) => {
    try {
        const item = queueManager.updateItem(req.params.id, req.body);

        if (!item) {
            return res.status(404).json({
                success: false,
                error: { message: 'Öğe bulunamadı' }
            });
        }

        res.json({
            success: true,
            data: item,
            message: 'Güncellendi'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// Öğe sil
const deleteQueueItem = (req, res) => {
    try {
        const removed = queueManager.removeFromQueue(req.params.id);

        if (!removed) {
            return res.status(404).json({
                success: false,
                error: { message: 'Öğe bulunamadı' }
            });
        }

        res.json({
            success: true,
            message: 'Silindi'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// Sıralama değiştir
const reorderQueue = (req, res) => {
    try {
        const { oldIndex, newIndex } = req.body;
        const success = queueManager.reorderQueue(oldIndex, newIndex);

        if (!success) {
            return res.status(400).json({
                success: false,
                error: { message: 'Geçersiz index' }
            });
        }

        res.json({
            success: true,
            message: 'Sıralama değiştirildi'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// Toplu sil
const bulkDelete = (req, res) => {
    try {
        const { ids } = req.body;
        const deleted = queueManager.bulkDelete(ids);

        res.json({
            success: true,
            data: { deleted },
            message: `${deleted.length} öğe silindi`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// Tekrar dene
const retryItem = (req, res) => {
    try {
        const item = queueManager.retryItem(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                error: { message: 'Öğe bulunamadı veya retry yapılamaz' }
            });
        }

        res.json({
            success: true,
            data: item,
            message: 'Retry için işaretlendi'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// Tüm başarısızları retry
const retryAllFailed = (req, res) => {
    try {
        const count = queueManager.retryFailed();

        res.json({
            success: true,
            data: { count },
            message: `${count} öğe retry için işaretlendi`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// İstatistikler
const getStatistics = (req, res) => {
    try {
        const stats = queueManager.getStatistics();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// Dışa aktar
const exportQueue = (req, res) => {
    try {
        const format = req.query.format || 'json';
        const data = queueManager.exportQueue(format);

        const contentType = format === 'csv' ? 'text/csv' : 'application/json';
        const filename = `queue-export-${Date.now()}.${format}`;

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(data);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// Yedek al
const backupQueue = (req, res) => {
    try {
        const backupFile = queueManager.backupQueue();

        res.json({
            success: true,
            data: { file: backupFile },
            message: 'Yedek oluşturuldu'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// Kuyruğu temizle
const clearQueue = (req, res) => {
    try {
        queueManager.clearQueue();

        res.json({
            success: true,
            message: 'Kuyruk temizlendi'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

module.exports = {
    getQueue,
    getQueueItem,
    addToQueue,
    updateQueueItem,
    deleteQueueItem,
    reorderQueue,
    bulkDelete,
    retryItem,
    retryAllFailed,
    getStatistics,
    exportQueue,
    backupQueue,
    clearQueue
};
