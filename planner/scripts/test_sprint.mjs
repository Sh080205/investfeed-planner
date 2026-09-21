// ทดสอบ data layer ของ Final Sprint (รันด้วย node) — ตรวจ acceptance criteria ฝั่งข้อมูล
const base = new URL('../src/data/', import.meta.url).href;
const seedM = await import(base + 'seed.js');
const storeM = await import(base + 'store.js');
const S = await import(base + 'sprint.js');

let fail = 0;
const ok = (cond, msg) => { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) fail++; };

/* ---------- 1) seed ใหม่ ---------- */
console.log('1) buildSeedDoc (เครื่องใหม่)');
const fresh = seedM.buildSeedDoc();
const wk = (d) => d.sections.find((s) => s.id === 'weekly');
const tasks = S.datedItems(fresh);
ok(fresh.schemaVersion === 19, 'schemaVersion = 19');
ok(tasks.length === 40, `task ผูกวันที่ = 40 (ได้ ${tasks.length})`);
const inWeek = (w) => tasks.filter((t) => S.weekKeyOf(t.date) === w).length;
ok(inWeek('2026-W39') === 2 && inWeek('2026-W40') === 12 && inWeek('2026-W41') === 13 && inWeek('2026-W42') === 13,
  `แยกสัปดาห์ W39/40/41/42 = ${inWeek('2026-W39')}/${inWeek('2026-W40')}/${inWeek('2026-W41')}/${inWeek('2026-W42')} (ต้อง 2/12/13/13)`);
ok(!wk(fresh).items.some((i) => !i.pool && !i.date), 'ไม่มีการ์ดรูทีนเก่าค้างใน weekly');
ok(!wk(fresh).items.some((i) => i.cat === 'icpc'), 'ไม่มี task ICPC บนบอร์ด');
ok(S.isPaused(fresh, 'icpc'), 'icpc paused');
ok(fresh.sprint.projects.length === 6 && fresh.sprint.milestones.length === 11, 'projects 6 · milestones 11');
const v = S.validateSprint(fresh);
ok(v.length === 0, 'validation ผ่าน (ไม่มีเวลาทับ / start<end / milestone มีจริง)' + (v.length ? '\n    ' + v.join('\n    ') : ''));

/* ---------- 2) idempotent ---------- */
console.log('2) seed ซ้ำไม่เกิด task ซ้ำ');
const again = S.seedSprintTasks(fresh);
S.applyFinalSprint(fresh);
ok(again === 0 && S.datedItems(fresh).length === 40, `seed ซ้ำ 2 รอบ → เติม ${again} · ยังเป็น ${S.datedItems(fresh).length}`);

/* ---------- 3) migration จากข้อมูลผู้ใช้ v18 ---------- */
console.log('3) upgradeDoc: ข้อมูลผู้ใช้ v18 → v19');
const old = seedM.buildBaseSeed();
old.statuses['weekly:2026-W39'] = { 'mw-mon1': 'done' };
old.statuses['icpc'] = { f1: 'done' };
old.statuses['roadmap'] = { rm1: 'done' };
old.finance.transactions.push({ id: 'tx1', type: 'income', amount: 5000, category: 'x', note: '', date: '2026-09-01' });
wk(old).items.find((i) => i.id === 'rd-os').day = 'พุธ WED';          // การ์ดถาดที่เคยจองวันไว้
wk(old).items.push({ id: 'uMine', day: 'ศุกร์ FRI', time: '10:00–11:00', activity: 'custom', cat: 'plan' });
const icpcBefore = old.sections.find((s) => s.id === 'icpc').items.length;
storeM.upgradeDoc(old);
ok(old.schemaVersion === 19, 'อัปเกรดเป็น v19');
ok(old.finance.transactions.length === 1, 'รายการเงินไม่หาย');
ok(old.sections.find((s) => s.id === 'icpc').items.length === icpcBefore && old.statuses.icpc?.f1 === 'done', 'icpc: การ์ด+สถานะยังอยู่ (แค่ paused)');
for (const id of ['roadmap', 'electives', 'learn', 'skills', 'research', 'english', 'projects', 'exam']) {
  ok(old.sections.find((s) => s.id === id).items.length === 0, `ล้าง ${id}`);
}
ok(!old.statuses.roadmap && !old.statuses['weekly:2026-W39'], 'สถานะของแท็บที่ล้างถูกลบด้วย');
ok(old.sections.find((s) => s.id === 'classes').items.length > 0, 'ตารางเรียนไม่แตะ');
ok(old.sections.find((s) => s.id === 'fitness').items.length > 0, 'fitness ไม่แตะ');
const pool = wk(old).items.filter((i) => i.pool);
ok(pool.length === 16 && pool.every((i) => i.day === ''), `การ์ดถาด 16 ใบอยู่ครบ และกลับเข้าถาดหมด`);
ok(!wk(old).items.some((i) => i.id === 'uMine' || i.id.startsWith('mw-')), 'การ์ด weekly เก่า (รวมที่เพิ่มเอง) ถูกล้าง');
ok(S.datedItems(old).length === 40, 'มี task ใหม่ 40');
ok(old.sprintMigration && old.sprintMigration.removed > 0, `บันทึกจำนวนที่ล้าง: ${old.sprintMigration?.removed} ใบ`);
ok(S.validateSprint(old).length === 0, 'validation หลัง migration ผ่าน');
const re = storeM.upgradeDoc(old);
ok(re === false && S.datedItems(old).length === 40, 'รัน upgrade ซ้ำ ไม่เปลี่ยนอะไร');

