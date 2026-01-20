import React from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQueueStore } from '../../store/queueStore';
import { useUIStore } from '../../store/uiStore';

const statusConfig = {
    pending: { label: 'Bekliyor', class: 'status-pending', icon: '⏳' },
    processing: { label: 'İşleniyor', class: 'status-processing', icon: '⚡' },
    completed: { label: 'Tamamlandı', class: 'status-completed', icon: '✓' },
    failed: { label: 'Başarısız', class: 'status-failed', icon: '✗' },
    skipped: { label: 'Atlandı', class: 'status-skipped', icon: '⏭️' },
    retrying: { label: 'Yeniden', class: 'status-retrying', icon: '🔄' }
};

const QueueItem = ({ item, index }) => {
    const { removeItem, retryItem } = useQueueStore();
    const { selectItem, selectedItems } = useUIStore();

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    const status = statusConfig[item.status] || statusConfig.pending;
    const isSelected = selectedItems.includes(item.id);

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.05 }}
            className={`glass-card !p-4 cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : ''
                } ${isDragging ? 'shadow-xl' : ''}`}
            onClick={() => selectItem(item.id)}
        >
            <div className="flex items-start gap-3">
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM6 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                    </svg>
                </div>

                {/* Thumbnail */}
                {item.bannerPath && (
                    <div className="w-16 h-9 rounded overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                        <img
                            src={`/manset/${item.bannerPath.split('/').pop().replace('.jpg', '_thumb.jpg')}`}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">
                        {item.jsonData?.baslik || 'Başlık yok'}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {item.jsonData?.aciklama || 'Açıklama yok'}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                        <span className={`status-badge ${status.class}`}>
                            {status.icon} {status.label}
                        </span>

                        {item.retryCount > 0 && (
                            <span className="text-xs text-gray-500">
                                Retry: {item.retryCount}/{item.maxRetries}
                            </span>
                        )}
                    </div>

                    {item.error && (
                        <p className="text-xs text-red-500 mt-1 truncate">
                            {item.error}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    {item.status === 'failed' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                retryItem(item.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-orange-500"
                            title="Tekrar Dene"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                        </button>
                    )}

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            removeItem(item.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                        title="Sil"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default QueueItem;
