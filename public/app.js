'use strict';

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  cat: 'all',
  search: '',
  page: 1,
  view: 'news',       // 'news' | 'bookmarks'
  savedIds: new Set(),
  searchTimer: null,
};

// item cache: id → item object (avoids putting JSON in HTML attributes)
const itemMap = new Map();

// ── Helpers ────────────────────────────────────────────────────────────────
const $  = id => document.getElementById(id);
const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff)) return '';
  const m = Math.floor(diff / 6e4);
  const h = Math.floor(diff / 36e5);
  const d = Math.floor(diff / 864e5);
  if (m < 1)  return 'เมื่อกี้';
  if (m < 60) return `${m} นาทีที่แล้ว`;
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
  if (d < 7)  return `${d} วันที่แล้ว`;
  return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

const CAT_LABELS = {
  thai: 'หุ้นไทย',
  international: 'ต่างประเทศ',
  tech: 'เทคโนโลยี',
  funds: 'กองทุน',
  bonds: 'พันธบัตร',
  crypto: 'คริปโต',
};

// ── Toast ──────────────────────────────────────────────────────────────────
let _toastTimer;
function showToast(msg, type = '') {
  const el = $('toast');
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// ── Card rendering ─────────────────────────────────────────────────────────
function buildCard(item) {
  itemMap.set(item.id, item);
  const saved = state.savedIds.has(item.id);
  const catLabel = CAT_LABELS[item.category] ?? item.category;

  const imgHtml = item.image
    ? `<img class="card-img" src="${esc(item.image)}" alt="" loading="lazy" onerror="this.style.display='none'">`
    : '';

  return `
<article class="card">
  ${imgHtml}
  <div class="card-body">
    <div class="card-meta">
      <span class="source-name">${esc(item.source)}</span>
      <span class="cat-pill ${esc(item.category)}">${esc(catLabel)}</span>
      <span class="card-time">${timeAgo(item.pubDate)}</span>
    </div>
    <a class="card-title" href="${esc(item.link)}" target="_blank" rel="noopener noreferrer">${esc(item.title)}</a>
    ${item.summary ? `<p class="card-summary">${esc(item.summary)}</p>` : ''}
    <div class="card-footer">
      <a class="read-more" href="${esc(item.link)}" target="_blank" rel="noopener noreferrer">อ่านต่อ →</a>
      <button class="bm-btn ${saved ? 'saved' : ''}" data-id="${esc(item.id)}" title="${saved ? 'ยกเลิกบุ๊กมาร์ก' : 'บุ๊กมาร์ก'}">
        <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      </button>
    </div>
  </div>
</article>`;
}

// ── Pagination ─────────────────────────────────────────────────────────────
function renderPagination(current, total) {
  const el = $('pagination');
  if (total <= 1) { el.innerHTML = ''; return; }

  const btns = [];
  const add = (label, page, cls = '') =>
    btns.push(`<button class="pg-btn ${cls}" onclick="goPage(${page})" ${page === current && !cls ? 'disabled' : ''}>${label}</button>`);
  const ellipsis = () => btns.push(`<span class="pg-ellipsis">…</span>`);

  add('‹', current - 1, current === 1 ? '' : '');
  btns[0] = `<button class="pg-btn" onclick="goPage(${current - 1})" ${current === 1 ? 'disabled' : ''}>‹</button>`;

  const lo = Math.max(1, current - 2);
  const hi = Math.min(total, current + 2);

  if (lo > 1) { add('1', 1); if (lo > 2) ellipsis(); }
  for (let p = lo; p <= hi; p++) {
    btns.push(`<button class="pg-btn ${p === current ? 'active' : ''}" onclick="goPage(${p})">${p}</button>`);
  }
  if (hi < total) { if (hi < total - 1) ellipsis(); add(String(total), total); }

  btns.push(`<button class="pg-btn" onclick="goPage(${current + 1})" ${current === total ? 'disabled' : ''}>›</button>`);

  el.innerHTML = btns.join('');
}

window.goPage = function(p) {
  state.page = p;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadNews();
};

// ── Load news ──────────────────────────────────────────────────────────────
async function loadNews() {
  if (state.view === 'bookmarks') { loadBookmarks(); return; }

  const grid  = $('news-grid');
  const loader = $('loader');
  const empty  = $('empty');

  grid.innerHTML = '';
  loader.classList.remove('hidden');
  empty.classList.add('hidden');
  $('pagination').innerHTML = '';

  const params = new URLSearchParams({
    category: state.cat,
    search:   state.search,
    page:     state.page,
    limit:    24,
  });

  try {
    const res  = await fetch(`/api/news?${params}`);
    const data = await res.json();
    loader.classList.add('hidden');

    const updated = data.lastUpdated
      ? `อัปเดต ${timeAgo(data.lastUpdated)}`
      : '';
    $('stats-bar').textContent = `${data.total.toLocaleString()} ข่าว · ${updated}`;

    if (!data.items.length) {
      empty.classList.remove('hidden');
      $('empty-msg').textContent = 'ไม่พบข่าวที่ค้นหา';
      return;
    }

    grid.innerHTML = data.items.map(buildCard).join('');
    renderPagination(data.page, data.pages);
  } catch {
    loader.classList.add('hidden');
    $('stats-bar').textContent = 'เกิดข้อผิดพลาด — กรุณาลองใหม่';
  }
}

// ── Load bookmarks ─────────────────────────────────────────────────────────
async function loadBookmarks() {
  const grid  = $('news-grid');
  const empty  = $('empty');
  $('loader').classList.add('hidden');
  $('pagination').innerHTML = '';

  try {
    const res   = await fetch('/api/bookmarks');
    const items = await res.json();

    $('stats-bar').textContent = `${items.length} บุ๊กมาร์ก`;

    if (!items.length) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      $('empty-msg').textContent = 'ยังไม่มีบุ๊กมาร์ก — กดไอคอน 🔖 ที่ข่าวเพื่อบันทึก';
      return;
    }

    empty.classList.add('hidden');
    grid.innerHTML = items.map(buildCard).join('');
  } catch {
    $('stats-bar').textContent = 'โหลดบุ๊กมาร์กไม่สำเร็จ';
  }
}

