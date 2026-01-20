# 🚀 MEB İçerik Otomasyon Sistemi - Geliştirilmiş Plan

## 📋 İçindekiler
- [Proje Yapısı](#-proje-yapısı)
- [Geliştirilmiş Özellikler](#-geliştirilmiş-özellikler)
  - [JSON Kuyruk Sistemi](#1-json-kuyruk-sistemi-iyileştirmeleri)
  - [Manşet Resmi Yönetimi](#2-manşet-resmi-yönetimi-iyileştirmeleri)
  - [Puppeteer Otomasyon](#3-puppeteer-otomasyon-iyileştirmeleri)
  - [UI/UX İyileştirmeleri](#4-uiux-iyileştirmeleri)
  - [Log Sistemi](#5-log-sistemi-iyileştirmeleri)
  - [API Endpoints](#6-api-endpoint-iyileştirmeleri)
  - [Validation ve Güvenlik](#7-validation-ve-güvenlik)
  - [Performans Optimizasyonları](#8-performans-optimizasyonları)
  - [Ek Özellikler](#9-ek-özellikler)
- [Öncelik Sırası](#-öncelik-sırası)

---

## 🎯 Teknoloji Yığını

- **Frontend:** React 18 + Vite + Tailwind CSS + Zustand (state management)
- **Backend:** Node.js + Express.js
- **Otomasyon:** Puppeteer (stealth plugin ile)
- **Resim İşleme:** Sharp (16:9 ölçekleme + WebP desteği)
- **Logging:** Winston
- **Validation:** Zod

---

## 📁 Proje Yapısı

```
meb-automation/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Queue/
│   │   │   │   ├── QueueList.jsx
│   │   │   │   ├── QueueItem.jsx
│   │   │   │   ├── DragDropZone.jsx
│   │   │   │   └── QueueControls.jsx
│   │   │   ├── Automation/
│   │   │   │   ├── AutomationControls.jsx
│   │   │   │   ├── ProgressBar.jsx
│   │   │   │   ├── StatusIndicator.jsx
│   │   │   │   └── ConfirmationModal.jsx
│   │   │   ├── Image/
│   │   │   │   ├── BannerUploader.jsx
│   │   │   │   ├── ImageCropper.jsx
│   │   │   │   └── ImagePreview.jsx
│   │   │   ├── Logs/
│   │   │   │   ├── LogPanel.jsx
│   │   │   │   └── LogFilter.jsx
│   │   │   ├── UI/
│   │   │   │   ├── ThemeToggle.jsx
│   │   │   │   ├── Toast.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   └── AnimatedBackground.jsx
│   │   │   └── Dashboard/
│   │   │       ├── Stats.jsx
│   │   │       └── RecentActivity.jsx
│   │   ├── store/
│   │   │   ├── queueStore.js
│   │   │   ├── automationStore.js
│   │   │   └── uiStore.js
│   │   ├── hooks/
│   │   │   ├── useQueue.js
│   │   │   ├── useAutomation.js
│   │   │   └── useSSE.js
│   │   ├── utils/
│   │   │   ├── validation.js
│   │   │   ├── fileHelpers.js
│   │   │   └── constants.js
│   │   └── App.jsx
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── puppeteer.config.js
│   │   │   ├── sharp.config.js
│   │   │   └── constants.js
│   │   ├── services/
│   │   │   ├── QueueManager.js
│   │   │   ├── AutomationEngine.js
│   │   │   ├── ImageProcessor.js
│   │   │   └── LogService.js
│   │   ├── controllers/
│   │   │   ├── queueController.js
│   │   │   ├── automationController.js
│   │   │   └── imageController.js
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   ├── validator.js
│   │   │   └── fileUpload.js
│   │   ├── utils/
│   │   │   ├── logger.js
│   │   │   ├── retry.js
│   │   │   └── helpers.js
│   │   ├── routes/
│   │   │   └── index.js
│   │   └── server.js
│   ├── data/
│   │   ├── queue/           (JSON dosyaları)
│   │   ├── manset/          (Görseller)
│   │   ├── processed/       (İşlenmiş içerikler)
│   │   └── failed/          (Başarısız olanlar)
│   ├── logs/
│   │   ├── app.log
│   │   ├── error.log
│   │   └── automation.log
│   └── package.json
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 🎯 Geliştirilmiş Özellikler

### 1. JSON Kuyruk Sistemi İyileştirmeleri

#### Eklenecek Özellikler:

- ✅ **Kuyruk durumunu JSON dosyasına kaydetme** - Uygulama kapansa bile kaldığı yerden devam
- ✅ **Otomatik yedekleme sistemi** - Her işlemden sonra backup
- ✅ **Başarısız işlemleri ayrı saklama** - "failed" klasöründe
- ✅ **Retry mekanizması** - Her öğe için 3 deneme hakkı
- ✅ **Toplu işlemler** - Seçili öğeleri sil/güncelle
- ✅ **Öncelik sistemi** - Acil içerikler önce işlensin
- ✅ **Kuyruk dışa aktarma/içe aktarma** - JSON/CSV formatında
- ✅ **İşlem geçmişi** - Tamamlanan içeriklerin kaydı
- ✅ **Duraklatma/Devam ettirme** - İşlemi istediğiniz yerde duraklatın
- ✅ **Belirli bir öğeyi atlama** - Sorunlu içeriği geç

#### Yeni Durum Kodları:

| Kod | Açıklama |
|-----|----------|
| `pending` | Bekliyor |
| `processing` | İşleniyor |
| `completed` | Tamamlandı |
| `failed` | Başarısız |
| `skipped` | Atlandı |
| `retrying` | Yeniden deneniyor |

#### Kuyruk Dosya Formatı:

```json
{
  "queue": [
    {
      "id": "queue-1737294123-abc123",
      "jsonData": { 
        "baslik": "Okulumuzda Bilim Şenliği",
        "aciklama": "5. sınıflar bilim şenliği düzenliyor",
        "etiketler": ["bilim", "etkinlik", "5.sınıf"],
        "kisaIcerik": "<p>Bu hafta...</p>",
        "icerik": "<p>Detaylı içerik...</p>"
      },
      "bannerPath": "./data/manset/haber-001.jpg",
      "status": "pending",
      "retryCount": 0,
      "maxRetries": 3,
      "priority": 0,
      "error": null,
      "addedAt": "2025-01-19T14:23:45.000Z",
      "processedAt": null,
      "processingTime": null
    }
  ],
  "failedItems": [],
  "metadata": {
    "lastUpdated": "2025-01-19T14:23:45.000Z",
    "totalProcessed": 15,
    "totalFailed": 2
  }
}
```

#### QueueManager Servisi Özellikleri:

```javascript
// Temel işlemler
- addToQueue(jsonData, bannerPath)     // Kuyruğa ekle
- removeFromQueue(id)                   // Kuyruktan çıkar
- reorderQueue(oldIndex, newIndex)      // Sıralama değiştir
- updateItem(id, updates)               // Öğe güncelle

// Toplu işlemler
- bulkDelete(itemIds)                   // Toplu silme
- bulkUpdate(itemIds, updates)          // Toplu güncelleme
- setPriority(itemId, priority)         // Öncelik ayarla

// Filtreleme ve arama
- getByStatus(status)                   // Duruma göre filtrele
- searchItems(query)                    // Başlıkta ara
- getStatistics()                       // İstatistik al

// Yedekleme ve geri yükleme
- saveQueue()                           // JSON'a kaydet
- loadQueue()                           // JSON'dan yükle
- backupQueue()                         // Yedek oluştur
- restoreBackup(backupFile)             // Yedekten geri yükle
- cleanOldBackups(days)                 // Eski yedekleri temizle

// Retry yönetimi
- retryFailed()                         // Başarısızları tekrar dene
- retryItem(id)                         // Tek öğe retry
- resetRetryCount(id)                   // Retry sayacını sıfırla
```

---

### 2. Manşet Resmi Yönetimi İyileştirmeleri

#### Eklenecek Özellikler:

- ✅ **Otomatik akıllı kırpma** - Yüz/nesne algılama ile önemli alanları koruyarak kırp
- ✅ **Çoklu format oluşturma** - JPEG (uyumluluk) + WebP (performans) + Thumbnail (önizleme)
- ✅ **Görsel önizleme** - Yükleme öncesi kırpma/düzenleme yapabilme
- ✅ **Toplu resim yükleme** - Birden fazla resmi aynı anda işle
- ✅ **Resim validasyonu** - Boyut, format, kalite kontrolü
- ✅ **EXIF verilerini temizleme** - Gizlilik için konum/cihaz bilgilerini sil
- ✅ **Otomatik optimizasyon** - Dosya boyutunu %30-50 küçült
- ✅ **Resim üzerine watermark** - Opsiyonel logo/telif hakkı ekleme
- ✅ **Sürükle-bırak ile kırpma** - Kullanıcı kırpma alanını seçebilir
- ✅ **Yedek resim önerisi** - Unsplash/Pexels API ile ilgili görseller

#### Desteklenen Formatlar:

| Tür | Formatlar |
|-----|-----------|
| **Input** | JPG, PNG, WebP, HEIC |
| **Output** | JPG (uyumluluk), WebP (performans), Thumbnail (önizleme) |

#### Resim İşleme Akışı:

```
1. Dosya Yükleme
   ↓
2. Validasyon (format, boyut, mime-type)
   ↓
3. Metadata Okuma
   ↓
4. Akıllı Kırpma (16:9)
   ↓
5. Çoklu Format Oluştur:
   - JPEG (1280x720, quality: 85)
   - WebP (1280x720, quality: 85)
   - Thumbnail (320x180, quality: 75)
   ↓
6. EXIF Temizleme
   ↓
7. Kaydetme (./data/manset/)
```

#### Resim Boyutları:

| Tür | Boyut | Kullanım |
|-----|-------|----------|
| **Ana Manşet** | 1280x720px (16:9) | MEB sitesine yüklenir |
| **WebP Versiyonu** | 1280x720px (16:9) | Modern tarayıcılar için |
| **Thumbnail** | 320x180px | Kuyruk önizlemesi için |

#### ImageProcessor Servisi Özellikleri:

```javascript
// Resim işleme
- processImage(file, fileName)          // Ana işleme fonksiyonu
- createJPEG(buffer, fileName)          // JPEG oluştur
- createWebP(buffer, fileName)          // WebP oluştur
- createThumbnail(buffer, fileName)     // Thumbnail oluştur

// Validasyon
- validateImage(metadata)               // Format ve boyut kontrolü
- checkDimensions(width, height)        // Boyut kontrolü
- checkFileSize(size)                   // Dosya boyutu kontrolü

// Düzenleme
- cropImage(buffer, x, y, width, height)  // Manuel kırpma
- smartCrop(buffer)                     // Akıllı kırpma (yüz algılama)
- addWatermark(buffer, watermarkPath)   // Watermark ekle
- stripMetadata(buffer)                 // EXIF verilerini sil

// Yardımcı
- deleteImage(fileName)                 // Tüm formatları sil
- getImageInfo(filePath)                // Resim bilgilerini al
```

---

### 3. Puppeteer Otomasyon İyileştirmeleri

#### A) Anti-Detection Özellikleri:

- ✅ **Puppeteer Stealth Plugin** - Bot tespitini engelle
- ✅ **User-Agent Rotasyonu** - Her oturumda farklı UA
- ✅ **Rastgele Gecikme** - İnsansı davranış simülasyonu (0.5-2 saniye)
- ✅ **Mouse Hareketleri** - Gerçekçi mouse yörüngesi
- ✅ **Klavye Simülasyonu** - Karakter karakter yazma

#### B) Hata Yönetimi:

- ✅ **Network Hatalarında Retry** - 3 deneme, exponential backoff
- ✅ **Timeout Yönetimi** - 30 saniye default, ayarlanabilir
- ✅ **Element Bulunamazsa Screenshot** - Debugging için
- ✅ **Her Adımda Loglama** - Detaylı işlem kaydı
- ✅ **Hata Durumunda Seçenek** - Durdur veya devam et

#### C) Kullanıcı Etkileşimi:

- ✅ **Kritik Noktalarda Onay** - Giriş, resim seçimi, gönderim
- ✅ **Manuel Müdahale İmkanı** - İşlem sırasında düzeltme yapabilme
- ✅ **Headful Mode** - Tarayıcı görünür olsun
- ✅ **Slow-Motion Mode** - Her adımı izlemek için (debugging)

#### D) Akıllı Bekleme:

- ✅ **Network Idle** - Tüm istekler tamamlanana kadar bekle
- ✅ **Dinamik Element Bekleme** - AJAX yüklenen elementler için
- ✅ **TinyMCE Hazır Olana Kadar Bekle** - Editör tamamen yüklensin

#### E) Session Yönetimi:

- ✅ **Browser Session Kaydetme** - Her seferinde giriş yapmaya gerek yok
- ✅ **Cookie Yönetimi** - Oturum bilgilerini sakla
- ✅ **LocalStorage Koruma** - Tarayıcı verilerini muhafaza et

#### F) Ek Özellikler:

- ✅ **Screenshot Alma** - Her işlem için otomatik
- ✅ **Video Kaydı** - Opsiyonel (debugging için)
- ✅ **İşlem Süresi Ölçümü** - Performance tracking
- ✅ **Network Trafiği Kaydı** - Debugging için

#### Otomasyon Akışı:

```
1. Tarayıcı Başlat (Headful Mode)
   ↓
2. Anti-Detection Ayarları Yap
   ↓
3. MEB MEBBİS'e Git
   ↓
4. Kullanıcı Girişi İçin Bekle
   [Kullanıcı Onayı]
   ↓
5. Okul Paneline Tıkla
   ↓
6. İçerik Sayfasına Git
   ↓
7. KUYRUK DÖNGÜSÜ:
   │
   ├─ Haberler Kategorisini Aç
   ├─ "İçerik Ekle" Butonu
   ├─ [Kullanıcı Onayı - Manşet Resmi]
   ├─ Formu Doldur:
   │  ├─ Başlık (BASLIK)
   │  ├─ Açıklama (ACIKLAMA)
   │  ├─ Etiketler (ANAHTAR_KELIMELER)
   │  ├─ Kısa İçerik (TinyMCE - KISAICERIK_ifr)
   │  └─ Detaylı İçerik (TinyMCE - ICERIK_ifr)
   ├─ [Kullanıcı Onayı - Gönderim]
   ├─ Formu Gönder
   ├─ Başarı Kontrolü
   ├─ Screenshot Al
   └─ Sonraki İçeriğe Geç
   ↓
8. Tüm Kuyruk Tamamlandı
   ↓
9. Tarayıcı Kapat (Opsiyonel)
```

#### AutomationEngine Servisi Özellikleri:

```javascript
// Ana kontroller
- start()                               // Otomasyonu başlat
- pause()                               // Duraklat
- resume()                              // Devam ettir
- stop()                                // Durdur
- skip()                                // Mevcut öğeyi atla

// Browser yönetimi
- initBrowser()                         // Tarayıcı başlat
- closeBrowser()                        // Tarayıcı kapat
- takeScreenshot(name)                  // Screenshot al
- startVideoRecording()                 // Video kaydı başlat

// İşlem akışı
- navigateAndWaitLogin()                // MEB'e git ve giriş bekle
- processQueue()                        // Kuyruk işleme
- processItem(item)                     // Tek öğe işle
- fillForm(data)                        // Form doldur

// Yardımcı fonksiyonlar
- retryWithBackoff(fn, retries)         // Retry mekanizması
- waitForSelector(selector, options)    // Element bekleme
- typeWithDelay(selector, text)         // İnsansı yazma
- clickWithDelay(selector)              // İnsansı tıklama
- waitForUserConfirmation(type)         // Kullanıcı onayı bekle

// Hata yönetimi
- handleError(error, item)              // Hata işleme
- recoverFromError()                    // Hata sonrası kurtarma
- logStep(message, level)               // Adım loglama
```

#### MEB Site Seçicileri:

```javascript
const selectors = {
  MEBBIS_URL: "https://mebbis.meb.gov.tr/",
  SCHOOL_PANEL_ID: "rptProjeler_ctl03_rptKullanicilar_ctl00_LinkButton1",
  CONTENT_LINK_ID: "icerik",
  HABERLER_XPATH: "//a[contains(@href, 'KATEGORINO=517471')]",
  ADD_CONTENT_XPATH: "//a[contains(@href, 'icerik_degistir.php')]",
  TITLE_INPUT_ID: "BASLIK",
  DESCRIPTION_ID: "ACIKLAMA",
  TAGS_ID: "ANAHTAR_KELIMELER",
  SHORT_CONTENT_IFRAME: "KISAICERIK_ifr",
  DETAILED_CONTENT_IFRAME: "ICERIK_ifr",
  SUBMIT_BUTTON_ID: "button",
  SUCCESS_MESSAGE_XPATH: "//div[contains(@class, 'success')]"
};
```

---

### 4. UI/UX İyileştirmeleri

#### Ana Sayfa Layout:

```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                      │
│  ┌──────────┐  MEB Otomasyon  [🌙 Tema]  [📊 Stats]       │
│  │   Logo   │                                               │
│  └──────────┘                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐  ┌─────────────────────────────┐ │
│  │                      │  │                             │ │
│  │   Kuyruk Listesi     │  │   Log Panel                 │ │
│  │   (Sol Panel)        │  │   (Sağ Panel)               │ │
│  │                      │  │                             │ │
│  │  📁 JSON Upload      │  │  ✓ [14:23] Başarılı        │ │
│  │  🖼️  Resim Upload    │  │  ⚠ [14:24] Uyarı           │ │
│  │                      │  │  ✗ [14:25] Hata            │ │
│  │  ┌────────────────┐  │  │  ℹ [14:26] Bilgi           │ │
│  │  │ Haber #1       │  │  │                             │ │
│  │  │ Pending ⋮      │  │  │  [Filtrele: Tümü ▼]        │ │
│  │  └────────────────┘  │  │  [Dışa Aktar]              │ │
│  │  ┌────────────────┐  │  │                             │ │
│  │  │ Haber #2       │  │  │  [Temizle]                 │ │
│  │  │ Processing ⋮   │  │  │                             │ │
│  │  └────────────────┘  │  │                             │ │
│  │  ┌────────────────┐  │  │                             │ │
│  │  │ Haber #3       │  │  │                             │ │
│  │  │ Completed ✓ ⋮  │  │  │                             │ │
│  │  └────────────────┘  │  │                             │ │
│  │                      │  │                             │ │
│  │  [Toplu İşlem ▼]    │  │                             │ │
│  │                      │  │                             │ │
│  └──────────────────────┘  └─────────────────────────────┘ │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  Otomasyon Kontrolleri                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [▶ Başlat]  [⏸ Duraklat]  [⏹ Durdur]  [⏭ Atla]   │  │
│  │                                                       │  │
│  │  İlerleme: ████████████████░░░░░░░░ 67% (2/3)       │  │
│  │                                                       │  │
│  │  Mevcut: "Okulumuzda Bilim Şenliği" - İşleniyor...  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### Glassmorphism Tasarım Özellikleri:

- ✅ **Yarı Saydam Kartlar** - `background: rgba(255, 255, 255, 0.1)`
- ✅ **Blur Efekti** - `backdrop-filter: blur(10px)`
- ✅ **Hafif Gölgeler** - `box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1)`
- ✅ **Yumuşak Border** - `border: 1px solid rgba(255, 255, 255, 0.18)`
- ✅ **Hover Animasyonları** - Transform & transition

#### Animasyonlar (Framer Motion):

```javascript
// Sayfa geçişleri
- Fade in/out
- Slide left/right
- Scale up/down

// Liste öğeleri
- Stagger animation (sıralı giriş)
- Exit animation (çıkış animasyonu)
- Reorder animation (sıralama değişimi)

// İlerleme çubuğu
- Pulse efekti
- Gradient animasyonu
- Smooth progress

// Toast bildirimleri
- Slide in from top/right
- Auto dismiss animation
- Stack multiple toasts
```

#### Dark/Light Tema:

| Özellik | Açıklama |
|---------|----------|
| **Sistem Tercihi** | Otomatik algılama (prefers-color-scheme) |
| **Smooth Geçiş** | 0.3s transition all |
| **CSS Variables** | Dinamik renk değişimi |
| **LocalStorage** | Tercih kaydetme |

**Renk Paleti:**

```css
/* Light Mode */
--bg-primary: #ffffff;
--bg-secondary: #f7f9fc;
--text-primary: #1a202c;
--text-secondary: #4a5568;
--accent: #3b82f6;

/* Dark Mode */
--bg-primary: #1a202c;
--bg-secondary: #2d3748;
--text-primary: #f7fafc;
--text-secondary: #cbd5e0;
--accent: #60a5fa;
```

#### Animasyonlu Arka Plan Seçenekleri:

1. **Gradient Mesh** - Hareketli renk geçişleri
2. **Particle System** - Yüzen parçacıklar
3. **Wave Effect** - Dalga animasyonu
4. **Geometric Patterns** - Geometrik şekiller
5. **None** - Düz renk (performans için)

#### Responsive Breakpoints:

```javascript
// Tailwind CSS breakpoints
sm: 640px   // Mobile
md: 768px   // Tablet
lg: 1024px  // Laptop
xl: 1280px  // Desktop
2xl: 1536px // Large Desktop
```

#### Klavye Kısayolları:

| Kısayol | Aksiyon |
|---------|---------|
| `Ctrl+N` | Yeni içerik ekle |
| `Ctrl+S` | Kuyruk kaydet |
| `Space` | Otomasyon başlat/duraklat |
| `Esc` | İşlemi durdur |
| `Delete` | Seçili öğeleri sil |
| `Ctrl+Z` | Geri al |
| `Ctrl+Shift+L` | Log panelini aç/kapat |
| `Ctrl+Shift+D` | Dark mode toggle |

---

### 5. Log Sistemi İyileştirmeleri

#### Log Seviyeleri:

| Seviye | İkon | Renk | Kullanım |
|--------|------|------|----------|
| `INFO` | ℹ | Mavi | Genel bilgi (işlem başladı, ilerleme) |
| `SUCCESS` | ✓ | Yeşil | Başarılı işlem (içerik yüklendi) |
| `WARNING` | ⚠ | Sarı | Uyarı (yavaş internet, retry) |
| `ERROR` | ✗ | Kırmızı | Hata (işlem başarısız) |
| `DEBUG` | 🔧 | Gri | Detaylı bilgi (geliştirme için) |

#### Log Özellikleri:

- ✅ **Real-time Güncelleme** - Server-Sent Events (SSE)
- ✅ **Seviyeye Göre Filtreleme** - Sadece hataları göster vb.
- ✅ **Zaman Damgası** - Her log için tarih/saat
- ✅ **Renk Kodlaması** - Görsel ayırt etme
- ✅ **Log Geçmişi** - Son 1000 kayıt
- ✅ **Dışa Aktarma** - TXT, JSON, CSV
- ✅ **Arama/Filtreleme** - Metin bazlı arama
- ✅ **Log Temizleme** - Tüm logları sil
- ✅ **Otomatik Scroll** - En son log görünsün
- ✅ **Dosyaya Kaydetme** - Günlük log dosyaları

#### Log Format Örneği:

```
[2025-01-19 14:23:45] [INFO] 🚀 Otomasyon başlatıldı
[2025-01-19 14:23:50] [INFO] 🌐 MEBBİS sayfası yüklendi
[2025-01-19 14:24:15] [SUCCESS] ✓ Giriş yapıldı
[2025-01-19 14:24:20] [INFO] 📋 Kuyrukta 5 içerik bulundu
[2025-01-19 14:24:25] [INFO] ▶️ İçerik işleniyor: "Okulumuzda Bilim Şenliği"
[2025-01-19 14:24:30] [WARNING] ⚠ Yavaş yanıt süresi: 3.2s
[2025-01-19 14:24:35] [SUCCESS] ✓ İçerik başarıyla yüklendi (5.2s)
[2025-01-19 14:24:40] [INFO] ▶️ İçerik işleniyor: "Kitap Okuma Yarışması"
[2025-01-19 14:24:45] [ERROR] ✗ Element bulunamadı: #SUBMIT_BUTTON
[2025-01-19 14:24:47] [INFO] 🔄 Retry yapılıyor (1/3)
[2025-01-19 14:24:52] [SUCCESS] ✓ Retry başarılı
[2025-01-19 14:25:00] [SUCCESS] 🎉 Tüm işlemler tamamlandı (3/3 başarılı)
```

#### Log Dosya Yapısı:

```
logs/
├── app.log              (Tüm loglar)
├── error.log            (Sadece hatalar)
├── automation.log       (Otomasyon logları)
├── 2025-01-19.log       (Günlük log)
└── archive/
    ├── 2025-01-18.log.gz
    └── 2025-01-17.log.gz
```

#### LogService Özellikleri:

```javascript
// Log yazma
- info(message, data)                   // Bilgi logu
- success(message, data)                // Başarı logu
- warning(message, data)                // Uyarı logu
- error(message, error, data)           // Hata logu
- debug(message, data)                  // Debug logu

// Log yönetimi
- getLogs(filter)                       // Log getir
- searchLogs(query)                     // Log ara
- filterByLevel(level)                  // Seviyeye göre filtrele
- exportLogs(format)                    // Dışa aktar (txt/json/csv)
- clearLogs()                           // Tüm logları temizle

// Dosya işlemleri
- writeToFile(message)                  // Dosyaya yaz
- rotateLogs()                          // Log rotasyonu
- archiveOldLogs(days)                  // Eski logları arşivle
```

#### SSE (Server-Sent Events) İmplementasyonu:

```javascript
// Backend
app.get('/api/logs/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Log gönderimi
  logEmitter.on('log', (log) => {
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  });
});

// Frontend
const eventSource = new EventSource('/api/logs/stream');
eventSource.onmessage = (event) => {
  const log = JSON.parse(event.data);
  addLogToUI(log);
};
```

---

### 6. API Endpoint İyileştirmeleri

#### Kuyruk İşlemleri:

```
POST   /api/queue                       - Kuyruk oluştur
GET    /api/queue                       - Tüm kuyruğu getir
GET    /api/queue/:id                   - Tek öğe detayı
PATCH  /api/queue/:id                   - Öğe güncelle
DELETE /api/queue/:id                   - Öğe sil
POST   /api/queue/reorder               - Sıralamayı değiştir
POST   /api/queue/:id/retry             - Tekrar dene
POST   /api/queue/bulk-delete           - Toplu sil
GET    /api/queue/export                - Dışa aktar (JSON/CSV)
POST   /api/queue/import                - İçe aktar
GET    /api/queue/backup                - Yedek al
POST   /api/queue/restore               - Yedekten geri yükle
GET    /api/queue/statistics            - İstatistik
```

#### Otomasyon Kontrolleri:

```
POST   /api/automation/start            - Başlat
POST   /api/automation/pause            - Duraklat
POST   /api/automation/resume           - Devam ettir
POST   /api/automation/stop             - Durdur
POST   /api/automation/skip             - Mevcut öğeyi atla
GET    /api/automation/status           - Durum bilgisi
POST   /api/automation/confirm          - Kullanıcı onayı
GET    /api/automation/stats            - İstatistikler
```

#### Resim İşlemleri:

```
POST   /api/image/upload                - Resim yükle
POST   /api/image/process               - İşle (crop, resize)
GET    /api/image/:id/preview           - Önizleme
DELETE /api/image/:id                   - Resim sil
POST   /api/image/bulk-upload           - Toplu yükle
POST   /api/image/crop                  - Manuel kırpma
POST   /api/image/watermark             - Watermark ekle
```

#### Log ve İstatistik:

```
GET    /api/logs/stream                 - SSE log stream
GET    /api/logs/history                - Geçmiş loglar
POST   /api/logs/search                 - Log ara
GET    /api/logs/export                 - Log dışa aktar (txt/json/csv)
DELETE /api/logs                        - Logları temizle
GET    /api/stats/summary               - Özet istatistik
GET    /api/stats/daily                 - Günlük rapor
GET    /api/stats/weekly                - Haftalık rapor
```

#### API Response Formatı:

```json
// Başarılı
{
  "success": true,
  "data": { ... },
  "message": "İşlem başarılı",
  "timestamp": "2025-01-19T14:23:45.000Z"
}

// Hata
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Başlık alanı zorunludur",
    "details": { "field": "baslik" }
  },
  "timestamp": "2025-01-19T14:23:45.000Z"
}
```

---

### 7. Validation ve Güvenlik

#### JSON Validation (Zod):

```javascript
// İçerik şeması
const ContentSchema = z.object({
  baslik: z.string().min(1).max(200),
  aciklama: z.string().max(500).optional(),
  etiketler: z.array(z.string()).max(5).optional(),
  kisaIcerik: z.string().max(1000),
  icerik: z.string(),
  yayinTarihi: z.string().datetime().optional()
});

// Validasyon kullanımı
const validateContent = (data) => {
  try {
    ContentSchema.parse(data);
    return { valid: true };
  } catch (error) {
    return { valid: false, errors: error.errors };
  }
};
```

#### Dosya Güvenliği:

- ✅ **Mime-Type Kontrolü** - Sadece resim formatları kabul et
- ✅ **Dosya Boyutu Limiti** - Max 10MB
- ✅ **Uzantı Whitelist** - jpg, jpeg, png, webp
- ✅ **Magic Number Kontrolü** - Gerçek dosya tipi doğrulama
- ✅ **Malicious Dosya Tarama** - Zararlı içerik kontrolü
- ✅ **Sandbox Depolama** - Yüklenen dosyaları izole et

#### Rate Limiting:

```javascript
// Express rate limiter
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 dakika
  max: 30,                     // Max 30 istek
  message: 'Çok fazla istek gönderildi'
});

// Dosya yükleme limiti
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,                     // Max 10 dosya/dakika
  skipSuccessfulRequests: true
});
```

#### Error Handling:

```javascript
// Merkezi hata yakalayıcı
app.use((error, req, res, next) => {
  // Log hata
  logger.error(error.message, { stack: error.stack });
  
  // Kullanıcıya anlaşılır mesaj
  const userMessage = getErrorMessage(error.code);
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      code: error.code,
      message: userMessage
    }
  });
});

// Hata tipleri
const ErrorTypes = {
  VALIDATION_ERROR: 'Veri doğrulama hatası',
  FILE_TOO_LARGE: 'Dosya çok büyük (max 10MB)',
  INVALID_FORMAT: 'Geçersiz dosya formatı',
  NETWORK_ERROR: 'Ağ bağlantı hatası',
  TIMEOUT: 'İşlem zaman aşımına uğradı',
  ELEMENT_NOT_FOUND: 'Sayfa öğesi bulunamadı'
};
```

#### Input Sanitization:

```javascript
// XSS koruması
const sanitizeHtml = require('sanitize-html');

const cleanContent = (html) => {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'b', 'i', 'u', 'strong', 'em', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: {}
  });
};

// SQL Injection koruması (kullanmıyoruz ama örnek)
// Parameterized queries kullan

// Path Traversal koruması
const sanitizePath = (filename) => {
  return path.basename(filename); // Sadece dosya adı, yol yok
};
```

---

### 8. Performans Optimizasyonları

#### Backend Optimizasyonları:

**Resim İşleme:**
```javascript
// Paralel işleme
const processImages = async (files) => {
  return Promise.all(
    files.map(file => imageProcessor.processImage(file))
  );
};

// Stream kullanımı (büyük dosyalar)
const fs = require('fs');
const stream = fs.createReadStream(largefile);
stream.pipe(sharp()).pipe(fs.createWriteStream(output));
```

**Memory Management:**
```javascript
// Event listener cleanup
process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});

// Garbage collection
if (global.gc) {
  setInterval(() => {
    global.gc();
  }, 60000); // Her dakika
}
```

**Graceful Shutdown:**
```javascript
// İşlem bitene kadar bekle
process.on('SIGTERM', async () => {
  logger.info('SIGTERM alındı, işlemler tamamlanıyor...');
  
  await automationEngine.stop();
  await queueManager.saveQueue();
  
  server.close(() => {
    logger.info('Server kapatıldı');
    process.exit(0);
  });
});
```

#### Frontend Optimizasyonları:

**Lazy Loading:**
```javascript
// React lazy loading
const Dashboard = lazy(() => import('./components/Dashboard'));
const LogPanel = lazy(() => import('./components/Logs/LogPanel'));

// Kuyruk 100+ öğe olunca
{queue.length > 100 ? <VirtualList /> : <RegularList />}
```

**Virtualization:**
```javascript
// react-window ile
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={queue.length}
  itemSize={80}
>
  {QueueItem}
</FixedSizeList>
```

**Debounce/Throttle:**
```javascript
// Arama için debounce
const debouncedSearch = useMemo(
  () => debounce((query) => searchQueue(query), 300),
  []
);

// Scroll için throttle
const throttledScroll = useMemo(
  () => throttle((e) => handleScroll(e), 100),
  []
);
```

**Memoization:**
```javascript
// React.memo
const QueueItem = React.memo(({ item }) => {
  // Component
}, (prevProps, nextProps) => {
  return prevProps.item.id === nextProps.item.id;
});

// useMemo
const sortedQueue = useMemo(() => {
  return queue.sort((a, b) => a.priority - b.priority);
}, [queue]);

// useCallback
const handleDelete = useCallback((id) => {
  deleteItem(id);
}, []);
```

**Code Splitting:**
```javascript
// Vite route-based splitting
const routes = [
  {
    path: '/',
    component: lazy(() => import('./pages/Home'))
  },
  {
    path: '/dashboard',
    component: lazy(() => import('./pages/Dashboard'))
  }
];
```

#### Puppeteer Optimizasyonları:

**Resource Blocking:**
```javascript
// Gereksiz kaynakları blokla
await page.setRequestInterception(true);

page.on('request', (request) => {
  const resourceType = request.resourceType();
  
  // Gereksiz kaynaklar
  if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
    request.abort();
  } else {
    request.continue();
  }
});
```

**Page Pool:**
```javascript
// Sayfaları yeniden kullan
class PagePool {
  constructor(size = 3) {
    this.pages = [];
    this.size = size;
  }
  
  async getPage() {
    if (this.pages.length > 0) {
      return this.pages.pop();
    }
    return await browser.newPage();
  }
  
  releasePage(page) {
    if (this.pages.length < this.size) {
      this.pages.push(page);
    } else {
      page.close();
    }
  }
}
```

**Paralel İşlem:**
```javascript
// Aynı anda 2-3 içerik işle
const processBatch = async (items, batchSize = 2) => {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(item => processItem(item)));
  }
};
```

---

### 9. Ek Özellikler

#### Dashboard İstatistikleri:

```javascript
// Ana metrikler
{
  totalProcessed: 156,          // Toplam işlenen
  successRate: 94.2,            // Başarı oranı (%)
  avgProcessingTime: 4.8,       // Ortalama süre (saniye)
  todayProcessed: 12,           // Bugün işlenen
  failedCount: 9,               // Başarısız
  queueCount: 5                 // Kuyrukta bekleyen
}

// Grafik verileri
last7Days: [
  { date: '2025-01-13', count: 18, success: 17, failed: 1 },
  { date: '2025-01-14', count: 22, success: 20, failed: 2 },
  // ...
]

// En çok kullanılan şablonlar
topTemplates: [
  { type: 'haber', count: 89 },
  { type: 'duyuru', count: 45 },
  { type: 'etkinlik', count: 22 }
]

// Hata dağılımı
errorTypes: {
  'TIMEOUT': 3,
  'ELEMENT_NOT_FOUND': 4,
  'NETWORK_ERROR': 2
}
```

#### Bildirim Sistemi:

**Tarayıcı Bildirimleri:**
```javascript
// İzin iste
Notification.requestPermission();

// Bildirim gönder
const notify = (title, body) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/logo.png'
    });
  }
};

// Örnek kullanım
notify('İşlem Tamamlandı', '3 içerik başarıyla yüklendi');
```

**Ses Efektleri:**
```javascript
// Ses dosyaları
const sounds = {
  success: new Audio('/sounds/success.mp3'),
  error: new Audio('/sounds/error.mp3'),
  notify: new Audio('/sounds/notify.mp3')
};

// Çal
const playSound = (type) => {
  if (settings.soundEnabled) {
    sounds[type].play();
  }
};
```

**Toast Mesajları:**
```javascript
// react-hot-toast kullanımı
import toast from 'react-hot-toast';

// Başarı
toast.success('İçerik yüklendi!');

// Hata
toast.error('Bir hata oluştu');

// Özel
toast.custom((t) => (
  <div className={`${t.visible ? 'animate-enter' : 'animate-leave'}`}>
    {/* Custom toast */}
  </div>
));
```

#### Yedekleme Sistemi:

```javascript
// Otomatik yedekleme
cron.schedule('0 */2 * * *', () => {  // Her 2 saatte
  queueManager.backupQueue();
  logger.info('Otomatik yedek alındı');
});

// Manuel yedekleme
const createBackup = () => {
  const timestamp = new Date().toISOString();
  const backupData = {
    queue: queueManager.queue,
    settings: getSettings(),
    timestamp
  };
  
  fs.writeFileSync(
    `./data/queue/manual-backup-${timestamp}.json`,
    JSON.stringify(backupData, null, 2)
  );
};

// Yedek geri yükleme
const restoreBackup = (backupFile) => {
  const data = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
  queueManager.queue = data.queue;
  saveSettings(data.settings);
  queueManager.saveQueue();
};

// Eski yedekleri temizle
const cleanOldBackups = (days = 30) => {
  const files = fs.readdirSync('./data/queue/');
  const now = Date.now();
  
  files.forEach(file => {
    if (file.includes('backup-')) {
      const stats = fs.statSync(`./data/queue/${file}`);
      const ageInDays = (now - stats.mtime) / (1000 * 60 * 60 * 24);
      
      if (ageInDays > days) {
        fs.unlinkSync(`./data/queue/${file}`);
      }
    }
  });
};
```

#### Dışa Aktarma:

**Kuyruk Export:**
```javascript
// JSON
const exportQueueJSON = () => {
  const data = {
    queue: queueManager.queue,
    metadata: {
      exportDate: new Date().toISOString(),
      totalItems: queueManager.queue.length
    }
  };
  return JSON.stringify(data, null, 2);
};

// CSV
const exportQueueCSV = () => {
  const headers = ['ID', 'Başlık', 'Durum', 'Tarih'];
  const rows = queueManager.queue.map(item => [
    item.id,
    item.jsonData.baslik,
    item.status,
    item.addedAt
  ]);
  
  return [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
};
```

**Log Export:**
```javascript
// TXT
const exportLogsTXT = (logs) => {
  return logs
    .map(log => `[${log.timestamp}] [${log.level}] ${log.message}`)
    .join('\n');
};

// JSON
const exportLogsJSON = (logs) => {
  return JSON.stringify({
    logs,
    exportDate: new Date().toISOString(),
    totalLogs: logs.length
  }, null, 2);
};

// CSV
const exportLogsCSV = (logs) => {
  const headers = ['Timestamp', 'Level', 'Message'];
  const rows = logs.map(log => [
    log.timestamp,
    log.level,
    log.message.replace(/,/g, ';') // CSV escape
  ]);
  
  return [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
};
```

**İstatistik Export:**
```javascript
// Excel (XLSX)
const XLSX = require('xlsx');

const exportStatsExcel = (stats) => {
  const wb = XLSX.utils.book_new();
  
  // Özet sayfa
  const summaryWs = XLSX.utils.json_to_sheet([stats.summary]);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Özet');
  
  // Günlük veriler
  const dailyWs = XLSX.utils.json_to_sheet(stats.daily);
  XLSX.utils.book_append_sheet(wb, dailyWs, 'Günlük');
  
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};
```

#### Import/Export Ayarları:

```javascript
// Ayarları dışa aktar
const exportSettings = () => {
  return JSON.stringify({
    theme: settings.theme,
    soundEnabled: settings.soundEnabled,
    notifications: settings.notifications,
    autoBackup: settings.autoBackup,
    retryCount: settings.retryCount
  }, null, 2);
};

// Ayarları içe aktar
const importSettings = (jsonString) => {
  const imported = JSON.parse(jsonString);
  Object.assign(settings, imported);
  saveSettings();
};
```

---

## 📊 Öncelik Sırası

### 🔴 Kritik (Hemen Yapılması Gerekenler):

1. **Kuyruk Kaydetme/Yükleme Sistemi**
   - JSON dosyasına kaydetme
   - Uygulama açılışta yükleme
   - Otomatik kaydetme

2. **Retry Mekanizması**
   - 3 deneme hakkı
   - Exponential backoff
   - Hata loglama

3. **Temel Hata Yönetimi**
   - Try-catch blokları
   - Hata mesajları
   - Error boundaries (React)

4. **Resim Validasyonu**
   - Format kontrolü
   - Boyut kontrolü
   - Mime-type kontrolü

5. **Puppeteer Stealth Plugin**
   - Bot tespitini engelleme
   - Anti-detection ayarları

6. **Kullanıcı Onay Sistemi**
   - Giriş onayı
   - Resim yükleme onayı
   - Form gönderme onayı

### 🟡 Yüksek (1-2 Hafta İçinde):

7. **Duraklat/Devam Ettir Özelliği**
   - Pause/Resume butonları
   - Durum yönetimi

8. **Log Filtreleme ve Export**
   - Seviyeye göre filtreleme
   - TXT/JSON/CSV export

9. **Çoklu Format Resim (WebP)**
   - JPEG + WebP + Thumbnail
   - Otomatik optimizasyon

10. **İstatistik Dashboard**
    - Temel metrikler
    - Grafik gösterimi

11. **Yedekleme Sistemi**
    - Otomatik yedekleme
    - Manuel yedek alma
    - Geri yükleme

12. **SSE Log Streaming**
    - Real-time log güncellemeleri
    - Server-Sent Events

### 🟢 Orta (İsteğe Bağlı / Sonra):

13. **Dark/Light Tema**
    - Tema toggle
    - Sistem tercihi algılama

14. **Klavye Kısayolları**
    - Temel kısayollar
    - Özelleştirilebilir

15. **Tarayıcı Bildirimleri**
    - İşlem tamamlandı bildirimi
    - Ses efektleri

16. **Gelişmiş Animasyonlar**
    - Framer Motion
    - Smooth transitions

17. **Toplu İşlemler**
    - Çoklu seçim
    - Toplu silme/güncelleme

18. **Akıllı Resim Kırpma**
    - Yüz algılama
    - Manuel kırpma arayüzü

### ⚪ Düşük (Çok Sonra / Opsiyonel):

19. **Video Kaydı**
    - Otomasyon kaydı
    - Debugging için

20. **Performans İyileştirmeleri**
    - Lazy loading
    - Virtualization
    - Code splitting

21. **Watermark Ekleme**
    - Logo ekleme
    - Telif hakkı

22. **Yedek Resim Önerisi**
    - Unsplash/Pexels API
    - Otomatik resim bulma

23. **Excel Export**
    - İstatistikleri XLSX olarak
    - Gelişmiş raporlama

24. **Multi-Language**
    - Türkçe/İngilizce
    - i18n desteği

---

## 🎯 Geliştirme Yol Haritası

### Faz 1: Temel Altyapı (1 Hafta)
- [ ] Proje yapısını oluştur
- [ ] Backend temel konfigürasyon
- [ ] Frontend iskelet (React + Vite + Tailwind)
- [ ] Kuyruk kaydetme/yükleme sistemi
- [ ] Temel API endpoints

### Faz 2: Core Features (2 Hafta)
- [ ] Resim işleme servisi (Sharp)
- [ ] Puppeteer temel otomasyon
- [ ] Retry mekanizması
- [ ] Hata yönetimi
- [ ] Kullanıcı onay sistemi
- [ ] Temel UI bileşenleri

### Faz 3: Gelişmiş Özellikler (2 Hafta)
- [ ] Log sistemi (Winston + SSE)
- [ ] Dashboard ve istatistikler
- [ ] Duraklat/Devam ettir
- [ ] Yedekleme sistemi
- [ ] Dark/Light tema
- [ ] Toast bildirimleri

### Faz 4: Polish ve Optimizasyon (1 Hafta)
- [ ] UI/UX iyileştirmeleri
- [ ] Animasyonlar
- [ ] Performans optimizasyonu
- [ ] Hata düzeltmeleri
- [ ] Dokümantasyon
- [ ] Test

---

## 📦 Gerekli Paketler

### Backend:
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "puppeteer": "^21.0.0",
    "puppeteer-extra": "^3.3.6",
    "puppeteer-extra-plugin-stealth": "^2.11.2",
    "sharp": "^0.33.0",
    "winston": "^3.11.0",
    "zod": "^3.22.4",
    "multer": "^1.4.5-lts.1",
    "express-rate-limit": "^7.1.5",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### Frontend:
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.7",
    "framer-motion": "^10.16.16",
    "react-hot-toast": "^2.4.1",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "axios": "^1.6.2"
  },
  "devDependencies": {
    "vite": "^5.0.8",
    "tailwindcss": "^3.4.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

---

## 🚀 Kurulum ve Çalıştırma

### Backend:
```bash
cd backend
npm install
npm run dev
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
```

### Production:
```bash
# Backend
npm start

# Frontend
npm run build
npm run preview
```

---

## 📝 Notlar

- **Veritabanı YOK** - Tüm veriler JSON dosyalarında saklanır
- **Kullanıcı Girişi YOK** - Tek kullanıcılı sistem
- **MEB Giriş Bilgileri** - Kullanıcı manuel giriş yapar (güvenlik için)
- **Session Yönetimi** - Puppeteer browser-data klasöründe session saklar
- **Yedekleme Önemli** - Düzenli yedek almayı unutmayın

---

## ⚠️ Önemli Uyarılar

1. **MEB Sitesi Değişiklikleri**: MEB sitesi güncellenirse seçiciler değişebilir
2. **Rate Limiting**: Çok hızlı yükleme yapmayın, spam olarak algılanabilir
3. **Tarayıcı Session**: Browser-data klasörünü yedekleyin
4. **Log Dosyaları**: Düzenli temizleyin, çok büyüyebilir
5. **Resim Boyutları**: Çok büyük resimler RAM tüketebilir

---

## 🎉 Başarılar!

Bu plan ile profesyonel, güvenilir ve kullanıcı dostu bir MEB içerik otomasyon sistemi oluşturabilirsiniz!
