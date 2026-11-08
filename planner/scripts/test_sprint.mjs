// ทดสอบ data layer ของแผนผูกวันที่ (รันด้วย node) — schema v20 = MLSys Roadmap ปิดเทอม 3/1 · v23 = คาบเทอม 3/2 ตามแผน
const base = new URL('../src/data/', import.meta.url).href;
const seedM = await import(base + 'seed.js');
const storeM = await import(base + 'store.js');
const S = await import(base + 'sprint.js');

let fail = 0;
const ok = (cond, msg) => { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) fail++; };
const sec = (d, id) => d.sections.find((s) => s.id === id);
const wk = (d) => sec(d, 'weekly');
const WEEKDAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const dow = (iso) => WEEKDAY[new Date(iso + 'T00:00').getDay()];

/* ---------- 1) seed ใหม่ (เครื่องใหม่) ---------- */
console.log('1) buildSeedDoc v23');
const fresh = seedM.buildSeedDoc();
const tasks = S.datedItems(fresh);
ok(fresh.schemaVersion === 23, 'schemaVersion = 23');
ok(S.SPRINT.id === 'mlsys-break-2569-1', 'แผน active = mlsys-break-2569-1');
ok(tasks.length === 27, `task ผูกวันที่ = 27 (ได้ ${tasks.length})`);
ok(tasks.every((t) => t.id.startsWith('mls-')), 'id task ใหม่ขึ้นต้น mls-');
const fsIds = new Set(S.RETIRED_V20.finalSprintTasks);
ok(fsIds.size === 40 && tasks.every((t) => !fsIds.has(t.id)), 'id task ใหม่ไม่ชน task Final Sprint 40 ตัว');
ok(!wk(fresh).items.some((i) => String(i.id).startsWith('fs-')), 'ไม่มี task Final Sprint ค้างบนบอร์ด');
ok(tasks.every((t) => t.date >= '2026-11-07' && t.date <= '2026-11-22'), 'task อยู่ในช่วง 7–22 พ.ย. 2569');
ok(fresh.sprint.id === 'mlsys-break-2569-1' && fresh.sprint.projects.length === 5 && fresh.sprint.milestones.length === 5,
  `projects ${fresh.sprint.projects.length} · milestones ${fresh.sprint.milestones.length} (ต้อง 5 · 5)`);
