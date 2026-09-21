// ---------- Final Sprint 2569/1 — logic ของแผนแบบผูกวันที่ ----------
// ข้อมูล (projects / milestones / tasks / ช่องพลังงาน) อยู่ใน final_sprint_2569_1.json
// ไฟล์นี้เป็นฟังก์ชันล้วน ไม่แตะ localStorage/DOM → ทดสอบใน Node ได้ตรง ๆ

import SPRINT from './final_sprint_2569_1.json' with { type: 'json' };
import { DAY_ORDER, isoWeekKey } from './constants.js';

export { SPRINT };

const WEEKDAY_CODE = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']; // index = Date#getDay()
const TH_MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

/* ---------------- เวลา / วันที่ ---------------- */
export const toMin = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + m; };
export const fromMin = (n) => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
const parseISO = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
export const isoOf = (dt) =>
  dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
export const todayISO = () => isoOf(new Date());
export const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return isoOf(d); };
export const daysBetween = (fromIso, toIso) => Math.round((parseISO(toIso) - parseISO(fromIso)) / 86400000);
export const weekKeyOf = (iso) => isoWeekKey(parseISO(iso));
/** 'จันทร์ MON' ของวันที่นั้น — ให้การ์ดผูกวันที่ใช้ร่วมกับ layout รายวันเดิมได้ */
export const dayLabelOf = (iso) => DAY_ORDER[(parseISO(iso).getDay() + 6) % 7];
export const fmtDateShort = (iso) => { const d = parseISO(iso); return d.getDate() + ' ' + TH_MONTH[d.getMonth()]; };

/** วันที่ จันทร์→อาทิตย์ ของ ISO week (สัปดาห์ที่ 1 = สัปดาห์ที่มีวันที่ 4 ม.ค.) */
export function datesOfWeek(weekKey) {
  const [y, w] = weekKey.split('-W').map(Number);
  const jan4 = new Date(y, 0, 4);
  const mondayW1 = new Date(y, 0, 4 - ((jan4.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mondayW1);
    d.setDate(mondayW1.getDate() + (w - 1) * 7 + i);
    return isoOf(d);
  });
}
export const shiftWeek = (weekKey, n) => weekKeyOf(addDays(datesOfWeek(weekKey)[0], 7 * n));

/** ช่วงเวลา [เริ่ม, จบ] เป็นนาทีของการ์ด — จาก start/end หรือแยกจาก time 'HH:MM–HH:MM' (null = ไม่ระบุเวลา) */
export function spanOf(item) {
  if (item.start && item.end) return [toMin(item.start), toMin(item.end)];
  const m = String(item.time || '').match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
  return m ? [+m[1] * 60 + +m[2], +m[3] * 60 + +m[4]] : null;
}
const overlaps = (a, b) => a[0] < b[1] && b[0] < a[1]; // ชนกันพอดีขอบ (จบ 11:00 เริ่ม 11:00) ไม่นับว่าทับ

/* ---------------- seed → การ์ด ---------------- */
/** id คงที่จาก วันที่+เวลาเริ่ม+โปรเจค → seed ซ้ำกี่รอบก็ได้ id เดิม ไม่เกิดการ์ดซ้ำ */
export const sprintTaskId = (t) => 'fs-' + t.date + '-' + t.start.replace(':', '') + '-' + t.project;

export function taskToItem(t) {
  const item = {
    id: sprintTaskId(t),
    date: t.date, day: dayLabelOf(t.date),
    start: t.start, end: t.end, time: t.start + '–' + t.end,
    project: t.project, milestone: t.milestone || null, energy: t.energy,
    activity: t.title, detail: t.detail || '',
    cat: 'plan', // สีป้ายของการ์ด sprint มาจาก project (ItemCard) — cat ใช้เป็น fallback
  };
  if (/^BUFFER/i.test(t.title)) item.buffer = true;
  return item;
}

/** เติม task ของ sprint ที่ยังไม่มี (เทียบ id) — idempotent · คืนจำนวนที่เติม */
export function seedSprintTasks(doc) {
  const weekly = doc.sections.find((s) => s.id === 'weekly');
  if (!weekly) return 0;
  const have = new Set(weekly.items.map((i) => i.id));
  let added = 0;
  for (const t of SPRINT.tasks) {
    const item = taskToItem(t);
    if (have.has(item.id)) continue;
    weekly.items.push(item);
    have.add(item.id);
    added++;
  }
  return added;
}

