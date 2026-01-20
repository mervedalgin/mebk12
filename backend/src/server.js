require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const logService = require('./services/LogService');

const app = express();

const PORT = process.env.PORT || 3001;
// Railway / container ortamları için host binding
const HOST = process.env.HOST || '0.0.0.0';

// SSE client yönetimi
const sseClients = {
    automation: new Set(),
    logs: new Set()
};

// Trust proxy (rate limiter için)
app.set('trust proxy', 1);

// CORS - Production ve development için dinamik
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://mebk12.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(
    cors({
        origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true, // Development'ta tüm originlere izin ver
        credentials: true
    })
);

// Rate Limiter - gevşek ayarlar, upload ve SSE hariç
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 500,
    message: {
        success: false,
        error: { message: 'Çok fazla istek gönderildi. Lütfen bekleyin.' }
    },
    skip: (req) => {
        const skipPaths = ['/upload', '/stream', '/upload-json'];
        return skipPaths.some((p) => req.path.includes(p));
    }
});
app.use('/api', limiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/manset', express.static(path.join(__dirname, '../data/manset')));
app.use('/screenshots', express.static(path.join(__dirname, '../data/screenshots')));

// SSE yardımcı fonksiyonu - veri gönder ve flush et
const sendSSE = (res, data) => {
    try {
        if (!res || res.writableEnded || res.destroyed) return;
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        // Node.js streams için flush (varsa)
        if (typeof res.flush === 'function') res.flush();
    } catch (e) {
        // bağlantı kapanmış olabilir; sessiz geç
    }
};

// SSE client setlerinden güvenli şekilde sil
const safeDeleteClient = (set, res) => {
    try {
        set.delete(res);
    } catch (_) { }
};

// SSE Log Stream
app.get('/api/logs/stream', (req, res) => {
    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Nginx için

    // Headerları hemen gönder
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    // Client'ı kaydet
    sseClients.logs.add(res);

    // Heartbeat - bağlantıyı canlı tut
    const heartbeat = setInterval(() => {
        try {
            if (res.writableEnded || res.destroyed) {
                clearInterval(heartbeat);
                return;
            }
            res.write(':heartbeat\n\n');
            if (typeof res.flush === 'function') res.flush();
        } catch (e) {
            clearInterval(heartbeat);
        }
    }, 15000); // 15 saniye

    // Log listener
    const sendLog = (log) => sendSSE(res, log);
    const unsubscribe = logService.onLog(sendLog);

    // Bağlantı mesajı
    sendSSE(res, {
        id: 'connected',
        level: 'info',
        message: 'Log stream bağlantısı kuruldu',
        timestamp: new Date().toISOString()
    });

    // Cleanup
    const cleanup = () => {
        clearInterval(heartbeat);
        try {
            unsubscribe();
        } catch (_) { }
        safeDeleteClient(sseClients.logs, res);
        try {
            if (!res.writableEnded) res.end();
        } catch (_) { }
    };

    req.on('close', cleanup);
    req.on('error', cleanup);
    res.on('error', cleanup);
});

// SSE Automation Stream
app.get('/api/automation/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    const automationEngine = require('./services/AutomationEngine');

    // Client'ı kaydet
    sseClients.automation.add(res);

    // Heartbeat
    const heartbeat = setInterval(() => {
        try {
            if (res.writableEnded || res.destroyed) {
                clearInterval(heartbeat);
                return;
            }
            res.write(':heartbeat\n\n');
            if (typeof res.flush === 'function') res.flush();
        } catch (e) {
            clearInterval(heartbeat);
        }
    }, 15000);

    // Status listener
    const sendStatus = (data) => sendSSE(res, data);
    automationEngine.on('status', sendStatus);

    // İLK BAĞLANTIDA mevcut durumu HEMEN gönder
    const currentStatus = automationEngine.getStatus();
    sendSSE(res, currentStatus);

    // Debug log
    console.log(
        'SSE client connected, current status:',
        currentStatus.status,
        'waiting:',
        currentStatus.waitingForConfirmation
    );

    // Cleanup
    const cleanup = () => {
        clearInterval(heartbeat);
        try {
            automationEngine.off('status', sendStatus);
        } catch (_) { }
        safeDeleteClient(sseClients.automation, res);
        try {
            if (!res.writableEnded) res.end();
        } catch (_) { }
    };

    req.on('close', cleanup);
    req.on('error', cleanup);
    res.on('error', cleanup);
});

// Tüm automation clientlara broadcast
const broadcastAutomationStatus = (data) => {
    sseClients.automation.forEach((client) => {
        if (!client || client.writableEnded || client.destroyed) {
            safeDeleteClient(sseClients.automation, client);
            return;
        }
        sendSSE(client, data);
    });
};

// Global erişim için export
app.locals.broadcastAutomationStatus = broadcastAutomationStatus;

// API Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        sseClients: {
            automation: sseClients.automation.size,
            logs: sseClients.logs.size
        }
    });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server (Railway için HOST ile dinle)
const server = app.listen(PORT, HOST, () => {
    logService.info(`Server başlatıldı`, { host: HOST, port: PORT });
    console.log(`\n  MEB Otomasyon Backend`);
    console.log(`  ─────────────────────────`);
    console.log(`  API: http://${HOST}:${PORT}/api`);
    console.log(`  Health: http://${HOST}:${PORT}/health`);
    console.log(`  SSE Logs: http://${HOST}:${PORT}/api/logs/stream`);
    console.log(`\n`);
});

// Keep-alive timeout artır (SSE için)
server.keepAliveTimeout = 120000; // 2 dakika
server.headersTimeout = 125000;

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    logService.info(`${signal} alındı, kapatılıyor...`);

    // SSE clientları kapat
    sseClients.automation.forEach((client) => {
        try {
            client.end();
        } catch (e) { }
    });
    sseClients.logs.forEach((client) => {
        try {
            client.end();
        } catch (e) { }
    });

    const queueManager = require('./services/QueueManager');
    try {
        queueManager.saveQueue();
    } catch (_) { }

    // Sadece gerçek kapanmada (SIGTERM/SIGINT) tarayıcıyı kapat
    // Nodemon restart sırasında tarayıcı açık kalabilir
    if (signal !== 'nodemon') {
        try {
            const automationEngine = require('./services/AutomationEngine');
            await automationEngine.stop();
        } catch (_) { }
    }

    server.close(() => {
        process.exit(0);
    });

    // 5 saniye sonra zorla kapat
    setTimeout(() => process.exit(1), 5000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
