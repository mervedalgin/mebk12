const express = require('express');
const router = express.Router();

// Controllers
const queueController = require('../controllers/queueController');
const automationController = require('../controllers/automationController');
const imageController = require('../controllers/imageController');

// Middleware
const { uploadSingle, uploadMultiple, uploadJSON } = require('../middleware/fileUpload');
const { validate, QueueItemSchema, ReorderSchema, CropSchema } = require('../middleware/validator');

// Utils
const { normalizeJsonData } = require('../utils/normalizer');

// ==================== KUYRUK ROUTES ====================

// Kuyruk CRUD
router.get('/queue', queueController.getQueue);
router.get('/queue/statistics', queueController.getStatistics);
router.get('/queue/export', queueController.exportQueue);
router.post('/queue/backup', queueController.backupQueue);
router.delete('/queue/clear', queueController.clearQueue);

router.get('/queue/:id', queueController.getQueueItem);
router.post('/queue', validate(QueueItemSchema), queueController.addToQueue);
router.patch('/queue/:id', queueController.updateQueueItem);
router.delete('/queue/:id', queueController.deleteQueueItem);

// Kuyruk işlemleri
router.post('/queue/reorder', validate(ReorderSchema), queueController.reorderQueue);
router.post('/queue/bulk-delete', queueController.bulkDelete);
router.post('/queue/:id/retry', queueController.retryItem);
router.post('/queue/retry-all', queueController.retryAllFailed);

// JSON dosyalarını yükle
router.post('/queue/upload-json', uploadJSON, (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: { message: 'En az bir JSON dosyası gerekli' }
            });
        }

        const queueManager = require('../services/QueueManager');
        const results = [];
        const errors = [];

        req.files.forEach(file => {
            try {
                const rawContent = JSON.parse(file.buffer.toString('utf-8'));
                // JSON verisini normalize et (farklı formatları destekle)
                const normalizedContent = normalizeJsonData(rawContent);
                const item = queueManager.addToQueue(normalizedContent, null, 0);
                results.push({ filename: file.originalname, id: item.id });
            } catch (error) {
                errors.push({ filename: file.originalname, error: error.message });
            }
        });

        res.json({
            success: true,
            data: { results, errors },
            message: `${results.length} dosya eklendi, ${errors.length} hata`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
});

// ==================== OTOMASYON ROUTES ====================

router.post('/automation/start', automationController.startAutomation);
router.post('/automation/pause', automationController.pauseAutomation);
router.post('/automation/resume', automationController.resumeAutomation);
router.post('/automation/stop', automationController.stopAutomation);
router.post('/automation/skip', automationController.skipCurrent);
router.post('/automation/confirm', automationController.confirmAction);
router.get('/automation/status', automationController.getStatus);

// ==================== RESİM ROUTES ====================

router.post('/image/upload', uploadSingle, imageController.uploadImage);
router.post('/image/bulk-upload', uploadMultiple, imageController.bulkUploadImages);
router.post('/image/preview', uploadSingle, imageController.getImagePreview);
router.post('/image/crop', uploadSingle, validate(CropSchema), imageController.cropImage);
router.delete('/image/:filename', imageController.deleteImage);

// ==================== LOG ROUTES ====================

const logService = require('../services/LogService');

// Log geçmişi
router.get('/logs/history', (req, res) => {
    const { level, search, limit } = req.query;
    const logs = logService.getHistory({
        level,
        search,
        limit: limit ? parseInt(limit) : undefined
    });
    res.json({ success: true, data: logs });
});

// Log dışa aktar
router.get('/logs/export', (req, res) => {
    const format = req.query.format || 'json';
    const data = logService.exportLogs(format);

    const contentType = {
        json: 'application/json',
        txt: 'text/plain',
        csv: 'text/csv'
    }[format] || 'text/plain';

    const filename = `logs-export-${Date.now()}.${format}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data);
});

// Logları temizle
router.delete('/logs', (req, res) => {
    logService.clearHistory();
    res.json({ success: true, message: 'Loglar temizlendi' });
});

module.exports = router;
