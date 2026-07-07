// ---------- Seed data (ค่าเริ่มต้นตอนเปิดแอปครั้งแรก) ----------
//
// สำคัญ: นี่คือ "ค่าเริ่มต้น" เท่านั้น — หลังเปิดครั้งแรกข้อมูลจริงอยู่ใน localStorage
// และแก้ไขทุกรายการได้ผ่าน UI (ปุ่ม ✎ / 🗑 / + เพิ่มรายการ)
//
// เนื้อหา sections เดิมคัดลอกจาก planner_v2.html แบบคำต่อคำ และ **ใช้ item id เดิม**
// เพื่อให้ migration ดึงสถานะที่เคยติ๊กไว้กลับมาได้ตรง ๆ
// มีของใหม่ 2 อย่าง: section "ตารางเรียน" (จากตาราง Notion) และแผน ICPC ที่วางใหม่

// โครงสร้าง section:
//   id         ใช้เป็น key สถานะ + จับคู่ตอน migrate (ห้ามซ้ำ)
//   tab        ป้ายบนแท็บ sidebar
//   layout     'days' = จัดตามวันในสัปดาห์ | 'group' = จัดตามกลุ่มหัวข้อ
//   resettable true = สถานะติ๊กรีเซ็ตใหม่ทุกสัปดาห์ (weekly, fitness)
//   checkable  false = การ์ดข้อมูลล้วน ไม่มีสถานะติ๊ก (ตารางเรียน)
//
// โครงสร้าง item: { id, activity, cat, day?, time?, meta?, group?, url?, track? }
//   track (เฉพาะ ICPC): '' = แผนหลัก | 'qualified' = หลังแข่งถ้าติดรอบ | 'notq' = ถ้าไม่ติด

