// API URL konfigürasyonu
// Development: Vite proxy kullanır (/api -> localhost:3001)
// Production: VITE_API_URL zorunlu (Railway backend URL)

const normalizeBaseUrl = (url) => {
    if (!url) return '';
    return url.endsWith('/') ? url.slice(0, -1) : url;
};

const getApiUrl = () => {
    // Env var varsa kullan (production'da zorunlu)
    const envUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL);
    if (envUrl) return envUrl;

    // Development modda Vite proxy kullan
    if (import.meta.env.DEV) {
        return ''; // Relative URL, Vite proxy handle eder
    }

    // Production'da env yoksa relative'a düşme: yanlış domaine gider (Vercel)
    // Bu yüzden en azından console uyarısı verelim.
    console.warn(
        'VITE_API_URL tanımlı değil. Production ortamında backend URL env ile verilmelidir.'
    );
    return '';
};

const joinUrl = (base, path) => {
    // base boşsa path'i aynen döndür (dev proxy veya aynı-origin senaryosu)
    if (!base) return path;
    return `${base}${path}`;
};

export const API_CONFIG = {
    BASE_URL: getApiUrl(),

    // SSE endpoints (EventSource tam URL ile bağlanmalı)
    SSE_AUTOMATION: joinUrl(getApiUrl(), '/api/automation/stream'),
    SSE_LOGS: joinUrl(getApiUrl(), '/api/logs/stream'),

    // API endpoints (fetch/axios baseURL olarak BASE_URL kullanılabilir)
    endpoints: {
        queue: '/api/queue',
        automation: '/api/automation',
        image: '/api/image',
        logs: '/api/logs'
    }
};

export default API_CONFIG;