/** merge projects/milestones จาก seed โดยเก็บค่าที่ผู้ใช้แก้แล้ว (deadline / confirmed) ไว้ */
export function mergeSprintMeta(doc) {
  const cur = doc.sprint || {};
  const byId = (arr) => new Map((arr || []).map((x) => [x.id, x]));
  const p = byId(cur.projects);
  const m = byId(cur.milestones);
  const seedP = new Set(SPRINT.projects.map((x) => x.id));
  const seedM = new Set(SPRINT.milestones.map((x) => x.id));
  doc.sprint = {
    id: SPRINT.id,
    projects: [
      ...SPRINT.projects.map((x) => ({ ...x, ...(p.get(x.id) || {}) })),
      ...(cur.projects || []).filter((x) => !seedP.has(x.id)),
    ],
    milestones: [
      ...SPRINT.milestones.map((x) => ({ ...x, ...(m.get(x.id) || {}) })),
      ...(cur.milestones || []).filter((x) => !seedM.has(x.id)),
    ],
  };
}

/**
 * เข้าโหมด Final Sprint — ใช้ทั้ง migration v19 (ข้อมูลผู้ใช้) และตอนสร้าง seed ใหม่
 *  - ล้างการ์ดใน SPRINT.clearSections (ไม่แตะ: เงิน, ตารางเรียน, fitness, หนังสือ, icpc)
 *  - weekly: การ์ดถาดเก็บไว้ แต่ดึงกลับเข้าถาดหมด (กันชนเวลากับ task ใหม่)
 *  - icpc: paused (ซ่อน + ไม่นับ progress) · เติม projects / milestones / tasks
 * คืนจำนวนการ์ดเดิมที่ถูกล้าง
 */
export function applyFinalSprint(doc) {
  let removed = 0;
  for (const id of SPRINT.clearSections) {
    const sec = doc.sections.find((s) => s.id === id);
    if (!sec) continue;
    const keep = id === 'weekly' ? sec.items.filter((i) => i.pool) : [];
    removed += sec.items.length - keep.length;
    keep.forEach((i) => { i.day = ''; delete i.date; });
    sec.items = keep;
    for (const k of Object.keys(doc.statuses || {})) {
      if (k === id || k.startsWith(id + ':')) delete doc.statuses[k];
    }
  }
  const weekly = doc.sections.find((s) => s.id === 'weekly');
  if (weekly) { weekly.dated = true; weekly.note = SPRINT.app.boardHeader; }
  const exam = doc.sections.find((s) => s.id === 'exam');
  if (exam) exam.note = 'ว่าง — ช่วง Final Sprint ใช้ project FINAL บนบอร์ด weekly แทน';

  doc.settings = doc.settings || {};
  doc.settings.paused = [...new Set([...(doc.settings.paused || []), ...SPRINT.pause])];
  mergeSprintMeta(doc);
  seedSprintTasks(doc);
  return removed;
}

export const isPaused = (doc, sectionId) => (doc.settings?.paused || []).includes(sectionId);

/* ---------------- สถานะ / progress ---------------- */
const datedStatus = (doc) => doc.statuses?.['weekly:dated'] || {};
export const isDone = (doc, item) => datedStatus(doc)[item.id] === 'done';
const weeklyItems = (doc) => doc.sections.find((s) => s.id === 'weekly')?.items || [];
/** การ์ดที่ผูกวันที่ทั้งหมดบนบอร์ด (sprint + ที่ผู้ใช้เพิ่ม) */
export const datedItems = (doc) => weeklyItems(doc).filter((i) => i.date);

export function milestoneState(doc, m, today = todayISO()) {
  const tasks = datedItems(doc).filter((t) => t.milestone === m.id);
  const done = tasks.filter((t) => isDone(doc, t)).length;
  const complete = tasks.length > 0 && done === tasks.length;
  return { total: tasks.length, done, complete, overdue: !complete && m.due < today };
}

/** % ของโปรเจค = task ที่ done / task ทั้งหมดของโปรเจค (ทุกสัปดาห์) · เตือนเมื่อเหลือ ≤3 วันและ % < 70 */
export function projectStats(doc, p, today = todayISO()) {
  const tasks = datedItems(doc).filter((t) => t.project === p.id);
  const done = tasks.filter((t) => isDone(doc, t)).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const daysLeft = p.deadline ? daysBetween(today, p.deadline) : null;
  // milestone 'all' (เช่น M0 เช็ค requirement, M10 buffer) เป็นของโปรเจคที่มีกำหนดส่งเท่านั้น
  const next = (doc.sprint?.milestones || [])
    .filter((m) => m.project === p.id || (m.project === 'all' && p.deadline))
    .filter((m) => !milestoneState(doc, m, today).complete)
    .sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0))[0] || null;
  return { total: tasks.length, done, pct, daysLeft, next, warn: daysLeft !== null && daysLeft <= 3 && pct < 70 };
}

const byDateTime = (a, b) =>
  a.date !== b.date ? (a.date < b.date ? -1 : 1) : ((spanOf(a) || [0])[0] - (spanOf(b) || [0])[0]);

