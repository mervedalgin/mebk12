const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const {
    getPuppeteerConfig,
    getRandomUserAgent
} = require('../config/puppeteer.config');
const {
    MEB_SELECTORS,
    TIMEOUTS,
    WAITS,
    AUTOMATION_STATUS,
    CONFIRMATION_TYPES,
    QUEUE_STATUS
} = require('../config/constants');
const logService = require('./LogService');
const queueManager = require('./QueueManager');

// Stealth plugin ekle
puppeteer.use(StealthPlugin());

// Screenshot klasörü
const screenshotDir = path.resolve(__dirname, '../../data/screenshots');
if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
}

// Yardımcı fonksiyonlar
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ============= ROBUST HELPER FUNCTIONS =============

/**
 * Tüm sayfalardaki (tabs/windows) linkleri logla
 */
async function debugLogAllPages(browser) {
    const pages = await browser.pages();
    logService.info(`Toplam ${pages.length} sayfa/tab açık`);

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        try {
            const url = await page.url();
            const title = await page.title();
            logService.info(`Sayfa ${i + 1}: ${title} - ${url}`);
        } catch (e) {
            logService.warning(`Sayfa ${i + 1}: Bilgi alınamadı`);
        }
    }
}

/**
 * Frame dahil tüm linkleri bul ve logla
 */
async function debugLogAllLinks(page, maxLinks = 50) {
    const links = [];

    // Ana sayfadaki linkler
    try {
        const mainLinks = await page.evaluate((max) => {
            return Array.from(document.querySelectorAll('a')).slice(0, max).map(a => ({
                type: 'main',
                id: a.id || '',
                text: (a.innerText || '').trim().substring(0, 40),
                href: (a.href || '').substring(0, 80),
                visible: a.offsetParent !== null,
                className: a.className?.substring(0, 30) || ''
            }));
        }, maxLinks);
        links.push(...mainLinks);
    } catch (e) {
        logService.warning('Ana sayfa linkleri okunamadı: ' + e.message);
    }

    // Frame'lerdeki linkler
    try {
        const frames = page.frames();
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            if (frame === page.mainFrame()) continue;

            try {
                const frameName = frame.name() || `frame-${i}`;
                const frameLinks = await frame.evaluate((max, fName) => {
                    return Array.from(document.querySelectorAll('a')).slice(0, max).map(a => ({
                        type: `frame:${fName}`,
                        id: a.id || '',
                        text: (a.innerText || '').trim().substring(0, 40),
                        href: (a.href || '').substring(0, 80),
                        visible: a.offsetParent !== null,
                        className: a.className?.substring(0, 30) || ''
                    }));
                }, 20, frameName);
                links.push(...frameLinks);
            } catch (e) {
                // Frame erişilemiyor
            }
        }
    } catch (e) {
        logService.warning('Frame linkleri okunamadı');
    }

    logService.info(`Toplam ${links.length} link bulundu`);

    // İlk 20 linki logla
    links.slice(0, 20).forEach((link, i) => {
        logService.debug(`Link ${i + 1}: [${link.type}] id="${link.id}" text="${link.text}" visible=${link.visible}`);
    });

    return links;
}

/**
 * Frame-aware element bul - çoklu strateji
 */
async function findElementRobust(page, options) {
    const { id, text, href, xpath, timeout = 10000 } = options;
    const strategies = [];

    // Strateji tanımları
    if (id) {
        strategies.push({
            name: `ID: #${id}`,
            fn: async (ctx) => {
                await ctx.waitForSelector(`#${id}`, { visible: true, timeout: 3000 });
                return await ctx.$(`#${id}`);
            }
        });
    }

    if (text) {
        strategies.push({
            name: `Text: "${text}"`,
            fn: async (ctx) => {
                const elements = await ctx.$$('a, button');
                for (const el of elements) {
                    const elText = await el.evaluate(e => e.innerText?.toLowerCase().trim());
                    if (elText && elText.includes(text.toLowerCase())) {
                        return el;
                    }
                }
                return null;
            }
        });
    }

    if (href) {
        strategies.push({
            name: `Href: *${href}*`,
            fn: async (ctx) => {
                const selector = `a[href*="${href}"]`;
                await ctx.waitForSelector(selector, { timeout: 3000 }).catch(() => { });
                return await ctx.$(selector);
            }
        });
    }

    if (xpath) {
        strategies.push({
            name: `XPath: ${xpath}`,
            fn: async (ctx) => {
                await ctx.waitForXPath(xpath, { timeout: 3000 }).catch(() => { });
                const elements = await ctx.$x(xpath);
                return elements[0] || null;
            }
        });
    }

    // Ana sayfada dene
    for (const strategy of strategies) {
        try {
            const element = await strategy.fn(page);
            if (element) {
                logService.info(`Element bulundu: ${strategy.name} (ana sayfa)`);
                return { element, context: page, strategy: strategy.name };
            }
        } catch (e) {
            // Devam
        }
    }

    // Frame'lerde dene
    const frames = page.frames();
    for (const frame of frames) {
        if (frame === page.mainFrame()) continue;

        for (const strategy of strategies) {
            try {
                const element = await strategy.fn(frame);
                if (element) {
                    logService.info(`Element bulundu: ${strategy.name} (frame: ${frame.name() || 'unnamed'})`);
                    return { element, context: frame, strategy: strategy.name };
                }
            } catch (e) {
                // Devam
            }
        }
    }

    logService.warning(`Element bulunamadı. Denenen stratejiler: ${strategies.map(s => s.name).join(', ')}`);
    return null;
}