// ── Bookmark count ─────────────────────────────────────────────────────────
async function syncBookmarkCount() {
  try {
    const res   = await fetch('/api/bookmarks');
    const items = await res.json();
    state.savedIds = new Set(items.map(i => i.id));
    $('bm-count').textContent = items.length;
  } catch {}
}

// ── Toggle bookmark ────────────────────────────────────────────────────────
async function toggleBookmark(btn) {
  const id   = btn.dataset.id;
  const item = itemMap.get(id);
  if (!item) return;

  const isSaved = state.savedIds.has(id);

  if (isSaved) {
    await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' });
    state.savedIds.delete(id);
    btn.classList.remove('saved');
    btn.title = 'บุ๊กมาร์ก';
    showToast('ลบออกจากบุ๊กมาร์กแล้ว', 'removed');
  } else {
    await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    state.savedIds.add(id);
    btn.classList.add('saved');
    btn.title = 'ยกเลิกบุ๊กมาร์ก';
    showToast('บันทึกบุ๊กมาร์กแล้ว ✓', 'saved');
  }

  $('bm-count').textContent = state.savedIds.size;
}

// ── Events ─────────────────────────────────────────────────────────────────
document.getElementById('tab-bar').addEventListener('click', e => {
  const tab = e.target.closest('.tab');
  if (!tab) return;

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');

  const cat = tab.dataset.cat;
  if (cat === 'bookmarks') {
    state.view = 'bookmarks';
  } else {
    state.view = 'news';
    state.cat  = cat;
    state.page = 1;
  }
  loadNews();
});

document.getElementById('news-grid').addEventListener('click', e => {
  const btn = e.target.closest('.bm-btn');
  if (!btn) return;
  e.preventDefault();
  toggleBookmark(btn);
});

document.getElementById('search-input').addEventListener('input', e => {
  clearTimeout(state.searchTimer);
  state.searchTimer = setTimeout(() => {
    state.search = e.target.value.trim();
    state.page   = 1;
    loadNews();
  }, 380);
});

