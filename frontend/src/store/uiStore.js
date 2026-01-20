import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
    persist(
        (set, get) => ({
            // Tema
            theme: 'system',

            // Log panel
            isLogPanelOpen: true,
            logFilter: 'all',

            // Modal durumları
            activeModal: null,
            modalData: null,

            // Seçili öğeler
            selectedItems: [],

            // Tema ayarla
            setTheme: (theme) => {
                set({ theme });
                get().applyTheme(theme);
            },

            // Temayı uygula
            applyTheme: (theme) => {
                const root = document.documentElement;

                if (theme === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    root.classList.toggle('dark', prefersDark);
                } else {
                    root.classList.toggle('dark', theme === 'dark');
                }
            },

            // Tema toggle
            toggleTheme: () => {
                const current = get().theme;
                const next = current === 'dark' ? 'light' : 'dark';
                get().setTheme(next);
            },

            // Log panel toggle
            toggleLogPanel: () => {
                set(state => ({ isLogPanelOpen: !state.isLogPanelOpen }));
            },

            // Log filtre
            setLogFilter: (filter) => set({ logFilter: filter }),

            // Modal aç
            openModal: (modalName, data = null) => {
                set({ activeModal: modalName, modalData: data });
            },

            // Modal kapat
            closeModal: () => {
                set({ activeModal: null, modalData: null });
            },

            // Öğe seç
            selectItem: (id) => {
                set(state => ({
                    selectedItems: state.selectedItems.includes(id)
                        ? state.selectedItems.filter(i => i !== id)
                        : [...state.selectedItems, id]
                }));
            },

            // Tümünü seç
            selectAll: (ids) => {
                set({ selectedItems: ids });
            },

            // Seçimi temizle
            clearSelection: () => {
                set({ selectedItems: [] });
            },

            // Başlangıçta tema uygula
            initTheme: () => {
                const theme = get().theme;
                get().applyTheme(theme);

                // Sistem tema değişikliğini dinle
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                    if (get().theme === 'system') {
                        get().applyTheme('system');
                    }
                });
            }
        }),
        {
            name: 'meb-ui-storage',
            partialize: (state) => ({
                theme: state.theme,
                isLogPanelOpen: state.isLogPanelOpen
            })
        }
    )
);
