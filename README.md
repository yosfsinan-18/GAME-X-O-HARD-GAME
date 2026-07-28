# Sonic VIP Store

ماڵپەڕی بڵاوکردنەوەی فایلە IPAکانی PUBG MOBILE — بە زمانی کوردی/عەرەبی، RTL.

## ✨ تایبەتمەندیەکان

- 🎮 لیستی وەشانەکان (KR, VNG, TW, Global, BGMI, Lite)
- 🔐 پانێڵی بەڕێوەبردن بە پاسوۆرد (`/admin.html`)
- 📦 بارکردنی فایلی IPA ڕاستەوخۆ (تا 4 GB)
- 💾 هەموو زانیاری لە یەک فایلدا (`data/releases.json`)
- 📱 ڕەسپۆنسیڤ (مۆبایل + کۆمپیوتەر)
- 🌙 Dark theme بە ڕەنگی بنەفشی/سەوزی شین

## 🚀 جێگیرکردن (Installation)

پێویستی بە **Node.js 18+** هەیە.

```bash
# 1) دامەزراندنی پاکێجەکان
npm install

# 2) دەستپێکردنی سێرڤەر
node server.js
```

سێرڤەرەکە لە پۆرتی **5000** کاردەکات (یان `PORT` ی ژینگەی بنێ).

دواتر بکەرەوە:
- ماڵپەڕ: <http://localhost:5000>
- پانێڵی ئەدمین: <http://localhost:5000/admin.html>

## 🔑 پاسوۆردی ئەدمین

پاسوۆردی بنەڕەتی: **`sonic2026`**

دەتوانیت بیگۆڕیت لە دوو ڕێگەوە:
1. لە پانێڵی ئەدمین → دوگمەی «گۆڕینی وشەی نهێنی»
2. یاخود بە ژینگەی سیستەم پێش دەستپێکردن:
   ```bash
   ADMIN_PASSWORD="my_new_password" node server.js
   ```

## 📁 پێکهاتەی پەڕگەکان

```
sonic-vip-store/
├── server.js            # سێرڤەری Express + بارکردنی فایل
├── package.json
├── index.html           # ماڵپەڕی سەرەکی
├── admin.html           # پانێڵی بەڕێوەبردن
├── style.css / script.js
├── admin.css / admin.js
├── assets/              # وێنەکان (logo, sonic.png)
├── data/
│   ├── releases.json    # هەموو وەشانەکان
│   └── config.json      # پاسوۆردی گۆڕاو (خۆکار دروست دەبێت)
└── downloads/           # فایلە بارکراوەکان (IPA)
```

## 🌐 جێگیرکردنی لەسەر سێرڤەری خۆت (VPS / Hostinger / DigitalOcean)

```bash
# 1) ZIPـەکە دابچێنە سەر سێرڤەرەکە و بیکەرەوە
unzip sonic-vip-store.zip -d /var/www/sonic-vip
cd /var/www/sonic-vip

# 2) دامەزراندنی پاکێجەکان
npm install --production

# 3) لەگەڵ pm2 (پێشنیاردراو)
npm install -g pm2
PORT=3000 ADMIN_PASSWORD="پاسوۆردی_خۆت" pm2 start server.js --name sonic-vip
pm2 save
pm2 startup
```

دواتر Nginx ڕێکبخە بۆ بەستنەوەی دۆماینەکەت بۆ پۆرتی 3000:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 5G;   # بۆ بارکردنی IPA گەورە

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

دواتر SSL زیاد بکە بە Let's Encrypt:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 📨 پەیوەندی

- چەناڵی تەلیگرام: <https://t.me/sonic_vip01>
- پەیوەندی ڕاستەوخۆ: <https://t.me/pg_7amaa>
