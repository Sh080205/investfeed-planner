import React from 'react';
import { spanOf, fmtDateShort, dayLabelOf, fromMin } from '../data/sprint.js';
import StatusMark from './StatusMark.jsx';

const byDateTime = (a, b) =>
  a.date !== b.date ? (a.date < b.date ? -1 : 1) : ((spanOf(a) || [0])[0] - (spanOf(b) || [0])[0]);
const nowMinutes = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const MAX_OVERDUE = 4;

/**
 * แถบ "วันนี้" บนบอร์ดผูกวันที่ — ไม่ต้องไล่หาในกริด 7 วัน
 *  - งานของวันนี้เรียงตามเวลา · ไฮไลต์บล็อกที่อยู่ในช่วงเวลาตอนนี้
 *  - งานค้างจากวันก่อน (ยังไม่ ✓) + ปุ่ม ⏭ เลื่อนไปช่องว่างถัดไป
 *  - วันนี้ไม่มีงาน → บอกงานถัดไปของแผน
 */
export default function TodayStrip({ items, today, stateOf, projectOf, onCycle, onMoveNext }) {
  const now = nowMinutes();
  const dated = items.filter((i) => i.date && !i.pool);
  const todays = dated.filter((i) => i.date === today).sort(byDateTime);
  const overdue = dated.filter((i) => i.date < today && stateOf(i) !== 'done').sort(byDateTime);
  const next = todays.length ? null : dated.filter((i) => i.date > today).sort(byDateTime)[0] || null;
  const doneToday = todays.filter((i) => stateOf(i) === 'done').length;

  const row = (item, { showDate = false, late = false } = {}) => {
    const sp = spanOf(item);
    const state = stateOf(item);
    const isNow = !showDate && sp && sp[0] <= now && now < sp[1];
    const project = projectOf(item);
    const canMove = late && onMoveNext && !(item.energy === 'locked' && !item.unlocked);
    return (
      <div
        key={item.id}
        className={'today-row' + (isNow ? ' is-now' : '') + (state === 'done' ? ' done' : '') + (late ? ' late' : '')}
        role="button"
        tabIndex={0}
        aria-pressed={state === 'done'}
        onClick={() => onCycle(item)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCycle(item); } }}
        title={item.detail || item.activity}
      >
        <StatusMark state={state} />
        <span className="today-time mono">
          {showDate && <>{fmtDateShort(item.date)} · </>}
          {sp ? fromMin(sp[0]) + '–' + fromMin(sp[1]) : '—'}
        </span>
        <span className="today-title">{item.activity}</span>
        {isNow && <span className="now-badge mono">ตอนนี้</span>}
        {project && <span className={'tag proj-' + project.tag.toLowerCase()}>{project.tag}</span>}
        {item.energy === 'deep' && <span className="energy e-deep">DEEP</span>}
        {canMove && (
          <button className="icon-btn" title="เลื่อนไปช่องว่างถัดไป (พลังงานเดียวกัน)" aria-label="เลื่อนไปช่องว่างถัดไป"
            onClick={(e) => { e.stopPropagation(); onMoveNext(item); }}>⏭</button>
        )}
      </div>
    );
  };

  return (
    <section className="today-strip" aria-label="งานวันนี้">
      <div className="today-head">
        <span className="today-label">วันนี้</span>
        <span className="mono today-date">{dayLabelOf(today).split(' ')[0]} {fmtDateShort(today)}</span>
        {todays.length > 0 && <span className="mono today-count">เสร็จ {doneToday}/{todays.length}</span>}
      </div>

      {todays.length > 0
        ? <div className="today-list">{todays.map((i) => row(i))}</div>
        : (
          <div className="today-empty">
            วันนี้ไม่มีงานในแผน
            {next && <> · ถัดไป <b>{dayLabelOf(next.date).split(' ')[0]} {fmtDateShort(next.date)} {next.start || ''}</b> — {next.activity}</>}
          </div>
        )}

      {overdue.length > 0 && (
        <>
          <div className="today-sub mono">ค้างจากวันก่อน {overdue.length}</div>
          <div className="today-list">
            {overdue.slice(0, MAX_OVERDUE).map((i) => row(i, { showDate: true, late: true }))}
          </div>
          {overdue.length > MAX_OVERDUE && (
            <div className="today-more mono">…และอีก {overdue.length - MAX_OVERDUE} ใบ — ดูทั้งหมดใน 📋 สรุปสัปดาห์</div>
          )}
        </>
      )}
    </section>
  );
}
