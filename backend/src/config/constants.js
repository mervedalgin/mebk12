// MEB Site Seçicileri
const MEB_SELECTORS = {
  // Giriş sayfası
  MEBBIS_URL: 'https://mebbis.meb.gov.tr/',

  // Okul paneli
  SCHOOL_PANEL_ID: 'rptProjeler_ctl03_rptKullanicilar_ctl00_LinkButton1',
  SCHOOL_PANEL_TARGET: 'MEBK12PANEL',

  // İçerik sayfası
  CONTENT_LINK_ID: 'icerik',

  // Haberler kategorisi
  HABERLER_XPATH: "//a[contains(@href, 'KATEGORINO=517471')]",

  // İçerik ekleme
  ADD_CONTENT_XPATH: "//a[contains(@href, 'icerik_degistir.php') and contains(@class, 'button green')]",

  // Form alanları
  TITLE_INPUT_ID: 'BASLIK',
  END_DATE_XPATH: "/html/body/div[1]/div[3]/div[1]/div[2]/div/form/div/div[2]/table/tbody/tr[3]/td[2]/input",
  CONTENT_SOURCE_ID: 'ICERIKKAYNAGI',
  DESCRIPTION_ID: 'ACIKLAMA',
  TAGS_ID: 'ANAHTAR_KELIMELER',

  // TinyMCE editörleri
  SHORT_CONTENT_IFRAME: 'KISAICERIK_ifr',
  DETAILED_CONTENT_IFRAME: 'ICERIK_ifr',
  TINYMCE_BODY_ID: 'tinymce',

  // Submit butonu
  SUBMIT_BUTTON_ID: 'button',

  // Başarı mesajı
  SUCCESS_MESSAGE_XPATH: "//*[contains(text(), 'başarı') or contains(text(), 'eklendi')]"
};

// Timeout değerleri (milisaniye)
const TIMEOUTS = {
  SHORT: 10000,      // 10 saniye
  MEDIUM: 20000,     // 20 saniye
  LONG: 30000,       // 30 saniye
  PAGE_LOAD: 60000   // 60 saniye
};

// Bekleme süreleri (milisaniye)
const WAITS = {
  PAGE_LOAD: 2000,
  ELEMENT_CLICK: 1000,
  PANEL_SWITCH: 3000,
  AFTER_SUBMIT: 2000,
  TYPING_MIN: 30,
  TYPING_MAX: 80
};

// Retry ayarları
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000,
  BACKOFF_MULTIPLIER: 2
};

// Kuyruk durumları
const QUEUE_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
  RETRYING: 'retrying'
};

// Log seviyeleri
const LOG_LEVELS = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  DEBUG: 'debug'
};

// Otomasyon durumları
const AUTOMATION_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ERROR: 'error',
  WAITING_CONFIRMATION: 'waiting_confirmation'
};

// Onay tipleri
const CONFIRMATION_TYPES = {
  LOGIN: 'login',
  BANNER_UPLOAD: 'banner_upload',
  FORM_SUBMIT: 'form_submit'
};

// Resim boyutları
const IMAGE_SIZES = {
  MAIN: {
    width: 1280,
    height: 720
  },
  THUMBNAIL: {
    width: 320,
    height: 180
  },
  MIN_WIDTH: 1280
};

// Dosya limitleri
const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_QUEUE_FILES: 10,
  ALLOWED_MIMES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
};

// Otomasyon adımları
const AUTOMATION_STEPS = [
  { id: 1, name: 'Tarayıcı başlatılıyor', timeout: TIMEOUTS.MEDIUM },
  { id: 2, name: 'MEB giriş sayfasına gidiliyor', timeout: TIMEOUTS.MEDIUM },
  { id: 3, name: 'Okul paneline tıklanıyor', timeout: TIMEOUTS.LONG },
  { id: 4, name: 'İçerik sayfasına gidiliyor', timeout: TIMEOUTS.LONG },
  { id: 5, name: 'Haberler kategorisi açılıyor', timeout: TIMEOUTS.MEDIUM },
  { id: 6, name: 'İçerik Ekle butonuna tıklanıyor', timeout: TIMEOUTS.MEDIUM },
  { id: 7, name: 'Manşet resmi bekleniyor', timeout: null },
  { id: 8, name: 'Başlık giriliyor', timeout: TIMEOUTS.SHORT },
  { id: 9, name: 'Yayın bitiş tarihi giriliyor', timeout: TIMEOUTS.SHORT },
  { id: 10, name: 'İçerik kaynağı seçiliyor', timeout: TIMEOUTS.SHORT },
  { id: 11, name: 'Açıklama giriliyor', timeout: TIMEOUTS.SHORT },
  { id: 12, name: 'Etiketler giriliyor', timeout: TIMEOUTS.SHORT },
  { id: 13, name: 'Kısa içerik giriliyor', timeout: TIMEOUTS.SHORT },
  { id: 14, name: 'Detaylı içerik giriliyor', timeout: TIMEOUTS.SHORT },
  { id: 15, name: 'Form gönderiliyor', timeout: TIMEOUTS.MEDIUM }
];

module.exports = {
  MEB_SELECTORS,
  TIMEOUTS,
  WAITS,
  RETRY_CONFIG,
  QUEUE_STATUS,
  LOG_LEVELS,
  AUTOMATION_STATUS,
  CONFIRMATION_TYPES,
  IMAGE_SIZES,
  FILE_LIMITS,
  AUTOMATION_STEPS
};
