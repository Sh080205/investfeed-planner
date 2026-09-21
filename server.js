'use strict';
const express = require('express');
const RSSParser = require('rss-parser');
const cron = require('node-cron');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

// โหลด API key จากไฟล์ .env (ถ้ามี) เข้า process.env แบบง่าย ๆ ไม่ต้องพึ่ง dotenv
(function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env');
    const raw = fsSync.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch { /* ไม่มี .env ก็ไม่เป็นไร */ }
})();

const app = express();
const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash'; // ฟรี เร็ว ภาษาไทยดี — เปลี่ยนเป็น gemini-2.5-flash ได้

const parser = new RSSParser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

const DATA_DIR = path.join(__dirname, 'data');
const BOOKMARKS_FILE = path.join(DATA_DIR, 'bookmarks.json');
const CACHE_FILE = path.join(DATA_DIR, 'cache.json');
const SUMMARIES_FILE = path.join(DATA_DIR, 'summaries.json');
const ARCHIVE_DAYS = 30; // เก็บคลังสรุปย้อนหลังกี่วัน

const FEEDS = [
  // ข่าวไทย
  { id: 'bangkokpost-biz', name: 'Bangkok Post', url: 'https://www.bangkokpost.com/rss/data/business.xml', category: 'thai' },
  { id: 'thestandard', name: 'The Standard', url: 'https://thestandard.co/feed/', category: 'thai' },
  { id: 'positioning', name: 'Positioning', url: 'https://positioningmag.com/feed/', category: 'thai' },
  // ข่าวต่างประเทศ
  { id: 'reuters', name: 'Reuters', url: 'https://feeds.reuters.com/reuters/businessNews', category: 'international' },
  { id: 'cnbc-top', name: 'CNBC', url: 'https://www.cnbc.com/id/10001147/device/rss/rss.html', category: 'international' },
  { id: 'marketwatch', name: 'MarketWatch', url: 'http://feeds.marketwatch.com/marketwatch/topstories', category: 'international' },
  { id: 'yahoo-finance', name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex', category: 'international' },
  // เทคโนโลยี (หุ้นเทค)
  { id: 'techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'tech' },
  { id: 'theverge', name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'tech' },
  { id: 'wired', name: 'Wired Business', url: 'https://www.wired.com/feed/category/business/latest/rss', category: 'tech' },
  // กองทุน
  { id: 'etftrends', name: 'ETF Trends', url: 'https://www.etftrends.com/feed/', category: 'funds' },
  { id: 'seekingalpha-etf', name: 'Seeking Alpha ETF', url: 'https://seekingalpha.com/tag/etfs/feed.xml', category: 'funds' },
  // พันธบัตร / ตราสารหนี้
  { id: 'reuters-bonds', name: 'Reuters Fixed Income', url: 'https://feeds.reuters.com/reuters/bondsNews', category: 'bonds' },
  { id: 'cnbc-bonds', name: 'CNBC Bonds', url: 'https://www.cnbc.com/id/20910258/device/rss/rss.html', category: 'bonds' },
  // คริปโต
  { id: 'coindesk', name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', category: 'crypto' },
  { id: 'cointelegraph', name: 'Cointelegraph', url: 'https://cointelegraph.com/rss', category: 'crypto' },
  { id: 'decrypt', name: 'Decrypt', url: 'https://decrypt.co/feed', category: 'crypto' },
];

let cache = { items: [], lastUpdated: null, feedStatus: {} };
let bookmarks = [];
let summaryCache = {}; // { [category]: { text, generatedAt, basedOn } } — แคชชั่วคราว ล้างเมื่อข่าวรีเฟรช
let summaryArchive = {}; // { [date]: { [category]: result } } — คลังถาวร เก็บย้อนหลังตามวัน

async function init() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    bookmarks = JSON.parse(await fs.readFile(BOOKMARKS_FILE, 'utf8'));
  } catch {
    bookmarks = [];
  }

  try {
    summaryArchive = JSON.parse(await fs.readFile(SUMMARIES_FILE, 'utf8'));
  } catch {
    summaryArchive = {};
  }

  try {
    const saved = JSON.parse(await fs.readFile(CACHE_FILE, 'utf8'));
    const age = Date.now() - new Date(saved.lastUpdated || 0).getTime();
    cache = saved;
    if (age > 30 * 60 * 1000) refreshFeeds();
  } catch {
    await refreshFeeds();
  }
}

function extractImage(item) {
  if (item.mediaContent) {
    const url = item.mediaContent?.['$']?.url || item.mediaContent?.url;
    if (url && /^https?:\/\//.test(url)) return url;
  }
  if (item.mediaThumbnail) {
    const url = item.mediaThumbnail?.['$']?.url || item.mediaThumbnail?.url;
    if (url && /^https?:\/\//.test(url)) return url;
  }
  if (item.enclosure?.url && /^https?:\/\//.test(item.enclosure.url)) {
    return item.enclosure.url;
  }
  const html = item.contentEncoded || item.content || '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match && /^https?:\/\//.test(match[1]) ? match[1] : null;
}

async function parseFeed(feed) {
  const result = await parser.parseURL(feed.url);
  return result.items.slice(0, 25).map(item => {
    const link = item.link || item.guid || '';
    if (!/^https?:\/\//.test(link)) return null;

    const id = crypto.createHash('md5').update(link + (item.title || '')).digest('hex');
    const rawSummary = item.contentSnippet || item.summary || '';
    const summary = rawSummary.replace(/<[^>]*>/g, '').trim().substring(0, 300);

    return {
      id,
      feedId: feed.id,
      source: feed.name,
      category: feed.category,
      title: (item.title || '').replace(/<[^>]*>/g, '').trim(),
      link,
      summary,
      pubDate: item.isoDate || item.pubDate || new Date().toISOString(),
      image: extractImage(item),
    };
  }).filter(Boolean).filter(i => i.title);
}

async function refreshFeeds() {
  console.log('[Feeds] Refreshing all RSS feeds...');
  const results = await Promise.allSettled(FEEDS.map(async feed => {
    try {
      const items = await parseFeed(feed);
      cache.feedStatus[feed.id] = { ok: true, count: items.length, name: feed.name };
      return items;
    } catch (err) {
      console.error(`[Feeds] ${feed.name}: ${err.message}`);
      cache.feedStatus[feed.id] = { ok: false, error: err.message, name: feed.name };
      return [];
    }
  }));

  const seen = new Set();
  const allItems = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  cache.items = allItems;
  cache.lastUpdated = new Date().toISOString();
  summaryCache = {}; // ข่าวเปลี่ยน → ล้างสรุปเก่าให้สร้างใหม่ตามรอบ

  await fs.writeFile(CACHE_FILE, JSON.stringify(cache));
  const ok = Object.values(cache.feedStatus).filter(s => s.ok).length;
  console.log(`[Feeds] Done: ${allItems.length} items · ${ok}/${FEEDS.length} feeds OK`);
}

app.use(express.json({ limit: '10mb' })); // backup ของ planner ทั้งก้อนใหญ่กว่า default 100kb
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Planner (Mission Log v3) ----------
// เสิร์ฟแอป planner (ไฟล์ build ไฟล์เดียว) ที่ /planner — รวมสองแอปใน server เดียว
// ถ้าแก้โค้ด planner ให้รัน "npm run build:planner" แล้วรีเฟรชหน้า
const PLANNER_DIST = path.join(__dirname, 'planner', 'dist', 'index.html');
app.get('/planner', (req, res) => {
  if (!fsSync.existsSync(PLANNER_DIST)) {
    return res
      .status(503)
      .send('ยังไม่มีไฟล์ build ของ planner — รัน "npm run build:planner" ในโฟลเดอร์โปรเจกต์ก่อน แล้วรีเฟรชหน้านี้');
  }
  res.sendFile(PLANNER_DIST);
});
app.get('/planner/migrate-helper.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'planner', 'migrate-helper.html'));
});

// ---------- Backup ข้อมูล planner (เรียกจากแอปตอนอัปเกรด schema) ----------
// ข้อมูลจริงอยู่ใน localStorage ของเบราว์เซอร์ — แอปส่งสำเนาก่อนอัปเกรดมาให้เขียนลงดิสก์
// ชื่อไฟล์ server เป็นคนตั้ง (ไม่รับชื่อจาก client) และไม่เขียนทับไฟล์เดิม
const BACKUP_DIR = path.join(__dirname, 'backup');
app.post('/api/backup', async (req, res) => {
  const data = req.body && req.body.data;
  if (!data || typeof data !== 'object' || !Array.isArray(data.sections)) {
    return res.status(400).json({ error: 'ไม่ใช่ข้อมูล planner' });
  }
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    const day = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
    let name = `mission_log_backup_${day}.json`;
    for (let n = 2; fsSync.existsSync(path.join(BACKUP_DIR, name)); n++) {
      name = `mission_log_backup_${day}-${n}.json`;
    }
    await fs.writeFile(path.join(BACKUP_DIR, name), JSON.stringify(data, null, 2));
    console.log('[Backup] planner →', name);
    res.json({ file: name });
  } catch (err) {
    res.status(500).json({ error: 'เขียน backup ไม่สำเร็จ: ' + err.message });
  }
});

// ---------- Book Library (ชั้นหนังสือ) ----------
// เสิร์ฟไฟล์หนังสือ/สไลด์จากโฟลเดอร์ Reseach skill — เปลี่ยนที่เก็บได้ด้วย BOOKS_DIR ใน .env
const BOOKS_DIR = process.env.BOOKS_DIR || 'C:\\Users\\Public\\Documents\\Reseach skill';
const BOOK_EXTS = new Set(['.pdf', '.pptx', '.ppt', '.epub', '.docx']);

// รายชื่อไฟล์ทั้งหมด (เดินโฟลเดอร์ recursive) — client ดึงไปแสดงเป็นชั้นหนังสือ
app.get('/api/books', async (req, res) => {
  async function walk(dir, rel) {
    let out = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(dir, e.name);
      const relPath = rel ? rel + '/' + e.name : e.name;
      if (e.isDirectory()) {
        out = out.concat(await walk(abs, relPath));
      } else if (BOOK_EXTS.has(path.extname(e.name).toLowerCase())) {
        const st = await fs.stat(abs);
        out.push({
          name: e.name,
          path: relPath,
          folder: rel, // '' = ไฟล์ที่อยู่ root ของโฟลเดอร์หนังสือ
          sizeMB: +(st.size / 1048576).toFixed(1),
          ext: path.extname(e.name).slice(1).toLowerCase(),
        });
      }
    }
    return out;
  }
  try {
    res.json({ dir: BOOKS_DIR, books: await walk(BOOKS_DIR, '') });
  } catch (err) {
    res.status(500).json({ error: 'อ่านโฟลเดอร์หนังสือไม่ได้: ' + err.message });
  }
});

// ตัวไฟล์จริง — browser เปิด PDF ในแท็บได้เลย ไฟล์อื่นจะเป็นดาวน์โหลด
app.use('/books', express.static(BOOKS_DIR));

app.get('/api/news', (req, res) => {
  const { category = 'all', search = '', page = '1', limit = '24' } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 24));

  let items = cache.items;
  if (category !== 'all') items = items.filter(i => i.category === category);

  if (search.trim()) {
    const q = search.toLowerCase();
    items = items.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.summary.toLowerCase().includes(q) ||
      i.source.toLowerCase().includes(q)
    );
  }

  const total = items.length;
  const start = (pageNum - 1) * limitNum;

  res.json({
    items: items.slice(start, start + limitNum),
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    lastUpdated: cache.lastUpdated,
    feedStatus: cache.feedStatus,
  });
});

