const { IMAGE_SIZES } = require('./constants');

// Sharp işleme ayarları
const SHARP_CONFIG = {
    jpeg: {
        quality: parseInt(process.env.IMAGE_QUALITY) || 85,
        progressive: true,
        mozjpeg: true
    },
    webp: {
        quality: parseInt(process.env.IMAGE_QUALITY) || 85,
        lossless: false,
        nearLossless: false
    },
    thumbnail: {
        quality: 75,
        progressive: true
    }
};

// 16:9 oran hesaplama
const calculateCropDimensions = (width, height) => {
    const targetRatio = 16 / 9;
    const currentRatio = width / height;

    let cropWidth, cropHeight, left, top;

    if (currentRatio > targetRatio) {
        // Resim çok geniş, yatay kırp
        cropHeight = height;
        cropWidth = Math.round(height * targetRatio);
        left = Math.round((width - cropWidth) / 2);
        top = 0;
    } else {
        // Resim çok uzun, dikey kırp
        cropWidth = width;
        cropHeight = Math.round(width / targetRatio);
        left = 0;
        top = Math.round((height - cropHeight) / 2);
    }

    return { left, top, width: cropWidth, height: cropHeight };
};

// Resim boyutu validasyonu
const validateImageDimensions = (width, height) => {
    const minWidth = IMAGE_SIZES.MAIN.width;
    const minHeight = IMAGE_SIZES.MAIN.height;

    if (width < minWidth || height < minHeight) {
        return {
            valid: false,
            message: `Resim en az ${minWidth}x${minHeight} piksel olmalıdır. Mevcut: ${width}x${height}`
        };
    }

    return { valid: true };
};

module.exports = {
    SHARP_CONFIG,
    calculateCropDimensions,
    validateImageDimensions
};