/**
 * Retry mekanizmalı tıklama
 */
async function clickWithRetry(page, options, maxRetries = 3) {
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        logService.info(`Tıklama denemesi ${attempt}/${maxRetries}`);

        const result = await findElementRobust(page, options);

        if (result && result.element) {
            try {
                await result.element.click();
                logService.success(`Tıklama başarılı: ${result.strategy}`);
                return true;
            } catch (e) {
                lastError = e;
                logService.warning(`Tıklama hatası: ${e.message}`);
            }
        }

        if (attempt < maxRetries) {
            await sleep(2000);
        }
    }

    logService.error(`Tıklama başarısız (${maxRetries} deneme)`);
    return false;
}

/**
 * En son açılan sayfaya geç
 */
async function switchToLatestPage(browser, currentPage) {
    const pages = await browser.pages();

    if (pages.length > 1) {
        const latestPage = pages[pages.length - 1];
        if (latestPage !== currentPage) {
            await latestPage.bringToFront();
            logService.info('Yeni sayfaya geçildi');
            return latestPage;
        }
    }

    return currentPage;
}

/**
 * Sayfa HTML yapısını kaydet (debugging için)
 */
async function savePageHTML(page, filename) {
    try {
        const html = await page.content();
        const htmlPath = path.join(screenshotDir, `${filename}.html`);
        fs.writeFileSync(htmlPath, html);
        logService.info(`HTML kaydedildi: ${filename}.html`);
    } catch (e) {
        logService.warning('HTML kaydedilemedi: ' + e.message);
    }
}

class AutomationEngine extends EventEmitter {
    constructor() {
        super();
        this.browser = null;
        this.page = null;
        this.status = AUTOMATION_STATUS.IDLE;
        this.currentItem = null;
        this.isPaused = false;
        this.isStopped = false;
        this.waitingForConfirmation = null;
        this.confirmationResolver = null;
        this.startTime = null;
        this.processedCount = 0;
        this.failedCount = 0;
        this.currentStep = 0;
    }

    // Durum güncelle ve SSE'ye yayınla
    setStatus(status, data = {}) {
        this.status = status;
        // Tüm durumu yayınla (waitingForConfirmation dahil)
        this.emit('status', this.getStatus());
        logService.debug('Otomasyon durumu değişti', { status });
    }

    // Adım log
    logStep(stepId, message) {
        this.currentStep = stepId;
        logService.info(`[Adım ${stepId}/15] ${message}`);
        this.emit('step', { step: stepId, message });
    }

    // Tarayıcı başlat
    async initBrowser() {
        try {
            this.logStep(1, 'Tarayıcı başlatılıyor...');

            const config = getPuppeteerConfig();
            this.browser = await puppeteer.launch(config);
            this.page = await this.browser.newPage();

            // User Agent ayarla
            await this.page.setUserAgent(getRandomUserAgent());

            // Türkçe dil ayarı
            await this.page.setExtraHTTPHeaders({
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
            });

            // Timeout ayarları
            this.page.setDefaultNavigationTimeout(TIMEOUTS.PAGE_LOAD);
            this.page.setDefaultTimeout(TIMEOUTS.MEDIUM);

            logService.success('✓ Tarayıcı başlatıldı');
            return true;
        } catch (error) {
            logService.error('Tarayıcı başlatılamadı', error);
            throw error;
        }
    }

