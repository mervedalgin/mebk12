import { create } from 'zustand';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || \
    (import.meta.env.DEV ? 'http://localhost:3001' : 'https://mebk12-production.up.railway.app');

const api = axios.create({
    baseURL: API_BASE_URL
});

export const useQueueStore = create((set, get) => ({
    queue: [],
    loading: false,
    error: null,
    selectedItems: new Set(),

    fetchQueue: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.get('/api/queue');
            const queueData = response.data?.data || [];
            set({ queue: Array.isArray(queueData) ? queueData : [], loading: false });
        } catch (error) {
            console.error('Queue fetch error:', error);
            set({ error: error.message, loading: false, queue: [] });
        }
    },

    addItem: (item) => {
        set(state => ({
            queue: [...state.queue, item]
        }));
    },

    removeItem: async (id) => {
        try {
            await api.delete(`/api/queue/${id}`);
            set(state => ({
                queue: state.queue.filter(item => item.id !== id),
                selectedItems: new Set([...state.selectedItems].filter(i => i !== id))
            }));
            return true;
        } catch (error) {
            console.error('Delete error:', error);
            return false;
        }
    },

    updateItem: (id, updates) => {
        set(state => ({
            queue: state.queue.map(item =>
                item.id === id ? { ...item, ...updates } : item
            )
        }));
    },

    reorderQueue: async (oldIndex, newIndex) => {
        const queue = [...get().queue];
        const [item] = queue.splice(oldIndex, 1);
        queue.splice(newIndex, 0, item);
        set({ queue });

        try {
            await api.post('/api/queue/reorder', { oldIndex, newIndex });
        } catch (error) {
            get().fetchQueue();
        }
    },

    bulkDelete: async (ids) => {
        try {
            const idsArray = ids instanceof Set ? Array.from(ids) : ids;
            await api.post('/api/queue/bulk-delete', { ids: idsArray });
            set(state => ({
                queue: state.queue.filter(item => !idsArray.includes(item.id)),
                selectedItems: new Set()
            }));
            return true;
        } catch (error) {
            console.error('Bulk delete error:', error);
            return false;
        }
    },

    clearQueue: async () => {
        try {
            await api.delete('/api/queue/clear');
            set({ queue: [], selectedItems: new Set() });
            return true;
        } catch (error) {
            console.error('Clear queue error:', error);
            return false;
        }
    },

    retryItem: async (id) => {
        try {
            await api.post(`/api/queue/${id}/retry`);
            await get().fetchQueue();
            return true;
        } catch (error) {
            console.error('Retry error:', error);
            return false;
        }
    },

    retryAllFailed: async () => {
        try {
            await api.post('/api/queue/retry-all');
            await get().fetchQueue();
            return true;
        } catch (error) {
            console.error('Retry all error:', error);
            return false;
        }
    },

    toggleSelection: (id) => {
        set(state => {
            const newSelected = new Set(state.selectedItems);
            if (newSelected.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }
            return { selectedItems: newSelected };
        });
    },

    selectAll: () => {
        set(state => ({
            selectedItems: new Set(state.queue.map(item => item.id))
        }));
    },

    clearSelection: () => {
        set({ selectedItems: new Set() });
    },

    uploadJSONFiles: async (files) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        const response = await api.post('/api/queue/upload-json', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        await get().fetchQueue();
        return response;
    }
}));
