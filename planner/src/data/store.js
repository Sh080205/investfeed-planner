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
      if (upgradeDoc(doc)) saveDoc(doc); // ยกระดับ schema เก่า → ใหม่ อัตโนมัติ
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

/**
 * ยกระดับ doc ที่บันทึกไว้ด้วย schema เก่าให้เป็นเวอร์ชันปัจจุบัน แบบไล่ทีละขั้น
 * (คืน true ถ้ามีการแก้) — ใช้ทั้งตอน loadDoc และตอน import ไฟล์ backup เก่า
 *
 * v1 → v2: แผน ICPC เปลี่ยนจาก countdown รอบ ก.ค. 2026 → เส้นทางยาวสู่ ICPC 2027 (แข่งตอนปี 4)
 *          + เพิ่มแท็บ english (แก้จุดอ่อนอ่านโจทย์) + ช่อง ENG ใน weekly + วันแข่งปี 2027
 * v2 → v3: เพิ่มกลุ่ม "แหล่งเรียนระดับ B2" (id ขึ้นต้น enr) ในแท็บ english
 * v3 → v4: เพิ่มแท็บ research (แผนอ่าน 18 สัปดาห์ โครงงาน FPGA air quality)
 * v4 → v5: เพิ่มแท็บ "หนังสือ" (ชั้นหนังสือ PDF ดึงรายชื่อสดจาก server)
 * v5 → v6: แผนอ่าน research อัปเดต — ทุกรายการลิงก์ไปไฟล์หนังสือจริง + ใส่วันที่จริง
 *          (สัปดาห์ 1 = 13–19 ก.ค. 2026) · สถานะที่ติ๊กไว้คงเดิม (id ไม่เปลี่ยน)
 */
export function upgradeDoc(doc) {
  let changed = false;
  const seed = buildSeedDoc();

  if ((doc.schemaVersion || 1) < 2) {
    // 1) ICPC: แทนที่ด้วยแผนใหม่ทั้ง section — เก็บสถานะเดิมไว้เฉพาะ id ที่ยังอยู่ (พวก resources rs-*)
    const seedIcpc = seed.sections.find((s) => s.id === 'icpc');
    const icpcIdx = doc.sections.findIndex((s) => s.id === 'icpc');
    if (icpcIdx >= 0) {
      doc.sections[icpcIdx] = seedIcpc;
      const oldStatuses = doc.statuses.icpc || {};
      const validIds = new Set(seedIcpc.items.map((i) => i.id));
      doc.statuses.icpc = {};
      for (const [id, st] of Object.entries(oldStatuses)) {
        if (validIds.has(id)) doc.statuses.icpc[id] = st;
      }
    } else {
      doc.sections.push(seedIcpc);
    }

    // 2) เพิ่มแท็บ english ถัดจาก icpc (ถ้ายังไม่มี)
    if (!doc.sections.some((s) => s.id === 'english')) {
      const englishSeed = seed.sections.find((s) => s.id === 'english');
      const at = doc.sections.findIndex((s) => s.id === 'icpc') + 1;
      doc.sections.splice(at, 0, englishSeed);
    }

    // 3) เพิ่มช่องซ้อม ENG ในตาราง weekly (ถ้ายังไม่มี)
    const weekly = doc.sections.find((s) => s.id === 'weekly');
    if (weekly) {
      const seedWeekly = seed.sections.find((s) => s.id === 'weekly');
      for (const it of seedWeekly.items.filter((i) => i.id.startsWith('eng-'))) {
        if (!weekly.items.some((i) => i.id === it.id)) weekly.items.push({ ...it });
      }
    }

    // 4) วันแข่ง: เปลี่ยนเป็นประมาณการ 2027 เฉพาะเมื่อยังเป็นค่า default เดิม
    //    (ถ้าผู้ใช้เคยตั้งวันเองไว้ จะไม่ไปทับ)
    const d = doc.settings.dates;
    if (d.national === '2026-09-12') d.national = seed.settings.dates.national;
    if (d.bangkok === '2026-11-21') d.bangkok = seed.settings.dates.bangkok;
    delete d.contest; // countdown ไม่มีแถว contest รอบ ก.ค. แล้ว

    doc.schemaVersion = 2;
    changed = true;
  }

  if (doc.schemaVersion < 3) {
    // เติมแหล่งเรียน B2 เข้าแท็บ english (ข้ามตัวที่มีอยู่แล้ว เผื่อผู้ใช้เพิ่มเองไปก่อน)
    const seedEnglish = seed.sections.find((s) => s.id === 'english');
    const english = doc.sections.find((s) => s.id === 'english');
    if (english) {
      for (const it of seedEnglish.items.filter((i) => i.id.startsWith('enr'))) {
        if (!english.items.some((i) => i.id === it.id)) english.items.push({ ...it });
      }
    }
    doc.schemaVersion = 3;
    changed = true;
  }

  if (doc.schemaVersion < 4) {
    // เพิ่มแท็บ research (แผนอ่านโครงงาน FPGA) ต่อจาก projects
    if (!doc.sections.some((s) => s.id === 'research')) {
      const researchSeed = seed.sections.find((s) => s.id === 'research');
      const at = doc.sections.findIndex((s) => s.id === 'projects');
      if (at >= 0) doc.sections.splice(at + 1, 0, researchSeed);
      else doc.sections.push(researchSeed);
    }
    doc.schemaVersion = 4;
    changed = true;
  }

  if (doc.schemaVersion < 5) {
    // เพิ่มแท็บชั้นหนังสือต่อจาก research
    if (!doc.sections.some((s) => s.id === 'library')) {
      const librarySeed = seed.sections.find((s) => s.id === 'library');
      const at = doc.sections.findIndex((s) => s.id === 'research');
      if (at >= 0) doc.sections.splice(at + 1, 0, librarySeed);
      else doc.sections.push(librarySeed);
    }
    doc.schemaVersion = 5;
    changed = true;
  }

  if (doc.schemaVersion < 6) {
    // แทนที่ section research ด้วยเวอร์ชันมีลิงก์หนังสือ + วันที่จริง
    // — สถานะที่ติ๊กไว้อยู่ใน doc.statuses.research (id เดิมทั้งหมด) จึงไม่หาย
    // — รายการที่ผู้ใช้เพิ่มเอง (id ไม่อยู่ใน seed) เก็บต่อท้ายไว้ให้
    const seedResearch = seed.sections.find((s) => s.id === 'research');
    const idx = doc.sections.findIndex((s) => s.id === 'research');
    if (idx >= 0) {
      const seedIds = new Set(seedResearch.items.map((i) => i.id));
      const customItems = doc.sections[idx].items.filter((i) => !seedIds.has(i.id));
      doc.sections[idx] = { ...seedResearch, items: [...seedResearch.items, ...customItems] };
    }
    doc.schemaVersion = 6;
    changed = true;
  }

  return changed;
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
