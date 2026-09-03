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
 * v6 → v7: weekly จัดใหม่ให้เข้ากับตารางเรียนจริง + เพิ่มช่อง research 4 ช่อง/สัปดาห์
 *          (รายการที่ผู้ใช้เพิ่มเองถูกเก็บไว้ · สถานะ weekly รีเซ็ตรายสัปดาห์อยู่แล้ว)
 * v7 → v8: ตารางเรียนเพิ่มระดับความยาก ★ / เวลาที่ต้องเผื่อ ⏱ / วิธีเรียนต่อวิชา
 *          + thu2 ใน weekly เรียงทบทวนตามตัวกินเวลา
 * v8 → v9: เพิ่ม "ถาดวิชา" (pool) ใน weekly — การ์ดอ่านหนังสือรายวิชา ลากเข้า/ออกวันได้
 * v9 → v10: กู้การ์ดปกติที่หลุดหาย (day='' แต่ไม่ใช่ pool) จากบั๊กลากลงถาด — คืนวันเดิมจาก seed
 * v10 → v11: เพิ่ม "ถาดหนังสือ" (pool kind:'book') ใน weekly แยกจากถาดวิชา
 * v11 → v12: บันทึกผลตกรอบ regional ก.ค. 2026 (2/5 — อ่านโจทย์ไม่ผ่าน)
 *            → เพิ่ม Postmortem (pm*) หัวลิสต์ icpc + กลุ่มแก้อาการ (enx*) หัวลิสต์ english
 *            + กติกาห้ามดู I/O ใน eng-tue + ช่อง eng-sat อ่านโจทย์หลัง virtual
 * v12 → v13: เพิ่มแท็บ "เงิน" (finance) รายรับรายจ่าย + doc.finance.transactions
 * v13 → v14: weekly → โหมดอ่านสอบไฟนอล (แทนรูทีน ICPC/research เดิมด้วยรอบทบทวน 7 วิชา)
 *            คงการ์ดถาด (pool) พร้อมวันที่จองไว้ + รายการที่ผู้ใช้เพิ่มเอง (id 'u…')
 * v14 → v15: เพิ่มแท็บ "เตรียมสอบ" (แผน 4 ช่วง + วิธีติวรายวิชา + เช็กพอยต์)
 *            + weekly จัดใหม่ตามเพดานเวลาช่วงสอบ (ICPC 0 · research 5 ชม. · VHDL 1.5 ชม.)
 * v15 → v16: ยืนยันวันสอบ OS = ศ 21 ส.ค. (ไม่ใช่ 18) → รื้อ ช่วง 2–3 ตามลำดับสอบจริง
 *            ช่วง 3 กลายเป็นสัปดาห์สอบ 7 วัน (เย็นแต่ละวัน = ติวของพรุ่งนี้)
 * v16 → v17: มิดเทอมสอบจบแล้ว → weekly กลับสู่โหมดปกติ (จัดตาม baseline รายวิชา
 *            + ล็อกการบ้าน Prob&Stat/DS + protected block งานวิจัย)
 *            และแท็บสอบเปลี่ยนจากแผนมิดเทอมเป็นแผนไฟนอล (ยังรอวันสอบ+scope)
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

  if (doc.schemaVersion < 7) {
    // weekly: แทนด้วยตารางใหม่ (เลี่ยงชนคาบเรียน + มีช่องโครงงาน research)
    // — รายการที่ผู้ใช้เพิ่มเอง (id นอก seed) เก็บต่อท้ายไว้ · tue2 (SQL/pandas เดิม) ถูกถอด
    const seedWeekly = seed.sections.find((s) => s.id === 'weekly');
    const idx = doc.sections.findIndex((s) => s.id === 'weekly');
    if (idx >= 0) {
      const seedIds = new Set(seedWeekly.items.map((i) => i.id));
      const removedIds = new Set(['tue2']);
      const customItems = doc.sections[idx].items.filter(
        (i) => !seedIds.has(i.id) && !removedIds.has(i.id)
      );
      doc.sections[idx] = { ...seedWeekly, items: [...seedWeekly.items, ...customItems] };
    }
    doc.schemaVersion = 7;
    changed = true;
  }

  if (doc.schemaVersion < 8) {
    // ตารางเรียน: แทนด้วยเวอร์ชันมีความยาก/เวลา/วิธีเรียน — วิชาที่ผู้ใช้เพิ่มเองเก็บต่อท้าย
    const seedClasses = seed.sections.find((s) => s.id === 'classes');
    const idx = doc.sections.findIndex((s) => s.id === 'classes');
    if (idx >= 0) {
      const seedIds = new Set(seedClasses.items.map((i) => i.id));
      const customItems = doc.sections[idx].items.filter((i) => !seedIds.has(i.id));
      doc.sections[idx] = { ...seedClasses, items: [...seedClasses.items, ...customItems] };
    }
    // thu2: อัปเดตข้อความให้เรียงทบทวนตามตัวกินเวลา
    const weekly = doc.sections.find((s) => s.id === 'weekly');
    const thu2 = weekly?.items.find((i) => i.id === 'thu2');
    if (thu2) {
      const seedThu2 = seed.sections.find((s) => s.id === 'weekly').items.find((i) => i.id === 'thu2');
      if (seedThu2) thu2.activity = seedThu2.activity;
    }
    doc.schemaVersion = 8;
    changed = true;
  }

  if (doc.schemaVersion < 9) {
    // เพิ่มการ์ดวิชา (pool) เข้าถาดของ weekly — เก็บ placement/custom เดิมไว้ทั้งหมด
    const seedWeekly = seed.sections.find((s) => s.id === 'weekly');
    const weekly = doc.sections.find((s) => s.id === 'weekly');
    if (weekly) {
      const have = new Set(weekly.items.map((i) => i.id));
      for (const it of seedWeekly.items.filter((i) => i.pool)) {
        if (!have.has(it.id)) weekly.items.push({ ...it });
      }
      weekly.note = seedWeekly.note; // อัปเดตคำอธิบายให้พูดถึงถาดวิชา
    }
    doc.schemaVersion = 9;
    changed = true;
  }

  if (doc.schemaVersion < 10) {
    // กู้การ์ดที่หลุดหาย: ใน weekly ถ้าการ์ด "ไม่ใช่ pool" แต่ไม่มีวัน (เกิดจากบั๊กก่อนแก้
    // ที่ลากการ์ดปกติไปวางบนการ์ดในถาด) → คืนวันเดิมจาก seed หรือลงวันจันทร์เป็น fallback
    const seedWeekly = seed.sections.find((s) => s.id === 'weekly');
    const seedDay = new Map(seedWeekly.items.map((i) => [i.id, i.day]));
    const weekly = doc.sections.find((s) => s.id === 'weekly');
    if (weekly) {
      for (const it of weekly.items) {
        if (!it.pool && !it.day) it.day = seedDay.get(it.id) || 'จันทร์ MON';
      }
    }
    doc.schemaVersion = 10;
    changed = true;
  }

  if (doc.schemaVersion < 11) {
    // เพิ่มการ์ดหนังสือ (pool kind:'book') เข้าถาดหนังสือของ weekly — เก็บ placement/custom เดิมไว้
    const seedWeekly = seed.sections.find((s) => s.id === 'weekly');
    const weekly = doc.sections.find((s) => s.id === 'weekly');
    if (weekly) {
      const have = new Set(weekly.items.map((i) => i.id));
      for (const it of seedWeekly.items.filter((i) => i.kind === 'book')) {
        if (!have.has(it.id)) weekly.items.push({ ...it });
      }
      weekly.note = seedWeekly.note; // อัปเดตคำอธิบายให้พูดถึงถาดหนังสือ
    }
    doc.schemaVersion = 11;
    changed = true;
  }

  if (doc.schemaVersion < 12) {
    const seedOf = (id) => seed.sections.find((s) => s.id === id);

    // 1) icpc: แทรกกลุ่ม Postmortem (pm*) ไว้หัวลิสต์ + note สถานะจริง
    const icpc = doc.sections.find((s) => s.id === 'icpc');
    if (icpc) {
      const have = new Set(icpc.items.map((i) => i.id));
      const pmItems = seedOf('icpc').items.filter((i) => i.id.startsWith('pm') && !have.has(i.id));
      icpc.items.splice(0, 0, ...pmItems.map((i) => ({ ...i })));
      icpc.note = seedOf('icpc').note;
    }

    // 2) english: แทรกกลุ่มแก้อาการ (enx*) ไว้หัวลิสต์ + note
    const english = doc.sections.find((s) => s.id === 'english');
    if (english) {
      const have = new Set(english.items.map((i) => i.id));
      const enxItems = seedOf('english').items.filter((i) => i.id.startsWith('enx') && !have.has(i.id));
      english.items.splice(0, 0, ...enxItems.map((i) => ({ ...i })));
      english.note = seedOf('english').note;
    }

    // 3) weekly: กติกาห้ามดู I/O ใน eng-tue + เพิ่ม eng-sat (แทรกก่อน sat2 ให้เรียงตามเวลา)
    const weekly = doc.sections.find((s) => s.id === 'weekly');
    if (weekly) {
      const sw = seedOf('weekly');
      const tue = weekly.items.find((i) => i.id === 'eng-tue');
      const seedTue = sw.items.find((i) => i.id === 'eng-tue');
      if (tue && seedTue) tue.activity = seedTue.activity;
      if (!weekly.items.some((i) => i.id === 'eng-sat')) {
        const seedSat = sw.items.find((i) => i.id === 'eng-sat');
        if (seedSat) {
          const at = weekly.items.findIndex((i) => i.id === 'sat2');
          if (at >= 0) weekly.items.splice(at, 0, { ...seedSat });
          else weekly.items.push({ ...seedSat });
        }
      }
    }

    doc.schemaVersion = 12;
    changed = true;
  }

  if (doc.schemaVersion < 13) {
    // เพิ่มแท็บ finance ก่อน fitness (ถ้ายังไม่มี) + เตรียมที่เก็บธุรกรรม
    if (!doc.sections.some((s) => s.id === 'finance')) {
      const financeSeed = seed.sections.find((s) => s.id === 'finance');
      const at = doc.sections.findIndex((s) => s.id === 'fitness');
      if (at >= 0) doc.sections.splice(at, 0, financeSeed);
      else doc.sections.push(financeSeed);
    }
    if (!doc.finance) doc.finance = { transactions: [] };
    doc.schemaVersion = 13;
    changed = true;
  }

  if (doc.schemaVersion < 14) {
    // weekly → โหมดอ่านสอบ: แทนรายการรูทีนเดิม (ex-* จาก seed) แต่คงถาด (pool) + custom ('u…')
    const seedWeekly = seed.sections.find((s) => s.id === 'weekly');
    const weekly = doc.sections.find((s) => s.id === 'weekly');
    if (weekly) {
      const examItems = seedWeekly.items.filter((i) => !i.pool).map((i) => ({ ...i }));
      const curPool = weekly.items.filter((i) => i.pool); // การ์ดถาด + วันที่ผู้ใช้จองไว้ (คงไว้)
      const pool = curPool.length ? curPool : seedWeekly.items.filter((i) => i.pool).map((i) => ({ ...i }));
      const custom = weekly.items.filter((i) => !i.pool && String(i.id).startsWith('u')); // ที่ผู้ใช้เพิ่มเอง
      weekly.items = [...examItems, ...pool, ...custom];
      weekly.note = seedWeekly.note;
    }
    doc.schemaVersion = 14;
    changed = true;
  }

  if (doc.schemaVersion < 15) {
    // 1) เพิ่มแท็บ "เตรียมสอบ" ต่อจาก weekly
    if (!doc.sections.some((s) => s.id === 'exam')) {
      const examSeed = seed.sections.find((s) => s.id === 'exam');
      const at = doc.sections.findIndex((s) => s.id === 'weekly');
      doc.sections.splice(at >= 0 ? at + 1 : doc.sections.length, 0, examSeed);
    }
    // 2) weekly: แทนรายการเดิม (รวมรอบอ่านสอบ ex-* ของ v14) ด้วยตารางตามเพดานเวลาใหม่
    //    คงการ์ดถาด (pool) พร้อมวันที่จองไว้ + รายการที่ผู้ใช้เพิ่มเอง ('u…')
    const seedWeekly = seed.sections.find((s) => s.id === 'weekly');
    const weekly = doc.sections.find((s) => s.id === 'weekly');
    if (weekly) {
      const pool = weekly.items.filter((i) => i.pool);
      const custom = weekly.items.filter((i) => !i.pool && String(i.id).startsWith('u'));
      weekly.items = [...seedWeekly.items.filter((i) => !i.pool).map((i) => ({ ...i })), ...pool, ...custom];
      weekly.note = seedWeekly.note;
    }
    doc.schemaVersion = 15;
    changed = true;
  }

  if (doc.schemaVersion < 16) {
    // แผนสอบปรับตามวันสอบ OS ที่ยืนยันแล้ว (ศ 21) — แทน section exam ทั้งชุด
    // สถานะที่ติ๊กไว้อยู่ใน doc.statuses.exam (id เดิมคงอยู่) จึงไม่หาย
    // รายการที่ผู้ใช้เพิ่มเอง (id นอก seed) เก็บต่อท้ายไว้
    const seedExam = seed.sections.find((s) => s.id === 'exam');
    const idx = doc.sections.findIndex((s) => s.id === 'exam');
    if (idx >= 0) {
      const seedIds = new Set(seedExam.items.map((i) => i.id));
      // การ์ดแผนเก่าที่อิงวันสอบผิด (18 ส.ค.) ต้องถอดทิ้ง ไม่ใช่เก็บไว้เป็น custom
      const retired = new Set(['xp3-mon', 'xp3-tue']);
      const custom = doc.sections[idx].items.filter((i) => !seedIds.has(i.id) && !retired.has(i.id));
      doc.sections[idx] = { ...seedExam, items: [...seedExam.items, ...custom] };
    } else {
      const at = doc.sections.findIndex((s) => s.id === 'weekly');
      doc.sections.splice(at >= 0 ? at + 1 : doc.sections.length, 0, seedExam);
    }
    doc.schemaVersion = 16;
    changed = true;
  }

  if (doc.schemaVersion < 17) {
    // มิดเทอมจบแล้ว → weekly กลับสู่โหมดปกติ + แท็บสอบเปลี่ยนเป็นแผนไฟนอล
    // การ์ดของแผนมิดเทอมทั้งชุด (mx-* ใน weekly · xp/xw/xh/xc-* ใน exam) ถอดทิ้ง
    // คงไว้: การ์ดถาด (pool) พร้อมวันที่จอง + รายการที่ผู้ใช้เพิ่มเอง (id 'u…')
    const isUserAdded = (i) => String(i.id).startsWith('u');

    const seedWeekly = seed.sections.find((s) => s.id === 'weekly');
    const weekly = doc.sections.find((s) => s.id === 'weekly');
    if (weekly) {
      const pool = weekly.items.filter((i) => i.pool);
      const custom = weekly.items.filter((i) => !i.pool && isUserAdded(i));
      weekly.items = [...seedWeekly.items.filter((i) => !i.pool).map((i) => ({ ...i })), ...pool, ...custom];
      weekly.note = seedWeekly.note;
    }

    const seedExam = seed.sections.find((s) => s.id === 'exam');
    const exIdx = doc.sections.findIndex((s) => s.id === 'exam');
    if (exIdx >= 0) {
      const custom = doc.sections[exIdx].items.filter(isUserAdded);
      doc.sections[exIdx] = { ...seedExam, items: [...seedExam.items.map((i) => ({ ...i })), ...custom] };
    } else {
      const at = doc.sections.findIndex((s) => s.id === 'weekly');
      doc.sections.splice(at >= 0 ? at + 1 : doc.sections.length, 0, seedExam);
    }
    doc.schemaVersion = 17;
    changed = true;
  }

  if (doc.schemaVersion < 18) {
    // ได้ข้อมูลช่วงพลังงานจริง (ตื่น 7 · นอน 24 · พีค 8–12) → จัด weekly ใหม่
    // งานคิดหนัก (FPGA/OS ครึ่งแรก/โจทย์ Prob&Stat) ย้ายขึ้นช่วงพีคที่ว่าง
    const seedWeekly = seed.sections.find((s) => s.id === 'weekly');
    const weekly = doc.sections.find((s) => s.id === 'weekly');
    if (weekly) {
      const pool = weekly.items.filter((i) => i.pool);
      const custom = weekly.items.filter((i) => !i.pool && String(i.id).startsWith('u'));
      weekly.items = [...seedWeekly.items.filter((i) => !i.pool).map((i) => ({ ...i })), ...pool, ...custom];
      weekly.note = seedWeekly.note;
    }
    doc.schemaVersion = 18;
    changed = true;
  }

  // กันเหนียว: doc เก่าที่อัปเกรดครบแล้วแต่ยังไม่มี finance (เช่น import ไฟล์เก่า)
  if (!doc.finance) { doc.finance = { transactions: [] }; changed = true; }

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
