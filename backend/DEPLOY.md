# Railway Deployment Rehberi

## Ön Gereksinimler

1. [Railway hesabı](https://railway.app/)
2. GitHub hesabı (repo Railway'e bağlanacak)
3. Railway CLI (opsiyonel)

## Önemli Not ⚠️

Bu backend **Puppeteer** kullanmaktadır. Railway'de Puppeteer çalıştırılabilir ancak:
- **Headless mod zorunludur** (production ortamında)
- Chromium bağımlılıkları otomatik kurulacak (nixpacks.toml)
- Kaynak limitleri nedeniyle performans kısıtlamaları olabilir

## Deployment Adımları

### 1. GitHub'a Push Et

```bash
cd backend
git add .
git commit -m "Railway deployment config eklendi"
git push origin main
```

### 2. Railway'de Yeni Proje Oluştur

1. [Railway Dashboard](https://railway.app/dashboard) açın
2. "New Project" → "Deploy from GitHub repo" seçin
3. Bu repoyu seçin
4. **Root Directory** olarak `backend` klasörünü belirtin

### 3. Environment Variables Ayarla

Railway dashboard'da şu değişkenleri ekleyin:

| Variable | Değer |
|----------|-------|
| `PORT` | 3001 (veya Railway'in atadığı) |
| `NODE_ENV` | production |
| `HEADLESS` | true |
| `FRONTEND_URL` | Frontend URL'iniz (örn: https://your-frontend.vercel.app) |
| `PUPPETEER_EXECUTABLE_PATH` | /usr/bin/chromium-browser |

### 4. Domain Ayarla

1. Railway dashboard'da projenizi açın
2. Settings → Networking → Generate Domain
3. Oluşturulan URL'i frontend'de kullanın

## Sorun Giderme

### Puppeteer Hataları

Eğer Chromium bulunamıyor hatası alırsanız:

1. `PUPPETEER_EXECUTABLE_PATH` değişkenini kontrol edin
2. Railway'in Chromium'u bulabilmesi için `nixpacks.toml` doğru yapılandırılmış olmalı

### Memory Limit

Railway free tier'da 512MB RAM limiti var. Puppeteer çok fazla memory kullanırsa:

1. Pro plana geçmeyi düşünün
2. Veya Puppeteer işlemlerini optimize edin

## Alternatif: Docker ile Deploy

Eğer Nixpacks çalışmazsa, Dockerfile kullanabilirsiniz:

```dockerfile
FROM ghcr.io/puppeteer/puppeteer:21.0.0

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

EXPOSE 3001
CMD ["node", "src/server.js"]
```

## Test Etme

Deploy sonrası şu URL'i kontrol edin:
```
https://your-railway-url.railway.app/health
```

Başarılı response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": ...
}
```
