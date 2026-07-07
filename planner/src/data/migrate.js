// ---------- Migration จาก planner_v2 (Mission Log v2) ----------
//
// schema เดิมใน localStorage (ทุก key ขึ้นต้น 'mission-log-v2:'):
//   dates                      -> {"national":"YYYY-MM-DD","bangkok":"YYYY-MM-DD"}
//   icpc / skills / projects / roadmap / electives / learn
//                              -> {"<itemId>":"pending"|"running"|"done"} (เก็บถาวร)
//   weekly:<ISO-week> / fitness:<ISO-week>
//                              -> สถานะแบบเดียวกัน แต่ key หมุนตามสัปดาห์
//
// หลักการ: seed ของแอปใหม่ใช้ item id เดิมทั้งหมด จึง map สถานะกลับได้ตรง ๆ
// ยกเว้น ICPC ที่เนื้อหาถูกวางแผนใหม่ — คงไว้เฉพาะ Resources (id 'rs-*')

import { LEGACY_PREFIX, STATES, isoWeekKey } from './constants.js';

/** เก็บทุก key เดิมจาก localStorage ของ origin ปัจจุบัน (คืน null ถ้าไม่พบเลย) */
export function collectLegacyFromLocalStorage() {
  const out = {};
  let found = false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LEGACY_PREFIX)) {
        out[k.slice(LEGACY_PREFIX.length)] = localStorage.getItem(k);
        found = true;
      }
    }
  } catch (e) {
    console.error('อ่าน localStorage เดิมไม่ได้', e);
  }
  return found ? out : null;
}

/**
 * เทข้อมูลเดิมเข้า doc ใหม่ (mutate doc) แล้วคืนจำนวนรายการที่นำเข้าได้
 * ใช้ทั้งตอน auto-migrate ครั้งแรก และตอน import ไฟล์จาก migrate-helper.html
 */
export function applyLegacy(doc, legacy) {
  let count = 0;

  // 1) วันแข่ง National / Bangkok ที่เคยตั้งไว้
  if (legacy.dates) {
    try {
      const d = typeof legacy.dates === 'string' ? JSON.parse(legacy.dates) : legacy.dates;
      if (d.national) doc.settings.dates.national = d.national;
      if (d.bangkok) doc.settings.dates.bangkok = d.bangkok;
      count++;
    } catch { /* ข้าม ถ้า parse ไม่ได้ */ }
  }

  // 2) สถานะการ์ด — sections ถาวรใช้ key ตรงชื่อ, weekly/fitness ใช้ key ของ "สัปดาห์นี้"
  const wk = isoWeekKey();
  const keys = [
    'icpc', 'skills', 'projects', 'roadmap', 'electives', 'learn',
    'weekly:' + wk, 'fitness:' + wk,
  ];
  for (const key of keys) {
    const raw = legacy[key];
    if (!raw) continue;
    let statuses;
    try {
      statuses = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch { continue; }

    const sectionId = key.split(':')[0];
    const section = doc.sections.find((s) => s.id === sectionId);
    if (!section) continue;

    // รับเฉพาะ id ที่ยังมีอยู่ใน seed ใหม่ กับสถานะที่รู้จักเท่านั้น
    const validIds = new Set(section.items.map((i) => i.id));
    const target = doc.statuses[key] || (doc.statuses[key] = {});
    for (const [id, state] of Object.entries(statuses)) {
      if (validIds.has(id) && STATES.includes(state)) {
        target[id] = state;
        count++;
      }
    }
  }
  return count;
}
