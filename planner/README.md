# Mission Log — Final Sprint 2569/1

Web app จัดการแผนส่วนตัว (ยกระดับจาก `planner_v2.html`) — **ทุกตารางแก้ไข/เพิ่ม/ลบได้ผ่าน UI**
สร้างด้วย React + Vite, เก็บข้อมูลใน localStorage, มี Export/Import JSON และ migration จากของเดิม

## Final Sprint (21 ก.ย. – 18 ต.ค. 2026) — schema v19

- แผนทั้งหมดอยู่ใน [`src/data/final_sprint_2569_1.json`](src/data/final_sprint_2569_1.json)
  (6 projects · 11 milestones · 40 task · ช่องพลังงานสำหรับปุ่มเลื่อน) — แก้ไฟล์นี้แล้ว build ใหม่
- logic อยู่ที่ [`src/data/sprint.js`](src/data/sprint.js): seed แบบ idempotent (id = วันที่+เวลา+โปรเจค),
  หา slot ว่าง, % โปรเจค, สรุปสัปดาห์, validation
- บอร์ด weekly ผูกวันที่: ปุ่ม ‹ › เลื่อนสัปดาห์ · แถบ Project ด้านบน (%, วันเหลือ, milestone ถัดไป,
  แก้ deadline + ติ๊กยืนยัน, เตือนเมื่อเหลือ ≤3 วันและ % < 70) · 📋 สรุปสัปดาห์ · ⏭ เลื่อนไปช่องว่างถัดไป
- การ์ด `locked` ลาก/เลื่อน/แก้เวลาไม่ได้จนกว่าจะติ๊กปลดล็อกในหน้าแก้ไข · การ์ด BUFFER ไม่มีทางถูกทับ
- icpc พักไว้ (ซ่อน + ไม่นับ progress) — กด "▶ เปิดใช้ต่อ" ในแท็บ icpc

ตรวจ acceptance ฝั่งข้อมูล (40 task, ไม่มีเวลาทับ, migration, ปุ่มเลื่อน):

```bash
npm run test:sprint
```

### Backup + วิธี restore

ข้อมูลจริงอยู่ใน localStorage ของเบราว์เซอร์ที่ใช้เปิดแอป ตอนเปิดแอปเวอร์ชันนี้ครั้งแรก
(อัปเกรดจาก v18 → v19) แอปจะเก็บสำเนาข้อมูลเดิม **ก่อนล้าง** ไว้ 2 ที่:

1. ไฟล์ `backup/mission_log_backup_YYYY-MM-DD.json` (server เขียนให้ — โฟลเดอร์นี้ gitignore เพราะมีรายการเงิน)
2. localStorage key `planner-v3:backup:pre-v19` — กดปุ่ม "⬇ สำเนาก่อนอัปเกรด" บนแถบแจ้งเตือนเพื่อดาวน์โหลด

**restore ทั้งหมดกลับเป็นแอปเดิม** (การ import ไฟล์ v18 เข้าแอปเวอร์ชันนี้จะถูกอัปเกรดเป็น Final Sprint ซ้ำ):

```bash
git checkout pre-final-sprint-2026-09-21 -- planner
npm run build:planner
```

แล้วเปิด planner → ⬆ Import JSON → เลือกไฟล์ backup · กลับมาเวอร์ชันปัจจุบันด้วย
`git checkout main -- planner` แล้ว build อีกครั้ง

## วิธีรันแบบง่ายสุด (รวมกับแอปข่าว InvestFeed)

ดับเบิลคลิก **shortcut "InvestFeed + Planner"** บน Desktop (หรือไฟล์ `start-app.cmd`
ในโฟลเดอร์แม่) — server เดียวเสิร์ฟทั้งสองแอป:

- http://localhost:3000 → แอปข่าว InvestFeed
- http://localhost:3000/planner → Planner (แอปนี้)

ถ้าแก้โค้ด planner แล้วอยากให้เวอร์ชันรวมอัปเดต ให้รัน `npm run build:planner`
ที่โฟลเดอร์แม่ แล้วรีเฟรชหน้า

