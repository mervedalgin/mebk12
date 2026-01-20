import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutomationStore } from '../../store/automationStore';

const confirmationMessages = {
    login: {
        title: 'Giriş Yapın',
        description: 'MEBBİS\'e giriş yapın ve ardından Onayla butonuna tıklayın.',
        icon: '🔐'
    },
    banner_upload: {
        title: 'Manşet Resmi Yükleyin',
        description: 'Manşet resmini manuel olarak yükleyin ve Onayla\'yı tıklayın.',
        icon: '🖼️'
    },
    form_submit: {
        title: 'Formu Gönder',
        description: 'Form gönderilecek. İçeriği kontrol edin ve onaylayın.',
        icon: '📝'
    }
};

const ConfirmationModal = () => {
    const { waitingForConfirmation, confirm } = useAutomationStore();

    if (!waitingForConfirmation) return null;

    const config = confirmationMessages[waitingForConfirmation] || {
        title: 'Onay Gerekiyor',
        description: 'Devam etmek için onaylayın.',
        icon: '❓'
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="glass-card relative z-10 max-w-md w-full text-center"
                >
                    {/* Icon */}
                    <div className="text-6xl mb-4">{config.icon}</div>

                    {/* Title */}
                    <h2 className="text-xl font-semibold mb-2">{config.title}</h2>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {config.description}
                    </p>

                    {/* Pulse indicator */}
                    <div className="flex justify-center mb-6">
                        <div className="flex items-center gap-2 text-blue-500">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                            </span>
                            <span className="text-sm">Bekleniyor...</span>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => confirm(false)}
                            className="btn btn-ghost px-8"
                        >
                            İptal
                        </button>
                        <button
                            onClick={() => confirm(true)}
                            className="btn btn-primary px-8"
                        >
                            Onayla
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ConfirmationModal;
