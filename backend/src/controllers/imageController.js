const path = require('path');
const imageProcessor = require('../services/ImageProcessor');
const queueManager = require('../services/QueueManager');
const logService = require('../services/LogService');

// Resim yükle ve işle
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { message: 'Resim dosyası gerekli' }
            });
        }

        const { queueId, filename } = req.body;
        const finalFilename = filename || path.parse(req.file.originalname).name;

        // Resmi işle
        const result = await imageProcessor.processImage(req.file.buffer, finalFilename);

        // Kuyruk öğesine bağla
        if (queueId) {
            queueManager.updateBannerPath(queueId, result.jpeg);
        }

        res.json({
            success: true,
            data: {
                filename: finalFilename,
                paths: result,
                originalInfo: result.originalInfo
            },
            message: 'Resim başarıyla işlendi'
        });

    } catch (error) {
        logService.error('Resim yükleme hatası', error);
        res.status(400).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// Toplu resim yükle
const bulkUploadImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: { message: 'En az bir resim dosyası gerekli' }
            });
        }

        const results = [];
        const errors = [];

        for (const file of req.files) {
            try {
                const filename = path.parse(file.originalname).name;
                const result = await imageProcessor.processImage(file.buffer, filename);
                results.push({
                    filename,
                    paths: result
                });
            } catch (error) {
                errors.push({
                    filename: file.originalname,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            data: { results, errors },
            message: `${results.length} resim işlendi, ${errors.length} hata`
        });

    } catch (error) {
        logService.error('Toplu resim yükleme hatası', error);
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// Resim önizlemesi
const getImagePreview = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { message: 'Resim dosyası gerekli' }
            });
        }

        const preview = await imageProcessor.getPreview(req.file.buffer);
        const info = await imageProcessor.getImageInfo(req.file.buffer);

        res.json({
            success: true,
            data: {
                preview,
                info
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// Resim sil
const deleteImage = (req, res) => {
    try {
        const { filename } = req.params;
        const deleted = imageProcessor.deleteImage(filename);

        if (deleted === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Resim bulunamadı' }
            });
        }

        res.json({
            success: true,
            message: 'Resim silindi'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
};

// Manuel kırpma
const cropImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { message: 'Resim dosyası gerekli' }
            });
        }

        const { left, top, width, height, filename } = req.body;

        // Kırp
        const croppedBuffer = await imageProcessor.cropImage(
            req.file.buffer,
            parseInt(left),
            parseInt(top),
            parseInt(width),
            parseInt(height)
        );

        // İşle ve kaydet
        const result = await imageProcessor.processImage(croppedBuffer, filename);

        res.json({
            success: true,
            data: {
                filename,
                paths: result
            },
            message: 'Resim kırpıldı ve işlendi'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: { message: error.message }
        });
    }
};

module.exports = {
    uploadImage,
    bulkUploadImages,
    getImagePreview,
    deleteImage,
    cropImage
};
