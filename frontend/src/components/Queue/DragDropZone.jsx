import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useQueueStore } from '../../store/queueStore';
import toast from 'react-hot-toast';

const DragDropZone = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const { uploadJSONFiles } = useQueueStore();

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const processUpload = async (files) => {
        if (files.length === 0) {
            toast.error('Sadece JSON dosyaları kabul edilir');
            return;
        }

        if (files.length > 10) {
            toast.error('Maksimum 10 dosya yüklenebilir');
            return;
        }

        setIsUploading(true);
        try {
            const response = await uploadJSONFiles(files);

            // Null-safe erişim
            const results = response?.data?.data?.results || response?.data?.results || [];
            const errors = response?.data?.data?.errors || response?.data?.errors || [];

            if (results.length > 0) {
                toast.success(`${results.length} dosya yüklendi`);
            }

            if (errors.length > 0) {
                errors.forEach(err => {
                    toast.error(`${err.filename || 'Dosya'}: ${err.error || 'Bilinmeyen hata'}`);
                });
            }

            if (results.length === 0 && errors.length === 0) {
                toast.success('Dosyalar işlendi');
            }
        } catch (error) {
            const message = error.response?.data?.error?.message ||
                error.response?.data?.message ||
                error.message ||
                'Bilinmeyen hata';
            toast.error('Dosya yükleme hatası: ' + message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files).filter(
            file => file.name.toLowerCase().endsWith('.json')
        );

        await processUpload(files);
    }, [uploadJSONFiles]);

    const handleFileSelect = useCallback(async (e) => {
        const files = Array.from(e.target.files || []).filter(
            file => file.name.toLowerCase().endsWith('.json')
        );

        await processUpload(files);
        e.target.value = '';
    }, [uploadJSONFiles]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`dropzone cursor-pointer ${isDragging ? 'active' : ''} ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                multiple
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="hidden"
                id="json-upload"
                disabled={isUploading}
            />
            <label htmlFor="json-upload" className="cursor-pointer block text-center py-8">
                <div className="flex flex-col items-center gap-3">
                    <div className={`p-4 rounded-full transition-colors ${isDragging
                            ? 'bg-blue-100 dark:bg-blue-900/50'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                        {isUploading ? (
                            <svg className="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                            </svg>
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                            {isUploading ? 'Yükleniyor...' : 'JSON dosyalarını sürükleyin veya tıklayın'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Maksimum 10 dosya
                        </p>
                    </div>
                </div>
            </label>
        </motion.div>
    );
};

export default DragDropZone;
