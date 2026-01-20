import { create } from 'zustand';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || \
    (import.meta.env.DEV ? 'http://localhost:3001' : 'https://mebk12-production.up.railway.app');

const api = axios.create({
    baseURL: API_BASE_URL
});

const defaultProgress = {
    processed: 0,
    failed: 0,
    pending: 0,
    total: 0
};

export const useAutomationStore = create((set, get) => ({
    status: 'idle',
    isRunning: false,
    isPaused: false,
    waitingForConfirmation: null,
    currentItem: null,
    currentStep: 0,
    progress: { ...defaultProgress },
    startTime: null,
    error: null,
    logs: [],

    addLog: (message, type = 'info') => set(state => ({
        logs: [...state.logs, {
            message,
            type,
            timestamp: new Date().toISOString()
        }]
    })),

    clearLogs: () => set({ logs: [] }),

    setStatus: (data) => {
        if (!data || typeof data !== 'object') return;

        set({
            status: data.status || get().status,
            isRunning: data.isRunning ?? get().isRunning,
            isPaused: data.isPaused ?? get().isPaused,
            waitingForConfirmation: data.waitingForConfirmation ?? null,
            currentItem: data.currentItem ?? null,
            currentStep: data.currentStep ?? get().currentStep,
            progress: data.progress ? {
                processed: data.progress.processed ?? 0,
                failed: data.progress.failed ?? 0,
                pending: data.progress.pending ?? 0,
                total: data.progress.total ?? 0
            } : get().progress,
            startTime: data.startTime ?? get().startTime
        });
    },

    start: async () => {
        set({ error: null });
        try {
            const response = await api.post('/api/automation/start');
            set({ status: 'running', isRunning: true });
            return response.data;
        } catch (error) {
            const message = error.response?.data?.error?.message || error.message;
            set({ error: message });
            throw new Error(message);
        }
    },

    pause: async () => {
        try {
            await api.post('/api/automation/pause');
            set({ isPaused: true, status: 'paused' });
        } catch (error) {
            console.error('Pause error:', error);
        }
    },

    resume: async () => {
        try {
            await api.post('/api/automation/resume');
            set({ isPaused: false, status: 'running' });
        } catch (error) {
            console.error('Resume error:', error);
        }
    },

    stop: async () => {
        try {
            await api.post('/api/automation/stop');
            set({
                status: 'idle',
                isRunning: false,
                isPaused: false,
                waitingForConfirmation: null,
                currentItem: null,
                currentStep: 0
            });
        } catch (error) {
            console.error('Stop error:', error);
        }
    },

    skip: async () => {
        try {
            await api.post('/api/automation/skip');
        } catch (error) {
            console.error('Skip error:', error);
        }
    },

    confirm: async (confirmed = true) => {
        try {
            await api.post('/api/automation/confirm', { confirmed });
            set({ waitingForConfirmation: null });
        } catch (error) {
            console.error('Confirm error:', error);
        }
    },

    fetchStatus: async () => {
        try {
            const response = await api.get('/api/automation/status');
            if (response.data?.data) {
                get().setStatus(response.data.data);
            }
        } catch (error) {
            console.warn('Status fetch error:', error.message);
        }
    },

    reset: () => {
        set({
            status: 'idle',
            isRunning: false,
            isPaused: false,
            waitingForConfirmation: null,
            currentItem: null,
            currentStep: 0,
            progress: { ...defaultProgress },
            startTime: null,
            error: null
        });
    }
}));
