import React from 'react';
import { daysUntil } from '../data/constants.js';
import { fmtDateShort, milestoneState, todayISO, datedItems } from '../data/sprint.js';

const fmtDays = (n, past) => (n > 1 ? 'อีก ' + n + ' วัน' : n === 1 ? 'พรุ่งนี้!' : n === 0 ? 'วันนี้!' : past);

// countdown หลักของแผนผูกวันที่ + milestone ที่ยังไม่เสร็จ 3 ตัวถัดไป · ซ่อนตัวเองเมื่อเลยเป้าเกินสัปดาห์
//  - แผนที่มี project "final" (Final Sprint): นับถึงวันเริ่มสอบ final (แก้ได้ในแถบโปรเจค)
//  - แผนอื่น (MLSys Roadmap): นับถึงวันสุดท้ายของ task ในแผน
export default function SprintCountdown({ doc }) {
  if (!doc.sprint) return null;
  const final = doc.sprint.projects.find((p) => p.id === 'final');
  const planIds = new Set(doc.sprint.projects.map((p) => p.id));
  const lastDate = datedItems(doc).filter((t) => planIds.has(t.project)).map((t) => t.date).sort().pop();
  const target = final?.deadline
    ? { date: final.deadline, label: 'Final เริ่ม', confirmed: final.confirmed, past: 'เริ่มแล้ว' }
    : lastDate ? { date: lastDate, label: 'จบแผน', confirmed: true, past: 'จบแล้ว' } : null;
  if (!target) return null;
  const d = daysUntil(target.date);
  if (d < -7) return null;

  const today = todayISO();
  const upcoming = (doc.sprint.milestones || [])
    .filter((m) => !milestoneState(doc, m, today).complete)
    .sort((a, b) => (a.due < b.due ? -1 : 1))
    .slice(0, 3);

  return (
    <div className="cd-card exam-cd">
      <div className="cd-head">
        <div className="ml-eyebrow"><span className="dot dot-exam" />นับถอยหลัง</div>
      </div>
      <div className="exam-next">
        <div className="exam-next-label">{target.label} {fmtDateShort(target.date)} {Number(target.date.slice(0, 4))}</div>
        <div className="exam-next-days">{fmtDays(d, target.past)}</div>
        {!target.confirmed && <div className="exam-next-meta">⚠ ยังไม่ยืนยันวัน</div>}
      </div>
      {upcoming.length > 0 && (
        <div className="exam-list">
          {upcoming.map((m) => {
            const late = m.due < today;
            return (
              <div className="exam-row" key={m.id} title={m.name}>
                <span className="exam-row-name">{m.id} · {m.name}</span>
                <span className={'exam-row-days mono' + (late ? ' late' : '')}>{late ? 'เลยแล้ว' : fmtDateShort(m.due)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
