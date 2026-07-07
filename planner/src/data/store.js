// ---------- Persistence layer ----------
// ข้อมูลทั้งหมด (sections + items + statuses + settings) เก็บเป็น JSON ก้อนเดียว
// ใต้ key 'planner-v3:doc' — ทำให้ export/import ง่ายและไม่มี state กระจัดกระจาย

import { STORAGE_KEY, isoWeekKey } from './constants.js';
import { buildSeedDoc } from './seed.js';
import { collectLegacyFromLocalStorage, applyLegacy } from './migrate.js';

export function loadDoc() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const doc = JSON.parse(raw);
      pruneOldWeeks(doc);
      return doc;
    }
  } catch (e) {
    console.error('อ่านข้อมูลที่บันทึกไว้ไม่ได้ — เริ่มจากค่า default', e);
  }

  // เปิดครั้งแรก (ยังไม่มีข้อมูล v3): สร้างจาก seed
  // แล้วมองหา localStorage ของ planner_v2 เดิมบน origin นี้ → นำเข้าอัตโนมัติครั้งเดียว
  const doc = buildSeedDoc();
  const legacy = collectLegacyFromLocalStorage();
  if (legacy) {
    doc.migratedCount = applyLegacy(doc, legacy);
  }
  saveDoc(doc);
  return doc;
}

export function saveDoc(doc) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  } catch (e) {
    console.error('บันทึกไม่สำเร็จ (localStorage ปิดหรือเต็ม)', e);
  }
}

/** section รายสัปดาห์เก็บสถานะแยกตามสัปดาห์: 'weekly:2026-W27' — เปลี่ยน key = รีเซ็ต */
export function statusKey(section, weekKey) {
  return section.resettable ? section.id + ':' + weekKey : section.id;
}

/** ลบสถานะของสัปดาห์เก่า ๆ ทิ้ง กัน doc บวมไปเรื่อย ๆ */
function pruneOldWeeks(doc) {
  const wk = isoWeekKey();
  const weeklyIds = doc.sections.filter((s) => s.resettable).map((s) => s.id);
  for (const key of Object.keys(doc.statuses)) {
    const [secId, week] = key.split(':');
    if (week && weeklyIds.includes(secId) && week !== wk) delete doc.statuses[key];
  }
}

/** ดาวน์โหลดข้อมูลทั้งหมดเป็นไฟล์ JSON (ใช้เป็น backup / ย้ายเครื่อง) */
export function downloadJSON(doc) {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'planner-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