app.post('/api/refresh', async (req, res) => {
  try {
    await refreshFeeds();
    res.json({ success: true, count: cache.items.length, lastUpdated: cache.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// วันที่ตามเวลาไทย รูปแบบ YYYY-MM-DD
function todayKeyTH() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
}

// บันทึกสรุปลงคลังถาวร (เก็บล่าสุดต่อหมวดต่อวัน) + ตัดของเก่าเกิน ARCHIVE_DAYS
async function archiveSummary(result) {
  const day = todayKeyTH();
  if (!summaryArchive[day]) summaryArchive[day] = {};
  summaryArchive[day][result.category] = result;

  const days = Object.keys(summaryArchive).sort().reverse();
  for (const d of days.slice(ARCHIVE_DAYS)) delete summaryArchive[d];

  try {
    await fs.writeFile(SUMMARIES_FILE, JSON.stringify(summaryArchive, null, 2));
  } catch (err) {
    console.error('[Summary] บันทึกคลังไม่สำเร็จ:', err.message);
  }
}

const CAT_NAMES = {
  all: 'ภาพรวมทั้งหมด',
  thai: 'หุ้นและการลงทุนไทย',
  international: 'ตลาดต่างประเทศ',
  tech: 'หุ้นเทคโนโลยี',
  funds: 'กองทุนและ ETF',
  bonds: 'พันธบัตรและตราสารหนี้',
  crypto: 'คริปโตเคอร์เรนซี',
};

app.get('/api/summary', async (req, res) => {
  const category = req.query.category || 'all';

  if (!GEMINI_API_KEY) {
    return res.status(503).json({
      error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY — รับ key ฟรีที่ https://aistudio.google.com/apikey แล้วสร้างไฟล์ .env ใส่ GEMINI_API_KEY=... จากนั้นรีสตาร์ท server',
    });
  }

  // ใช้สรุปที่ cache ไว้ถ้ามี (ล้างทุกครั้งที่ข่าวรีเฟรช)
  if (summaryCache[category]) {
    return res.json({ ...summaryCache[category], cached: true });
  }

  let items = cache.items;
  if (category !== 'all') items = items.filter(i => i.category === category);
  items = items.slice(0, 18);

  if (!items.length) {
    return res.status(404).json({ error: 'ยังไม่มีข่าวให้สรุปในหมวดนี้' });
  }

  const headlines = items
    .map((it, i) => `${i + 1}. [${it.source}] ${it.title}${it.summary ? ` — ${it.summary}` : ''}`)
    .join('\n');

  const systemPrompt =
    'คุณเป็นนักวิเคราะห์การเงินที่สรุปข่าวการลงทุนเป็นภาษาไทยให้นักลงทุนรายย่อยอ่านเข้าใจง่าย ' +
    'สรุปจากพาดหัวข่าวที่ให้มาเท่านั้น ห้ามแต่งข้อมูลหรือตัวเลขที่ไม่มีในข่าว ' +
    'ตอบเป็น Markdown: เริ่มด้วยภาพรวม 2-3 ประโยค ตามด้วยหัวข้อสำคัญ 3-5 ข้อแบบ bullet ' +
    'และปิดท้ายด้วยประเด็นที่นักลงทุนควรจับตา 1-2 ข้อ กระชับ ไม่เกินครึ่งหน้า';

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    const apiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{
          role: 'user',
          parts: [{ text: `นี่คือพาดหัวข่าวล่าสุดหมวด "${CAT_NAMES[category] || category}":\n\n${headlines}\n\nช่วยสรุปภาพรวมให้หน่อย` }],
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2000,
          // ปิดโหมดคิดของ gemini-2.5-* เพื่อไม่ให้กิน token จนคำตอบว่าง (รุ่น 2.0 ไม่มีผล)
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    const data = await apiRes.json();
    if (!apiRes.ok) {
      throw new Error(data?.error?.message || `Gemini API error ${apiRes.status}`);
    }

    const text = (data.candidates?.[0]?.content?.parts || [])
      .map(p => p.text || '')
      .join('')
      .trim();

    if (!text) throw new Error('Gemini ไม่ได้ส่งข้อความกลับมา');

    const result = {
      text,
      category,
      generatedAt: new Date().toISOString(),
      basedOn: items.length,
      lastUpdated: cache.lastUpdated,
    };
    summaryCache[category] = result;
    await archiveSummary(result); // เก็บลงคลังถาวรแยกตามวัน
    res.json({ ...result, cached: false });
  } catch (err) {
    console.error('[Summary]', err.message);
    res.status(500).json({ error: 'สรุปข่าวไม่สำเร็จ: ' + err.message });
  }
});

// คลังสรุปย้อนหลัง — เรียงวันใหม่ → เก่า แต่ละวันมีสรุปแยกตามหมวด
app.get('/api/summary/history', (req, res) => {
  const days = Object.keys(summaryArchive)
    .sort()
    .reverse()
    .map(date => ({
      date,
      summaries: Object.values(summaryArchive[date])
        .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt)),
    }));
  res.json({ days });
});

app.get('/api/bookmarks', (req, res) => res.json(bookmarks));

app.post('/api/bookmarks', async (req, res) => {
  const item = req.body;
  if (!item?.id) return res.status(400).json({ error: 'Missing id' });
  if (bookmarks.some(b => b.id === item.id)) return res.status(409).json({ error: 'Already saved' });
  const bookmark = { ...item, savedAt: new Date().toISOString() };
  bookmarks.unshift(bookmark);
  await fs.writeFile(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
  res.json(bookmark);
});

app.delete('/api/bookmarks/:id', async (req, res) => {
  bookmarks = bookmarks.filter(b => b.id !== req.params.id);
  await fs.writeFile(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
  res.json({ success: true });
});

app.get('/api/feeds', (req, res) => {
  res.json({ feeds: FEEDS, status: cache.feedStatus });
});

init().then(() => {
  app.listen(PORT, () => {
    console.log(`\n📈 InvestFeed → http://localhost:${PORT}\n`);
  });
  cron.schedule('*/30 * * * *', () => refreshFeeds());
});
