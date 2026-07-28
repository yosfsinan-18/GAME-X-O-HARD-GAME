const express = require('express');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data', 'releases.json');
const DOWNLOADS_DIR = path.join(ROOT, 'downloads');
const CONFIG_FILE = path.join(ROOT, 'data', 'config.json');

const PORT = process.env.PORT || 5000;
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || 'sonic2026';

fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ stats: {}, releases: [] }, null, 2));
}

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

function getPassword() {
  const cfg = loadConfig();
  return cfg.adminPassword || DEFAULT_PASSWORD;
}

function setPassword(pw) {
  const cfg = loadConfig();
  cfg.adminPassword = pw;
  saveConfig(cfg);
}

function loadReleases() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return { stats: {}, releases: [] };
  }
}

function saveReleases(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const SESSIONS = new Set();
function makeToken() {
  return crypto.randomBytes(32).toString('hex');
}

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

function authRequired(req, res, next) {
  const token = req.cookies.sonic_token || req.headers['x-auth-token'];
  if (!token || !SESSIONS.has(token)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DOWNLOADS_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]+/g, '_');
    const stamp = Date.now().toString(36);
    cb(null, `${stamp}_${safe}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 * 1024 }
});

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body || {};
  if (password !== getPassword()) {
    return res.status(401).json({ error: 'invalid password' });
  }
  const token = makeToken();
  SESSIONS.add(token);
  res.cookie('sonic_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  res.json({ ok: true, token });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.cookies.sonic_token;
  if (token) SESSIONS.delete(token);
  res.clearCookie('sonic_token');
  res.json({ ok: true });
});

app.get('/api/auth/check', (req, res) => {
  const token = req.cookies.sonic_token;
  res.json({ authenticated: !!(token && SESSIONS.has(token)) });
});

app.post('/api/auth/password', authRequired, (req, res) => {
  const { password } = req.body || {};
  if (!password || password.length < 4) {
    return res.status(400).json({ error: 'password too short' });
  }
  setPassword(password);
  SESSIONS.clear();
  res.clearCookie('sonic_token');
  res.json({ ok: true });
});

app.get('/api/releases', (req, res) => {
  res.json(loadReleases());
});

app.post('/api/releases', authRequired, (req, res) => {
  const item = req.body || {};
  if (!item.title || !item.region || !item.version || !item.file) {
    return res.status(400).json({ error: 'missing fields' });
  }
  const data = loadReleases();
  if (!item.id) {
    const base = `${item.title}-${item.region}-${item.version}`
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let id = base, n = 1;
    while (data.releases.some(r => r.id === id)) id = `${base}-${++n}`;
    item.id = id;
  }
  const idx = data.releases.findIndex(r => r.id === item.id);
  if (idx > -1) data.releases[idx] = item;
  else data.releases.unshift(item);
  saveReleases(data);
  res.json({ ok: true, item });
});

app.delete('/api/releases/:id', authRequired, (req, res) => {
  const data = loadReleases();
  const item = data.releases.find(r => r.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'not found' });

  if (item.file && item.file.startsWith('downloads/')) {
    const fp = path.join(ROOT, item.file);
    if (fs.existsSync(fp) && fp.startsWith(DOWNLOADS_DIR)) {
      try { fs.unlinkSync(fp); } catch {}
    }
  }
  data.releases = data.releases.filter(r => r.id !== req.params.id);
  saveReleases(data);
  res.json({ ok: true });
});

app.put('/api/stats', authRequired, (req, res) => {
  const data = loadReleases();
  data.stats = req.body || {};
  saveReleases(data);
  res.json({ ok: true, stats: data.stats });
});

app.post('/api/upload', authRequired, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  const relPath = `downloads/${req.file.filename}`;
  const sizeMB = req.file.size / (1024 * 1024);
  const sizeStr = sizeMB > 1024
    ? `${(sizeMB / 1024).toFixed(2)} GB`
    : `${sizeMB.toFixed(1)} MB`;
  res.json({
    ok: true,
    file: relPath,
    originalName: req.file.originalname,
    size: req.file.size,
    sizeStr
  });
});

app.get('/api/files', authRequired, async (req, res) => {
  try {
    const files = await fsp.readdir(DOWNLOADS_DIR);
    const out = [];
    for (const f of files) {
      if (f === 'README.txt') continue;
      const full = path.join(DOWNLOADS_DIR, f);
      const st = await fsp.stat(full);
      if (st.isFile()) {
        out.push({
          name: f,
          path: `downloads/${f}`,
          size: st.size,
          mtime: st.mtimeMs
        });
      }
    }
    out.sort((a, b) => b.mtime - a.mtime);
    res.json({ files: out });
  } catch (e) {
    res.json({ files: [] });
  }
});

app.delete('/api/files/:name', authRequired, (req, res) => {
  const name = req.params.name;
  const fp = path.join(DOWNLOADS_DIR, name);
  if (!fp.startsWith(DOWNLOADS_DIR + path.sep)) {
    return res.status(400).json({ error: 'invalid path' });
  }
  if (fs.existsSync(fp)) {
    try { fs.unlinkSync(fp); } catch (e) { return res.status(500).json({ error: 'delete failed' }); }
  }
  res.json({ ok: true });
});

app.get('/downloads/:name', (req, res) => {
  const name = req.params.name;
  const fp = path.join(DOWNLOADS_DIR, name);
  if (!fp.startsWith(DOWNLOADS_DIR + path.sep) || !fs.existsSync(fp)) {
    return res.status(404).send('Not found');
  }
  res.download(fp);
});

app.use(express.static(ROOT, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('releases.json')) {
      res.setHeader('Cache-Control', 'no-store');
    }
  }
}));

app.use((err, req, res, next) => {
  console.error(err);
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'file too large' });
  }
  res.status(500).json({ error: err.message || 'server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Sonic VIP server running on http://0.0.0.0:${PORT}`);
});
