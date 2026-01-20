# MEB İçerik Otomasyon Sistemi

MEB okul web sitesine içerik yüklemeyi otomatikleştiren kapsamlı bir sistem.

## 🚀 Hızlı Başlangıç

### Backend
```bash
cd backend
npm install
npm run dev
```
Backend http://localhost:3001'de çalışacak.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend http://localhost:5173'te açılacak.

## 📋 Özellikler

- **JSON Kuyruk Sistemi**: Sürükle-bırak ile içerik yükleme
- **Resim İşleme**: 16:9 otomatik kırpma ve optimizasyon
- **Puppeteer Otomasyon**: MEB sitesine otomatik içerik yükleme
- **Gerçek Zamanlı Loglar**: SSE ile canlı log izleme
- **Glassmorphism UI**: Modern ve şık arayüz
- **Dark/Light Tema**: Sistem tercihine göre otomatik tema

## 🔧 Teknolojiler

- **Frontend**: React 18 + Vite + Tailwind CSS + Zustand
- **Backend**: Node.js + Express.js
- **Otomasyon**: Puppeteer + Stealth Plugin
- **Resim**: Sharp

## 📁 Klasör Yapısı

```
meb-automation/
├── frontend/          # React frontend
├── backend/           # Node.js backend
│   ├── src/
│   │   ├── config/    # Ayar dosyaları
│   │   ├── services/  # İş mantığı
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── routes/
│   └── data/
│       ├── queue/     # JSON kuyruk dosyaları
│       └── manset/    # İşlenmiş resimler
└── README.md
```

## ⚠️ Notlar

- Puppeteer headful modda çalışır (tarayıcı görünür)
- Giriş işlemi manuel yapılmalıdır
- Session bilgileri `browser-data` klasöründe saklanır