## วิธีติดตั้ง + รัน (โหมดพัฒนา แยกเฉพาะ planner)

ต้องมี Node.js 18+ (`node --version` เช็กได้)

```bash
cd planner
npm install
npm run dev
```

แล้วเปิด http://localhost:5173

## Build เป็นไฟล์เดียว (ใช้แบบเดียวกับ planner เดิม)

```bash
npm run build
```

ได้ `dist/index.html` **ไฟล์เดียวจบ** (JS/CSS ฝังในไฟล์แล้ว) — copy ไปวางที่ไหนก็ได้
เช่นใน OneDrive ข้าง `planner_v2.html` เดิม แล้วเปิดใน browser ตรง ๆ ได้เลย ไม่ต้องรัน server

> ⭐ แนะนำ: ถ้าเคยเปิด `planner_v2.html` แบบดับเบิลคลิกไฟล์ (`file://`) ให้เอา `dist/index.html`
> ไปวางในเครื่องแล้วเปิดด้วย **browser ตัวเดิม** — แอปจะเห็น localStorage เดิมและ
> **นำเข้าข้อมูลเก่าให้อัตโนมัติทันทีตอนเปิดครั้งแรก**

## การย้ายข้อมูลจาก planner_v2 (ทำครั้งเดียว)

แอปหาข้อมูลเดิม (key `mission-log-v2:*`) ตอนเปิดครั้งแรกโดยอัตโนมัติ — สถานะที่เคยติ๊ก (⏳/🔄/✅)
และวันแข่งที่เคยตั้งไว้จะตามมาครบ ถ้าเห็นแถบเขียว "นำเข้าข้อมูลจาก planner เดิมสำเร็จ" คือเรียบร้อย

**ถ้าไม่เห็นแถบเขียว** (เพราะเปิดแอปคนละ origin กับ planner เดิม เช่น รันบน localhost):

1. copy `migrate-helper.html` ไปไว้โฟลเดอร์เดียวกับ `planner_v2.html` เดิม
2. เปิด `migrate-helper.html` ด้วย browser ตัวเดียวกับที่เคยใช้ planner เดิม
3. กดดาวน์โหลด → ได้ไฟล์ `planner-v2-legacy.json`
4. ในแอปใหม่ กด **⬆ Import JSON** แล้วเลือกไฟล์นั้น

หมายเหตุ: ส่วน ICPC วางแผนใหม่ทั้งหมด สถานะเดิมของหัวข้อ Base/Sharpen/Peak/Bangkok
จึงไม่ถูก map (เนื้อหาไม่ตรงกันแล้ว) — ยกเว้น Resources 7 ลิงก์ที่คงไว้พร้อมสถานะเดิม

## วิธีแก้ตารางเอง

