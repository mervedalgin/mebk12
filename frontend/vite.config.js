import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                // SSE bağlantıları için timeout'u devre dışı bırak
                timeout: 0,
                proxyTimeout: 0,
                // WebSocket benzeri davranış için
                configure: (proxy, _options) => {
                    proxy.on('error', (err, _req, _res) => {
                        console.log('proxy error', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, _res) => {
                        // SSE endpoint'leri için timeout'u kaldır
                        if (req.url?.includes('/stream')) {
                            proxyReq.setHeader('Connection', 'keep-alive');
                        }
                    });
                }
            },
            '/manset': {
                target: 'http://localhost:3001',
                changeOrigin: true
            }
        }
    }
});
