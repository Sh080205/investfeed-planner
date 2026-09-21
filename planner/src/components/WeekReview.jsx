import React from 'react';
import { weekReview, datesOfWeek, datedItems, fmtDateShort, dayLabelOf, todayISO } from '../data/sprint.js';

// สรุปสัปดาห์ (ปุ่ม 📋 บนบอร์ด weekly): task ที่ยังไม่เสร็จของสัปดาห์ที่ดูอยู่ + milestone ที่เลยกำหนด
export default function WeekReview({ doc, weekKey, onMoveNext, onClose }) {
  const today = todayISO();
  const days = datesOfWeek(weekKey);
  const { unfinished, overdueMilestones } = weekReview(doc, weekKey, today);
  const total = datedItems(doc).filter((t) => days.includes(t.date)).length;
  const done = total - unfinished.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const tagOf = (t) => doc.sprint?.projects.find((p) => p.id === t.project)?.tag;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal review" onClick={(e) => e.stopPropagation()}>
        <h3>📋 สรุปสัปดาห์ {weekKey} · {fmtDateShort(days[0])} – {fmtDateShort(days[6])}</h3>
        <div className="review-score">เสร็จ <b>{done}/{total}</b> ({pct}%)</div>

        <div className="review-head">ยังไม่เสร็จ ({unfinished.length})</div>
        {unfinished.length === 0 && <div className="empty-state">ไม่มีงานค้างในสัปดาห์นี้</div>}
        <div className="review-list">
          {unfinished.map(({ task: t, overdue }) => {
            const movable = !(t.energy === 'locked' && !t.unlocked);
            return (
              <div key={t.id} className={'review-row' + (overdue ? ' overdue' : '')}>
                <span className="mono review-when">{dayLabelOf(t.date).split(' ')[0]} {fmtDateShort(t.date)} {t.start || ''}</span>
                <span className="review-title">
                  {tagOf(t) && <span className="review-tag">{tagOf(t)}{t.milestone ? ' · ' + t.milestone : ''}</span>}
                  {t.activity}
                  {overdue && <span className="review-late">เลยวันแล้ว</span>}
                </span>
                {movable
                  ? <button className="icon-btn" title="เลื่อนไปช่องว่างถัดไป" onClick={() => onMoveNext(t)}>⏭</button>
                  : <span className="review-locked" title="การ์ด locked ย้ายไม่ได้">🔒</span>}
              </div>
            );
          })}
        </div>

        <div className="review-head">Milestone เลยกำหนด ({overdueMilestones.length})</div>
        {overdueMilestones.length === 0 && <div className="empty-state">ไม่มี milestone เลยกำหนด</div>}
        <div className="review-list">
          {overdueMilestones.map(({ m, st }) => (
            <div key={m.id} className="review-row overdue">
              <span className="mono review-when">{m.id} · {fmtDateShort(m.due)}</span>
              <span className="review-title">{m.name}</span>
              <span className="mono">{st.done}/{st.total}</span>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </div>
  );
}