document.getElementById('refresh-btn').addEventListener('click', async () => {
  const btn = $('refresh-btn');
  btn.classList.add('loading');
  btn.disabled = true;
  try {
    await fetch('/api/refresh', { method: 'POST' });
    await loadNews();
    showToast('รีเฟรชข่าวสำเร็จ ✓');
  } catch {
    showToast('รีเฟรชไม่สำเร็จ');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
});

// ── AI Summary ───────────────────────────────────────────────────────────
// แปลง Markdown แบบง่าย (เฉพาะที่ต้องใช้) เป็น HTML ที่ปลอดภัย
function renderMarkdown(md) {
  const lines = esc(md).split('\n');
  let html = '';
  let inList = false;
  const inline = s => s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  for (let line of lines) {
    const t = line.trim();
    if (/^[-*•]\s+/.test(t)) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${inline(t.replace(/^[-*•]\s+/, ''))}</li>`;
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      if (/^#{1,3}\s+/.test(t)) {
        html += `<h3>${inline(t.replace(/^#{1,3}\s+/, ''))}</h3>`;
      } else if (t) {
        html += `<p>${inline(t)}</p>`;
      }
    }
  }
  if (inList) html += '</ul>';
  return html;
}

function catLabel() {
  return state.view === 'bookmarks' ? 'ทั้งหมด' : (CAT_LABELS[state.cat] ?? 'ทั้งหมด');
}

async function generateSummary() {
  const btn   = $('ai-btn');
  const panel = $('ai-panel');
  const body  = $('ai-panel-body');
  const meta  = $('ai-meta');

  const category = state.view === 'bookmarks' ? 'all' : state.cat;

  panel.classList.remove('hidden');
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  btn.classList.add('loading');
  btn.disabled = true;
  meta.textContent = `· หมวด${catLabel()}`;
  body.innerHTML = `<div class="ai-loading"><div class="spinner" style="width:18px;height:18px;border-width:2px"></div><span>AI กำลังอ่านและสรุปข่าว...</span></div>`;

  try {
    const res  = await fetch(`/api/summary?category=${encodeURIComponent(category)}`);
    const data = await res.json();

    if (!res.ok) {
      body.innerHTML = `<p class="ai-error">⚠ ${esc(data.error || 'สรุปข่าวไม่สำเร็จ')}</p>`;
      return;
    }

    const when = data.cached ? 'จากแคช' : `อัปเดต ${timeAgo(data.generatedAt)}`;
    meta.textContent = `· หมวด${catLabel()} · จาก ${data.basedOn} ข่าว · ${when}`;
    body.innerHTML = renderMarkdown(data.text) +
      `<p class="ai-disclaimer">✨ สรุปโดย Gemini AI จากพาดหัวข่าว — เป็นข้อมูลประกอบ ไม่ใช่คำแนะนำการลงทุน โปรดตรวจสอบจากแหล่งข่าวต้นทางก่อนตัดสินใจ</p>`;
  } catch {
    body.innerHTML = `<p class="ai-error">⚠ เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่</p>`;
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

const SUMMARY_CAT_LABEL = { all: 'ภาพรวมทั้งหมด', ...CAT_LABELS };

function formatThaiDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  const label = date.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  if (sameDay(date, today)) return `วันนี้ · ${label}`;
  if (sameDay(date, yest)) return `เมื่อวาน · ${label}`;
  return label;
}

async function showHistory() {
  const panel = $('ai-panel');
  const body  = $('ai-panel-body');
  const meta  = $('ai-meta');
  const histBtn = $('ai-history-btn');

  panel.classList.remove('hidden');
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  histBtn.classList.add('active');
  meta.textContent = '· คลังสรุปย้อนหลัง';
  body.innerHTML = `<div class="ai-loading"><div class="spinner" style="width:18px;height:18px;border-width:2px"></div><span>กำลังโหลดประวัติ...</span></div>`;

  try {
    const res  = await fetch('/api/summary/history');
    const data = await res.json();

    if (!data.days?.length) {
      body.innerHTML = `<p class="hist-empty">ยังไม่มีสรุปที่บันทึกไว้ — กด "สรุปข่าว AI" เพื่อสร้างอันแรก</p>`;
      return;
    }

    body.innerHTML = data.days.map(day => `
      <div class="hist-day">
        <div class="hist-date">${esc(formatThaiDate(day.date))}</div>
        ${day.summaries.map(s => {
          const label = SUMMARY_CAT_LABEL[s.category] ?? s.category;
          const time = new Date(s.generatedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
          return `
          <div class="hist-item">
            <div class="hist-item-head">
              <span class="hist-arrow">▶</span>
              <span class="cat-pill ${esc(s.category)}">${esc(label)}</span>
              <span class="hist-item-time">${esc(time)} น. · ${s.basedOn} ข่าว</span>
            </div>
            <div class="hist-item-body collapsed">${renderMarkdown(s.text)}</div>
          </div>`;
        }).join('')}
      </div>`).join('');
  } catch {
    body.innerHTML = `<p class="ai-error">⚠ โหลดประวัติไม่สำเร็จ</p>`;
  }
}

document.getElementById('ai-btn').addEventListener('click', () => {
  $('ai-history-btn').classList.remove('active');
  generateSummary();
});
document.getElementById('ai-history-btn').addEventListener('click', showHistory);
document.getElementById('ai-close').addEventListener('click', () => {
  $('ai-panel').classList.add('hidden');
  $('ai-history-btn').classList.remove('active');
});

// ขยาย/ย่อรายการในประวัติ
document.getElementById('ai-panel-body').addEventListener('click', e => {
  const head = e.target.closest('.hist-item-head');
  if (!head) return;
  const item = head.parentElement;
  item.classList.toggle('open');
  item.querySelector('.hist-item-body').classList.toggle('collapsed');
});

document.getElementById('theme-btn').addEventListener('click', () => {
  const html  = document.documentElement;
  const theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
  html.dataset.theme = theme;
  localStorage.setItem('theme', theme);
});

// ── Init ───────────────────────────────────────────────────────────────────
(function init() {
  const theme = localStorage.getItem('theme') ?? 'dark';
  document.documentElement.dataset.theme = theme;

  syncBookmarkCount();
  loadNews();
})();