    // Tarayıcı kapat
    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
            logService.info('Tarayıcı kapatıldı');
        }
    }

    // Screenshot al
    async takeScreenshot(name) {
        if (!this.page) return null;
        try {
            const timestamp = Date.now();
            const filename = `${name}-${timestamp}.png`;
            const filepath = path.join(screenshotDir, filename);
            await this.page.screenshot({ path: filepath, fullPage: false });
            logService.debug('Screenshot alındı', { filename });
            return filepath;
        } catch (error) {
            logService.warning('Screenshot alınamadı', { error: error.message });
            return null;
        }
    }

    // Kullanıcı onayı bekle
    async waitForUserConfirmation(type, message) {
        // ÖNCE waiting değerini ayarla, SONRA status emit et
        this.waitingForConfirmation = type;
        this.setStatus(AUTOMATION_STATUS.WAITING_CONFIRMATION, { confirmationType: type, message });
        logService.info(`⏳ Kullanıcı onayı bekleniyor: ${message}`, { type });

        return new Promise((resolve) => {
            this.confirmationResolver = resolve;
        });
    }

    // Kullanıcı onayı al
    confirm(confirmed = true) {
        if (this.confirmationResolver) {
            this.waitingForConfirmation = null;
            this.confirmationResolver(confirmed);
            this.confirmationResolver = null;

            if (confirmed) {
                logService.success('✓ Kullanıcı onayladı');
                this.setStatus(AUTOMATION_STATUS.RUNNING);
            } else {
                logService.warning('Kullanıcı iptal etti');
            }
        }
    }

    // Elemana bekle ve tıkla - hata durumunda exception fırlat
    async waitAndClick(selector, options = {}) {
        const timeout = options.timeout || TIMEOUTS.MEDIUM;
        await sleep(WAITS.ELEMENT_CLICK);

        try {
            await this.page.waitForSelector(selector, { visible: true, timeout });
            await this.page.click(selector);
            logService.debug(`Element tıklandı: ${selector}`);
            return true;
        } catch (error) {
            logService.error(`Element bulunamadı veya tıklanamadı: ${selector}`, error);
            // Hata fırlat - sessizce geçme
            throw new Error(`Element bulunamadı: ${selector}`);
        }
    }

    // XPath ile bekle ve tıkla
    async waitAndClickXPath(xpath, options = {}) {
        const timeout = options.timeout || TIMEOUTS.MEDIUM;
        await sleep(WAITS.ELEMENT_CLICK);

        try {
            await this.page.waitForXPath(xpath, { visible: true, timeout });
            const elements = await this.page.$x(xpath);
            if (elements.length > 0) {
                await elements[0].click();
                return true;
            }
            return false;
        } catch (error) {
            logService.warning(`XPath element tıklanamadı: ${xpath}`, { error: error.message });
            return false;
        }
    }

    // Input'a yaz (doğrudan value ataması - EN HIZLI yöntem)
    async typeIntoInput(selector, text, options = {}) {
        if (!text) return;

        try {
            await this.page.waitForSelector(selector, { visible: true, timeout: TIMEOUTS.SHORT });

            // Doğrudan value ata - tıklama veya keyboard yok, anında!
            await this.page.evaluate((inputText, sel) => {
                const input = document.querySelector(sel);
                if (input) {
                    input.focus();
                    input.value = inputText;
                    // Event'leri dispatch et (form validation için)
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.dispatchEvent(new Event('blur', { bubbles: true }));
                }
            }, text, selector);

            await sleep(50); // Minimal bekleme
            return true;
        } catch (error) {
            logService.warning(`Input'a yazılamadı: ${selector}`, { error: error.message });
            return false;
        }
    }

    // XPath input'a yaz (doğrudan value ataması - EN HIZLI)
    async typeIntoXPathInput(xpath, text) {
        if (!text) return;

        try {
            await this.page.waitForXPath(xpath, { visible: true, timeout: TIMEOUTS.SHORT });
            const elements = await this.page.$x(xpath);
            if (elements.length > 0) {
                // Doğrudan value ata - anında!
                await elements[0].evaluate((el, inputText) => {
                    el.focus();
                    el.value = inputText;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                }, text);
                await sleep(50);
                return true;
            }
            return false;
        } catch (error) {
            logService.warning(`XPath input'a yazılamadı`, { error: error.message });
            return false;
        }
    }

    // Select dropdown
    async selectOption(selector, value) {
        if (!value) return;

        try {
            await this.page.waitForSelector(selector, { visible: true, timeout: TIMEOUTS.SHORT });
            await this.page.select(selector, value);
            return true;
        } catch (error) {
            logService.warning(`Select seçilemedi: ${selector}`, { error: error.message });
            return false;
        }
    }

    // TinyMCE editörüne içerik gir
    async fillTinyMCE(iframeId, content) {
        if (!content) return true;

        try {
            const iframeSelector = `#${iframeId}`;
            await this.page.waitForSelector(iframeSelector, { visible: true, timeout: TIMEOUTS.MEDIUM });

            // iframe'e geç
            const frameHandle = await this.page.$(iframeSelector);
            const frame = await frameHandle.contentFrame();

            // body'yi bekle
            await frame.waitForSelector('body#tinymce', { timeout: TIMEOUTS.SHORT });

            // İçeriği ayarla
            await frame.evaluate((html) => {
                const body = document.querySelector('body#tinymce');
                if (body) {
                    body.innerHTML = html;
                }
            }, content);

            logService.debug('TinyMCE içeriği girildi', { iframeId });
            return true;
        } catch (error) {
            logService.error('TinyMCE hatası', error, { iframeId });
            return false;
        }
    }

    // Form doldur
    async fillForm(data) {
        try {
            // Adım 8: Başlık
            this.logStep(8, 'Başlık giriliyor...');
            await this.typeIntoInput(`#${MEB_SELECTORS.TITLE_INPUT_ID}`, data.baslik);
            logService.success('✓ Başlık girildi');

            // Adım 9: Yayın bitiş tarihi - popup takvimi açmadan doğrudan değer ata
            this.logStep(9, 'Yayın bitiş tarihi giriliyor...');
            try {
                // XPath ile elementi bul ve doğrudan value ata (tıklamadan!)
                await this.page.waitForXPath(MEB_SELECTORS.END_DATE_XPATH, { visible: true, timeout: TIMEOUTS.SHORT });
                const dateElements = await this.page.$x(MEB_SELECTORS.END_DATE_XPATH);
                if (dateElements.length > 0) {
                    // Popup açılmasını engellemek için tıklamadan doğrudan value ata
                    await dateElements[0].evaluate((el) => {
                        el.value = '31.12.2028';
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    });
                    logService.success('✓ Yayın bitiş tarihi girildi: 31.12.2028');
                }
            } catch (e) {
                logService.warning('Yayın bitiş tarihi girilemedi: ' + e.message);
            }

            // Adım 10: İçerik kaynağı (opsiyonel)
            this.logStep(10, 'İçerik kaynağı seçiliyor...');
            await this.selectOption(`#${MEB_SELECTORS.CONTENT_SOURCE_ID}`, '1'); // Varsayılan değer
            logService.debug('İçerik kaynağı seçildi');

            // Adım 11: Açıklama
            this.logStep(11, 'Açıklama giriliyor...');
            if (data.aciklama) {
                await this.typeIntoInput(`#${MEB_SELECTORS.DESCRIPTION_ID}`, data.aciklama);
                logService.success('✓ Açıklama girildi');
            }

            // Adım 12: Etiketler
            this.logStep(12, 'Etiketler giriliyor...');
            if (data.etiketler) {
                const tags = Array.isArray(data.etiketler) ? data.etiketler.join(', ') : data.etiketler;
                await this.typeIntoInput(`#${MEB_SELECTORS.TAGS_ID}`, tags);
                logService.success('✓ Etiketler girildi');
            }

            // Adım 13: Kısa içerik (TinyMCE)
            this.logStep(13, 'Kısa içerik giriliyor...');
            if (data.kisaIcerik) {
                await this.fillTinyMCE(MEB_SELECTORS.SHORT_CONTENT_IFRAME, data.kisaIcerik);
                logService.success('✓ Kısa içerik girildi');
            }

            // Adım 14: Detaylı içerik (TinyMCE)
            this.logStep(14, 'Detaylı içerik giriliyor...');
            if (data.icerik) {
                await this.fillTinyMCE(MEB_SELECTORS.DETAILED_CONTENT_IFRAME, data.icerik);
                logService.success('✓ Detaylı içerik girildi');
            }

            logService.success('✓ Form dolduruldu');
            return true;
        } catch (error) {
            logService.error('Form doldurma hatası', error);
            throw error;
        }
    }

    // Tek öğe işle
    async processItem(item) {
        const startTime = Date.now();
        this.currentItem = item;

        try {
            logService.info(`▶️ İçerik işleniyor: "${item.jsonData.baslik}"`);
            queueManager.updateStatus(item.id, QUEUE_STATUS.PROCESSING);

            // Adım 5: Haberler kategorisini aç
            this.logStep(5, 'Haberler kategorisi açılıyor...');
            await this.waitAndClickXPath(MEB_SELECTORS.HABERLER_XPATH);
            await sleep(WAITS.PAGE_LOAD);
            logService.success('✓ Haberler kategorisi açıldı');

            // Adım 6: İçerik Ekle butonuna tıkla
            this.logStep(6, 'İçerik Ekle butonuna tıklanıyor...');
            await this.waitAndClickXPath(MEB_SELECTORS.ADD_CONTENT_XPATH);
            await sleep(WAITS.PAGE_LOAD);
            logService.success('✓ İçerik ekleme sayfası açıldı');

            // Adım 7: Manşet resmi için onay bekle
            this.logStep(7, 'Manşet resmi bekleniyor...');
            const bannerConfirmed = await this.waitForUserConfirmation(
                CONFIRMATION_TYPES.BANNER_UPLOAD,
                'Manşet resmini yükleyin ve Onayla butonuna tıklayın'
            );

            if (!bannerConfirmed) {
                throw new Error('Kullanıcı resim yüklemeyi iptal etti');
            }

            // Durdurma kontrolü
            if (this.isStopped) throw new Error('Otomasyon durduruldu');

            // Duraklatma kontrolü
            while (this.isPaused) {
                await sleep(1000);
                if (this.isStopped) throw new Error('Otomasyon durduruldu');
            }

            // Formu doldur (Adım 8-14)
            await this.fillForm(item.jsonData);

            // Adım 15: Gönderim öncesi onay
            this.logStep(15, 'Form gönderiliyor...');
            const submitConfirmed = await this.waitForUserConfirmation(
                CONFIRMATION_TYPES.FORM_SUBMIT,
                'Form gönderilecek. Onaylıyor musunuz?'
            );

            if (!submitConfirmed) {
                throw new Error('Kullanıcı gönderimi iptal etti');
            }

            // Formu gönder
            await this.waitAndClick(`#${MEB_SELECTORS.SUBMIT_BUTTON_ID}`);
            await sleep(WAITS.AFTER_SUBMIT);

            // Screenshot al
            await this.takeScreenshot(`success-${item.id}`);

            // Başarılı olarak işaretle
            const processingTime = (Date.now() - startTime) / 1000;
            queueManager.markAsCompleted(item.id, processingTime);
            this.processedCount++;

            logService.success(`✓ İçerik başarıyla yüklendi (${processingTime.toFixed(1)}s)`, {
                id: item.id,
                title: item.jsonData.baslik
            });

            return true;

        } catch (error) {
            logService.error(`✗ İçerik yüklenemedi: ${item.jsonData.baslik}`, error);
            await this.takeScreenshot(`error-${item.id}`);
            queueManager.markAsFailed(item.id, error.message);
            this.failedCount++;
            return false;
        } finally {
            this.currentItem = null;
        }
    }

    // Kuyruk işleme
    async processQueue() {
        let item;

        while ((item = queueManager.getNextPending()) && !this.isStopped) {
            while (this.isPaused) {
                await sleep(1000);
                if (this.isStopped) break;
            }

            if (this.isStopped) break;

            await this.processItem(item);
            await sleep(randomDelay(1000, 2000));
        }
    }

    // Otomasyonu başlat
    async start() {
        if (this.status === AUTOMATION_STATUS.RUNNING) {
            logService.warning('Otomasyon zaten çalışıyor');
            return false;
        }

        try {
            this.isStopped = false;
            this.isPaused = false;
            this.startTime = Date.now();
            this.processedCount = 0;
            this.failedCount = 0;

            this.setStatus(AUTOMATION_STATUS.RUNNING);
            logService.info('🚀 Otomasyon başlatıldı');

            // Adım 1: Tarayıcı başlat
            await this.initBrowser();

            // Adım 2: MEBBİS'e git
            this.logStep(2, 'MEB giriş sayfasına gidiliyor...');
            await this.page.goto(MEB_SELECTORS.MEBBIS_URL, {
                waitUntil: 'networkidle2',
                timeout: TIMEOUTS.PAGE_LOAD
            });
            logService.success('✓ MEB sayfası açıldı');

            // Giriş onayı bekle
            const loginConfirmed = await this.waitForUserConfirmation(
                CONFIRMATION_TYPES.LOGIN,
                'MEBBİS\'e giriş yapın ve devam etmek için Onayla butonuna tıklayın'
            );

            if (!loginConfirmed) {
                throw new Error('Kullanıcı girişi iptal etti');
            }

            // Adım 3: Okul paneline tıkla (yeni pencere açabilir)
            this.logStep(3, 'Okul paneline tıklanıyor...');

            // Sayfa tam yüklenene kadar bekle
            await sleep(2000);

            // Yeni pencere açılırsa yakala
            let newPage = null;
            const newPageHandler = async (target) => {
                const page = await target.page();
                if (page) newPage = page;
            };
            this.browser.on('targetcreated', newPageHandler);

            // Panele tıkla - birden fazla strateji dene
            let clicked = false;

            // Strateji 1: ID ile bekle ve tıkla
            try {
                const selector = `#${MEB_SELECTORS.SCHOOL_PANEL_ID}`;
                await this.page.waitForSelector(selector, { visible: true, timeout: 10000 });
                await this.page.click(selector);
                clicked = true;
                logService.info('Okul paneli ID ile tıklandı');
            } catch (e) {
                logService.warning(`Panel ID bulunamadı: ${e.message}`);
            }

            // Strateji 2: LinkButton içeren elementi ara
            if (!clicked) {
                try {
                    clicked = await this.page.evaluate(() => {
                        const links = document.querySelectorAll('a[id*="LinkButton"]');
                        for (const link of links) {
                            if (link.offsetParent !== null) { // Görünür mü?
                                link.click();
                                return true;
                            }
                        }
                        return false;
                    });
                    if (clicked) logService.info('Okul paneli LinkButton ile tıklandı');
                } catch (e) {
                    logService.warning('LinkButton stratejisi başarısız');
                }
            }

            // Strateji 3: MEBK12PANEL target'lı link ara
            if (!clicked) {
                try {
                    clicked = await this.page.evaluate((target) => {
                        const link = document.querySelector(`a[target="${target}"]`);
                        if (link) {
                            link.click();
                            return true;
                        }
                        return false;
                    }, MEB_SELECTORS.SCHOOL_PANEL_TARGET);
                    if (clicked) logService.info('Okul paneli target ile tıklandı');
                } catch (e) {
                    logService.warning('Target stratejisi başarısız');
                }
            }

            if (!clicked) {
                // Sayfadaki tüm linkleri logla
                const allLinks = await this.page.evaluate(() => {
                    return Array.from(document.querySelectorAll('a')).slice(0, 20).map(a => ({
                        id: a.id,
                        text: a.innerText?.substring(0, 50),
                        href: a.href?.substring(0, 50)
                    }));
                });
                logService.error('Okul paneli bulunamadı. Sayfadaki linkler:', { links: allLinks });
                throw new Error('Okul paneli bulunamadı - sayfada beklenmeyen içerik');
            }

            // Yeni pencere açılmasını bekle
            await sleep(3000);

            // Event listener'ı kaldır
            this.browser.off('targetcreated', newPageHandler);

            // Popup açılmış olabilir - "Kapat" butonuna tıkla
            try {
                const popupClosed = await this.page.evaluate(() => {
                    // Kapat butonu - çeşitli seçiciler dene
                    const selectors = [
                        'button.close',
                        '.modal button.close',
                        '[data-dismiss="modal"]',
                        '.modal-footer button',
                        'button[title="Kapat"]'
                    ];

                    for (const sel of selectors) {
                        const btn = document.querySelector(sel);
                        if (btn) {
                            btn.click();
                            return 'selector: ' + sel;
                        }
                    }

                    // "Kapat" yazısı içeren butonu ara - POPUP KAPATMA
                    const buttons = document.querySelectorAll('button, .btn, input[type="button"]');
                    for (const btn of buttons) {
                        if (btn.innerText?.toLowerCase().trim() === 'kapat' ||
                            btn.value?.toLowerCase().trim() === 'kapat') {
                            btn.click();
                            return 'text: kapat';
                        }
                    }

                    return 'none';
                });

                logService.info(`Popup kapatma denendi: ${popupClosed}`);
                await sleep(2000);
            } catch (e) {
                logService.warning('Popup kapatma hatası: ' + e.message);
            }

            // Yeni pencere açıldıysa ona geç
            if (newPage) {
                logService.info('Yeni pencere açıldı, geçiş yapılıyor...');
                this.page = newPage;
                await this.page.bringToFront();
                await sleep(WAITS.PAGE_LOAD);
            } else {
                // MEBK12PANEL'e tıklama - yeni pencere açar
                logService.info('MEBK12PANEL ikonunu arıyor ve tıklıyor...');

                // Önce mevcut URL'yi kontrol et
                const currentUrl = await this.page.url();
                logService.info(`Mevcut URL: ${currentUrl}`);

                // Eğer hala MEBBİS ana sayfasındaysak
                if (currentUrl.includes('mebbis.meb.gov.tr')) {

                    // Popup açık olabilir - popup içindeki okul linkine tıkla
                    // (birecikdumlupinar veya benzeri)
                    let schoolLinkClicked = false;

                    try {
                        schoolLinkClicked = await this.page.evaluate(() => {
                            // Modal/popup içindeki linkleri ara
                            const modalLinks = document.querySelectorAll('.modal a, .popup a, [role="dialog"] a, .modal-body a');
                            for (const link of modalLinks) {
                                // Herhangi bir linke tıkla (okul linki olmalı)
                                if (link.href && link.offsetParent !== null) {
                                    link.click();
                                    return 'modal-link';
                                }
                            }

                            // Alternatif: birecik veya okul adı içeren linke tıkla
                            const allLinks = document.querySelectorAll('a');
                            for (const link of allLinks) {
                                const text = link.innerText?.toLowerCase() || '';
                                const href = link.href?.toLowerCase() || '';
                                if ((text.includes('birecik') || text.includes('dumlupinar') ||
                                    href.includes('k12') || href.includes('panel')) &&
                                    link.offsetParent !== null) {
                                    link.click();
                                    return 'school-link: ' + text.substring(0, 20);
                                }
                            }

                            return null;
                        });

                        if (schoolLinkClicked) {
                            logService.info(`Okul linkine tıklandı: ${schoolLinkClicked}`);
                            await sleep(5000); // Yeni pencere açılmasını bekle
                        }
                    } catch (e) {
                        logService.warning('Okul linki tıklama hatası: ' + e.message);
                    }

                    // Yeni pencere açılmış olabilir - kontrol et
                    const allPages = await this.browser.pages();
                    logService.info(`Açık sayfa sayısı: ${allPages.length}`);

                    // K12 içeren sayfayı bul
                    for (const p of allPages) {
                        try {
                            const pUrl = await p.url();
                            const pTitle = await p.title();
                            logService.info(`Sayfa: ${pTitle} - ${pUrl}`);

                            if (pUrl.includes('meb.k12.tr') || pUrl.includes('mebpanel')) {
                                this.page = p;
                                await this.page.bringToFront();
                                logService.success('K12 panel sayfasına geçildi!');
                                break;
                            }
                        } catch (e) {
                            // Sayfa erişilemez
                        }
                    }

                    // Eğer hala K12 sayfasına geçemediyse, MEBK12PANEL ikonuna tıkla
                    const checkUrl = await this.page.url();
                    if (!checkUrl.includes('meb.k12.tr')) {
                        logService.warning('K12 sayfası bulunamadı, MEBK12PANEL ikonuna tıklanıyor...');

                        const panelClicked = await this.page.evaluate(() => {
                            // MEBK12PANEL yazısını içeren elementi bul
                            const allElements = document.querySelectorAll('*');
                            for (const el of allElements) {
                                if (el.innerText?.trim() === 'MEBK12PANEL' && el.offsetParent !== null) {
                                    const clickTarget = el.closest('a') || el.closest('div[onclick]') || el.parentElement;
                                    if (clickTarget) {
                                        clickTarget.click();
                                        return true;
                                    }
                                }
                            }
                            return false;
                        });

                        if (panelClicked) {
                            logService.info('MEBK12PANEL tıklandı, popup bekleniyor...');
                            await sleep(3000);

                            // Popup açıldıysa okul linkine tıkla
                            const schoolClicked = await this.page.evaluate(() => {
                                // Popup içindeki ilk görünür linke tıkla
                                const links = document.querySelectorAll('a');
                                for (const link of links) {
                                    if (link.offsetParent !== null &&
                                        (link.innerText?.includes('birecik') ||
                                            link.innerText?.includes('dumlupinar') ||
                                            link.href?.includes('k12'))) {
                                        link.click();
                                        return true;
                                    }
                                }
                                return false;
                            });

                            if (schoolClicked) {
                                logService.info('Popup içindeki okul linkine tıklandı');
                                await sleep(5000);

                                // Yeni sayfaya geç
                                const pages2 = await this.browser.pages();
                                for (const p of pages2) {
                                    const pUrl = await p.url();
                                    if (pUrl.includes('meb.k12.tr')) {
                                        this.page = p;
                                        await this.page.bringToFront();
                                        logService.success('K12 panel sayfasına geçildi!');
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }

                await sleep(WAITS.PANEL_SWITCH);
            }

            logService.success('✓ Okul paneli açıldı');

            // ========== ADIM 4: İÇERİK SAYFASINA GİT ==========
            this.logStep(4, 'İçerik sayfasına gidiliyor...');

            // Önce tüm açık sayfaları logla
            await debugLogAllPages(this.browser);

            // En son açılan sayfaya geç (MEBK12PANEL yeni sekme açmış olabilir)
            this.page = await switchToLatestPage(this.browser, this.page);

            await sleep(3000); // Sayfa yüklemesi için bekle

            // Mevcut sayfa bilgilerini logla
            const step4Url = await this.page.url();
            const step4Title = await this.page.title();
            logService.info(`Mevcut sayfa: ${step4Title}`);
            logService.info(`URL: ${step4Url}`);

            // K12 panelinde mi kontrol et
            const isK12Panel = step4Url.includes('meb.k12.tr') || step4Url.includes('mebpanel');

            if (!isK12Panel) {
                logService.warning('K12 panelinde değiliz, sayfa geçişi yapılıyor...');

                // Tüm sayfaları kontrol et
                const allPages = await this.browser.pages();
                for (const p of allPages) {
                    const pUrl = await p.url();
                    if (pUrl.includes('meb.k12.tr') || pUrl.includes('mebpanel')) {
                        this.page = p;
                        await this.page.bringToFront();
                        logService.info(`K12 sayfasına geçildi: ${pUrl}`);
                        await sleep(2000);
                        break;
                    }
                }
            }

            // Yeniden kontrol
            const currentK12Url = await this.page.url();
            logService.info(`K12 Panel URL: ${currentK12Url}`);

            // HTML kaydet (debugging için)
            await savePageHTML(this.page, 'step4-k12-panel');

            // Tüm linkleri logla
            await debugLogAllLinks(this.page, 30);

            // İçerik linkini bul - K12 panel için özel stratejiler
            logService.info('K12 panelinde içerik linki aranıyor...');

            let contentClicked = false;

            // Strateji 1: Doğrudan icerik_listele.php linkine git
            try {
                contentClicked = await this.page.evaluate(() => {
                    const link = document.querySelector('a[href*="icerik_listele"]') ||
                        document.querySelector('a[href*="icerik.php"]') ||
                        document.querySelector('a[href*="kategoriler"]');
                    if (link) {
                        link.click();
                        return true;
                    }
                    return false;
                });
                if (contentClicked) logService.info('İçerik linki href ile bulundu');
            } catch (e) { }

            // Strateji 2: Text ile ara
            if (!contentClicked) {
                contentClicked = await clickWithRetry(this.page, {
                    id: MEB_SELECTORS.CONTENT_LINK_ID,
                    text: 'içerik',
                    href: 'icerik'
                }, 2);

                if (!contentClicked) {
                    // Son çare: Frame'lerde manuel arama
                    logService.warning('Standart yöntemler başarısız, frame araması yapılıyor...');

                    let frameContentClicked = false;
                    const frames = this.page.frames();

                    for (const frame of frames) {
                        try {
                            const frameName = frame.name() || 'unnamed';
                            logService.info(`Frame kontrol ediliyor: ${frameName}`);

                            // Frame'deki tüm linkleri logla
                            const frameLinks = await frame.evaluate(() => {
                                return Array.from(document.querySelectorAll('a')).map(a => ({
                                    id: a.id,
                                    text: a.innerText?.trim().substring(0, 30),
                                    href: a.href?.substring(0, 60)
                                }));
                            }).catch(() => []);

                            logService.debug(`Frame ${frameName}: ${frameLinks.length} link`);

                            // İçerik linki ara
                            for (const link of frameLinks) {
                                if (link.id?.toLowerCase().includes('icerik') ||
                                    link.text?.toLowerCase().includes('içerik') ||
                                    link.href?.toLowerCase().includes('icerik')) {
                                    logService.info(`Frame'de içerik linki bulundu: ${link.text}`);

                                    // Tıkla
                                    await frame.evaluate((linkId, linkText) => {
                                        let el = null;
                                        if (linkId) el = document.getElementById(linkId);
                                        if (!el && linkText) {
                                            el = Array.from(document.querySelectorAll('a')).find(a =>
                                                a.innerText?.includes(linkText));
                                        }
                                        if (el) el.click();
                                        return !!el;
                                    }, link.id, link.text);

                                    frameContentClicked = true;
                                    break;
                                }
                            }

                            if (frameContentClicked) break;
                        } catch (e) {
                            // Frame erişim hatası, devam
                        }
                    }

                    if (!frameContentClicked) {
                        // Screenshot ve HTML kaydet
                        await this.takeScreenshot('step4-content-not-found');
                        await savePageHTML(this.page, 'step4-content-not-found');

                        throw new Error('İçerik linki bulunamadı - tüm stratejiler başarısız');
                    }
                }
            }

            await sleep(WAITS.PAGE_LOAD);
            logService.success('✓ İçerik sayfasına ulaşıldı');

            // Kuyruğu işle
            const stats = queueManager.getStatistics();
            logService.info(`📋 Kuyrukta ${stats.pending} içerik bulundu`);

            await this.processQueue();

            // Tamamlandı
            const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
            this.setStatus(AUTOMATION_STATUS.COMPLETED);

            logService.success(`🎉 Tüm işlemler tamamlandı`, {
                processed: this.processedCount,
                failed: this.failedCount,
                totalTime: `${totalTime}s`
            });

            return true;

        } catch (error) {
            logService.error('Otomasyon hatası', error);
            this.setStatus(AUTOMATION_STATUS.ERROR, { error: error.message });
            throw error;
        }
    }

    pause() {
        if (this.status === AUTOMATION_STATUS.RUNNING) {
            this.isPaused = true;
            this.setStatus(AUTOMATION_STATUS.PAUSED);
            logService.info('⏸️ Otomasyon duraklatıldı');
        }
    }

    resume() {
        if (this.status === AUTOMATION_STATUS.PAUSED) {
            this.isPaused = false;
            this.setStatus(AUTOMATION_STATUS.RUNNING);
            logService.info('▶️ Otomasyon devam ediyor');
        }
    }

    async stop() {
        this.isStopped = true;
        this.isPaused = false;

        if (this.confirmationResolver) {
            this.confirmationResolver(false);
        }

        await this.closeBrowser();
        this.setStatus(AUTOMATION_STATUS.IDLE);
        logService.warning('⏹️ Otomasyon durduruldu');
    }

    skip() {
        if (this.currentItem) {
            queueManager.updateStatus(this.currentItem.id, QUEUE_STATUS.SKIPPED);
            logService.info('⏭️ Öğe atlandı', { id: this.currentItem.id });

            if (this.confirmationResolver) {
                this.confirmationResolver(true);
            }
        }
    }

    getStatus() {
        const stats = queueManager.getStatistics();

        return {
            status: this.status,
            isRunning: this.status === AUTOMATION_STATUS.RUNNING,
            isPaused: this.isPaused,
            waitingForConfirmation: this.waitingForConfirmation,
            currentStep: this.currentStep,
            currentItem: this.currentItem ? {
                id: this.currentItem.id,
                title: this.currentItem.jsonData.baslik
            } : null,
            progress: {
                processed: this.processedCount,
                failed: this.failedCount,
                pending: stats.pending,
                total: stats.total
            },
            startTime: this.startTime
        };
    }
}

const automationEngine = new AutomationEngine();

module.exports = automationEngine;
