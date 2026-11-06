import React, { useRef } from 'react';
import { TAB_GROUPS, itemStatusKey } from '../data/constants.js';
import { SPRINT, isPaused, datesOfWeek } from '../data/sprint.js';
import ProgressRing from './ProgressRing.jsx';
import CountdownCard from './CountdownCard.jsx';
import SprintCountdown from './SprintCountdown.jsx';

/**
 * ความคืบหน้าของ section (null = ไม่นับ: แท็บไม่ติ๊กสถานะ เช่น ตารางเรียน หรือแท็บที่พักไว้)
 * - การ์ดถาดที่ยังไม่จองวัน ไม่นับเป็นงาน
 * - บอร์ดผูกวันที่ (weekly ช่วง Final Sprint): นับเฉพาะการ์ดของ "สัปดาห์นี้" + การ์ดรูทีน
 */
function sectionProgress(doc, section, weekKey) {
  if (section.checkable === false || isPaused(doc, section.id)) return null;
  let counted = section.items.filter((i) => !(i.pool && !i.day && !i.date));
  if (section.dated) {
    const days = new Set(datesOfWeek(weekKey));
    counted = counted.filter((i) => !i.date || days.has(i.date));
  }
  const done = counted.filter((i) => (doc.statuses[itemStatusKey(section, i, weekKey)] || {})[i.id] === 'done').length;
  const total = counted.length;
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

const THEMES = [
  { id: 'ink', label: 'ดำสนิท' },
  { id: 'slate', label: 'มืดหม่น' },
];

export default function Sidebar({ doc, weekKey, activeId, onSelect, onSaveDates, onExport, onImportFile, theme, onTheme }) {
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
        {/* ชื่อแอปมาจาก seed ของ sprint (ไม่ hardcode ใน component) */}
        <div className="ml-title">{doc.sprint ? SPRINT.app.title : 'แผนพิชิต ICPC + สาย AI'}</div>
        <div className="ml-sub">{doc.sprint ? SPRINT.app.subtitle : 'ซ้อมแข่ง ICPC · English · อัพสกิล DS/ML · โปรเจกต์ · ฟิต'}</div>
      </div>

      <ProgressRing pct={pct} done={done} total={total} />

      {/* แท็บจัดเป็นกลุ่ม — อยู่ก่อน countdown ให้เห็นครบโดยไม่ต้องเลื่อน
          section ที่ไม่อยู่ในกลุ่มไหนไปรวมที่ "อื่น ๆ" ท้ายสุด */}
      <nav className="ml-tabs" role="tablist">
        {(() => {
          const grouped = new Set(TAB_GROUPS.flatMap((g) => g.ids));
          const leftovers = doc.sections.filter((s) => !grouped.has(s.id)).map((s) => s.id);
          const groups = leftovers.length
            ? [...TAB_GROUPS, { label: 'อื่น ๆ', ids: leftovers }]
            : TAB_GROUPS;

          return groups.map((g) => {
            const secs = g.ids.map((id) => doc.sections.find((s) => s.id === id)).filter(Boolean);
            if (!secs.length) return null;
            return (
              <div className="tab-group" key={g.label}>
                <div className="tab-group-label">{g.label}</div>
                {secs.map((s) => {
                  const p = sectionProgress(doc, s, weekKey);
                  return (
                    <button
                      key={s.id}
                      role="tab"
                      aria-selected={s.id === activeId}
                      className={'ml-tab' + (s.id === activeId ? ' active' : '')}
                      onClick={() => onSelect(s.id)}
                    >
                      <span className="tab-name">{s.tab}</span>
                      {isPaused(doc, s.id)
                        ? <span className="pct" title={SPRINT.app.pauseNote}>⏸</span>
                        : p && <span className="pct mono">{p.pct}%</span>}
                    </button>
                  );
                })}
              </div>
            );
          });
        })()}
      </nav>

      {/* countdown หลักของแผน + milestone ถัดไป */}
      <SprintCountdown doc={doc} />

      {/* ICPC: ตอนพักไว้ยุบเหลือบรรทัดเดียว */}
      <CountdownCard dates={doc.settings.dates} onSave={onSaveDates} paused={isPaused(doc, 'icpc') ? SPRINT.app.pauseNote : null} />

      {/* สลับธีม — เก็บใน doc.settings.theme (ติดไปกับ Export JSON) */}
      <div className="theme-switch" role="radiogroup" aria-label="ธีม">
        <span className="theme-label">ธีม</span>
        {THEMES.map((t) => (
          <button
            key={t.id}
            role="radio"
            aria-checked={theme === t.id}
            className={'theme-opt' + (theme === t.id ? ' active' : '')}
            onClick={() => onTheme(t.id)}
          >
            <span className={'theme-swatch sw-' + t.id} aria-hidden="true" />{t.label}
          </button>
        ))}
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
        คลิกการ์ดเพื่อเปลี่ยนสถานะ: ○ รอทำ → ◐ กำลังทำ → ✓ เสร็จ<br />
        ชี้การ์ดเพื่อเห็นปุ่ม ✎ แก้ไข · 🗑 ลบ · ⏭ เลื่อน<br />
        บันทึกอัตโนมัติในเครื่อง · Export JSON ไว้กันข้อมูลหาย
      </div>
    </aside>
  );
}
