const logService = require('../services/LogService');

// Hata tipleri
const ErrorTypes = {
    VALIDATION_ERROR: { status: 400, message: 'Veri doğrulama hatası' },
    FILE_TOO_LARGE: { status: 400, message: 'Dosya çok büyük (max 10MB)' },
    INVALID_FORMAT: { status: 400, message: 'Geçersiz dosya formatı' },
    NOT_FOUND: { status: 404, message: 'Kaynak bulunamadı' },
    NETWORK_ERROR: { status: 502, message: 'Ağ bağlantı hatası' },
    TIMEOUT: { status: 504, message: 'İşlem zaman aşımına uğradı' },
    ELEMENT_NOT_FOUND: { status: 500, message: 'Sayfa öğesi bulunamadı' },
    INTERNAL_ERROR: { status: 500, message: 'Sunucu hatası' }
};

// Custom Error sınıfı
class AppError extends Error {
    constructor(code, message, details = null) {
        super(message);
        this.code = code;
        this.statusCode = ErrorTypes[code]?.status || 500;
        this.details = details;
    }
}

// Merkezi hata yakalayıcı
const errorHandler = (error, req, res, next) => {
    // Hata logla
    logService.error(error.message, error, {
        path: req.path,
        method: req.method
    });

    // AppError ise
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            success: false,
            error: {
                code: error.code,
                message: error.message,
                details: error.details
            }
        });
    }

    // Multer hataları
    if (error.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'FILE_UPLOAD_ERROR',
                message: error.message
            }
        });
    }

    // Syntax hataları (JSON parse)
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'JSON_PARSE_ERROR',
                message: 'Geçersiz JSON formatı'
            }
        });
    }

    // Genel hata
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: {
            code: error.code || 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'production'
                ? 'Sunucu hatası'
                : error.message
        }
    });
};

// 404 handler
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route bulunamadı: ${req.method} ${req.path}`
        }
    });
};

module.exports = {
    errorHandler,
    notFoundHandler,
    AppError,
    ErrorTypes
};
