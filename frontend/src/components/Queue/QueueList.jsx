import React from 'react';
import { AnimatePresence } from 'framer-motion';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import QueueItem from './QueueItem';
import { useQueueStore } from '../../store/queueStore';

const QueueList = () => {
    // loading kullan (isLoading değil)
    const { queue, reorderQueue, loading } = useQueueStore();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = queue.findIndex(item => item.id === active.id);
            const newIndex = queue.findIndex(item => item.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                reorderQueue(oldIndex, newIndex);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!queue || queue.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
                <p className="font-medium">Kuyruk Boş</p>
                <p className="text-sm mt-1">JSON dosyalarını yükleyerek başlayın</p>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={queue.map(item => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                    <AnimatePresence>
                        {queue.map((item, index) => (
                            <QueueItem key={item.id} item={item} index={index} />
                        ))}
                    </AnimatePresence>
                </div>
            </SortableContext>
        </DndContext>
    );
};

export default QueueList;
