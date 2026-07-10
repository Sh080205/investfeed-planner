// ---------- Seed data (ค่าเริ่มต้นตอนเปิดแอปครั้งแรก) ----------
//
// สำคัญ: นี่คือ "ค่าเริ่มต้น" เท่านั้น — หลังเปิดครั้งแรกข้อมูลจริงอยู่ใน localStorage
// และแก้ไขทุกรายการได้ผ่าน UI (ปุ่ม ✎ / 🗑 / + เพิ่มรายการ)
//
// เนื้อหา sections เดิมคัดลอกจาก planner_v2.html แบบคำต่อคำ และ **ใช้ item id เดิม**
// เพื่อให้ migration ดึงสถานะที่เคยติ๊กไว้กลับมาได้ตรง ๆ
// ของใหม่: section "ตารางเรียน" (จากตาราง Notion), แผน ICPC เส้นทางสู่ปี 2027,
// และ section "english" (แก้จุดอ่อนอ่านโจทย์ภาษาอังกฤษ)

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
      // ช่องซ้อมภาษาอังกฤษ (เพิ่มตามแผนแท็บ english — แก้เวลา/วันได้ตามสะดวก)
      { id: 'eng-tue', day: 'อังคาร TUE', time: '21:00–21:20', activity: 'ENG: อ่านโจทย์ EN 1 ข้อ + สรุป spec เป็นไทย 3 บรรทัด + เก็บศัพท์ลง Anki', cat: 'eng' },
      { id: 'eng-thu', day: 'พฤหัส THU', time: '21:30–21:50', activity: 'ENG: อ่านโจทย์ EN จับเวลา 1 ข้อ + ทบทวน Anki ศัพท์โจทย์', cat: 'eng' },
      { id: 'eng-sun', day: 'อาทิตย์ SUN', time: '20:00–20:30', activity: 'ENG: อ่าน editorial ภาษาอังกฤษของโจทย์สัปดาห์นี้ + จดวลีที่เจอบ่อย', cat: 'eng' },
    ],
  },

  // ---------- 3) ICPC (เส้นทางยาวสู่การแข่งปี 2027 — แข่งตอนปี 4) ----------
  // เลื่อนเป้าจากรอบ ก.ค. 2026 → Thailand National 2027 (~ก.ย.) และ Bangkok Regional (~พ.ย.)
  // 4 เฟสตามปฏิทินจริง: เก็บพื้นฐานคู่เทอมเรียน → เข้มข้น+ตั้งทีม → ซ้อมทีม → แข่ง
  // จุดอ่อนอ่านโจทย์ภาษาอังกฤษ → มีแผนแยกที่แท็บ english (ทำคู่กันตลอดทั้งปี)
  {
    id: 'icpc', tab: 'icpc', layout: 'group', resettable: false, checkable: true,
    note: 'เส้นทางสู่ ICPC 2027 (แข่งตอนปี 4) · 4 เฟสตามปฏิทิน · ทุกรายการแก้/เพิ่ม/ลบได้ · แผนหลัง National สลับดูได้ที่ตัวเลือกขวามือ',
    items: [
      // เฟส 1 — ปูพื้นคู่กับเทอมเรียน (จังหวะยั่งยืน ไม่เบิร์นเอาต์)
      { id: 'f1', group: 'เฟส 1 · FOUNDATION (ก.ค. – ธ.ค. 2026) — เก็บ topic หลักคู่กับเทอมเรียน', meta: '1 หัวข้อ/2 สัปดาห์ · 4–6 ข้อ/หัวข้อ', activity: 'DP: knapsack, LIS, coin change, interval → bitmask, digit, DP on trees', cat: 'icpc' },
      { id: 'f2', group: 'เฟส 1 · FOUNDATION (ก.ค. – ธ.ค. 2026) — เก็บ topic หลักคู่กับเทอมเรียน', activity: 'Graph: BFS/DFS, Dijkstra, Bellman-Ford, Floyd-Warshall, topo sort → SCC, bridges, MST', cat: 'icpc' },
      { id: 'f3', group: 'เฟส 1 · FOUNDATION (ก.ค. – ธ.ค. 2026) — เก็บ topic หลักคู่กับเทอมเรียน', activity: 'Data Structures: Segment Tree, BIT/Fenwick, Sparse Table, DSU', cat: 'icpc' },
      { id: 'f4', group: 'เฟส 1 · FOUNDATION (ก.ค. – ธ.ค. 2026) — เก็บ topic หลักคู่กับเทอมเรียน', activity: 'Number Theory & Combinatorics: sieve, modpow, ext Euclid, nCr mod p, CRT', cat: 'icpc' },
      { id: 'f5', group: 'เฟส 1 · FOUNDATION (ก.ค. – ธ.ค. 2026) — เก็บ topic หลักคู่กับเทอมเรียน', activity: 'Strings: hashing, KMP, Z-function, Trie', cat: 'icpc' },
      { id: 'f6', group: 'เฟส 1 · FOUNDATION (ก.ค. – ธ.ค. 2026) — เก็บ topic หลักคู่กับเทอมเรียน', activity: 'เทคนิคพื้นฐานสนาม: binary search on answer, two pointers, greedy ขั้นสูง, sweep line', cat: 'icpc' },
      { id: 'f7', group: 'เฟส 1 · FOUNDATION (ก.ค. – ธ.ค. 2026) — เก็บ topic หลักคู่กับเทอมเรียน', meta: 'ลง contest จริง 2 ครั้ง/เดือน', activity: 'Codeforces ต่อเนื่อง: ตั้งเป้า rating 1400+ ภายในสิ้นปี 2026', cat: 'icpc' },
      { id: 'f8', group: 'เฟส 1 · FOUNDATION (ก.ค. – ธ.ค. 2026) — เก็บ topic หลักคู่กับเทอมเรียน', activity: 'ไล่ CSES คู่กับหัวข้อที่เรียน — ใช้เช็กว่าหัวข้อไหน "ครบ" แล้วจริง', cat: 'icpc' },

      // เฟส 2 — เข้มข้นขึ้น + ตั้งทีมให้จบ
      { id: 'r1', group: 'เฟส 2 · RAMP-UP (ม.ค. – พ.ค. 2027) — เพิ่มความเข้มข้น + ตั้งทีม', meta: 'สำคัญสุดของเฟสนี้', activity: 'ตั้งทีม 3 คนให้จบ (ชวนเพื่อน/รุ่นน้องสายแข่ง) + ตกลงตารางซ้อมร่วมกัน', cat: 'icpc' },
      { id: 'r2', group: 'เฟส 2 · RAMP-UP (ม.ค. – พ.ค. 2027) — เพิ่มความเข้มข้น + ตั้งทีม', activity: 'Virtual contest เดี่ยวรายสัปดาห์ (CF Div.2 เต็มเวลา) + upsolve ทุกข้อที่หลุด', cat: 'icpc' },
      { id: 'r3', group: 'เฟส 2 · RAMP-UP (ม.ค. – พ.ค. 2027) — เพิ่มความเข้มข้น + ตั้งทีม', activity: 'หัวข้อขั้นสูง: max-flow เบื้องต้น, segment tree แบบ lazy, LCA/binary lifting', cat: 'icpc' },
      { id: 'r4', group: 'เฟส 2 · RAMP-UP (ม.ค. – พ.ค. 2027) — เพิ่มความเข้มข้น + ตั้งทีม', activity: 'เริ่มทำ team notebook/template จากโค้ดที่ใช้บ่อย (อิงโครง KACTL)', cat: 'icpc' },
      { id: 'r5', group: 'เฟส 2 · RAMP-UP (ม.ค. – พ.ค. 2027) — เพิ่มความเข้มข้น + ตั้งทีม', activity: 'อ่านโจทย์เป็นภาษาอังกฤษล้วนทุกครั้ง — ทำคู่กับแผนในแท็บ english', cat: 'icpc' },

      // เฟส 3 — โหมดทีม (ปิดเทอม + ต้นปี 4)
      { id: 't1', group: 'เฟส 3 · TEAM MODE (มิ.ย. – ส.ค. 2027) — ซ้อมทีมจริงจัง', activity: 'Team virtual contest 5 ชม. ทุกสัปดาห์ (vjudge: gym/regional เก่า)', cat: 'icpc' },
      { id: 't2', group: 'เฟส 3 · TEAM MODE (มิ.ย. – ส.ค. 2027) — ซ้อมทีมจริงจัง', activity: 'แบ่งบทบาทให้ชัด: ใครอ่านโจทย์ช่วงไหน ใครคุมเครื่อง ใคร debug บนกระดาษ', cat: 'icpc' },
      { id: 't3', group: 'เฟส 3 · TEAM MODE (มิ.ย. – ส.ค. 2027) — ซ้อมทีมจริงจัง', activity: 'Speed drill: เขียน algo คลาสสิก (DSU, Dijkstra, segtree) จากความจำให้เร็วและไม่ผิด', cat: 'icpc' },
      { id: 't4', group: 'เฟส 3 · TEAM MODE (มิ.ย. – ส.ค. 2027) — ซ้อมทีมจริงจัง', activity: 'ทำ printed team notebook ให้เสร็จ + ซ้อมเปิดใช้จริงใน mock', cat: 'icpc' },
      { id: 't5', group: 'เฟส 3 · TEAM MODE (มิ.ย. – ส.ค. 2027) — ซ้อมทีมจริงจัง', meta: 'มักเปิดรับสมัครช่วง ก.ค.–ส.ค.', activity: 'ตามประกาศรับสมัคร National 2027 + คุยอาจารย์ coach + ลงทะเบียนให้เรียบร้อย', cat: 'icpc' },

      // เฟส 4 — แข่งจริง
      { id: 'c1', group: 'เฟส 4 · RACE (ก.ย. – พ.ย. 2027) — National → Bangkok Regional', activity: 'ก่อนแข่ง 2 สัปดาห์: taper ลดของใหม่ เน้นทบทวน template + mock เบา ๆ', cat: 'icpc' },
      { id: 'c2', group: 'เฟส 4 · RACE (ก.ย. – พ.ย. 2027) — National → Bangkok Regional', activity: 'Mock เต็มรูปแบบในสภาพเหมือนจริง 1–2 รอบ (เวลา/หนึ่งเครื่อง/กติกา)', cat: 'icpc' },
      { id: 'c3', group: 'เฟส 4 · RACE (ก.ย. – พ.ย. 2027) — National → Bangkok Regional', activity: '🏁 Thailand National 2027 (~ก.ย.) — พีคให้ตรงวันนี้', cat: 'icpc' },
      { id: 'c4', group: 'เฟส 4 · RACE (ก.ย. – พ.ย. 2027) — National → Bangkok Regional', activity: 'หลังทราบผล → สลับดูแผนตามผลที่ได้ (ตัวเลือกมุมขวาบน)', cat: 'icpc' },

      // หลัง National · ผ่านเข้า Bangkok Regional (track: 'qualified')
      { id: 'q1', track: 'qualified', group: 'หลัง National · ถ้าผ่านเข้า Bangkok Regional — ดันสู่ระดับ regional', activity: 'FFT/NTT เบื้องต้น + โจทย์ polynomial', cat: 'icpc' },
      { id: 'q2', track: 'qualified', group: 'หลัง National · ถ้าผ่านเข้า Bangkok Regional — ดันสู่ระดับ regional', activity: 'HLD / Euler tour + โจทย์ tree query', cat: 'icpc' },
      { id: 'q3', track: 'qualified', group: 'หลัง National · ถ้าผ่านเข้า Bangkok Regional — ดันสู่ระดับ regional', activity: 'Flows ขั้นสูง + bipartite matching', cat: 'icpc' },
      { id: 'q4', track: 'qualified', group: 'หลัง National · ถ้าผ่านเข้า Bangkok Regional — ดันสู่ระดับ regional', activity: 'Geometry สนามแข่ง: convex hull, sweep line, closest pair', cat: 'icpc' },
      { id: 'q5', track: 'qualified', group: 'หลัง National · ถ้าผ่านเข้า Bangkok Regional — ดันสู่ระดับ regional', activity: 'Mock ระดับ regional รายสัปดาห์ + อัปเดต notebook หลังทุกรอบ', cat: 'icpc' },

      // หลัง National · ไม่ผ่าน (track: 'notq') — ปี 4 เทอม 2 คือช่วงเก็บดอกผลจาก CP
      { id: 'n1', track: 'notq', group: 'หลัง National · ถ้าไม่ผ่าน — เก็บดอกผลจาก CP ไปต่อ', activity: 'Postmortem ทีม: หลุดเพราะอะไร (ความรู้ / ความเร็ว / อ่านโจทย์ / ทีมเวิร์ก) จดให้ชัด', cat: 'icpc' },
      { id: 'n2', track: 'notq', group: 'หลัง National · ถ้าไม่ผ่าน — เก็บดอกผลจาก CP ไปต่อ', activity: 'แปลงสกิลแข่งเป็นสกิลสัมภาษณ์งาน: ไล่ LeetCode medium–hard ให้ลื่น', cat: 'icpc' },
      { id: 'n3', track: 'notq', group: 'หลัง National · ถ้าไม่ผ่าน — เก็บดอกผลจาก CP ไปต่อ', activity: 'คืนโฟกัสให้ capstone + สมัครฝึกงาน/งานสาย DS/ML (ปี 4 เทอม 2)', cat: 'icpc' },
      { id: 'n4', track: 'notq', group: 'หลัง National · ถ้าไม่ผ่าน — เก็บดอกผลจาก CP ไปต่อ', activity: 'ยังชอบแข่ง: CF / AtCoder / online mirror ลงได้เรื่อย ๆ ไม่ผูกกับ ICPC', cat: 'icpc' },

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

  // ---------- 4) English (ใหม่ — แก้จุดอ่อน "อ่านโจทย์/เอกสารภาษาอังกฤษ") ----------
  // ปัญหาหลักตอนแข่งไม่ใช่โค้ด แต่คืออ่านโจทย์ช้า/ไม่แม่น → ฝึกอ่านทุกวันทีละนิด
  // ยึดหลัก: อ่านของจริง (โจทย์แข่ง/editorial) > เรียนแกรมมาร์, สม่ำเสมอ > อัดหนัก
  {
    id: 'english', tab: 'english', layout: 'group', resettable: false, checkable: true,
    note: 'เป้าหมาย: อ่านโจทย์แข่ง/เอกสารเทคนิคได้เร็วโดยไม่พึ่ง translator · ฝึกทีละนิดแต่ทุกวัน · ทุกรายการแก้/เพิ่ม/ลบได้',
    items: [
      { id: 'en1', group: 'ฝึกอ่านโจทย์แข่ง (หัวใจของแผน — ทำประจำ)', meta: 'ทุกวัน · 15 นาที', activity: 'อ่านโจทย์ CF/AtCoder ภาษาอังกฤษวันละ 1 ข้อ แล้วสรุป spec เป็นไทย 3 บรรทัด (input / output / เงื่อนไข) — ไม่ต้องแก้โจทย์', cat: 'eng' },
      { id: 'en2', group: 'ฝึกอ่านโจทย์แข่ง (หัวใจของแผน — ทำประจำ)', meta: 'สัปดาห์ละ 2 ครั้ง', activity: 'จับเวลาอ่านโจทย์: Div.2 A เข้าใจใน 3 นาที, B ใน 5 นาที — จดเวลาไว้ดูพัฒนาการ', cat: 'eng' },
      { id: 'en3', group: 'ฝึกอ่านโจทย์แข่ง (หัวใจของแผน — ทำประจำ)', meta: 'ทุกครั้งที่ upsolve', activity: 'อ่าน editorial ภาษาอังกฤษให้จบก่อน ค่อยอนุญาตตัวเองเปิดตัวช่วยแปล', cat: 'eng' },
      { id: 'en4', group: 'ฝึกอ่านโจทย์แข่ง (หัวใจของแผน — ทำประจำ)', activity: 'เดาความหมายจากบริบทก่อนแล้วค่อยเช็ก — ห้ามโยนทั้งย่อหน้าใส่ translator', cat: 'eng' },

      { id: 'en5', group: 'คลังศัพท์โจทย์ (Anki / โน้ตส่วนตัว)', meta: 'อย่างน้อย 5 คำ/วัน', activity: 'สร้าง Anki deck "ศัพท์โจทย์แข่ง" — เก็บศัพท์ใหม่จากทุกข้อที่อ่าน', cat: 'eng' },
      { id: 'en6', group: 'คลังศัพท์โจทย์ (Anki / โน้ตส่วนตัว)', activity: 'ท่องวลีที่เจอบ่อยให้ขึ้นใจ: at most/at least, pairwise distinct, contiguous, lexicographically, respectively, such that, it is guaranteed that', cat: 'eng' },
      { id: 'en7', group: 'คลังศัพท์โจทย์ (Anki / โน้ตส่วนตัว)', activity: 'รวมศัพท์เฉพาะรายหมวด: graph (vertex/edge/weighted), DP (subsequence vs subarray), strings, geometry', cat: 'eng' },
      { id: 'en8', group: 'คลังศัพท์โจทย์ (Anki / โน้ตส่วนตัว)', meta: 'วันละ 10 นาที', activity: 'ทบทวน Anki ทุกวัน (ตอนเช้าหรือก่อนนอน) — ต่อ streak ให้ยาวที่สุด', cat: 'eng' },

      { id: 'en9', group: 'General English (เสริมจากวิชา English for Job Opportunities)', meta: '3 คลิป/สัปดาห์', activity: 'ดูคลิป CS/ML ภาษาอังกฤษเปิด sub อังกฤษ (ไม่ใช่ไทย) — ยิงสองเป้าคู่กับแท็บ learn', cat: 'eng' },
      { id: 'en10', group: 'General English (เสริมจากวิชา English for Job Opportunities)', meta: '1 ชิ้น/สัปดาห์', activity: 'อ่านบทความ/paper ML เป็นภาษาอังกฤษ (ผูกกับนิสัย research ในแท็บ skills)', cat: 'eng' },
      { id: 'en11', group: 'General English (เสริมจากวิชา English for Job Opportunities)', activity: 'ตั้งค่ามือถือ/คอม/แอปทั้งหมดเป็นภาษาอังกฤษ — บังคับตัวเองเจอศัพท์ทุกวัน', cat: 'eng' },

      { id: 'en12', group: 'เช็กพัฒนาการ (milestone รายช่วง)', meta: 'เดือน 1–2 (ก.ค.–ส.ค. 2026)', activity: 'อ่านโจทย์ Div.2 A–B เข้าใจโดยเปิด dict ไม่เกิน 2 ครั้ง/ข้อ', cat: 'eng' },
      { id: 'en13', group: 'เช็กพัฒนาการ (milestone รายช่วง)', meta: 'เดือน 3–4 (ก.ย.–ต.ค. 2026)', activity: 'อ่านโจทย์ Div.2 C + editorial จบได้โดยไม่ใช้ translator', cat: 'eng' },
      { id: 'en14', group: 'เช็กพัฒนาการ (milestone รายช่วง)', meta: 'เดือน 5–6 (พ.ย.–ธ.ค. 2026)', activity: 'อ่านโจทย์ ICPC regional จริง (ใน vjudge) เข้าใจครบทั้งชุด', cat: 'eng' },
      { id: 'en15', group: 'เช็กพัฒนาการ (milestone รายช่วง)', meta: 'ก่อน National 2027', activity: 'อ่านชุดโจทย์ 10–12 ข้อแบบแบ่งกันในทีม แล้วสรุปให้เพื่อนฟังได้คล่อง', cat: 'eng' },

      // แหล่งเรียนระดับ B2 — คัดเฉพาะของฟรี/มาตรฐาน เน้นอ่าน+ศัพท์ตามจุดอ่อน
      { id: 'enr1', group: 'แหล่งเรียนระดับ B2 (คัดแล้ว · กด "เปิด ↗")', meta: 'เริ่มที่นี่ · วัดระดับ', activity: 'EF SET — สอบวัดระดับฟรี 50 นาที ได้ใบรับรอง CEFR ใช้ยืนยันว่าอยู่ B2 จริง + สอบซ้ำทุก 3–4 เดือนดูพัฒนาการ', cat: 'eng', url: 'https://www.efset.org/' },
      { id: 'enr2', group: 'แหล่งเรียนระดับ B2 (คัดแล้ว · กด "เปิด ↗")', meta: 'อ่าน · 2–3 ชิ้น/สัปดาห์', activity: 'British Council — ชุดฝึกอ่านระดับ B2 พร้อมแบบฝึกเช็กความเข้าใจ (ฟรีทั้งหมด)', cat: 'eng', url: 'https://learnenglish.britishcouncil.org/skills/reading/b2-reading' },
      { id: 'enr3', group: 'แหล่งเรียนระดับ B2 (คัดแล้ว · กด "เปิด ↗")', meta: 'อ่าน', activity: 'Breaking News English — ข่าวเดียวกันเขียนหลายระดับ เริ่ม Level 6 แล้วขยับขึ้น (เห็นชัดว่าระดับต่างกันยังไง)', cat: 'eng', url: 'https://breakingnewsenglish.com/' },
      { id: 'enr4', group: 'แหล่งเรียนระดับ B2 (คัดแล้ว · กด "เปิด ↗")', meta: 'อ่าน · เครื่องมือ', activity: 'Readlang — เอาบทความ tech จริง (dev.to, blog) มาอ่านในเว็บ คลิกคำเพื่อแปลแล้วเก็บเป็น flashcard อัตโนมัติ', cat: 'eng', url: 'https://readlang.com/' },
      { id: 'enr5', group: 'แหล่งเรียนระดับ B2 (คัดแล้ว · กด "เปิด ↗")', meta: 'ศัพท์ · 30–50 คำ/สัปดาห์', activity: 'Oxford 5000 — ลิสต์ศัพท์ระดับ B2–C1 อย่างเป็นทางการ พร้อมเสียงอ่าน ทยอยเอาเข้า Anki', cat: 'eng', url: 'https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000' },
      { id: 'enr6', group: 'แหล่งเรียนระดับ B2 (คัดแล้ว · กด "เปิด ↗")', meta: 'ศัพท์ · สาย paper', activity: 'Academic Word List (AWL) — ศัพท์วิชาการ 570 ตระกูลคำที่โผล่บ่อยสุดใน paper/เอกสาร เรียนคู่กับการอ่าน paper ML', cat: 'eng', url: 'https://www.wgtn.ac.nz/lals/resources/academicwordlist' },
      { id: 'enr7', group: 'แหล่งเรียนระดับ B2 (คัดแล้ว · กด "เปิด ↗")', meta: 'ฟัง · 6 นาที/วัน', activity: 'BBC 6 Minute English — ตอนสั้นมี transcript อ่านตามได้ เหมาะฟังตอนเดินทาง/ก่อนนอน', cat: 'eng', url: 'https://www.bbc.co.uk/learningenglish/english/features/6-minute-english' },
      { id: 'enr8', group: 'แหล่งเรียนระดับ B2 (คัดแล้ว · กด "เปิด ↗")', meta: 'ฟัง+อ่าน', activity: 'TED Talks — เปิด transcript ภาษาอังกฤษอ่านคู่กับฟัง เลือกหัวข้อ tech/AI ที่รู้บริบทอยู่แล้วจะตามทัน', cat: 'eng', url: 'https://www.ted.com/talks' },
      { id: 'enr9', group: 'แหล่งเรียนระดับ B2 (คัดแล้ว · กด "เปิด ↗")', meta: 'ฟัง · สาย CS', activity: 'CS50 (YouTube) — เลกเชอร์ CS พูดชัด + sub อังกฤษ ฝึกหูด้วยเนื้อหาที่เรารู้เรื่องอยู่แล้ว', cat: 'eng', url: 'https://www.youtube.com/@cs50' },
      { id: 'enr10', group: 'แหล่งเรียนระดับ B2 (คัดแล้ว · กด "เปิด ↗")', meta: 'แกรมมาร์ · ตามอาการ', activity: 'British Council Grammar B1–B2 — ทบทวนแกรมมาร์เป็นจุด ๆ เฉพาะเรื่องที่งง ไม่ต้องไล่ทั้งคอร์ส', cat: 'eng', url: 'https://learnenglish.britishcouncil.org/grammar/b1-b2-grammar' },
      { id: 'enr11', group: 'แหล่งเรียนระดับ B2 (คัดแล้ว · กด "เปิด ↗")', meta: 'แกรมมาร์ · หนังสือ', activity: 'English Grammar in Use (Murphy เล่มฟ้า) — หนังสือมาตรฐาน B1–B2 มีเฉลยในตัว เปิดเฉพาะบทที่พลาดบ่อย', cat: 'eng' },
      { id: 'enr12', group: 'แหล่งเรียนระดับ B2 (คัดแล้ว · กด "เปิด ↗")', meta: 'วัดผล · ข้อสอบจริง', activity: 'Cambridge B2 First (FCE) sample papers — ข้อสอบมาตรฐานของระดับ B2 ไว้ซ้อมจริงจัง (เผื่อยื่นแลกเปลี่ยน/สมัครงาน)', cat: 'eng', url: 'https://www.cambridgeenglish.org/exams-and-tests/first/preparation/' },
    ],
  },

  // ---------- 5) Skills (เดิม) ----------
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

  // ---------- 6) Projects (เดิม) ----------
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

  // ---------- 7) Research (ใหม่ — โครงงาน FPGA-Accelerated Air Quality Anomaly Detection) ----------
  // แผนอ่าน 18 สัปดาห์ ทีม 4 คน: ML-1, ML-2 (สาย ML) · HW-1, HW-2 (สาย Hardware)
  // เฟส 1 ML Model = สัปดาห์ 1–10 · เฟส 2 FPGA Hardware = สัปดาห์ 11–18
  // Tier 1 แกนกลาง (H&P Ch.7, Walpole Ch.10) อ่านทุกคน · 📝 = อ่านจบต้องทำ summary note แชร์ทีม
  {
    id: 'research', tab: 'research', layout: 'group', resettable: false, checkable: true,
    note: 'โครงงาน: FPGA-Accelerated Air Quality Anomaly Detection (TCN · PM2.5/NO2/CO) · 18 สัปดาห์ · ทีม: ML-1 ML-2 HW-1 HW-2 (กด ✎ แก้เป็นชื่อจริงได้) · 📝 = อ่านจบต้องสรุปแชร์ทีม',
    items: [
      // Milestones หลัก
      { id: 'ms1', group: '🎯 Milestones หลัก', meta: 'สัปดาห์ 2', activity: 'จบ Literature Review — สรุปช่องว่างงานวิจัย + ตาราง related work', cat: 'res' },
      { id: 'ms2', group: '🎯 Milestones หลัก', meta: 'สัปดาห์ 10', activity: 'จบ Paper 1 draft (ML: TCN anomaly detection บนข้อมูล multivariate air quality)', cat: 'res' },
      { id: 'ms3', group: '🎯 Milestones หลัก', meta: 'สัปดาห์ 14', activity: 'ได้ bitstream แรก รันบนบอร์ด FPGA จริง', cat: 'res' },
      { id: 'ms4', group: '🎯 Milestones หลัก', meta: 'สัปดาห์ 18', activity: 'จบ Paper 2 draft (FPGA acceleration + performance comparison)', cat: 'res' },

      // เฟส 1 ช่วงแรก — พื้นฐาน + โมเดล TCN
      { id: 'rw1', group: 'เฟส 1 · ML — สัปดาห์ 1–5: พื้นฐาน + โมเดล TCN', meta: 'สัปดาห์ 1 · ทุกคน · 📝 สรุปแชร์', activity: '[Tier 2] OSTEP Ch.6 (Limited Direct Execution) + Ch.36 (I/O Devices) — primer อ่านก่อนเพื่อน → ปูพื้น OS/I/O ก่อนคุยเรื่อง accelerator', cat: 'res', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/' },
      { id: 'rw2', group: 'เฟส 1 · ML — สัปดาห์ 1–5: พื้นฐาน + โมเดล TCN', meta: 'สัปดาห์ 1–3 · HW-1 + HW-2', activity: '[Tier 1] COD 5th App.B (B.2–B.8 digital logic) → พื้นฐานวงจรก่อนเข้า HLS/FPGA (เฟส 2)', cat: 'res' },
      { id: 'rw3', group: 'เฟส 1 · ML — สัปดาห์ 1–5: พื้นฐาน + โมเดล TCN', meta: 'สัปดาห์ 2–4 · ML-1 + ML-2 · 📝 สรุปแชร์', activity: '[Self] TCN paper (Bai et al. 2018) — โมเดลแกนของโครงงาน → กำหนดสถาปัตยกรรมโมเดลเฟส 1', cat: 'res', url: 'https://arxiv.org/abs/1803.01271' },
      { id: 'rw4', group: 'เฟส 1 · ML — สัปดาห์ 1–5: พื้นฐาน + โมเดล TCN', meta: 'สัปดาห์ 2–4 · ML-1 · 📝 สรุปแชร์', activity: '[Tier 1] Data-Driven Mechanical Engineering Ch.7 (Time Series) → feature engineering ของข้อมูล PM2.5/NO2/CO', cat: 'res' },
      { id: 'rw5', group: 'เฟส 1 · ML — สัปดาห์ 1–5: พื้นฐาน + โมเดล TCN', meta: 'สัปดาห์ 3–5 · ML-2 · 📝 สรุปแชร์', activity: '[Tier 1] Walpole Prob&Stats 9th Ch.6 (sampling distributions) → พื้นฐานสถิติสำหรับนิยาม anomaly threshold', cat: 'res' },
      { id: 'rw6', group: 'เฟส 1 · ML — สัปดาห์ 1–5: พื้นฐาน + โมเดล TCN', meta: 'สัปดาห์ 3–6 · ML-1 + ML-2', activity: '[Self] PyTorch tutorials (official) → เขียน training pipeline ของ TCN', cat: 'res', url: 'https://pytorch.org/tutorials/' },
      { id: 'rw7', group: 'เฟส 1 · ML — สัปดาห์ 1–5: พื้นฐาน + โมเดล TCN', meta: 'สัปดาห์ 3–6 · ML-2', activity: '[Tier 2] Data-Driven Ch.5, 8–9 → เทคนิคโมเดล + validation เสริมเฟส 1', cat: 'res' },
      { id: 'rw8', group: 'เฟส 1 · ML — สัปดาห์ 1–5: พื้นฐาน + โมเดล TCN', meta: 'สัปดาห์ 4–5 · ML-1', activity: '[Tier 1] Data-Driven Ch.2 (EDA) → สำรวจ dataset คุณภาพอากาศจริงก่อน train', cat: 'res' },
      { id: 'rw9', group: 'เฟส 1 · ML — สัปดาห์ 1–5: พื้นฐาน + โมเดล TCN', meta: 'สัปดาห์ 1–8 · ML-1 + ML-2 · ตามวิชาเรียน', activity: '[Tier 2] Walpole Ch.2–4, 8–9 — อ่านตามจังหวะวิชา Prob&Stat เทอมนี้ → ฐานทฤษฎีให้ Ch.6/Ch.10', cat: 'res' },
      { id: 'rw10', group: 'เฟส 1 · ML — สัปดาห์ 1–5: พื้นฐาน + โมเดล TCN', meta: 'สัปดาห์ 4–6 · HW-1', activity: '[Tier 2] COD Ch.1 (1.6–1.7 performance), Ch.3 (3.1–3.5 arithmetic) → metric ประสิทธิภาพ + เลขคณิตสำหรับ quantization', cat: 'res' },

      // เฟส 1 ช่วงหลัง — ประเมินผล + Paper 1
      { id: 'rw11', group: 'เฟส 1 · ML — สัปดาห์ 5–10: ประเมินผล + Paper 1', meta: 'สัปดาห์ 5–8 · ML-1 · 📝 สรุปแชร์', activity: '[Self] Anomaly evaluation protocols (survey papers) → ออกแบบ experiment + metrics ของ Paper 1', cat: 'res' },
      { id: 'rw12', group: 'เฟส 1 · ML — สัปดาห์ 5–10: ประเมินผล + Paper 1', meta: 'สัปดาห์ 6–8 · HW-1 + HW-2 · 📝 สรุปแชร์', activity: '[Tier 1] COD Ch.4 (4.5–4.8 pipeline), Ch.5 (5.1–5.4, 5.9 cache) → หัวใจการออกแบบ accelerator + memory hierarchy', cat: 'res' },
      { id: 'rw13', group: 'เฟส 1 · ML — สัปดาห์ 5–10: ประเมินผล + Paper 1', meta: 'สัปดาห์ 8–10 · ⭐ ทุกคน · 📝 สรุปแชร์', activity: '[Tier 1 แกนกลาง] H&P 6th Ch.7 (Domain-Specific Architectures) → เหตุผลเชิงสถาปัตยกรรมของ FPGA accelerator ใช้อ้างใน Paper 2', cat: 'res' },
      { id: 'rw14', group: 'เฟส 1 · ML — สัปดาห์ 5–10: ประเมินผล + Paper 1', meta: 'สัปดาห์ 8–10 · ⭐ ทุกคน · 📝 สรุปแชร์', activity: '[Tier 1 แกนกลาง] Walpole Ch.10 (hypothesis testing) → ทดสอบนัยสำคัญของผลการทดลองทั้ง Paper 1 และ 2', cat: 'res' },
      { id: 'rw15', group: 'เฟส 1 · ML — สัปดาห์ 5–10: ประเมินผล + Paper 1', meta: 'สัปดาห์ 8–10 · HW-2', activity: '[Tier 1] Silberschatz OS 10th Ch.12 (I/O Systems) → เข้าใจ I/O path ก่อนต่อบอร์ดกับ host', cat: 'res' },
      { id: 'rw16', group: 'เฟส 1 · ML — สัปดาห์ 5–10: ประเมินผล + Paper 1', meta: 'สัปดาห์ 8–10 · HW-2', activity: '[Tier 1] Tanenbaum Modern OS Ch.5 (5.1–5.2 I/O hardware/software) → มุมมอง driver/DMA สำหรับเฟส 2', cat: 'res' },
      { id: 'rw17', group: 'เฟส 1 · ML — สัปดาห์ 5–10: ประเมินผล + Paper 1', meta: 'สัปดาห์ 9–10 · HW-1', activity: '[Tier 2] H&P Ch.1 (1.8–1.9 measuring/benchmarking) → ระเบียบวิธีวัดผล ใช้ทั้งสอง paper', cat: 'res' },
      { id: 'rw18', group: 'เฟส 1 · ML — สัปดาห์ 5–10: ประเมินผล + Paper 1', meta: 'สัปดาห์ 8–10 · ML-1 + ML-2', activity: '[Self] LaTeX/Overleaf + academic writing → เขียน Paper 1 draft ให้จบสัปดาห์ 10', cat: 'res', url: 'https://www.overleaf.com/learn' },

      // สะพาน ML → FPGA
      { id: 'rw19', group: 'สะพาน ML → FPGA — สัปดาห์ 9–13: Quantization + HLS', meta: 'สัปดาห์ 9–12 · ML-2 + HW-1 · 📝 สรุปแชร์', activity: '[Self] Brevitas QAT (quantization-aware training) → แปลง TCN เป็น INT8 ก่อนลง FPGA', cat: 'res', url: 'https://github.com/Xilinx/brevitas' },
      { id: 'rw20', group: 'สะพาน ML → FPGA — สัปดาห์ 9–13: Quantization + HLS', meta: 'สัปดาห์ 9–13 · HW-1 + HW-2 · 📝 สรุปแชร์', activity: '[Self] Vitis HLS: Kastner "Parallel Programming for FPGAs" + AMD UG1399 → เขียน TCN kernel เป็น HLS C++', cat: 'res', url: 'https://kastner.ucsd.edu/hlsbook/' },

      // เฟส 2 ช่วงแรก — Vivado + bitstream แรก
      { id: 'rw21', group: 'เฟส 2 · FPGA — สัปดาห์ 11–14: Vivado + bitstream แรก', meta: 'สัปดาห์ 11–14 · HW-1', activity: '[Self] Vivado tutorials → block design + synthesize ให้ได้ bitstream แรก (milestone สัปดาห์ 14)', cat: 'res' },
      { id: 'rw22', group: 'เฟส 2 · FPGA — สัปดาห์ 11–14: Vivado + bitstream แรก', meta: 'สัปดาห์ 11–14 · HW-2 · 📝 สรุปแชร์', activity: '[Self] AXI protocol (Zynq TRM UG585) → เชื่อม accelerator กับ PS ผ่าน AXI DMA', cat: 'res' },
      { id: 'rw23', group: 'เฟส 2 · FPGA — สัปดาห์ 11–14: Vivado + bitstream แรก', meta: 'สัปดาห์ 12–13 · HW-2', activity: '[Tier 2] Silberschatz Ch.9–10 (memory/virtual memory แบบ concept) → เข้าใจ address space ตอน map buffer ระหว่าง CPU กับ FPGA', cat: 'res' },
      { id: 'rw24', group: 'เฟส 2 · FPGA — สัปดาห์ 11–14: Vivado + bitstream แรก', meta: 'สัปดาห์ 13–15 · HW-2', activity: '[Tier 2] Tanenbaum Ch.10 (10.3, 10.5 Linux process/I/O) → ฐานก่อนใช้ PetaLinux', cat: 'res' },
      { id: 'rw25', group: 'เฟส 2 · FPGA — สัปดาห์ 11–14: Vivado + bitstream แรก', meta: 'สัปดาห์ 13–16 · HW-1', activity: '[Self] PetaLinux (Xilinx wiki) → สร้าง Linux image รันบนบอร์ด + เขียน userspace app คุยกับ driver', cat: 'res' },

      // เฟส 2 ช่วงท้าย — วัดผล + Paper 2
      { id: 'rw26', group: 'เฟส 2 · FPGA — สัปดาห์ 15–18: วัดผล + Paper 2', meta: 'สัปดาห์ 15–16 · HW-1', activity: '[Tier 2] COD Ch.6 (6.3, 6.6 parallelism/GPU) → ตาราง performance comparison ใน Paper 2', cat: 'res' },
      { id: 'rw27', group: 'เฟส 2 · FPGA — สัปดาห์ 15–18: วัดผล + Paper 2', meta: 'สัปดาห์ 15–17 · HW-1 + ML-1 · 📝 สรุปแชร์', activity: '[Tier 2] H&P Ch.2 (2.1–2.3 memory hierarchy) + Roofline model (Ch.4 บางส่วน) → วิเคราะห์ bottleneck ของ accelerator ใน Paper 2', cat: 'res' },
      { id: 'rw28', group: 'เฟส 2 · FPGA — สัปดาห์ 15–18: วัดผล + Paper 2', meta: 'สัปดาห์ 16–18 · ทุกคน (HW นำ)', activity: '[Self] LaTeX + academic writing รอบสอง → เขียน Paper 2 draft ให้จบสัปดาห์ 18', cat: 'res', url: 'https://www.overleaf.com/learn' },

      // Tier 3 — reference ท้ายแผน (ตามข้อกำหนด: ไม่ลงตาราง แต่ระบุไว้)
      { id: 'rw29', group: 'Tier 3 · Reference — เปิดเมื่อใช้ (ไม่ลงตาราง)', meta: 'ใช้ตลอดสัปดาห์ 3–10', activity: 'ML Python Cookbook 2nd: Ch.3–4 (data), 7 (datetime), 11–12 (evaluation/selection), 20–21 (NN/PyTorch), 23 (deploy) — เปิดเป็น recipe ตอนเขียนโค้ด', cat: 'res' },
      { id: 'rw30', group: 'Tier 3 · Reference — เปิดเมื่อใช้ (ไม่ลงตาราง)', meta: 'reference', activity: 'Kroese — Data Science & Machine Learning: Ch.2 (statistical learning), 4 (unsupervised), 9 (deep learning) — ทฤษฎีเสริมเวลาติดคณิต', cat: 'res' },
    ],
  },

  // ---------- 8) Roadmap (เดิม) ----------
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

  // ---------- 9) Electives (เดิม) ----------
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

  // ---------- 10) แหล่งเรียนฟรี STEP 0–7 (เดิม) ----------
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

  // ---------- 11) Fitness (เดิม — รีเซ็ตรายสัปดาห์) ----------
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
    schemaVersion: 4, // v2 = ICPC 2027 + english · v3 = แหล่งเรียน B2 · v4 = แท็บ research (ดู upgradeDoc ใน store.js)
    settings: {
      // National/Bangkok 2027 เป็นประมาณการจากรอบปีก่อน — แก้ใน UI เมื่อประกาศวันจริง
      dates: { national: '2027-09-11', bangkok: '2027-11-20' },
      icpcView: 'all', // ตัวกรองแผนหลัง National: all | qualified | notq
    },
    migratedCount: 0,
    migrationNoticeDismissed: false,
    sections: JSON.parse(JSON.stringify(SECTIONS)),
    statuses: {}, // { [sectionId หรือ 'sectionId:week']: { [itemId]: 'pending'|'running'|'done' } }
  };
}
