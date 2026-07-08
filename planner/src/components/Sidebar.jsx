import React, { useRef } from 'react';
import { statusKey } from '../data/store.js';
import ProgressRing from './ProgressRing.jsx';
import CountdownCard from './CountdownCard.jsx';

/** ความคืบหน้าของ section (null = section ที่ไม่ติ๊กสถานะ เช่น ตารางเรียน) */
function sectionProgress(doc, section, weekKey) {
  if (section.checkable === false) return null;
  const map = doc.statuses[statusKey(section, weekKey)] || {};
  const total = section.items.length;
  const done = section.items.filter((i) => map[i.id] === 'done').length;
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

export default function Sidebar({ doc, weekKey, activeId, onSelect, onSaveDates, onExport, onImportFile }) {
  const fileRef = useRef(null);

  // ความคืบหน้ารวมทุก section ที่ติ๊กได้
  let total = 0, done = 0;
  for (const s of doc.sections) {
    const p = sectionProgress(doc, s, weekKey);
    if (p) { total += p.total; done += p.done; }
  }
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <aside className="sidebar">
      <div>
        <div className="ml-eyebrow"><span className="dot" />MISSION LOG · v3</div>
        <div className="ml-title">แผนพิชิต ICPC + สาย AI</div>
        <div className="ml-sub">ซ้อมแข่ง ICPC 2027 · English · อัพสกิล DS/ML · โปรเจกต์ · ฟิต — แก้ทุกตารางได้ใน UI</div>
      </div>

      <ProgressRing pct={pct} done={done} total={total} />

      <CountdownCard dates={doc.settings.dates} onSave={onSaveDates} />

      <div className="ml-tabs" role="tablist">
        {doc.sections.map((s) => {
          const p = sectionProgress(doc, s, weekKey);
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={s.id === activeId}
              className={'ml-tab mono' + (s.id === activeId ? ' active' : '')}
              onClick={() => onSelect(s.id)}
            >
              <span>$ {s.tab}</span>
              {p && <span className="pct">{p.pct}%</span>}
            </button>
          );
        })}
      </div>

      {/* backup / ย้ายเครื่อง / ดึงข้อมูลจาก planner เดิม */}
      <div className="data-actions">
        <button className="ml-reset" onClick={onExport}>⬇ Export JSON</button>
        <button className="ml-reset" onClick={() => fileRef.current && fileRef.current.click()}>⬆ Import JSON</button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files && e.target.files[0];
            if (f) onImportFile(f);
            e.target.value = ''; // ให้เลือกไฟล์เดิมซ้ำได้
          }}
        />
      </div>

      {/* ลิงก์กลับแอปข่าว — โชว์เฉพาะตอนเสิร์ฟรวมกับ InvestFeed ที่ /planner */}
      {window.location.pathname.startsWith('/planner') && (
        <a className="ml-reset back-link" href="/">📈 เปิดแอปข่าว InvestFeed</a>
      )}

      <div className="sidebar-footer">
        คลิกการ์ดเพื่อเปลี่ยนสถานะ: ⏳ → 🔄 → ✅<br />
        ✎ แก้ไข · 🗑 ลบ · ปุ่ม + เพิ่มรายการ<br />
        บันทึกอัตโนมัติในเครื่อง · Export JSON ไว้กันข้อมูลหาย
      </div>
    </aside>
  );
}
