// API URL konfigürasyonu
// Development: Vite proxy kullanır (/api -> localhost:3001)
// Production: VITE_API_URL veya aynı domain

const getApiUrl = () => {
    // Environment variable varsa kullan
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // Development modda Vite proxy kullan
    if (import.meta.env.DEV) {
        return '';  // Relative URL, Vite proxy handle eder
    }

    // Production'da aynı origin varsay (backend aynı domain'de)
    return '';
};

const getSSEUrl = (path) => {
    const baseUrl = getApiUrl();
    return `${baseUrl}${path}`;
};

export const API_CONFIG = {
    BASE_URL: getApiUrl(),
    SSE_AUTOMATION: getSSEUrl('/api/automation/stream'),
    SSE_LOGS: getSSEUrl('/api/logs/stream'),

    // API endpoints
    endpoints: {
        queue: '/api/queue',
        automation: '/api/automation',
        image: '/api/image',
        logs: '/api/logs'
    }
};

export default API_CONFIG;
