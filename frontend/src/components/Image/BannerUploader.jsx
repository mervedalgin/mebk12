import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const BannerUploader = ({ queueId, onUpload }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFile = useCallback(async (file) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Sadece resim dosyaları kabul edilir');
            return;
        }

        setIsUploading(true);

        try {
            // Preview göster
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target.result);
            reader.readAsDataURL(file);

            // Yükle
            const formData = new FormData();
            formData.append('image', file);
            if (queueId) formData.append('queueId', queueId);
            formData.append('filename', file.name.replace(/\.[^/.]+$/, ''));

            const response = await axios.post('/api/image/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Resim yüklendi');
            if (onUpload) onUpload(response.data.data);
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Yükleme hatası');
            setPreview(null);
        } finally {
            setIsUploading(false);
        }
    }, [queueId, onUpload]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleFileSelect = useCallback((e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
        e.target.value = '';
    }, [handleFile]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`dropzone ${isDragging ? 'active' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={handleDrop}
        >
            <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="banner-upload"
            />

            <label htmlFor="banner-upload" className="cursor-pointer block">
                {preview ? (
                    <div className="relative">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full aspect-video object-cover rounded-lg"
                        />
                        {isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-8 text-center">
                        <div className={`p-4 rounded-full mx-auto w-fit transition-colors ${isDragging ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-gray-800'
                            }`}>
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                        <p className="font-medium text-gray-700 dark:text-gray-300 mt-3">
                            Manşet resmi yükleyin
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            16:9 oranında kırpılacak (min 1280px genişlik)
                        </p>
                    </div>
                )}
            </label>
        </motion.div>
    );
};

export default BannerUploader;
