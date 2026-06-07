# Yoklama Sistemi

Dernek üyeleri için tablet/telefon uyumlu yoklama ve imza uygulaması.

## Railway'e Deploy

### 1. GitHub Repo Oluştur
```bash
git init
git add .
git commit -m "ilk commit"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADI/yoklama.git
git push -u origin main
```

### 2. Railway'de Yeni Proje Aç
- railway.app → New Project → Deploy from GitHub repo
- Repo'yu seç

### 3. PostgreSQL Ekle
- Railway dashboard → Add Service → Database → PostgreSQL
- `DATABASE_URL` otomatik olarak env'e eklenir

### 4. Environment Variables Ekle
Railway dashboard → Variables:
```
APP_PASSWORD = senin_sifren
```

### 5. Domain Al
Railway → Settings → Networking → Generate Domain

---

## Telefon/Tablette Uygulama Olarak Kullan

Bağlantıyı aldıktan sonra:

**iPhone/iPad:** Safari → Paylaş (□↑) → Ana Ekrana Ekle  
**Android:** Chrome → ⋮ → Ana ekrana ekle

Tam ekran, ikon ile açılır — uygulama gibi çalışır.

---

## Lokal Geliştirme

```bash
# Terminal 1 - Backend
npm install
node server/index.js

# Terminal 2 - Frontend
cd client
npm install
npm start
```
