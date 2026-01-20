const path = require('path');

const getPuppeteerConfig = () => ({
    headless: 'new', // Railway için her zaman headless
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
    slowMo: parseInt(process.env.SLOW_MO) || 50,
    userDataDir: path.resolve(process.env.BROWSER_DATA_DIR || './browser-data'),
    defaultViewport: {
        width: 1366,
        height: 768
    },
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--single-process',
        '--no-zygote',
        '--window-size=1366,768',
        '--lang=tr-TR'
    ],
    ignoreDefaultArgs: ['--enable-automation']
});

// User Agent listesi (rotasyon için)
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
];

const getRandomUserAgent = () => {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
};

// İnsansı gecikme ayarları
const DELAYS = {
    MIN_TYPING: 50,
    MAX_TYPING: 150,
    MIN_CLICK: 100,
    MAX_CLICK: 300,
    PAGE_LOAD: 3000,
    ELEMENT_WAIT: 10000,
    NETWORK_IDLE: 5000
};

// Rastgele gecikme oluştur
const getRandomDelay = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

module.exports = {
    getPuppeteerConfig,
    USER_AGENTS,
    getRandomUserAgent,
    DELAYS,
    getRandomDelay
};