- **คลิกการ์ด** → วนสถานะ ⏳ PENDING → 🔄 RUNNING → ✅ AC (บันทึกอัตโนมัติ)
- **✎ มุมขวาบนการ์ด** (โผล่ตอน hover) → แก้ทุก field: ข้อความ วัน เวลา สถานที่ กลุ่ม ลิงก์ หมวด
- **🗑** → ลบรายการ (มี confirm)
- **ปุ่ม +** ที่หัวกลุ่ม/หัววัน หรือ **"+ เพิ่มรายการ"** มุมขวาบน → เพิ่มรายการใหม่
- **ลากการ์ด** (แท็บรายวัน: weekly / fitness / ตารางเรียน) → ย้ายวันหรือสลับลำดับ · ลากชิป **"✥ กล่องข้อความ"** ไปวางบนคอลัมน์วัน → เพิ่มงานของวันนั้น (บนมือถือใช้ปุ่ม ✎ เลือกวันแทน)
- **📚 ถาดวิชา + 📕 ถาดหนังสือ** ใต้แท็บ weekly (สองถาดแยกกัน ไม่ปนกัน) — ถาดวิชามีการ์ด 1 ใบ/วิชา, ถาดหนังสือมีการ์ด 1 ใบ/เล่ม (ลิงก์ PDF บนชั้น) ลากขึ้นไปวางในวันเพื่อจองเวลาอ่าน ลากกลับลงถาดเพื่อเก็บ · การ์ดที่พักในถาดยังไม่นับใน progress จนกว่าจะจองวัน
- แท็บ **icpc** เป็นเส้นทาง 4 เฟสสู่ ICPC 2027 (แข่งตอนปี 4) · มี dropdown สลับแผนหลัง National: ดูทั้งสองแผน / ✅ ผ่านเข้า Regional / 🔁 ไม่ผ่าน
- แท็บ **english** — แผนแก้จุดอ่อนอ่านโจทย์ภาษาอังกฤษ (ฝึกอ่านโจทย์จริง + คลังศัพท์ Anki + milestone รายเดือน)
- แท็บ **research** — แผนอ่าน 18 สัปดาห์ของโครงงาน FPGA-Accelerated Air Quality Anomaly Detection (ทีม 4 คน · Tier 1–3 · 📝 = ต้องสรุปแชร์ทีม)
- แท็บ **หนังสือ** — ชั้นหนังสือ PDF/สไลด์จากโฟลเดอร์ "Reseach skill" กดเปิดอ่านในแท็บใหม่ได้เลย (รายชื่อดึงสดจาก server — ใช้ได้เมื่อเปิดผ่าน localhost:3000/planner)
- แท็บ **เงิน** — รายรับรายจ่าย: เพิ่ม/ลบธุรกรรม, ดูรายเดือน, สรุปเงินที่ใช้ได้ (คงเหลือ) + เฉลี่ยใช้ได้ต่อวัน, แยกรายจ่ายตามหมวด · ข้อมูลเก็บใน localStorage + รวมใน Export/Import JSON
- **⬇ Export JSON** สำรองข้อมูลทั้งหมด · **⬆ Import JSON** กู้คืน/ย้ายเครื่อง
- แท็บ weekly กับ fitness รีเซ็ตสถานะอัตโนมัติทุกสัปดาห์ (ตาม ISO week)

## โครงสร้างโปรเจกต์

```
planner/
├─ index.html              จุดเริ่ม (โหลดฟอนต์ + mount React)
├─ migrate-helper.html     ตัวช่วยดึงข้อมูล planner_v2 (ใช้กรณีข้าม origin)
├─ vite.config.js          config + vite-plugin-singlefile (build ไฟล์เดียว)
└─ src/
   ├─ main.jsx             entry
   ├─ App.jsx              state หลัก + CRUD + import/export
   ├─ styles.css           ธีม dark เดิม + responsive
   ├─ data/
   │  ├─ constants.js      ค่าคงที่, ISO week, เฟส countdown
   │  ├─ seed.js           ★ ข้อมูลเริ่มต้นทุก section (แก้ผ่าน UI ได้หมด)
   │  ├─ store.js          โหลด/บันทึก localStorage, export JSON
   │  └─ migrate.js        อ่าน schema เดิม mission-log-v2:* → เทเข้าแอปใหม่
   └─ components/
      ├─ Sidebar.jsx        แท็บ + progress ring + countdown + ปุ่ม backup
      ├─ CountdownCard.jsx  นับถอยหลัง 3 รายการ (แก้วันได้)
      ├─ ProgressRing.jsx   วงแหวนความคืบหน้ารวม
      ├─ SectionPanel.jsx   จัด layout รายวัน/รายกลุ่ม + ตัวกรองแผน ICPC
      ├─ ItemCard.jsx       การ์ดรายการ + ปุ่ม ✎/🗑
      └─ ItemEditor.jsx     ฟอร์มเพิ่ม/แก้ไข (modal)
```

## ข้อมูลเก็บที่ไหน

ทั้งหมดอยู่ใน localStorage key เดียว: `planner-v3:doc` (JSON ก้อนเดียว: sections + statuses + settings)
— ล้าง site data ของ browser = ข้อมูลหาย ดังนั้นกด Export JSON เก็บไว้เป็นระยะ
