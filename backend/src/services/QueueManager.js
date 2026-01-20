const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { QUEUE_STATUS, RETRY_CONFIG } = require('../config/constants');
const logService = require('./LogService');

// Data klasörlerini oluştur
const dataDir = path.resolve(__dirname, '../../data');
const queueDir = path.join(dataDir, 'queue');
const mansetDir = path.join(dataDir, 'manset');
const processedDir = path.join(dataDir, 'processed');
const failedDir = path.join(dataDir, 'failed');

[dataDir, queueDir, mansetDir, processedDir, failedDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const QUEUE_FILE = path.join(queueDir, 'queue.json');
const BACKUP_PREFIX = 'backup-';

class QueueManager {
    constructor() {
        this.queue = [];
        this.failedItems = [];
        this.metadata = {
            lastUpdated: null,
            totalProcessed: 0,
            totalFailed: 0
        };
        this.loadQueue();
    }

    // Kuyruk dosyasından yükle
    loadQueue() {
        try {
            if (fs.existsSync(QUEUE_FILE)) {
                const data = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
                this.queue = data.queue || [];
                this.failedItems = data.failedItems || [];
                this.metadata = data.metadata || this.metadata;
                logService.info('Kuyruk yüklendi', { count: this.queue.length });
            }
        } catch (error) {
            logService.error('Kuyruk yüklenemedi', error);
            this.queue = [];
        }
    }

    // Kuyruğu dosyaya kaydet
    saveQueue() {
        try {
            this.metadata.lastUpdated = new Date().toISOString();
            const data = {
                queue: this.queue,
                failedItems: this.failedItems,
                metadata: this.metadata
            };
            fs.writeFileSync(QUEUE_FILE, JSON.stringify(data, null, 2));
            logService.debug('Kuyruk kaydedildi');
        } catch (error) {
            logService.error('Kuyruk kaydedilemedi', error);
        }
    }

    // Yedek oluştur
    backupQueue() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(queueDir, `${BACKUP_PREFIX}${timestamp}.json`);
            fs.copyFileSync(QUEUE_FILE, backupFile);
            logService.info('Yedek oluşturuldu', { file: backupFile });
            return backupFile;
        } catch (error) {
            logService.error('Yedek oluşturulamadı', error);
            return null;
        }
    }

    // Eski yedekleri temizle
    cleanOldBackups(days = 30) {
        try {
            const files = fs.readdirSync(queueDir);
            const now = Date.now();
            let deleted = 0;

            files.forEach(file => {
                if (file.startsWith(BACKUP_PREFIX)) {
                    const filePath = path.join(queueDir, file);
                    const stats = fs.statSync(filePath);
                    const ageInDays = (now - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

                    if (ageInDays > days) {
                        fs.unlinkSync(filePath);
                        deleted++;
                    }
                }
            });

            if (deleted > 0) {
                logService.info('Eski yedekler temizlendi', { count: deleted });
            }
        } catch (error) {
            logService.error('Yedek temizleme hatası', error);
        }
    }

    // Kuyruğa ekle
    addToQueue(jsonData, bannerPath = null, priority = 0) {
        const item = {
            id: `queue-${Date.now()}-${uuidv4().substring(0, 8)}`,
            jsonData,
            bannerPath,
            status: QUEUE_STATUS.PENDING,
            retryCount: 0,
            maxRetries: RETRY_CONFIG.MAX_RETRIES,
            priority,
            error: null,
            addedAt: new Date().toISOString(),
            processedAt: null,
            processingTime: null
        };

        this.queue.push(item);
        this.queue.sort((a, b) => b.priority - a.priority);
        this.saveQueue();

        logService.info('Kuyruğa eklendi', {
            id: item.id,
            title: jsonData.baslik
        });

        return item;
    }

    // Kuyruktan çıkar
    removeFromQueue(id) {
        const index = this.queue.findIndex(item => item.id === id);
        if (index !== -1) {
            const removed = this.queue.splice(index, 1)[0];
            this.saveQueue();
            logService.info('Kuyruktan çıkarıldı', { id });
            return removed;
        }
        return null;
    }

    // Öğe güncelle
    updateItem(id, updates) {
        const item = this.queue.find(item => item.id === id);
        if (item) {
            Object.assign(item, updates);
            this.saveQueue();
            return item;
        }
        return null;
    }

    // Duruma göre güncelle
    updateStatus(id, status, error = null) {
        return this.updateItem(id, {
            status,
            error,
            processedAt: status === QUEUE_STATUS.COMPLETED ? new Date().toISOString() : null
        });
    }

    // Sıralama değiştir
    reorderQueue(oldIndex, newIndex) {
        if (oldIndex < 0 || oldIndex >= this.queue.length ||
            newIndex < 0 || newIndex >= this.queue.length) {
            return false;
        }

        const [item] = this.queue.splice(oldIndex, 1);
        this.queue.splice(newIndex, 0, item);
        this.saveQueue();

        logService.debug('Sıralama değiştirildi', { oldIndex, newIndex });
        return true;
    }

    // Toplu silme
    bulkDelete(itemIds) {
        const deleted = [];
        itemIds.forEach(id => {
            const removed = this.removeFromQueue(id);
            if (removed) deleted.push(id);
        });
        return deleted;
    }

    // Öncelik ayarla
    setPriority(id, priority) {
        const item = this.updateItem(id, { priority });
        if (item) {
            this.queue.sort((a, b) => b.priority - a.priority);
            this.saveQueue();
        }
        return item;
    }

    // Duruma göre filtrele
    getByStatus(status) {
        return this.queue.filter(item => item.status === status);
    }

    // Bekleyen ilk öğeyi al
    getNextPending() {
        return this.queue.find(item =>
            item.status === QUEUE_STATUS.PENDING ||
            item.status === QUEUE_STATUS.RETRYING
        );
    }

    // Arama
    searchItems(query) {
        const queryLower = query.toLowerCase();
        return this.queue.filter(item =>
            item.jsonData.baslik?.toLowerCase().includes(queryLower) ||
            item.jsonData.aciklama?.toLowerCase().includes(queryLower)
        );
    }

    // İstatistikler
    getStatistics() {
        const stats = {
            total: this.queue.length,
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0,
            skipped: 0,
            retrying: 0,
            totalProcessed: this.metadata.totalProcessed,
            totalFailed: this.metadata.totalFailed
        };

        this.queue.forEach(item => {
            if (stats[item.status] !== undefined) {
                stats[item.status]++;
            }
        });

        return stats;
    }

    // Başarısız öğeyi işaretle
    markAsFailed(id, error) {
        const item = this.queue.find(i => i.id === id);
        if (!item) return null;

        item.retryCount++;
        item.error = error;

        if (item.retryCount >= item.maxRetries) {
            item.status = QUEUE_STATUS.FAILED;
            this.failedItems.push({ ...item });
            this.metadata.totalFailed++;
            logService.error('Öğe başarısız olarak işaretlendi', null, { id, error });
        } else {
            item.status = QUEUE_STATUS.RETRYING;
            logService.warning('Yeniden denenecek', {
                id,
                retry: item.retryCount,
                maxRetries: item.maxRetries
            });
        }

        this.saveQueue();
        return item;
    }

    // Başarılı olarak işaretle
    markAsCompleted(id, processingTime) {
        const item = this.updateItem(id, {
            status: QUEUE_STATUS.COMPLETED,
            processedAt: new Date().toISOString(),
            processingTime
        });

        if (item) {
            this.metadata.totalProcessed++;
            this.saveQueue();
            logService.success('Öğe tamamlandı', { id, processingTime });
        }

        return item;
    }

    // Başarısızları tekrar dene
    retryFailed() {
        const failedItems = this.getByStatus(QUEUE_STATUS.FAILED);
        failedItems.forEach(item => {
            item.status = QUEUE_STATUS.RETRYING;
            item.retryCount = 0;
            item.error = null;
        });
        this.saveQueue();
        return failedItems.length;
    }

    // Tek öğe retry
    retryItem(id) {
        const item = this.queue.find(i => i.id === id);
        if (item && item.status === QUEUE_STATUS.FAILED) {
            item.status = QUEUE_STATUS.RETRYING;
            item.retryCount = 0;
            item.error = null;
            this.saveQueue();
            return item;
        }
        return null;
    }

    // Tüm kuyruğu al
    getQueue() {
        return this.queue;
    }

    // Kuyruk ID ile öğe al
    getItem(id) {
        return this.queue.find(item => item.id === id);
    }

    // Banner path güncelle
    updateBannerPath(id, bannerPath) {
        return this.updateItem(id, { bannerPath });
    }

    // Kuyruğu temizle
    clearQueue() {
        this.queue = [];
        this.saveQueue();
        logService.info('Kuyruk temizlendi');
    }

    // Dışa aktar
    exportQueue(format = 'json') {
        const data = {
            queue: this.queue,
            metadata: this.metadata,
            exportDate: new Date().toISOString()
        };

        if (format === 'csv') {
            const headers = 'ID,Başlık,Durum,Eklenme Tarihi,İşlenme Tarihi\n';
            const rows = this.queue.map(item =>
                `"${item.id}","${item.jsonData.baslik}","${item.status}","${item.addedAt}","${item.processedAt || ''}"`
            ).join('\n');
            return headers + rows;
        }

        return JSON.stringify(data, null, 2);
    }
}

// Singleton instance
const queueManager = new QueueManager();

module.exports = queueManager;
