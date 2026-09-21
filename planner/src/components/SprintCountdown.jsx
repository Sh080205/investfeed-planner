import React from 'react';
import { daysUntil } from '../data/constants.js';
import { fmtDateShort, milestoneState, todayISO } from '../data/sprint.js';

const fmtDays = (n) => (n > 1 ? 'อีก ' + n + ' วัน' : n === 1 ? 'พรุ่งนี้!' : n === 0 ? 'วันนี้!' : 'เริ่มแล้ว');

// countdown หลักช่วง Final Sprint: วันเริ่มสอบ final (deadline ของ project "final" แก้ได้ในแถบโปรเจค)
// + milestone ที่ยังไม่เสร็จ 3 ตัวถัดไป · ซ่อนตัวเองเมื่อ final เริ่มไปแล้วเกินสัปดาห์
export default function SprintCountdown({ doc }) {
  const final = doc.sprint?.projects.find((p) => p.id === 'final');
  if (!final?.deadline) return null;
  const d = daysUntil(final.deadline);
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
        <div className="exam-next-label">Final เริ่ม {fmtDateShort(final.deadline)} {Number(final.deadline.slice(0, 4))}</div>
        <div className="exam-next-days">{fmtDays(d)}</div>
        {!final.confirmed && <div className="exam-next-meta">⚠ ยังไม่ยืนยันวัน</div>}
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
