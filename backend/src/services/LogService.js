const winston = require('winston');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

// Log klasörünü oluştur
const logsDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// SSE için event emitter
const logEmitter = new EventEmitter();

// Log formatı
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
    })
);

// Winston logger
const logger = winston.createLogger({
    level: 'debug',
    format: logFormat,
    transports: [
        // Console
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            )
        }),
        // Tüm loglar
        new winston.transports.File({
            filename: path.join(logsDir, 'app.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Sadece hatalar
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5
        }),
        // Otomasyon logları
        new winston.transports.File({
            filename: path.join(logsDir, 'automation.log'),
            maxsize: 5242880,
            maxFiles: 5
        })
    ]
});

// Log geçmişi (bellekte son 1000 log)
const logHistory = [];
const MAX_LOG_HISTORY = 1000;

// Log ikonları
const LOG_ICONS = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠️',
    error: '✗',
    debug: '🔧'
};

class LogService {
    constructor() {
        this.logger = logger;
        this.emitter = logEmitter;
    }

    // Log oluştur ve yayınla
    _log(level, message, data = {}) {
        const logEntry = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            timestamp: new Date().toISOString(),
            level,
            icon: LOG_ICONS[level] || '',
            message,
            data
        };

        // Winston'a yaz - seviye dönüşümü
        let winstonLevel = level;
        if (level === 'success') winstonLevel = 'info';
        if (level === 'warning') winstonLevel = 'warn';
        this.logger.log(winstonLevel, `${logEntry.icon} ${message}`, data);

        // Geçmişe ekle
        logHistory.push(logEntry);
        if (logHistory.length > MAX_LOG_HISTORY) {
            logHistory.shift();
        }

        // SSE için emit et
        this.emitter.emit('log', logEntry);

        return logEntry;
    }

    info(message, data = {}) {
        return this._log('info', message, data);
    }

    success(message, data = {}) {
        return this._log('success', message, data);
    }

    warning(message, data = {}) {
        return this._log('warning', message, data);
    }

    error(message, error = null, data = {}) {
        const errorData = error ? {
            ...data,
            error: error.message,
            stack: error.stack
        } : data;
        return this._log('error', message, errorData);
    }

    debug(message, data = {}) {
        return this._log('debug', message, data);
    }

    // Log geçmişini getir
    getHistory(options = {}) {
        let logs = [...logHistory];

        // Seviyeye göre filtrele
        if (options.level) {
            logs = logs.filter(log => log.level === options.level);
        }

        // Arama
        if (options.search) {
            const searchLower = options.search.toLowerCase();
            logs = logs.filter(log =>
                log.message.toLowerCase().includes(searchLower)
            );
        }

        // Limit
        if (options.limit) {
            logs = logs.slice(-options.limit);
        }

        return logs;
    }

    // Logları temizle
    clearHistory() {
        logHistory.length = 0;
        this.info('Log geçmişi temizlendi');
    }

    // SSE stream için listener ekle
    onLog(callback) {
        this.emitter.on('log', callback);
        return () => this.emitter.off('log', callback);
    }

    // Dışa aktar
    exportLogs(format = 'json') {
        const logs = this.getHistory();

        switch (format) {
            case 'txt':
                return logs.map(log =>
                    `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.icon} ${log.message}`
                ).join('\n');

            case 'csv':
                const headers = 'Timestamp,Level,Message\n';
                const rows = logs.map(log =>
                    `"${log.timestamp}","${log.level}","${log.message.replace(/"/g, '""')}"`
                ).join('\n');
                return headers + rows;

            case 'json':
            default:
                return JSON.stringify({
                    logs,
                    exportDate: new Date().toISOString(),
                    totalLogs: logs.length
                }, null, 2);
        }
    }
}

// Singleton instance
const logService = new LogService();

module.exports = logService;
