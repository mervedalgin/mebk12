const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const {
    SHARP_CONFIG,
    calculateCropDimensions,
    validateImageDimensions
} = require('../config/sharp.config');
const { IMAGE_SIZES, FILE_LIMITS } = require('../config/constants');
const logService = require('./LogService');

// Manset klasörünü oluştur
const mansetDir = path.resolve(__dirname, '../../data/manset');
if (!fs.existsSync(mansetDir)) {
    fs.mkdirSync(mansetDir, { recursive: true });
}

class ImageProcessor {
    constructor() {
        this.outputDir = mansetDir;
    }

    // Resim bilgilerini al
    async getImageInfo(buffer) {
        try {
            const metadata = await sharp(buffer).metadata();
            return {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: buffer.length,
                hasAlpha: metadata.hasAlpha,
                orientation: metadata.orientation
            };
        } catch (error) {
            logService.error('Resim bilgisi alınamadı', error);
            throw error;
        }
    }

    // Validasyon
    async validateImage(buffer) {
        const info = await this.getImageInfo(buffer);

        // Format kontrolü
        if (!['jpeg', 'png', 'webp', 'heif'].includes(info.format)) {
            return {
                valid: false,
                message: `Desteklenmeyen format: ${info.format}. Desteklenen: JPG, PNG, WebP, HEIC`
            };
        }

        // Boyut kontrolü
        if (info.size > FILE_LIMITS.MAX_SIZE) {
            return {
                valid: false,
                message: `Dosya çok büyük: ${(info.size / 1024 / 1024).toFixed(2)}MB. Maksimum: 10MB`
            };
        }

        // Çözünürlük kontrolü
        const dimValidation = validateImageDimensions(info.width, info.height);
        if (!dimValidation.valid) {
            return dimValidation;
        }

        return { valid: true, info };
    }

    // EXIF verilerini temizle
    async stripMetadata(buffer) {
        return await sharp(buffer)
            .rotate() // EXIF orientasyonunu uygula
            .toBuffer();
    }

    // 16:9 oranına kırp
    async cropTo16x9(buffer) {
        const metadata = await sharp(buffer).metadata();
        const cropDimensions = calculateCropDimensions(metadata.width, metadata.height);

        return await sharp(buffer)
            .extract(cropDimensions)
            .toBuffer();
    }

    // JPEG oluştur
    async createJPEG(buffer, filename) {
        const outputPath = path.join(this.outputDir, `${filename}.jpg`);

        await sharp(buffer)
            .resize(IMAGE_SIZES.MAIN.width, IMAGE_SIZES.MAIN.height, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg(SHARP_CONFIG.jpeg)
            .toFile(outputPath);

        logService.debug('JPEG oluşturuldu', { path: outputPath });
        return outputPath;
    }

    // WebP oluştur
    async createWebP(buffer, filename) {
        const outputPath = path.join(this.outputDir, `${filename}.webp`);

        await sharp(buffer)
            .resize(IMAGE_SIZES.MAIN.width, IMAGE_SIZES.MAIN.height, {
                fit: 'cover',
                position: 'center'
            })
            .webp(SHARP_CONFIG.webp)
            .toFile(outputPath);

        logService.debug('WebP oluşturuldu', { path: outputPath });
        return outputPath;
    }

    // Thumbnail oluştur
    async createThumbnail(buffer, filename) {
        const outputPath = path.join(this.outputDir, `${filename}_thumb.jpg`);

        await sharp(buffer)
            .resize(IMAGE_SIZES.THUMBNAIL.width, IMAGE_SIZES.THUMBNAIL.height, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg(SHARP_CONFIG.thumbnail)
            .toFile(outputPath);

        logService.debug('Thumbnail oluşturuldu', { path: outputPath });
        return outputPath;
    }

    // Ana işleme fonksiyonu
    async processImage(buffer, filename) {
        try {
            logService.info('Resim işleniyor', { filename });

            // Validasyon
            const validation = await this.validateImage(buffer);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            // EXIF temizle
            const cleanBuffer = await this.stripMetadata(buffer);

            // 16:9 kırp
            const croppedBuffer = await this.cropTo16x9(cleanBuffer);

            // Tüm formatları oluştur
            const results = await Promise.all([
                this.createJPEG(croppedBuffer, filename),
                this.createWebP(croppedBuffer, filename),
                this.createThumbnail(croppedBuffer, filename)
            ]);

            const output = {
                jpeg: results[0],
                webp: results[1],
                thumbnail: results[2],
                originalInfo: validation.info
            };

            logService.success('Resim işleme tamamlandı', {
                filename,
                outputs: Object.keys(output).length
            });

            return output;

        } catch (error) {
            logService.error('Resim işleme hatası', error, { filename });
            throw error;
        }
    }

    // Manuel kırpma
    async cropImage(buffer, left, top, width, height) {
        return await sharp(buffer)
            .extract({ left, top, width, height })
            .toBuffer();
    }

    // Watermark ekle
    async addWatermark(buffer, watermarkPath, options = {}) {
        const {
            position = 'southeast',
            opacity = 0.5,
            padding = 20
        } = options;

        if (!fs.existsSync(watermarkPath)) {
            throw new Error('Watermark dosyası bulunamadı');
        }

        const metadata = await sharp(buffer).metadata();
        const watermark = await sharp(watermarkPath)
            .resize(Math.round(metadata.width * 0.15))
            .composite([{
                input: Buffer.from([255, 255, 255, Math.round(255 * opacity)]),
                raw: { width: 1, height: 1, channels: 4 },
                tile: true,
                blend: 'dest-in'
            }])
            .toBuffer();

        return await sharp(buffer)
            .composite([{
                input: watermark,
                gravity: position
            }])
            .toBuffer();
    }

    // Resmi sil
    deleteImage(filename) {
        const extensions = ['.jpg', '.webp', '_thumb.jpg'];
        let deleted = 0;

        extensions.forEach(ext => {
            const filePath = path.join(this.outputDir, `${filename}${ext}`);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                deleted++;
            }
        });

        if (deleted > 0) {
            logService.info('Resim dosyaları silindi', { filename, count: deleted });
        }

        return deleted;
    }

    // Resim önizlemesi için base64
    async getPreview(buffer, maxWidth = 400) {
        const resized = await sharp(buffer)
            .resize(maxWidth, null, { withoutEnlargement: true })
            .jpeg({ quality: 70 })
            .toBuffer();

        return `data:image/jpeg;base64,${resized.toString('base64')}`;
    }

    // Çıktı klasörünü al
    getOutputDir() {
        return this.outputDir;
    }
}

// Singleton instance
const imageProcessor = new ImageProcessor();

module.exports = imageProcessor;
