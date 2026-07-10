# InvestFeed + Planner

โปรเจกต์ส่วนตัว รวมสองแอปไว้ใน server เดียว (Node.js + Express):

- **InvestFeed** — ตัวอ่านข่าวการลงทุน ดึง RSS หลายสำนัก + สรุปข่าวด้วย AI (Gemini)
- **Planner (Mission Log v3)** — แผนพิชิต ICPC + สาย AI, ตารางเรียน, roadmap ฯลฯ
  แก้ไขทุกตารางได้ผ่าน UI (React + Vite) — รายละเอียดใน [planner/README.md](planner/README.md)

## ติดตั้ง

ต้องมี Node.js 18+

```bash
npm install                 # ติดตั้ง dependencies ของ server
npm install --prefix planner  # ติดตั้ง dependencies ของ planner
npm run build:planner       # build planner เป็นไฟล์เดียวให้ server เสิร์ฟ
```

จากนั้นสร้างไฟล์ `.env` (คัดลอกจาก [.env.example](.env.example)) แล้วใส่ `GEMINI_API_KEY`
สำหรับฟีเจอร์สรุปข่าว AI (ถ้าไม่ใส่ แอปข่าวยังใช้ได้ แค่ปุ่มสรุป AI จะไม่ทำงาน)

## รัน

```bash
npm start
```

- http://localhost:3000 → InvestFeed (ข่าว)
- http://localhost:3000/planner → Planner

หรือดับเบิลคลิก `start-app.cmd` (Windows) — สตาร์ท server แล้วเปิด browser ให้อัตโนมัติ

## โครงสร้าง

```
.
├─ server.js          Express server (เสิร์ฟข่าว + planner + API)
├─ public/            หน้าเว็บ InvestFeed (static)
├─ planner/           แอป Planner (React + Vite) — build ไป planner/dist/
├─ start-app.cmd      launcher สำหรับ Windows
├─ .env.example       แม่แบบ environment (คัดลอกเป็น .env)
└─ data/              ข้อมูล runtime (cache/bookmarks/สรุป) — server สร้างเอง ไม่ commit
```

## หมายเหตุ

- `data/` และ `.env` ไม่ถูก commit (ดู [.gitignore](.gitignore)) — `data/` จะถูกสร้างใหม่ตอนรัน
- ข้อมูล Planner เก็บใน localStorage ของ browser (ต่ออุปกรณ์) — มีปุ่ม Export/Import JSON ใน UI
- แท็บ "หนังสือ" ใน planner เสิร์ฟไฟล์จากโฟลเดอร์หนังสือบนเครื่อง (ตั้งที่ `BOOKS_DIR` ใน `.env`,
  default คือ `C:\Users\Public\Documents\Reseach skill`) ผ่าน `/api/books` + `/books/<path>`
