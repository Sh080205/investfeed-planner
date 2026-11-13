import React from 'react';
import { DAY_ORDER } from '../data/constants.js';
import { spanOf, todayISO } from '../data/sprint.js';

// ตารางเรียนแบบกริดเวลา (แท็บ "ตารางเรียน") — แถว = ชั่วโมง, คอลัมน์ = วัน
// แสดงผลอย่างเดียว ข้อมูลยังเป็น item เดิม (day + time) → ไม่ต้อง migrate schema
// คลิกคาบ = แก้ไข · คาบที่อ่านเวลาไม่ออกไปอยู่แถว "ยังไม่ระบุเวลา" ใต้กริด

const HOUR_PX = 52;
const fmt = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

/** แยก "03603435 Cloud Computing — รายละเอียด" → { code, title, note } */
function splitActivity(text) {
  const s = String(text || '');
  const m = s.match(/^(\d{8})\s+(.*)$/);
  const code = m ? m[1] : '';
  const rest = m ? m[2] : s;
  const [title, ...more] = rest.split(' — ');
  return { code, title: title.trim(), note: more.join(' — ').trim() };
}

/** จัดเลนให้คาบที่เวลาทับกันในวันเดียวกันวางเคียงกัน */
function withLanes(blocks) {
  const sorted = [...blocks].sort((a, b) => a.span[0] - b.span[0]);
  const laneEnds = [];
  for (const b of sorted) {
    let lane = laneEnds.findIndex((end) => end <= b.span[0]);
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(0); }
    laneEnds[lane] = b.span[1];
    b.lane = lane;
  }
  for (const b of sorted) b.lanes = laneEnds.length;
  return sorted;
}

const credits = (meta) => {
  const m = String(meta || '').match(/(\d+)\s*นก\./);
  return m ? +m[1] : 0;
};

export default function Timetable({ items, onEdit, onAdd, onDelete }) {
  const timed = items.map((item) => ({ item, span: spanOf(item) })).filter((b) => b.span && b.item.day);
  const untimed = items.filter((i) => !spanOf(i) || !i.day);

  // จ–ศ เสมอ · ส–อา แสดงเฉพาะเมื่อมีคาบ
  const days = DAY_ORDER.filter((d, i) => i < 5 || timed.some((b) => b.item.day === d));
  const startMin = Math.min(8 * 60, ...timed.map((b) => Math.floor(b.span[0] / 60) * 60));
  const endMin = Math.max(18 * 60, ...timed.map((b) => Math.ceil(b.span[1] / 60) * 60));
  const hours = [];
  for (let m = startMin; m < endMin; m += 60) hours.push(m);
  const height = ((endMin - startMin) / 60) * HOUR_PX;

  const weekdayIdx = (new Date(todayISO() + 'T00:00:00').getDay() + 6) % 7; // 0 = จันทร์
  const todayDay = DAY_ORDER[weekdayIdx];

  const totalMin = timed.reduce((s, b) => s + (b.span[1] - b.span[0]), 0);
  const totalCredits = items.reduce((s, i) => s + credits(i.meta), 0);
  const planned = items.filter((i) => /^แผน/.test(i.meta || '')).length;

  return (
    <div className="tt">
      <div className="tt-summary">
        <span><b>{items.length}</b> คาบ</span>
        <span><b>{+(totalMin / 60).toFixed(1)}</b> ชม./สัปดาห์</span>
        {totalCredits > 0 && <span><b>{totalCredits}</b> นก. ที่ระบุในการ์ด</span>}
        {planned > 0 && <span className="tt-summary-plan"><i className="tt-plan-key" aria-hidden="true" />เส้นประ = ยังเป็นแผน ({planned})</span>}
      </div>

      <div className="tt-scroll">
        <div className="tt-grid" style={{ '--days': days.length, '--hour': HOUR_PX + 'px' }}>
          <div className="tt-corner" />
          {days.map((d) => (
            <div key={d} className={'tt-dayhead' + (d === todayDay ? ' is-today' : '')}>
              <span className="tt-day-th">{d.split(' ')[0]}</span>
              <span className="tt-day-en">{d.split(' ')[1]}</span>
              <button className="icon-btn tt-add" title={'เพิ่มคาบวัน' + d} aria-label={'เพิ่มคาบวัน' + d} onClick={() => onAdd({ day: d })}>+</button>
            </div>
          ))}

          <div className="tt-axis" style={{ height }}>
            {hours.map((m) => (
              <span key={m} className="tt-hour" style={{ top: ((m - startMin) / 60) * HOUR_PX }}>{fmt(m)}</span>
            ))}
          </div>

          {days.map((d) => (
            <div key={d} className={'tt-col' + (d === todayDay ? ' is-today' : '')} style={{ height }}>
              {withLanes(timed.filter((b) => b.item.day === d)).map(({ item, span, lane, lanes }) => {
                const { code, title } = splitActivity(item.activity);
                const isPlan = /^แผน/.test(item.meta || '');
                const metaShort = String(item.meta || '').replace(/^แผน\s*·\s*/, '').split(' · ').slice(0, 2).join(' · ');
                return (
                  <div
                    key={item.id}
                    className={'tt-block' + (isPlan ? ' is-plan' : '') + (span[1] - span[0] < 90 ? ' is-short' : '')}
                    style={{
                      top: ((span[0] - startMin) / 60) * HOUR_PX,
                      height: ((span[1] - span[0]) / 60) * HOUR_PX,
                      left: `calc(${(lane / lanes) * 100}% + 3px)`,
                      width: `calc(${100 / lanes}% - 6px)`,
                    }}
                  >
                    <button className="tt-block-main" onClick={() => onEdit(item)} title={item.activity + (item.meta ? '\n' + item.meta : '') + '\nคลิกเพื่อแก้ไข'}>
                      <span className="tt-time">{fmt(span[0])}–{fmt(span[1])}</span>
                      {code && <span className="tt-code">{code}</span>}
                      <span className="tt-title">{title}</span>
                      {metaShort && <span className="tt-meta">{metaShort}</span>}
                    </button>
                    <button className="tt-del" onClick={() => onDelete(item)} title="ลบคาบนี้" aria-label={'ลบคาบ ' + title}>×</button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {untimed.length > 0 && (
        <div className="tt-untimed">
          <div className="tt-untimed-head">ยังไม่ระบุวัน/เวลา — ใส่เวลาแบบ 9:00–12:00 แล้วจะขึ้นในตาราง</div>
          {untimed.map((item) => (
            <button key={item.id} className="tt-chip" onClick={() => onEdit(item)}>{splitActivity(item.activity).title || item.activity}</button>
          ))}
        </div>
      )}
    </div>
  );
}
