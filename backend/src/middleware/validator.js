const { z } = require('zod');

// İçerik şeması
const ContentSchema = z.object({
    baslik: z.string().min(1, 'Başlık gerekli').max(200, 'Başlık çok uzun'),
    aciklama: z.string().max(500, 'Açıklama çok uzun').optional(),
    etiketler: z.union([
        z.array(z.string()).max(10, 'Maksimum 10 etiket'),
        z.string()
    ]).optional(),
    kisaIcerik: z.string().max(5000, 'Kısa içerik çok uzun').optional(),
    icerik: z.string().optional(),
    yayinTarihi: z.string().datetime().optional()
});

// Kuyruk öğesi şeması
const QueueItemSchema = z.object({
    jsonData: ContentSchema,
    bannerPath: z.string().optional(),
    priority: z.number().min(0).max(10).optional()
});

// Kırpma şeması
const CropSchema = z.object({
    left: z.number().min(0),
    top: z.number().min(0),
    width: z.number().min(100),
    height: z.number().min(100),
    filename: z.string().min(1)
});

// Reorder şeması
const ReorderSchema = z.object({
    oldIndex: z.number().min(0),
    newIndex: z.number().min(0)
});

// Validasyon middleware oluşturucu
const validate = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Veri doğrulama hatası',
                        details: error.errors.map(e => ({
                            field: e.path.join('.'),
                            message: e.message
                        }))
                    }
                });
            }
            next(error);
        }
    };
};

// İçerik validasyonu
const validateContent = (data) => {
    try {
        ContentSchema.parse(data);
        return { valid: true };
    } catch (error) {
        return {
            valid: false,
            errors: error.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message
            }))
        };
    }
};

module.exports = {
    validate,
    validateContent,
    ContentSchema,
    QueueItemSchema,
    CropSchema,
    ReorderSchema
};