const SECTIONS = [
  // ---------- 1) ตารางเรียน (ใหม่ — จากตารางใน Notion) ----------
  {
    id: 'classes', tab: 'ตารางเรียน', layout: 'days', resettable: false, checkable: false,
    note: 'ตารางเรียนเทอมนี้ · แก้วิชา/วัน/เวลา/ห้อง ได้จากปุ่ม ✎ บนการ์ด',
    items: [
      { id: 'cl-mon1', day: 'จันทร์ MON', time: '9:00–12:00', meta: 'ห้อง 17304', activity: 'ระบบฝังตัวเบื้องต้น (Introduction to Embedded Systems)', cat: 'class' },
      { id: 'cl-mon2', day: 'จันทร์ MON', time: '13:00–16:00', meta: 'ห้อง 17204', activity: 'English for Job Opportunities', cat: 'class' },
      { id: 'cl-mon3', day: 'จันทร์ MON', time: '16:30–19:30', meta: '', activity: 'TA วิชา Compro', cat: 'class' },
      { id: 'cl-tue1', day: 'อังคาร TUE', time: '9:00–12:00', meta: 'Lab Com 3', activity: 'ปฏิบัติการผสานเทคโนโลยีสารสนเทศ (IT Integration Lab)', cat: 'class' },
      { id: 'cl-tue2', day: 'อังคาร TUE', time: '13:00–16:00', meta: 'ห้อง 1402', activity: 'ความน่าจะเป็นและสถิติสำหรับสารสนเทศศาสตร์ (Prob & Stat)', cat: 'class' },
      { id: 'cl-tue3', day: 'อังคาร TUE', time: '16:30–19:30', meta: 'ห้อง 17306', activity: 'ระบบปฏิบัติการ (Operating Systems)', cat: 'class' },
      { id: 'cl-wed1', day: 'พุธ WED', time: '08:00–10:00', meta: 'อาคารพลศึกษา', activity: 'ว่ายน้ำเพื่อสุขภาพ', cat: 'class' },
      { id: 'cl-thu1', day: 'พฤหัส THU', time: '9:00–12:00', meta: 'ห้อง 1302', activity: 'วิทยาศาสตร์ข้อมูลเบื้องต้น (Introduction to Data Science)', cat: 'class' },
      { id: 'cl-fri1', day: 'ศุกร์ FRI', time: '9:00–12:00', meta: 'ห้องติดต่อผู้สอน', activity: 'การเรียนรู้ของเครื่อง (Machine Learning)', cat: 'class' },
      { id: 'cl-fri2', day: 'ศุกร์ FRI', time: '13:00–16:00', meta: 'ห้อง Lab Logic', activity: 'ปฏิบัติการระบบฝังตัว (Embedded Systems Lab)', cat: 'class' },
    ],
  },

  // ---------- 2) ตารางซ้อมประจำสัปดาห์ (เดิม — รีเซ็ตรายสัปดาห์) ----------
  {
    id: 'weekly', tab: 'weekly', layout: 'days', resettable: true, checkable: true,
    note: 'ตารางประจำสัปดาห์ · รีเซ็ตอัตโนมัติ',
    items: [
      { id: 'mon1', day: 'จันทร์ MON', time: '19:30–21:00', activity: 'ICPC: ทำโจทย์เดี่ยว 2–3 ข้อ ตาม topic ของ phase ปัจจุบัน', cat: 'icpc' },
      { id: 'tue1', day: 'อังคาร TUE', time: '09:00–11:00', activity: 'ทบทวน Prob&Stat (วิชาเลเวอเรจสูงสุดต่อสาย DS/ML)', cat: 'review' },
      { id: 'tue2', day: 'อังคาร TUE', time: '19:00–20:30', activity: 'Skill: ฝึก SQL / pandas drills', cat: 'skill' },
      { id: 'wed1', day: 'พุธ WED', time: '13:00–15:00', activity: 'ICPC: upsolve โจทย์ที่ค้างจาก contest เสาร์', cat: 'icpc' },
      { id: 'wed2', day: 'พุธ WED', time: '19:00–20:30', activity: 'ทำโปรเจกต์ AI (Project ปัจจุบัน)', cat: 'ai' },
      { id: 'thu1', day: 'พฤหัส THU', time: '13:00–15:00', activity: 'Skill: statistics→data / DL track ตาม roadmap', cat: 'skill' },
      { id: 'thu2', day: 'พฤหัส THU', time: '20:00–21:30', activity: 'ทบทวน OS / Embedded (สลับกัน)', cat: 'review' },
      { id: 'fri1', day: 'ศุกร์ FRI', time: '16:30–18:00', activity: 'ICPC: เรียน topic ใหม่ + โจทย์ประกอบ', cat: 'icpc' },
      { id: 'sat1', day: 'เสาร์ SAT', time: '09:00–12:00', activity: 'Virtual Contest (CF Div2 / ICPC Gym) — เป็นทีมถ้าได้', cat: 'icpc' },
      { id: 'sun1', day: 'อาทิตย์ SUN', time: '14:00–16:00', activity: 'โปรเจกต์ AI: deep work', cat: 'ai' },
      { id: 'sun2', day: 'อาทิตย์ SUN', time: '19:00–20:00', activity: 'สรุปสัปดาห์ + วางแผน + อ่าน paper/บทความ ML 1 ชิ้น', cat: 'plan' },
    ],
  },

  // ---------- 3) ICPC (วางแผนใหม่ — นับถอยหลัง contest 19 ก.ค. แบบ taper) ----------
  // จัดวันหนัก/เบาตามตารางเรียนจริง: จ+อ เรียนถึง 19:30 → ซ้อมเบา · พ/พฤ/ศ ว่างช่วงบ่าย-เย็น
  // และเสาร์-อาทิตย์ → อัดหนัก · สามวันสุดท้ายก่อนแข่ง taper ลงให้พีคพอดีวันจริง
  {
    id: 'icpc', tab: 'icpc', layout: 'group', resettable: false, checkable: true,
    note: 'นับถอยหลัง contest อา 19 ก.ค. · taper หนัก→เบา · ทุก session แก้/เพิ่ม/ลบได้ · สลับแผนหลังแข่งได้ที่ตัวเลือกขวามือ',
    items: [
      // ช่วงที่ 1 · GRIND — เก็บ topic หลักให้ครบ ปริมาณสูงสุด
      { id: 'cd02', group: 'ช่วงที่ 1 · GRIND (พฤ 2 – ศ 10 ก.ค.) — อัดหนัก เก็บ topic หลัก', meta: 'พฤ 2 ก.ค. · 3 ข้อ · หลังเลิกเรียน', activity: 'DP หลัก: knapsack, LIS, coin change', cat: 'icpc' },
      { id: 'cd03', group: 'ช่วงที่ 1 · GRIND (พฤ 2 – ศ 10 ก.ค.) — อัดหนัก เก็บ topic หลัก', meta: 'ศ 3 ก.ค. · 3 ข้อ · หลังเลิกเรียน', activity: 'Graph หลัก: BFS/DFS, Dijkstra, topological sort', cat: 'icpc' },
      { id: 'cd04', group: 'ช่วงที่ 1 · GRIND (พฤ 2 – ศ 10 ก.ค.) — อัดหนัก เก็บ topic หลัก', meta: 'ส 4 ก.ค. · 5–6 ข้อ · เต็มวัน', activity: 'Virtual Contest #1 (CF Div.2 เต็มเวลา) + จด topic ที่พลาดไว้', cat: 'icpc' },
      { id: 'cd05', group: 'ช่วงที่ 1 · GRIND (พฤ 2 – ศ 10 ก.ค.) — อัดหนัก เก็บ topic หลัก', meta: 'อา 5 ก.ค. · 4 ข้อ', activity: 'Upsolve contest เมื่อวานให้ครบ + Segment Tree / BIT', cat: 'icpc' },
      { id: 'cd06', group: 'ช่วงที่ 1 · GRIND (พฤ 2 – ศ 10 ก.ค.) — อัดหนัก เก็บ topic หลัก', meta: 'จ 6 ก.ค. · 2 ข้อ · เบา (เรียน+TA ถึง 19:30)', activity: 'Two pointers + binary search on answer', cat: 'icpc' },
      { id: 'cd07', group: 'ช่วงที่ 1 · GRIND (พฤ 2 – ศ 10 ก.ค.) — อัดหนัก เก็บ topic หลัก', meta: 'อ 7 ก.ค. · 2 ข้อ · เบา (เรียนถึง 19:30)', activity: 'Number Theory: sieve, modpow, nCr mod p', cat: 'icpc' },
      { id: 'cd08', group: 'ช่วงที่ 1 · GRIND (พฤ 2 – ศ 10 ก.ค.) — อัดหนัก เก็บ topic หลัก', meta: 'พ 8 ก.ค. · 4 ข้อ · ว่างหลัง 10:00', activity: 'Advanced DP: bitmask DP, DP on trees', cat: 'icpc' },
      { id: 'cd09', group: 'ช่วงที่ 1 · GRIND (พฤ 2 – ศ 10 ก.ค.) — อัดหนัก เก็บ topic หลัก', meta: 'พฤ 9 ก.ค. · 3 ข้อ · ว่างหลังเที่ยง', activity: 'Graph ขั้นสูง: SCC, bridges/articulation, MST', cat: 'icpc' },
      { id: 'cd10', group: 'ช่วงที่ 1 · GRIND (พฤ 2 – ศ 10 ก.ค.) — อัดหนัก เก็บ topic หลัก', meta: 'ศ 10 ก.ค. · 3 ข้อ · หลัง lab', activity: 'Strings: hashing, KMP + greedy ขั้นสูง', cat: 'icpc' },

      // ช่วงที่ 2 · SHARPEN — โหมดสนามจริง เก็บจุดอ่อน ลดปริมาณลง
      { id: 'cd11', group: 'ช่วงที่ 2 · SHARPEN (ส 11 – พ 15 ก.ค.) — โหมดสนามจริง + เก็บจุดอ่อน', meta: 'ส 11 ก.ค. · 5–6 ข้อ · เต็มวัน', activity: 'Virtual Contest #2 + upsolve ทันทีหลังจบ', cat: 'icpc' },
      { id: 'cd12', group: 'ช่วงที่ 2 · SHARPEN (ส 11 – พ 15 ก.ค.) — โหมดสนามจริง + เก็บจุดอ่อน', meta: 'อา 12 ก.ค. · 3 ข้อ', activity: 'เก็บจุดอ่อน: ทำซ้ำ topic ที่พลาดจาก 2 contests', cat: 'icpc' },
      { id: 'cd13', group: 'ช่วงที่ 2 · SHARPEN (ส 11 – พ 15 ก.ค.) — โหมดสนามจริง + เก็บจุดอ่อน', meta: 'จ 13 ก.ค. · 1 ข้อ · เบา', activity: 'Speed drill: เขียน template (DSU, Dijkstra, sieve) จากความจำ + 1 ข้อ easy', cat: 'icpc' },
      { id: 'cd14', group: 'ช่วงที่ 2 · SHARPEN (ส 11 – พ 15 ก.ค.) — โหมดสนามจริง + เก็บจุดอ่อน', meta: 'อ 14 ก.ค. · 2 ข้อ · เบา', activity: 'โจทย์จุดอ่อนระดับ easy–medium', cat: 'icpc' },
      { id: 'cd15', group: 'ช่วงที่ 2 · SHARPEN (ส 11 – พ 15 ก.ค.) — โหมดสนามจริง + เก็บจุดอ่อน', meta: 'พ 15 ก.ค. · 4 ข้อ · วันหนักวันสุดท้าย', activity: 'Mock contest ย่อ 3 ชม. จับเวลาเหมือนแข่งจริง', cat: 'icpc' },

      // ช่วงที่ 3 · TAPER — ลดโหลด รักษามือ พักให้พอ
      { id: 'cd16', group: 'ช่วงที่ 3 · TAPER (พฤ 16 – ส 18 ก.ค.) — ลดโหลด พีคให้ตรงวันแข่ง', meta: 'พฤ 16 ก.ค. · 1–2 ข้อ', activity: 'ทบทวน template ทั้งชุด + upsolve จาก mock', cat: 'icpc' },
      { id: 'cd17', group: 'ช่วงที่ 3 · TAPER (พฤ 16 – ส 18 ก.ค.) — ลดโหลด พีคให้ตรงวันแข่ง', meta: 'ศ 17 ก.ค. · 1–2 ข้อ', activity: 'วอร์มมือโจทย์ easy + เตรียมของ (บัตร, notebook, เครื่องเขียน)', cat: 'icpc' },
      { id: 'cd18', group: 'ช่วงที่ 3 · TAPER (พฤ 16 – ส 18 ก.ค.) — ลดโหลด พีคให้ตรงวันแข่ง', meta: 'ส 18 ก.ค. · 0–1 ข้อ', activity: 'พักสมอง อ่าน notebook ผ่าน ๆ นอนเร็ว ห้ามโหมของใหม่', cat: 'icpc' },

      // วันแข่ง
      { id: 'cd19', group: '🏁 วันแข่ง (อา 19 ก.ค.)', meta: 'อา 19 ก.ค.', activity: 'Contest day! วอร์ม 1 ข้อง่ายตอนเช้า ไปถึงสนามก่อนเวลา', cat: 'icpc' },

      // หลังแข่ง · กรณีติดรอบ — ยกระดับหัวข้อสู่ระดับสูง (track: 'qualified')
      { id: 'pq1', track: 'qualified', group: 'หลังแข่ง · ถ้าติดรอบ — ซ้อมเข้มข้น หัวข้อระดับสูง', activity: 'Max-flow / min-cut จริงจัง (Dinic) + โจทย์ประยุกต์', cat: 'icpc' },
      { id: 'pq2', track: 'qualified', group: 'หลังแข่ง · ถ้าติดรอบ — ซ้อมเข้มข้น หัวข้อระดับสูง', activity: 'Segment tree ขั้นสูง: lazy propagation, segment tree beats', cat: 'icpc' },
      { id: 'pq3', track: 'qualified', group: 'หลังแข่ง · ถ้าติดรอบ — ซ้อมเข้มข้น หัวข้อระดับสูง', activity: 'FFT/NTT เบื้องต้น + โจทย์ polynomial', cat: 'icpc' },
      { id: 'pq4', track: 'qualified', group: 'หลังแข่ง · ถ้าติดรอบ — ซ้อมเข้มข้น หัวข้อระดับสูง', activity: 'Geometry พื้นฐานสนามแข่ง: convex hull, sweep line', cat: 'icpc' },
      { id: 'pq5', track: 'qualified', group: 'หลังแข่ง · ถ้าติดรอบ — ซ้อมเข้มข้น หัวข้อระดับสูง', activity: 'HLD / Euler tour + โจทย์ tree query', cat: 'icpc' },
      { id: 'pq6', track: 'qualified', group: 'หลังแข่ง · ถ้าติดรอบ — ซ้อมเข้มข้น หัวข้อระดับสูง', activity: 'Team virtual contest ระดับ regional ทุกสัปดาห์ + upsolve 100%', cat: 'icpc' },
      { id: 'pq7', track: 'qualified', group: 'หลังแข่ง · ถ้าติดรอบ — ซ้อมเข้มข้น หัวข้อระดับสูง', activity: 'อัปเดต team notebook หลังทุก contest มุ่ง National (ก.ย.) → Bangkok Regional (พ.ย.)', cat: 'icpc' },

      // หลังแข่ง · กรณีไม่ติด — แผนพัฒนาระยะยาว (track: 'notq')
      { id: 'pn1', track: 'notq', group: 'หลังแข่ง · ถ้าไม่ติด — แผนพัฒนาระยะยาว', activity: 'Postmortem: ไล่ดูทุกข้อใน contest ว่าพลาดเพราะอะไร (ความรู้ / ความเร็ว / bug)', cat: 'icpc' },
      { id: 'pn2', track: 'notq', group: 'หลังแข่ง · ถ้าไม่ติด — แผนพัฒนาระยะยาว', activity: 'ไล่เก็บ CSES หมวดที่เป็นจุดอ่อนให้ครบทีละหมวด', cat: 'icpc' },
      { id: 'pn3', track: 'notq', group: 'หลังแข่ง · ถ้าไม่ติด — แผนพัฒนาระยะยาว', activity: 'Virtual contest เบา ๆ รายสัปดาห์ รักษามือ ไม่ต้องอัด', cat: 'icpc' },
      { id: 'pn4', track: 'notq', group: 'หลังแข่ง · ถ้าไม่ติด — แผนพัฒนาระยะยาว', activity: 'ทำ template notebook ส่วนตัวให้เสร็จ ใช้ซ้อมรอบหน้า', cat: 'icpc' },
      { id: 'pn5', track: 'notq', group: 'หลังแข่ง · ถ้าไม่ติด — แผนพัฒนาระยะยาว', activity: 'ทบทวน DP / Graph ให้ขึ้นใจ — ฐานของโจทย์ส่วนใหญ่', cat: 'icpc' },
      { id: 'pn6', track: 'notq', group: 'หลังแข่ง · ถ้าไม่ติด — แผนพัฒนาระยะยาว', activity: 'ปรับสมดุลเวลา: คืนโฟกัสให้แผน DS/ML + โปรเจกต์', cat: 'icpc' },

      // Resources (คงจาก v2 — id เดิม สถานะเดิม migrate มาได้)
      { id: 'rs-usaco', group: 'แหล่งฝึกโจทย์ + Reference (ใช้ได้ตลอด)', activity: 'USACO Guide — ไกด์เรียงตามหัวข้อ + โจทย์คัดมาให้ ฟรี ⭐ ใช้ไล่ topic หลัก', cat: 'icpc', url: 'https://usaco.guide/' },
      { id: 'rs-cses', group: 'แหล่งฝึกโจทย์ + Reference (ใช้ได้ตลอด)', activity: 'CSES Problem Set — โจทย์จัดหมวดครบทุก topic เหมาะเก็บพื้นฐานทีละด้าน', cat: 'icpc', url: 'https://cses.fi/problemset/' },
      { id: 'rs-cf', group: 'แหล่งฝึกโจทย์ + Reference (ใช้ได้ตลอด)', activity: 'Codeforces — contest + โจทย์เยอะสุด (Div2/Div1) ฝึก speed + rating', cat: 'icpc', url: 'https://codeforces.com/' },
      { id: 'rs-atcoder', group: 'แหล่งฝึกโจทย์ + Reference (ใช้ได้ตลอด)', activity: 'AtCoder — โจทย์สะอาด ไล่จาก ABC → ARC/AGC ดีมากช่วงเก็บพื้นฐาน', cat: 'icpc', url: 'https://atcoder.jp/' },
      { id: 'rs-cpalgo', group: 'แหล่งฝึกโจทย์ + Reference (ใช้ได้ตลอด)', activity: 'CP-Algorithms — reference + โค้ด algorithm คลาสสิก ไว้เปิดตอนติด', cat: 'icpc', url: 'https://cp-algorithms.com/' },
      { id: 'rs-vjudge', group: 'แหล่งฝึกโจทย์ + Reference (ใช้ได้ตลอด)', activity: 'vjudge — จัด Virtual Team Contest / เล่นโจทย์ ICPC regional เก่า ⭐', cat: 'icpc', url: 'https://vjudge.net/' },
      { id: 'rs-kactl', group: 'แหล่งฝึกโจทย์ + Reference (ใช้ได้ตลอด)', activity: 'KACTL — team notebook ตัวอย่าง ไว้ทำ printed reference ของทีม', cat: 'icpc', url: 'https://github.com/kth-competitive-programming/kactl' },
    ],
  },

  // ---------- 4) Skills (เดิม) ----------
  {
    id: 'skills', tab: 'skills', layout: 'group', resettable: false, checkable: true,
    note: 'อัพสกิลสาย DS/ML/AI ของเทอมนี้ — เปลี่ยนวิชาเรียนให้เป็นสกิลสายงาน',
    items: [
      { id: 'lv1', group: 'ดึงค่าจากวิชาเทอมนี้', activity: 'Prob&Stat: เปลี่ยนทุกบทเป็นโน้ตประยุกต์กับข้อมูลจริง (distributions, hypothesis test, regression) = แกนของ DS/ML', cat: 'review' },
      { id: 'lv2', group: 'ดึงค่าจากวิชาเทอมนี้', activity: 'Data Science (วิชาเลือก): ทำ lab/assignment ให้เกินเกณฑ์ แล้วต่อยอดเป็น mini-project', cat: 'review' },
      { id: 'lv3', group: 'ดึงค่าจากวิชาเทอมนี้', activity: 'IT Integration Lab: ฝึกจนเขียน Dockerfile + GitHub Actions เองได้ = สกิล MLOps จริง', cat: 'review' },
      { id: 'lv4', group: 'ดึงค่าจากวิชาเทอมนี้', activity: 'OS: เข้าใจ process/thread/memory/scheduling → ฐานเข้าใจ training infra & GPU', cat: 'review' },
      { id: 'lv5', group: 'ดึงค่าจากวิชาเทอมนี้', activity: 'Embedded + Lab: ต่อยอดเป็น TinyML/Edge AI = จุดต่างใน resume', cat: 'review' },
      { id: 'sk1', group: 'Core DS/ML stack', activity: 'Python data stack: numpy, pandas, matplotlib/seaborn ให้คล่องมือ', cat: 'skill' },
      { id: 'sk2', group: 'Core DS/ML stack', activity: 'SQL ระดับกลาง-สูง (joins, window functions, CTE) ต่อยอดจาก Database Systems', cat: 'skill' },
      { id: 'sk3', group: 'Core DS/ML stack', activity: 'Statistics for ML: bias/variance, cross-validation, เลือก metric, A/B test', cat: 'skill' },
      { id: 'sk4', group: 'Core DS/ML stack', activity: 'Classic ML (sklearn): linear/logistic, decision tree, ensembles, clustering', cat: 'skill' },
      { id: 'sk5', group: 'Core DS/ML stack', activity: 'DL foundations (PyTorch): tensor, autograd, สร้าง NN + training loop เอง', cat: 'skill' },
      { id: 'sk6', group: 'Core DS/ML stack', activity: 'นิสัยสาย research: อ่าน paper/บทความ ML 1 ชิ้น/สัปดาห์ + จดสรุป', cat: 'skill' },
    ],
  },

  // ---------- 5) Projects (เดิม) ----------
  {
    id: 'projects', tab: 'projects', layout: 'group', resettable: false, checkable: true,
    note: 'โปรเจกต์สะสม portfolio — ทำให้จบทีละตัว มีของโชว์จริง',
    items: [
      { id: 'pr1a', group: 'Project 1 · เทอมนี้ — End-to-end Classic ML', activity: 'เลือกปัญหา + dataset จริง (ไม่ใช่ toy) ตั้งคำถามที่ตอบได้ด้วยข้อมูล', cat: 'ai' },
      { id: 'pr1b', group: 'Project 1 · เทอมนี้ — End-to-end Classic ML', activity: 'EDA + data cleaning + feature engineering', cat: 'ai' },
      { id: 'pr1c', group: 'Project 1 · เทอมนี้ — End-to-end Classic ML', activity: 'Baseline → model + tuning + ประเมินถูกวิธี (CV, metric เหมาะกับปัญหา)', cat: 'ai' },
      { id: 'pr1d', group: 'Project 1 · เทอมนี้ — End-to-end Classic ML', activity: 'เขียน README + notebook ที่เล่าเป็นเรื่อง แล้ว push GitHub', cat: 'ai' },
      { id: 'pr1e', group: 'Project 1 · เทอมนี้ — End-to-end Classic ML', activity: '(โบนัส) deploy เป็น Streamlit demo ให้คนกดเล่นได้', cat: 'ai' },
      { id: 'pr2a', group: 'Project 2 · เทอมหน้า — Deep Learning + Deploy', activity: 'เลือกงาน CV หรือ NLP (เช่น image/text classifier, sentiment)', cat: 'ai' },
      { id: 'pr2b', group: 'Project 2 · เทอมหน้า — Deep Learning + Deploy', activity: 'เทรนด้วย PyTorch + ใช้ transfer learning', cat: 'ai' },
      { id: 'pr2c', group: 'Project 2 · เทอมหน้า — Deep Learning + Deploy', activity: 'Dockerize + CI/CD + deploy เป็น API (FastAPI) หรือ web demo', cat: 'ai' },
      { id: 'pr2d', group: 'Project 2 · เทอมหน้า — Deep Learning + Deploy', activity: 'Track experiments ด้วย W&B หรือ MLflow', cat: 'ai' },
      { id: 'pr3a', group: 'Project 3 · จุดต่าง — TinyML / Edge AI', activity: 'โมเดลเล็กรันบน microcontroller (เชื่อมวิชา Embedded)', cat: 'ai' },
      { id: 'pr3b', group: 'Project 3 · จุดต่าง — TinyML / Edge AI', activity: 'ตัวอย่าง: keyword spotting / gesture / sensor anomaly detection', cat: 'ai' },
      { id: 'pr4a', group: 'Project 4 · สาย research — Reproduce a Paper', activity: 'เลือก paper ระดับเข้าถึงได้ แล้ว reproduce ผลลัพธ์ให้ได้', cat: 'ai' },
      { id: 'pr4b', group: 'Project 4 · สาย research — Reproduce a Paper', activity: 'เขียนสรุป + สิ่งที่เรียนรู้/ต่อยอด = ฐาน research portfolio', cat: 'ai' },
    ],
  },

  // ---------- 6) Roadmap (เดิม) ----------
  {
    id: 'roadmap', tab: 'roadmap', layout: 'group', resettable: false, checkable: true,
    note: 'เส้นทางยาว: ปี 3 → ทำงาน 1–3 ปี → เรียนต่อ AI research',
    items: [
      { id: 'rm1', group: 'ปี 3 (ตอนนี้ – 2027) · วางฐาน', activity: 'พื้นฐาน DS/ML แน่น + Project 1–2 + ทำเกรดวิชาแกน (Prob&Stat) ให้ดี + ซ้อม ICPC', cat: 'road' },
      { id: 'rm2', group: 'ปี 4 (2027 – 2028) · เจาะลึก + ฝึกงาน', activity: 'เลือก track เจาะลึก (DS analytics / ML systems / AI-LLM eng) + capstone ระดับ portfolio + ฝึกงาน DS/ML', cat: 'road' },
      { id: 'rm3', group: 'ปี 4 (2027 – 2028) · เจาะลึก + ฝึกงาน', activity: 'ถ้าจะเรียนต่อ research: เริ่มทำโปรเจกต์วิจัยกับอาจารย์ + reproduce paper', cat: 'road' },
      { id: 'rm4', group: 'จบใหม่ → ทำงาน 1–3 ปี (2028 – 2031)', activity: 'ได้งาน DS/MLE/AI Engineer, สร้างประสบการณ์ production จริง', cat: 'road' },
      { id: 'rm5', group: 'จบใหม่ → ทำงาน 1–3 ปี (2028 – 2031)', activity: 'รักษาเส้น research: อ่าน paper ต่อเนื่อง, เพิ่ม math depth (linear algebra, prob, optimization)', cat: 'road' },
      { id: 'rm6', group: 'เตรียมเรียนต่อ (ช่วงทำงาน)', activity: 'เตรียม research statement, จดหมายแนะนำ, เป้าหมาย lab/อาจารย์, อาจมี workshop paper', cat: 'road' },
      { id: 'rm7', group: 'เรียนต่อสาย AI Research (2031+)', activity: 'MS/PhD ด้าน ML/AI — เลือก advisor + research area ที่ใช่', cat: 'road' },
    ],
  },

  // ---------- 7) Electives (เดิม) ----------
  {
    id: 'electives', tab: 'electives', layout: 'group', resettable: false, checkable: true,
    note: 'วิชาเฉพาะเลือกที่แนะนำสาย DS/ML/AI · เก็บ 21 นก. (6 วิชา + โปรเจกต์) · ติ๊ก = ลงแล้ว · ⚠️ เช็กวิชาที่เปิดจริงแต่ละเทอม',
    items: [
      { id: 'el-ds', group: 'กำลังเรียน / บังคับ', meta: '03603351 · prereq 03603241 ✓ · ปี3/1', activity: 'วิทยาศาสตร์ข้อมูลเบื้องต้น (Intro to Data Science)', cat: 'course' },
      { id: 'el-proj', group: 'กำลังเรียน / บังคับ', meta: '03603495 + 03603499 · บังคับ ปี4 (3 นก.)', activity: 'เตรียมโครงงาน + โครงงาน วศ.คอม', cat: 'course' },
      { id: 'el-ml', group: 'Tier 1 — แกนหลัก (ต้องเรียนให้ครบ)', meta: '03603462 · ไม่มี prereq · แนะนำ ปี3/2', activity: 'การเรียนรู้ของเครื่อง (Machine Learning) ⭐ หัวใจของทุกสายงาน', cat: 'course' },
      { id: 'el-ai', group: 'Tier 1 — แกนหลัก (ต้องเรียนให้ครบ)', meta: '03603461 · prereq 03603213 ✓ · ปี3/2 หรือ 4/1', activity: 'ปัญญาประดิษฐ์ (AI) — search/agents/reasoning + basic ML', cat: 'course' },
      { id: 'el-nlp', group: 'Tier 1 — แกนหลัก (ต้องเรียนให้ครบ)', meta: '03603465 · ไม่มี prereq · แนะนำ ปี4/1', activity: 'การประมวลผลภาษาธรรมชาติ (NLP) — ประตูสู่ transformer/LLM', cat: 'course' },
      { id: 'el-mine', group: 'Tier 2 — เลือก 2 ตามสายที่อยากเน้น', meta: '03603452 · prereq 03603351 ✓ · ปี3/2+', activity: 'การทำเหมืองข้อมูลบิ๊กดาต้า (Mining Big Data) — สาย DS/Data', cat: 'course' },
      { id: 'el-cloud', group: 'Tier 2 — เลือก 2 ตามสายที่อยากเน้น', meta: '03603435 · ไม่มี prereq · ปี4/2', activity: 'การคำนวณแบบกลุ่มเมฆ (Cloud Computing) — สาย MLE/AI Eng (deploy/scale)', cat: 'course' },
      { id: 'el-cv', group: 'Tier 2 — เลือก 2 ตามสายที่อยากเน้น', meta: '03603464 · prereq 03603111 ✓', activity: 'คอมพิวเตอร์วิทัศน์ (Computer Vision) — ถ้าสนใจสาย CV', cat: 'course' },
      { id: 'el-dip', group: 'Tier 3 — เติมช่อง (ถ้าเหลือโควตา)', meta: '03603382 · prereq 03603111 ✓', activity: 'การประมวลผลภาพดิจิทัล (Digital Image Processing) — ปูฐาน CV', cat: 'course' },
      { id: 'el-test', group: 'Tier 3 — เติมช่อง (ถ้าเหลือโควตา)', meta: '03603441 · prereq 03603111 ✓', activity: 'การทดสอบซอฟต์แวร์ (Software Testing) — rigor สาย MLE', cat: 'course' },
      { id: 'el-web', group: 'Tier 3 — เติมช่อง (ถ้าเหลือโควตา)', meta: '03603436 · prereq 03603112 ✓', activity: 'การพัฒนาโปรแกรมประยุกต์บนเว็บ — deploy demo (เรียนเองได้)', cat: 'course' },
      { id: 'el-bio', group: 'Tier 3 — เติมช่อง (ถ้าเหลือโควตา)', meta: '03603463 · prereq 03603213 ✓', activity: 'ปัญญาเชิงคำนวณเลียนแบบชีวภาพ — neural nets/evolutionary (niche)', cat: 'course' },
    ],
  },

  // ---------- 8) แหล่งเรียนฟรี STEP 0–7 (เดิม) ----------
  {
    id: 'learn', tab: 'learn', layout: 'group', resettable: false, checkable: true,
    note: 'แหล่งเรียนฟรี เรียงเป็น path ตามลำดับ STEP 0 → 7 · กดปุ่ม "เปิด ↗" ไปที่แหล่ง · ติ๊กการ์ด = เรียนจบ',
    items: [
      { id: 'r-3b1b', group: 'STEP 0 · คณิตฐาน (ทำคู่ขนานตลอด)', activity: '3Blue1Brown — Essence of Linear Algebra / Calculus (intuition แบบเห็นภาพ)', cat: 'learn', url: 'https://www.3blue1brown.com/topics/linear-algebra' },
      { id: 'r-statq', group: 'STEP 0 · คณิตฐาน (ทำคู่ขนานตลอด)', activity: 'StatQuest (Josh Starmer) — สถิติ/ML ย่อยง่าย เสริมวิชา Prob&Stat', cat: 'learn', url: 'https://www.youtube.com/@statquest' },
      { id: 'r-1806', group: 'STEP 0 · คณิตฐาน (ทำคู่ขนานตลอด)', activity: 'MIT OCW 18.06 Linear Algebra (Gilbert Strang) — ถ้าอยากลึก (optional)', cat: 'learn', url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/' },
      { id: 'r-kaggle', group: 'STEP 1 · Python + SQL (ฐานจับข้อมูล)', activity: 'Kaggle Learn — micro-courses ฟรี (Python, Pandas, Viz, SQL) เริ่มที่นี่ก่อน', cat: 'learn', url: 'https://www.kaggle.com/learn' },
      { id: 'r-pdsh', group: 'STEP 1 · Python + SQL (ฐานจับข้อมูล)', activity: 'Python Data Science Handbook (Jake VanderPlas) — อ่านฟรีออนไลน์', cat: 'learn', url: 'https://jakevdp.github.io/PythonDataScienceHandbook/' },
      { id: 'r-ngml', group: 'STEP 2 · Machine Learning (แกน)', activity: 'Andrew Ng — Machine Learning Specialization (กด audit ฟรี) คอร์สมาตรฐาน ⭐', cat: 'learn', url: 'https://www.coursera.org/specializations/machine-learning-introduction' },
      { id: 'r-islp', group: 'STEP 2 · Machine Learning (แกน)', activity: 'An Introduction to Statistical Learning (ISLP, Python) — PDF + lab ฟรี', cat: 'learn', url: 'https://www.statlearning.com/' },
      { id: 'r-fastai', group: 'STEP 3 · Deep Learning', activity: 'fast.ai — Practical Deep Learning for Coders (ลงมือทำก่อน)', cat: 'learn', url: 'https://course.fast.ai/' },
      { id: 'r-karpathy', group: 'STEP 3 · Deep Learning', activity: 'Karpathy — Neural Networks: Zero to Hero (สร้าง NN/GPT จากศูนย์) ⭐', cat: 'learn', url: 'https://karpathy.ai/zero-to-hero.html' },
      { id: 'r-d2l', group: 'STEP 3 · Deep Learning', activity: 'Dive into Deep Learning (d2l.ai) — หนังสือ interactive + PyTorch', cat: 'learn', url: 'https://d2l.ai/' },
      { id: 'r-hf', group: 'STEP 4 · NLP / LLM (ยุคปัจจุบัน)', activity: 'Hugging Face LLM Course — ฟรี อัปเดต 2026 ครอบ NLP→LLM fine-tune+deploy ⭐', cat: 'learn', url: 'https://huggingface.co/learn/llm-course' },
      { id: 'r-mlabonne', group: 'STEP 4 · NLP / LLM (ยุคปัจจุบัน)', activity: 'mlabonne/llm-course (GitHub) — roadmap LLM Scientist + LLM Engineer ⭐', cat: 'learn', url: 'https://github.com/mlabonne/llm-course' },
      { id: 'r-cs224n', group: 'STEP 4 · NLP / LLM (ยุคปัจจุบัน)', activity: 'Stanford CS224n — NLP with Deep Learning (ทฤษฎีแน่น)', cat: 'learn', url: 'https://web.stanford.edu/class/cs224n/' },
      { id: 'r-cs188', group: 'STEP 5 · เลือกเจาะลึก (สายที่อยากเน้น)', activity: 'UC Berkeley CS188 — AI: search/agents + โปรเจกต์ Pacman (คู่วิชา 03603461)', cat: 'learn', url: 'https://inst.eecs.berkeley.edu/~cs188/' },
      { id: 'r-cs231n', group: 'STEP 5 · เลือกเจาะลึก (สายที่อยากเน้น)', activity: 'Stanford CS231n — Computer Vision (คู่วิชา 03603464)', cat: 'learn', url: 'https://cs231n.stanford.edu/' },
      { id: 'r-mwml', group: 'STEP 6 · เอาไป deploy จริง (MLOps)', activity: 'Made With ML (Goku Mohandas) — MLOps ครบ end-to-end ฟรี ⭐ ก้าวสู่ MLE', cat: 'learn', url: 'https://madewithml.com/' },
      { id: 'r-fsdl', group: 'STEP 6 · เอาไป deploy จริง (MLOps)', activity: 'Full Stack Deep Learning — production ML จริง ฟรี', cat: 'learn', url: 'https://fullstackdeeplearning.com/' },
      { id: 'r-kaggle2', group: 'STEP 7 · ฝึก + ทำ Portfolio (ทำตลอดทาง)', activity: 'Kaggle — แข่ง + dataset จริงไว้ใส่ portfolio', cat: 'learn', url: 'https://www.kaggle.com/' },
      { id: 'r-pwc', group: 'STEP 7 · ฝึก + ทำ Portfolio (ทำตลอดทาง)', activity: 'Papers with Code — หา paper + โค้ดไว้ reproduce (ปูทาง research)', cat: 'learn', url: 'https://paperswithcode.com/' },
    ],
  },

  // ---------- 9) Fitness (เดิม — รีเซ็ตรายสัปดาห์) ----------
  {
    id: 'fitness', tab: 'fitness', layout: 'days', resettable: true, checkable: true,
    note: 'ออกกำลังก่อนเริ่มวันเรียน 30–60 นาที/วัน',
    items: [
      { id: 'fit-mon', day: 'จันทร์ MON', time: '07:00–07:30', activity: 'Cardio เบา: วิ่ง/เดินเร็ว 30 นาที', cat: 'fitness' },
      { id: 'fit-tue', day: 'อังคาร TUE', time: '07:00–07:45', activity: 'Strength ท่อนบน (push/pull) 45 นาที', cat: 'fitness' },
      { id: 'fit-wed', day: 'พุธ WED', time: '07:00–07:20', activity: 'ยืดเหยียด/Mobility 20 นาที (ก่อนไปว่ายน้ำ)', cat: 'fitness' },
      { id: 'fit-thu', day: 'พฤหัส THU', time: '07:00–07:45', activity: 'Strength ท่อนล่าง (squat/lunge) 45 นาที', cat: 'fitness' },
      { id: 'fit-fri', day: 'ศุกร์ FRI', time: '07:00–07:30', activity: 'Core + HIIT สั้น 30 นาที', cat: 'fitness' },
      { id: 'fit-sat', day: 'เสาร์ SAT', time: '07:00–08:00', activity: 'Cardio ยาว/กิจกรรมกลางแจ้ง 60 นาที', cat: 'fitness' },
      { id: 'fit-sun', day: 'อาทิตย์ SUN', time: '08:00–08:30', activity: 'Active recovery: ยืดเหยียด/โยคะเบา 30 นาที', cat: 'fitness' },
    ],
  },
];

/** สร้าง doc เริ่มต้น (ก้อนข้อมูลทั้งหมดของแอป) */
export function buildSeedDoc() {
  return {
    schemaVersion: 1,
    settings: {
      // contest = รอบวันที่ 19 ก.ค. · National/Bangkok เป็นประมาณการเดิมจาก v2 (แก้ได้ใน UI)
      dates: { contest: '2026-07-19', national: '2026-09-12', bangkok: '2026-11-21' },
      icpcView: 'all', // ตัวกรองแผนหลังแข่ง: all | qualified | notq
    },
    migratedCount: 0,
    migrationNoticeDismissed: false,
    sections: JSON.parse(JSON.stringify(SECTIONS)),
    statuses: {}, // { [sectionId หรือ 'sectionId:week']: { [itemId]: 'pending'|'running'|'done' } }
  };
}