/** สรุปสัปดาห์: task ที่ยังไม่เสร็จของสัปดาห์นั้น + milestone ที่เลยกำหนด (ทั้งแผน) */
export function weekReview(doc, weekKey, today = todayISO()) {
  const days = new Set(datesOfWeek(weekKey));
  const unfinished = datedItems(doc)
    .filter((t) => days.has(t.date) && !isDone(doc, t))
    .sort(byDateTime)
    .map((t) => ({ task: t, overdue: t.date < today }));
  const overdueMilestones = (doc.sprint?.milestones || [])
    .map((m) => ({ m, st: milestoneState(doc, m, today) }))
    .filter((x) => x.st.overdue);
  return { unfinished, overdueMilestones };
}

/* ---------------- ช่องเวลา ---------------- */
/** ช่วงเวลาที่ถูกใช้แล้วในวันที่ iso: การ์ดผูกวันนั้น + การ์ดรูทีน (ไม่มีวันที่) ของวันในสัปดาห์เดียวกัน */
export function busyOn(doc, iso, exceptId = null) {
  const label = dayLabelOf(iso);
  return weeklyItems(doc)
    .filter((i) => i.id !== exceptId && (i.date ? i.date === iso : i.day === label))
    .map((i) => ({ item: i, span: spanOf(i) }))
    .filter((x) => x.span);
}

/**
 * หาช่องว่างถัดไปให้การ์ด (ปุ่ม "เลื่อนไปช่องว่างถัดไป")
 * - เริ่มหาจากวันถัดจากวันของการ์ด แต่ไม่ย้อนก่อนวันนี้ (การ์ดที่เลยวันมาแล้วจะได้ช่องวันนี้ที่ยังไม่ผ่าน)
 * - ใช้เฉพาะช่องพลังงานเดียวกับการ์ด (energyWindows ใน seed): deep→ช่วงพีค, อื่นๆ→ช่อง light
 * - ขยับทีละ 15 นาที และห้ามทับการ์ดใดๆ เลย — รวมถึง locked และ BUFFER จึงไม่มีทางย้ายไปทับสองอย่างนี้
 * - การ์ด locked (ที่ยังไม่ปลดล็อก) ห้ามย้าย → null
 */
export function findNextSlot(doc, item, { today = todayISO(), nowMin = null, maxDays = 21 } = {}) {
  if (item.energy === 'locked' && !item.unlocked) return null;
  const span = spanOf(item);
  if (!span) return null;
  const dur = span[1] - span[0];
  const windows = SPRINT.energyWindows[item.energy === 'deep' ? 'deep' : 'light'] || {};
  const afterTask = addDays(item.date || today, 1);
  let day = afterTask > today ? afterTask : today;
  const now = nowMin ?? (() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); })();

  for (let k = 0; k < maxDays; k++, day = addDays(day, 1)) {
    const busy = busyOn(doc, day, item.id).map((x) => x.span);
    const earliest = day === today ? Math.ceil(now / 15) * 15 : 0; // วันนี้: ห้ามวางย้อนเวลาที่ผ่านไปแล้ว
    for (const [ws, we] of windows[WEEKDAY_CODE[parseISO(day).getDay()]] || []) {
      for (let s = Math.max(toMin(ws), earliest); s + dur <= toMin(we); s += 15) {
        const cand = [s, s + dur];
        if (!busy.some((b) => overlaps(cand, b))) return { date: day, start: fromMin(s), end: fromMin(s + dur) };
      }
    }
  }
  return null;
}

/* ---------------- validation ตอนโหลด ---------------- */
/** ตรวจแผน: start<end · เวลาทับกันในวันเดียว · milestone/project มีจริง — คืนลิสต์ปัญหา ไม่ throw */
export function validateSprint(doc) {
  const issues = [];
  const ms = new Set((doc.sprint?.milestones || []).map((m) => m.id));
  const ps = new Set((doc.sprint?.projects || []).map((p) => p.id));
  const dated = datedItems(doc);
  for (const i of dated) {
    const sp = spanOf(i);
    if (sp && !(sp[0] < sp[1])) issues.push(`${i.date} "${i.activity}": เวลาเริ่มต้องน้อยกว่าเวลาจบ (${i.time})`);
    if (i.milestone && !ms.has(i.milestone)) issues.push(`"${i.activity}": ไม่มี milestone ${i.milestone}`);
    if (i.project && !ps.has(i.project)) issues.push(`"${i.activity}": ไม่มี project ${i.project}`);
  }
  for (const d of [...new Set(dated.map((i) => i.date))].sort()) {
    const b = busyOn(doc, d);
    for (let x = 0; x < b.length; x++) {
      for (let y = x + 1; y < b.length; y++) {
        if (overlaps(b[x].span, b[y].span)) {
          issues.push(`${d}: เวลาทับกัน "${b[x].item.activity}" (${b[x].item.time}) กับ "${b[y].item.activity}" (${b[y].item.time})`);
        }
      }
    }
  }
  return issues;
}
