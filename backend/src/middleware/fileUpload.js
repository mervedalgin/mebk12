const multer = require('multer');
const path = require('path');
const { FILE_LIMITS } = require('../config/constants');

// Memory storage (Sharp ile işlemek için)
const storage = multer.memoryStorage();

// Resim dosyası filtresi
const imageFileFilter = (req, file, cb) => {
    // Mime type kontrolü
    if (FILE_LIMITS.ALLOWED_MIMES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Desteklenmeyen dosya tipi: ${file.mimetype}`), false);
    }
};

// JSON dosyası filtresi (uzantı + MIME type)
const jsonFileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isJsonExt = ext === '.json';
    const isJsonMime = file.mimetype === 'application/json' || file.mimetype === 'text/plain';

    if (isJsonExt || isJsonMime) {
        cb(null, true);
    } else {
        cb(new Error(`Sadece JSON dosyaları kabul edilir. Gönderilen: ${file.mimetype}`), false);
    }
};

// Tek resim yükleyici
const uploadSingle = multer({
    storage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: FILE_LIMITS.MAX_SIZE
    }
}).single('image');

// Çoklu resim yükleyici
const uploadMultiple = multer({
    storage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: FILE_LIMITS.MAX_SIZE,
        files: FILE_LIMITS.MAX_QUEUE_FILES
    }
}).array('images', FILE_LIMITS.MAX_QUEUE_FILES);

// JSON dosyası yükleyici
const uploadJSON = multer({
    storage: multer.memoryStorage(),
    fileFilter: jsonFileFilter,
    limits: {
        fileSize: 1024 * 1024 // 1MB
    }
}).array('files', FILE_LIMITS.MAX_QUEUE_FILES);

// Middleware wrapper
const handleUpload = (uploadFn) => {
    return (req, res, next) => {
        uploadFn(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        error: { message: 'Dosya çok büyük (max 10MB)' }
                    });
                }
                if (err.code === 'LIMIT_FILE_COUNT') {
                    return res.status(400).json({
                        success: false,
                        error: { message: `Maksimum ${FILE_LIMITS.MAX_QUEUE_FILES} dosya yüklenebilir` }
                    });
                }
                return res.status(400).json({
                    success: false,
                    error: { message: err.message }
                });
            } else if (err) {
                return res.status(400).json({
                    success: false,
                    error: { message: err.message }
                });
            }
            next();
        });
    };
};

module.exports = {
    uploadSingle: handleUpload(uploadSingle),
    uploadMultiple: handleUpload(uploadMultiple),
    uploadJSON: handleUpload(uploadJSON)
};