ok(!fresh.sprint.projects.some((p) => ['dsml', 'emb', 'os-s', 'os-l', 'final'].includes(p.id)), 'ไม่มีโปรเจค Final Sprint');
ok(S.isPaused(fresh, 'icpc'), 'icpc paused');
ok(!sec(fresh, 'exam'), 'ไม่มีแท็บเตรียมสอบ');
ok(sec(fresh, 'classes') && sec(fresh, 'classes').items.every((i) => i.id.startsWith('c2-')), 'ตารางเรียน: ไม่มีคาบเทอม 1 · มีแค่คาบเทอม 3/2 (c2-*)');
ok(!wk(fresh).items.some((i) => String(i.id).startsWith('rd-')), 'ไม่มีถาดวิชา rd-*');
ok(wk(fresh).items.filter((i) => i.kind === 'book').map((i) => i.id).join(',') === 'bk-udl,bk-islp,bk-d2l,bk-cod,bk-hp', 'ถาดหนังสือ = L1 3 เล่ม + COD + H&P (ไม่มีเล่มเทอม 1)');
const bookIds = wk(fresh).items.filter((i) => i.kind === 'book').map((i) => i.id);
ok(bookIds.slice(0, 3).join(',') === 'bk-udl,bk-islp,bk-d2l', 'UDL / ISLP / d2l อยู่หัวถาดหนังสือ');
ok(wk(fresh).items.filter((i) => ['bk-udl','bk-islp','bk-d2l'].includes(i.id)).every((i) => String(i.url).startsWith('https://') && i.pool && i.day === ''), 'การ์ดหนังสือ L1 มีลิงก์ และอยู่ในถาด');
ok(sec(fresh, 'fitness').items.length === 7, 'fitness 7 การ์ด');
ok(wk(fresh).dated === true && wk(fresh).note === S.SPRINT.app.boardHeader, 'weekly = บอร์ดผูกวันที่ + header จาก JSON');
const rm = sec(fresh, 'roadmap').items.map((i) => i.id);
ok(['L1', 'L2', 'L3', 'L4', 'L5', 'L6'].every((l) => rm.includes('mlr-' + l)), `roadmap มี L1–L6 (${rm.join(',')})`);
ok(sec(fresh, 'roadmap').items.some((i) => i.url === S.SPRINT.skillTreeArtifact), 'roadmap มีลิงก์ skill tree');
ok(sec(fresh, 'projects').items.map((i) => i.id).join(',') === 'mlp-P1,mlp-P2,mlp-P3,mlp-P4,mlp-P5', 'projects = P1–P5');
const learn = sec(fresh, 'learn').items;
ok(learn.length === S.SPRINT.resources.length && learn.every((i) => /^https?:\/\//.test(i.url)), `learn = resources ${learn.length} ลิงก์ (มี url ครบ)`);
const allIds = fresh.sections.flatMap((s) => s.items.map((i) => i.id));
ok(new Set(allIds).size === allIds.length, 'id การ์ดทั้งแอปไม่ซ้ำกัน');
const newCards = ['roadmap', 'projects', 'learn'].flatMap((id) => sec(fresh, id).items);
ok(newCards.every((i) => !String(i.id).startsWith('u')), 'การ์ด seed ใหม่ไม่มี id ขึ้นต้น u (จะถูกนับเป็นการ์ดผู้ใช้)');
const v = S.validateSprint(fresh);
ok(v.length === 0, 'validateSprint ผ่าน (ไม่มีเวลาทับ / start<end / milestone+project มีจริง)' + (v.length ? '\n    ' + v.join('\n    ') : ''));
ok(tasks.every((t) => ['deep', 'light', 'locked'].includes(t.energy)), 'ทุก task มี energy');

/* ---------- 2) idempotent ---------- */
console.log('2) seed ซ้ำไม่เกิด task ซ้ำ');
const again = S.seedSprintTasks(fresh);
S.applyMlsysRoadmap(fresh);
const rmLen = sec(fresh, 'roadmap').items.length;
ok(again === 0 && S.datedItems(fresh).length === 27, `seed ซ้ำ 2 รอบ → เติม ${again} · ยังเป็น ${S.datedItems(fresh).length}`);
ok(rmLen === 7 && sec(fresh, 'learn').items.length === learn.length, 'การ์ด roadmap/learn ไม่เบิ้ล');

/* ---------- 3) migration ข้อมูลผู้ใช้ v19 → v20 ---------- */
console.log('3) upgradeDoc: ข้อมูลผู้ใช้ v19 → v20');
const v19 = seedM.buildBaseSeed();
S.applyFinalSprint(v19);              // = หน้าตา doc ของผู้ใช้หลังขั้น v18→v19
v19.schemaVersion = 19;
v19.sprintMigration = { at: '2026-09-22T00:00:00Z', removed: 120, backupFile: 'mission_log_backup_2026-09-22.json' };
ok(S.datedItems(v19).length === 40 && v19.sprint.id === 'final-sprint-2569-1', 'fixture v19: 40 task Final Sprint');
v19.finance.transactions.push({ id: 'tx1', type: 'income', amount: 5000, category: 'x', note: '', date: '2026-09-01' });
v19.statuses.icpc = { f1: 'done' };
v19.statuses['weekly:dated'] = { 'fs-2026-09-29-2000-os-s': 'done', uDated: 'done' };
v19.statuses['weekly:2026-W45'] = { 'rd-os': 'done', 'bk-cod': 'running' };
v19.statuses.exam = { uExam: 'done' };
v19.sprint.projects.find((p) => p.id === 'research').deadline = '2026-12-31'; // ค่าที่ผู้ใช้แก้ในแผนเก่า
wk(v19).items.find((i) => i.id === 'rd-os').day = 'พุธ WED';
wk(v19).items.push({ id: 'uDated', date: '2026-10-05', day: 'จันทร์ MON', start: '13:00', end: '14:00', time: '13:00–14:00', project: 'dsml', milestone: 'M2', energy: 'light', activity: 'custom dated', cat: 'plan' });
wk(v19).items.push({ id: 'uRes', date: '2026-10-06', day: 'อังคาร TUE', start: '13:00', end: '14:00', time: '13:00–14:00', project: 'research', milestone: 'M1', energy: 'light', activity: 'custom research', cat: 'res' });
sec(v19, 'exam').items.push({ id: 'uExam', group: 'g', activity: 'โน้ตสอบที่เพิ่มเอง', cat: 'exam' });
sec(v19, 'classes').items.push({ id: 'uClass', day: 'จันทร์ MON', time: '9:00–12:00', activity: 'คาบที่เพิ่มเอง', cat: 'class' });
sec(v19, 'roadmap').items.push({ id: 'uRoad', group: 'mine', activity: 'roadmap ที่เพิ่มเอง', cat: 'road' });
const icpcBefore = sec(v19, 'icpc').items.length;
const libraryBefore = JSON.stringify(sec(v19, 'library'));
const financeBefore = JSON.stringify(v19.finance);

const changed = storeM.upgradeDoc(v19);
ok(changed && v19.schemaVersion === 23, 'อัปเกรดเป็น v23 (ผ่าน v20–v22)');
ok(JSON.stringify(v19.finance) === financeBefore, 'finance ไม่ถูกแตะ');
ok(sec(v19, 'icpc').items.length === icpcBefore && v19.statuses.icpc?.f1 === 'done' && S.isPaused(v19, 'icpc'), 'icpc: การ์ด+สถานะอยู่ครบ และยัง paused');
ok(JSON.stringify(sec(v19, 'library')) === libraryBefore, 'ชั้นหนังสือไม่ถูกแตะ');
ok(sec(v19, 'fitness').items.length === 7, 'fitness อยู่ครบ');
ok(!wk(v19).items.some((i) => fsIds.has(i.id)), 'task Final Sprint (fs-*) ถูกลบหมด');
ok(!('fs-2026-09-29-2000-os-s' in v19.statuses['weekly:dated']) && v19.statuses['weekly:dated'].uDated === 'done', 'สถานะ fs-* ถูกลบ · สถานะการ์ดผู้ใช้คงอยู่');
ok(v19.sprint.id === 'mlsys-break-2569-1' && v19.sprint.projects.map((p) => p.id).join(',') === 'l1,p1,coop,research,hack', 'projects = ชุดใหม่ล้วน');
ok(v19.sprint.projects.find((p) => p.id === 'research').deadline === null, 'ค่าโปรเจค research ของแผนเก่าไม่รั่วมาแผนใหม่');
ok(v19.sprint.milestones.map((m) => m.id).join(',') === 'M0,M1,M2,M3,M4', 'milestones = M0–M4 ชุดใหม่');
const uDated = wk(v19).items.find((i) => i.id === 'uDated');
const uRes = wk(v19).items.find((i) => i.id === 'uRes');
ok(uDated && !uDated.project && !uDated.milestone, 'การ์ดผู้ใช้ผูกโปรเจคเก่า (dsml) → คงการ์ด ตัดลิงก์ project/milestone');
ok(uRes && uRes.project === 'research' && !uRes.milestone, 'การ์ดผู้ใช้ project research → คง project · ตัด milestone (M1 ความหมายใหม่)');
ok(!sec(v19, 'exam'), 'แท็บเตรียมสอบถูกลบ');
const moved = wk(v19).items.find((i) => i.id === 'uExam');
ok(moved && moved.pool === true && moved.day === '', 'การ์ดผู้ใช้ในแท็บเตรียมสอบย้ายเข้าถาด weekly');
ok(!v19.statuses.exam, 'สถานะแท็บเตรียมสอบถูกลบ');
const cls = sec(v19, 'classes').items.map((i) => i.id);
ok(!cls.some((id) => id.startsWith('cl-')) && cls.filter((id) => !id.startsWith('c2-')).join() === 'uClass', `ตารางเรียน: ถอด cl-* 10 ใบ เหลือการ์ดผู้ใช้ + c2-* (${cls})`);
ok(!wk(v19).items.some((i) => S.RETIRED_V20.pool.includes(i.id)), 'ถาดวิชา rd-* ถูกลบ');
ok(!('rd-os' in v19.statuses['weekly:2026-W45']) && v19.statuses['weekly:2026-W45']['bk-cod'] === 'running', 'สถานะ rd-* ถูกลบ · สถานะ bk-* คงอยู่');
ok(wk(v19).items.filter((i) => i.kind === 'book').length === 5, 'ถาดหนังสือ: L1 3 + COD + H&P');
ok(sec(v19, 'roadmap').items.some((i) => i.id === 'uRoad') && sec(v19, 'roadmap').items[0].id === 'mlr-L1', 'roadmap: L1–L6 นำหน้า + การ์ดผู้ใช้คงอยู่');
ok(S.datedItems(v19).filter((t) => t.id.startsWith('mls-')).length === 27, 'มี task ใหม่ 27');
const mig = v19.sprintMigration;
ok(mig && mig.label === 'MLSys Roadmap' && mig.backupKey === storeM.BACKUP_KEY_V20 && mig.backupFile === null, 'บันทึกการอัปเกรด + ชี้ backup key pre-v20');
ok(mig.removed === 40 + 6 + 10 && mig.detail.movedToPool === 1, `จำนวนที่ล้าง ${mig.removed} (fs 40 + rd 6 + cl 10) · ย้ายเข้าถาด ${mig.detail.movedToPool}`);
ok(!mig.prev, 'backup v19 ส่งสำเร็จแล้ว → ไม่ต้องเก็บ prev');
const v2 = S.validateSprint(v19);
ok(v2.length === 0, 'validateSprint หลัง migration ผ่าน' + (v2.length ? '\n    ' + v2.join('\n    ') : ''));
ok(storeM.upgradeDoc(v19) === false && S.datedItems(v19).length === 29, 'รัน upgrade ซ้ำ ไม่เปลี่ยนอะไร (27 task + การ์ดผู้ใช้ 2)');

/* ---------- 4) migration ประวัติ v18 → v20 ยังไม่พัง ---------- */
console.log('4) upgradeDoc: ข้อมูลผู้ใช้ v18 → v20 (ผ่านขั้น Final Sprint)');
const old = seedM.buildBaseSeed();
old.finance.transactions.push({ id: 'tx1', type: 'income', amount: 1, category: 'x', note: '', date: '2026-09-01' });
wk(old).items.push({ id: 'uMine', day: 'ศุกร์ FRI', time: '10:00–11:00', activity: 'custom', cat: 'plan' });
storeM.upgradeDoc(old);
ok(old.schemaVersion === 23 && old.finance.transactions.length === 1, 'v18 → v23 · finance คงอยู่');
ok(S.datedItems(old).length === 27 && !wk(old).items.some((i) => i.id.startsWith('fs-')), 'task ใหม่ 27 · ไม่มี fs-* ค้าง');
ok(!old.sprintMigration.prev && old.sprintMigration.backupKey === storeM.BACKUP_KEY_V20, 'กระโดด v18→v20: ส่ง backup ก้อนเดียว (pre-v20 = ข้อมูล v18) ไม่ส่งซ้ำ');
const v19b = seedM.buildBaseSeed();
S.applyFinalSprint(v19b);
v19b.schemaVersion = 19;
v19b.sprintMigration = { at: 'x', removed: 1, backupFile: null };
storeM.upgradeDoc(v19b);
ok(v19b.sprintMigration.prev?.backupKey === storeM.BACKUP_KEY, 'v19 ที่ backup ยังส่งไม่สำเร็จ → เก็บไว้ใน prev ให้ App ส่งต่อ');
ok(S.validateSprint(old).length === 0, 'validateSprint ผ่าน');


/* ---------- 4b) v20 → v21: เติมหนังสือ L1 เท่านั้น ---------- */
console.log('4b) upgradeDoc: v20 → v21 (ถาดหนังสือ L1)');
const v20 = seedM.buildSeedDoc();
wk(v20).items = wk(v20).items.filter((i) => !['bk-udl', 'bk-islp', 'bk-d2l'].includes(i.id));
v20.schemaVersion = 20;
wk(v20).items.find((i) => i.id === 'bk-cod').day = 'จันทร์ MON';
const snapshot = JSON.stringify({ ...v20, schemaVersion: 0, sections: v20.sections.filter((s) => s.id !== 'weekly' && s.id !== 'classes') });
storeM.upgradeDoc(v20);
ok(v20.schemaVersion === 23 && ['bk-udl', 'bk-islp', 'bk-d2l'].every((id) => wk(v20).items.some((i) => i.id === id)), 'เติม UDL / ISLP / d2l');
ok(wk(v20).items.find((i) => i.id === 'bk-cod').day === 'จันทร์ MON', 'การ์ดหนังสือที่จองวันไว้ไม่ถูกแตะ');
ok(JSON.stringify({ ...v20, schemaVersion: 0, sections: v20.sections.filter((s) => s.id !== 'weekly' && s.id !== 'classes') }) === snapshot, 'แท็บอื่น/สถานะ/การเงินไม่เปลี่ยน');
ok(S.addL1Books(v20) === 0, 'เติมซ้ำไม่เบิ้ล');


/* ---------- 4c) v21 → v22: ถอดหนังสือเทอม 1 ---------- */
console.log('4c) upgradeDoc: v21 → v22 (ลบหนังสือเทอม 1)');
const v21 = seedM.buildBaseSeed();
S.applyFinalSprint(v21); S.applyMlsysRoadmap(v21); S.addL1Books(v21); v21.schemaVersion = 21;
ok(wk(v21).items.filter((i) => i.kind === 'book').length === 13, 'fixture v21: ถาด 13 เล่ม');
wk(v21).items.find((i) => i.id === 'bk-silber').day = 'จันทร์ MON';
wk(v21).items.push({ id: 'uBook', pool: true, kind: 'book', day: '', activity: 'หนังสือที่เพิ่มเอง', cat: 'book' });
v21.statuses['weekly:2026-W46'] = { 'bk-walpole': 'done', 'bk-cod': 'running' };
storeM.upgradeDoc(v21);
const ids = wk(v21).items.filter((i) => i.kind === 'book').map((i) => i.id);
ok(v21.schemaVersion === 23 && S.RETIRED_V22_BOOKS.every((id) => !ids.includes(id)), 'ถอด 8 เล่มเทอม 1 (รวมใบที่จองวันไว้)');
ok(['bk-udl', 'bk-islp', 'bk-d2l', 'bk-cod', 'bk-hp', 'uBook'].every((id) => ids.includes(id)), 'เก็บ L1 + COD + H&P + หนังสือที่เพิ่มเอง');
ok(!('bk-walpole' in v21.statuses['weekly:2026-W46']) && v21.statuses['weekly:2026-W46']['bk-cod'] === 'running', 'สถานะเล่มที่ถอดถูกลบ · ของ COD คงอยู่');
ok(S.datedItems(v21).length === 27, 'task บนบอร์ดไม่ถูกแตะ');

/* ---------- 4d) v22 → v23: ตารางเรียนเทอม 3/2 ตามแผน ---------- */
console.log('4d) upgradeDoc: v22 → v23 (คาบเรียนเทอม 3/2)');
const v22 = seedM.buildBaseSeed();
S.applyFinalSprint(v22); S.applyMlsysRoadmap(v22); S.addL1Books(v22); S.removeTerm1Books(v22); v22.schemaVersion = 22;
ok(sec(v22, 'classes').items.length === 0, 'fixture v22: แท็บตารางเรียนว่าง');
sec(v22, 'classes').items.push({ id: 'uTA', day: 'พุธ WED', time: '13:00–16:00', meta: '', activity: 'TA ที่เพิ่มเอง', cat: 'class' });
const otherSnap = JSON.stringify({ ...v22, schemaVersion: 0, sections: v22.sections.filter((s) => s.id !== 'classes') });
storeM.upgradeDoc(v22);
const cIds = sec(v22, 'classes').items.map((i) => i.id);
ok(v22.schemaVersion === 23 && S.TERM2_PLAN_CLASSES.every((c) => cIds.includes(c.id)), 'เติมคาบ c2-* ครบ 5');
ok(cIds.includes('uTA'), 'คาบที่ผู้ใช้เพิ่มเองคงอยู่');
ok(sec(v22, 'classes').items.filter((i) => i.id.startsWith('c2-')).every((i) => i.meta.startsWith('แผน')), 'ทุกใบติดป้าย "แผน"');
ok(JSON.stringify({ ...v22, schemaVersion: 0, sections: v22.sections.filter((s) => s.id !== 'classes') }) === otherSnap, 'แท็บอื่น/สถานะ/การเงินไม่เปลี่ยน');
ok(S.addTerm2PlanClasses(v22) === 0, 'เติมซ้ำไม่เบิ้ล');
ok(S.datedItems(v22).length === 27, 'task บนบอร์ดไม่ถูกแตะ');
ok(sec(fresh, 'classes').items.length === 5, 'seed ใหม่มีคาบ 3/2 ครบ 5');

/* ---------- 5) เลื่อนไปช่องว่างถัดไป ---------- */
console.log('5) findNextSlot: ห้ามทับ locked/BUFFER และต้องตรงพลังงาน');
const today = '2026-11-07';
let movedN = 0, skippedLocked = 0;
const bad = [];
const lockedBufferSpans = (d, iso) => S.busyOn(d, iso).filter((x) => x.item.energy === 'locked' || x.item.buffer).map((x) => x.span);
for (const t of S.datedItems(fresh)) {
  const r = S.findNextSlot(fresh, t, { today, nowMin: 0 });
  if (t.energy === 'locked') { if (r === null) skippedLocked++; else bad.push('ย้าย locked ได้: ' + t.activity); continue; }
  if (!r) { bad.push('หา slot ไม่เจอ: ' + t.activity); continue; }
  movedN++;
  const cand = [S.toMin(r.start), S.toMin(r.end)];
  if (S.busyOn(fresh, r.date, t.id).some((b) => cand[0] < b.span[1] && b.span[0] < cand[1])) bad.push(`ทับการ์ดอื่น: ${t.activity} → ${r.date} ${r.start}`);
  if (lockedBufferSpans(fresh, r.date).some((b) => cand[0] < b[1] && b[0] < cand[1])) bad.push('ทับ locked/BUFFER: ' + t.activity);
  if (r.date <= t.date && t.date >= today) bad.push(`ไม่ได้ย้ายไปวันถัดไป: ${t.activity} ${t.date} → ${r.date}`);
  if (cand[1] - cand[0] !== S.spanOf(t)[1] - S.spanOf(t)[0]) bad.push('ความยาวบล็อกเพี้ยน: ' + t.activity);
  const win = S.SPRINT.energyWindows[t.energy === 'deep' ? 'deep' : 'light'][dow(r.date)] || [];
  if (!win.some(([a, b]) => cand[0] >= S.toMin(a) && cand[1] <= S.toMin(b))) bad.push(`ไม่อยู่ในช่องพลังงาน ${t.energy}: ${t.activity} → ${r.date} ${r.start}`);
}
ok(bad.length === 0, `ย้ายได้ ${movedN} ใบ · locked ห้ามย้าย ${skippedLocked} ใบ` + (bad.length ? '\n    ' + bad.join('\n    ') : ''));
ok(skippedLocked === 1, 'locked 1 ใบ (Hackathon 21 พ.ย.)');

/* ---------- 6) progress โปรเจค ---------- */
console.log('6) projectStats / weekReview');
const p1Tasks = S.datedItems(fresh).filter((t) => t.project === 'p1');
fresh.statuses['weekly:dated'] = { [p1Tasks[0].id]: 'done' };
const pP1 = S.projectStats(fresh, fresh.sprint.projects.find((p) => p.id === 'p1'), '2026-11-18');
ok(pP1.total === 4 && pP1.done === 1 && pP1.pct === 25, `p1: ${pP1.done}/${pP1.total} = ${pP1.pct}%`);
ok(pP1.daysLeft === 2 && pP1.warn === true && pP1.next?.id === 'M3', `p1 เหลือ ${pP1.daysLeft} วัน · warn=${pP1.warn} · ถัดไป ${pP1.next?.id}`);
const rv = S.weekReview(fresh, '2026-W46', '2026-11-16');
ok(rv.overdueMilestones.map((x) => x.m.id).join(',') === 'M0,M1', `milestone เลยกำหนด ณ 16 พ.ย.: ${rv.overdueMilestones.map((x) => x.m.id)}`);

console.log(fail ? `\n❌ FAIL ${fail}` : '\n✅ ALL PASS');
process.exit(fail ? 1 : 0);
