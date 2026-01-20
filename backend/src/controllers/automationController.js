const automationEngine = require('../services/AutomationEngine');
const logService = require('../services/LogService');

// Otomasyonu başlat
const startAutomation = async (req, res) => {
    try {
        // Async olarak başlat
        automationEngine.start().catch(error => {
            logService.error('Otomasyon hatası', error);
        });

        res.json({
            success: true,
            message: 'Otomasyon başlatıldı',
            data: automationEngine.getStatus()
        });
    } catch (error) {
        logService.error('Otomasyon başlatılamadı', error);
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// Duraklat
const pauseAutomation = (req, res) => {
    try {
        automationEngine.pause();

        res.json({
            success: true,
            message: 'Otomasyon duraklatıldı',
            data: automationEngine.getStatus()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// Devam ettir
const resumeAutomation = (req, res) => {
    try {
        automationEngine.resume();

        res.json({
            success: true,
            message: 'Otomasyon devam edecek',
            data: automationEngine.getStatus()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// Durdur
const stopAutomation = async (req, res) => {
    try {
        await automationEngine.stop();

        res.json({
            success: true,
            message: 'Otomasyon durduruldu',
            data: automationEngine.getStatus()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// Atla
const skipCurrent = (req, res) => {
    try {
        automationEngine.skip();

        res.json({
            success: true,
            message: 'Öğe atlandı',
            data: automationEngine.getStatus()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// Kullanıcı onayı
const confirmAction = (req, res) => {
    try {
        const { confirmed } = req.body;
        automationEngine.confirm(confirmed !== false);

        res.json({
            success: true,
            message: confirmed !== false ? 'Onaylandı' : 'İptal edildi',
            data: automationEngine.getStatus()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// Durum bilgisi
const getStatus = (req, res) => {
    try {
        const status = automationEngine.getStatus();
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

module.exports = {
    startAutomation,
    pauseAutomation,
    resumeAutomation,
    stopAutomation,
    skipCurrent,
    confirmAction,
    getStatus
};