/* ---------- 4) เลื่อนไปช่องว่างถัดไป ---------- */
console.log('4) findNextSlot: ห้ามทับ locked/BUFFER และต้องตรงพลังงาน');
const today = '2026-09-21';
let moved = 0, skippedLocked = 0, bad = [];
const lockedBufferSpans = (d, iso) => S.busyOn(d, iso).filter((x) => x.item.energy === 'locked' || x.item.buffer).map((x) => x.span);
for (const t of S.datedItems(fresh)) {
  const r = S.findNextSlot(fresh, t, { today, nowMin: 0 });
  if (t.energy === 'locked') { if (r === null) skippedLocked++; else bad.push('ย้าย locked ได้: ' + t.activity); continue; }
  if (!r) { bad.push('หา slot ไม่เจอ: ' + t.activity); continue; }
  moved++;
  const cand = [S.toMin(r.start), S.toMin(r.end)];
  const hit = S.busyOn(fresh, r.date, t.id).some((b) => cand[0] < b.span[1] && b.span[0] < cand[1]);
  if (hit) bad.push(`ทับการ์ดอื่น: ${t.activity} → ${r.date} ${r.start}`);
  if (lockedBufferSpans(fresh, r.date).some((b) => cand[0] < b[1] && b[0] < cand[1])) bad.push('ทับ locked/BUFFER: ' + t.activity);
  if (r.date <= t.date && t.date >= today) bad.push(`ไม่ได้ย้ายไปวันถัดไป: ${t.activity} ${t.date} → ${r.date}`);
  if (cand[1] - cand[0] !== S.spanOf(t)[1] - S.spanOf(t)[0]) bad.push('ความยาวบล็อกเพี้ยน: ' + t.activity);
}
ok(bad.length === 0, `ย้ายได้ ${moved} ใบ · locked ห้ามย้าย ${skippedLocked} ใบ` + (bad.length ? '\n    ' + bad.join('\n    ') : ''));
// ตัวอย่าง: deep ต้องไปลงช่อง deep เท่านั้น
const deep = S.datedItems(fresh).find((t) => t.id === 'fs-2026-09-30-1015-dsml');
const rd = S.findNextSlot(fresh, deep, { today, nowMin: 0 });
ok(rd && ['SAT', 'SUN', 'WED'].includes(['SUN','MON','TUE','WED','THU','FRI','SAT'][new Date(rd.date + 'T00:00').getDay()]), `deep "cleaning" 30 ก.ย. → ${rd?.date} ${rd?.start}–${rd?.end}`);

/* ---------- 5) progress โปรเจค ---------- */
console.log('5) projectStats');
fresh.statuses['weekly:dated'] = { 'fs-2026-09-29-2000-os-s': 'done' };
const pOs = S.projectStats(fresh, fresh.sprint.projects.find((p) => p.id === 'os-s'), '2026-09-30');
ok(pOs.total === 3 && pOs.done === 1 && pOs.pct === 33, `os-s: ${pOs.done}/${pOs.total} = ${pOs.pct}%`);
ok(pOs.daysLeft === 2 && pOs.warn === true, `os-s เหลือ ${pOs.daysLeft} วัน, % < 70 → warn=${pOs.warn}`);
const rv = S.weekReview(fresh, '2026-W40', '2026-10-05');
ok(rv.unfinished.length === 12 - 1, `review W40: ค้าง ${rv.unfinished.length} (ติ๊กไปแล้ว 1)`);
ok(rv.overdueMilestones.map((x) => x.m.id).join(',') === 'M0,M1,M2,M3', `milestone เลยกำหนด ณ 5 ต.ค.: ${rv.overdueMilestones.map((x) => x.m.id)}`);

console.log(fail ? `\n❌ FAIL ${fail}` : '\n✅ ALL PASS');
process.exit(fail ? 1 : 0);
