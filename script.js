const REGION_LABELS = {
  KR: 'KR',
  VNG: 'VNG',
  TW: 'TW',
  GLOBAL: 'GLOBAL',
  BGMI: 'BGMI',
  LITE: 'LITE'
};

const TG_CHANNEL = 'https://t.me/sonic_vip01';

const state = {
  data: null,
  region: 'ALL',
  query: ''
};

const els = {
  cards: document.getElementById('cards'),
  empty: document.getElementById('empty'),
  filters: document.getElementById('filters'),
  search: document.getElementById('search'),
  toast: document.getElementById('toast'),
  heroStats: document.getElementById('heroStats'),
  tpl: document.getElementById('cardTpl')
};

async function loadData() {
  try {
    const res = await fetch('/api/releases', { cache: 'no-store' });
    if (!res.ok) throw new Error('fetch failed');
    state.data = await res.json();
  } catch (e) {
    try {
      const res2 = await fetch('data/releases.json', { cache: 'no-store' });
      state.data = await res2.json();
    } catch {
      state.data = { stats: {}, releases: [] };
    }
  }
  renderStats();
  render();
}

function renderStats() {
  const s = state.data.stats || {};
  const items = [
    { v: s.downloads || '—', l: 'دابەزاندن' },
    { v: s.users || '—', l: 'بەکارهێنەر' },
    { v: (s.rating ? `★ ${s.rating}` : '—'), l: 'هەڵسەنگاندن' }
  ];
  els.heroStats.innerHTML = items.map(i => `<li><b>${i.v}</b><span>${i.l}</span></li>`).join('');
}

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('ar', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return iso; }
}

function buildCard(r) {
  const node = els.tpl.content.firstElementChild.cloneNode(true);
  if (r.featured) node.classList.add('featured');

  node.querySelector('.title').textContent = r.title;
  node.querySelector('.subtitle').textContent = r.subtitle || '';
  node.querySelector('.desc').textContent = r.description || '';
  node.querySelector('.version').textContent = 'v' + r.version;
  node.querySelector('.size').textContent = r.size;
  node.querySelector('.ios').textContent = r.ios || 'iOS 13+';
  node.querySelector('.date').textContent = fmtDate(r.date);

  const badge = node.querySelector('.region-badge');
  badge.textContent = REGION_LABELS[r.region] || r.region;
  badge.classList.add(r.region.toLowerCase());

  const tagsEl = node.querySelector('.tags');
  (r.tags || []).forEach(t => {
    const s = document.createElement('span');
    s.className = 'tag';
    if (t === 'Featured') s.classList.add('featured');
    if (t === 'نوێ') s.classList.add('new');
    s.textContent = t;
    tagsEl.appendChild(s);
  });

  const dl = node.querySelector('.dl');
  dl.href = r.file;
  dl.setAttribute('download', '');
  dl.addEventListener('click', (e) => {
    showToast(`دەستپێکردنی دابەزاندنی ${r.title} v${r.version}`);
    fetch(r.file, { method: 'HEAD' })
      .then(res => {
        if (!res.ok) {
          e.preventDefault();
          showToast('فایلەکە هێشتا بارنەکراوە. تکایە پەیوەندی بکە بە چەناڵەکە.');
          setTimeout(() => window.open(TG_CHANNEL, '_blank', 'noopener'), 800);
        }
      })
      .catch(() => {});
  });

  const tg = node.querySelector('.tg');
  tg.href = TG_CHANNEL;

  return node;
}

function render() {
  const { data, region, query } = state;
  const releases = (data?.releases || []).filter(r => {
    if (region !== 'ALL' && r.region !== region) return false;
    if (query) {
      const q = query.toLowerCase();
      const hay = `${r.title} ${r.subtitle || ''} ${r.region} ${r.version}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  els.cards.querySelectorAll('.card').forEach(n => n.remove());
  els.empty.hidden = releases.length > 0;

  releases.forEach(r => els.cards.appendChild(buildCard(r)));
}

function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => els.toast.classList.remove('show'), 2600);
}

els.filters.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  els.filters.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  state.region = chip.dataset.region;
  render();
});

els.search.addEventListener('input', (e) => {
  state.query = e.target.value.trim();
  render();
});

document.addEventListener('DOMContentLoaded', loadData);
