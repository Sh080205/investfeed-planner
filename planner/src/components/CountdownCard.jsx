import React, { useState } from 'react';
import { daysUntil, phaseLabel } from '../data/constants.js';

function fmtDays(n) {
  if (n > 1) return <>{n}<small>วัน</small></>;
  if (n === 1) return 'พรุ่งนี้!';
  if (n === 0) return 'วันนี้!';
  return 'ผ่านไปแล้ว';
}

// การ์ดนับถอยหลังวันแข่ง — กด "แก้วัน" เพื่อแก้ทั้ง 3 วัน (บันทึกตอนกด "เสร็จ")
export default function CountdownCard({ dates, onSave }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(dates);

  function toggle() {
    if (!open) {
      setForm(dates); // เปิด editor → ดึงค่าปัจจุบันเข้าฟอร์ม
      setOpen(true);
    } else {
      onSave(form); // ปิด = บันทึก
      setOpen(false);
    }
  }

  const rows = [
    { key: 'contest', name: 'Contest ถัดไป' },
    { key: 'national', name: 'Thailand National' },
    { key: 'bangkok', name: 'Bangkok Regional' },
  ];

  return (
    <div className="cd-card">
      <div className="cd-head">
        <div className="ml-eyebrow">
          <span className="dot dot-icpc" />นับถอยหลังแข่ง
        </div>
        <button className="cd-edit" onClick={toggle}>{open ? 'เสร็จ' : 'แก้วัน'}</button>
      </div>

      {!open ? (
        <div>
          {rows.map((r) => {
            const d = daysUntil(dates[r.key]);
            return (
              <div className="cd-row" key={r.key}>
                <span className="cd-name">{r.name}</span>
                <span className={'cd-days' + (d < 0 ? ' past' : '')}>{fmtDays(d)}</span>
              </div>
            );
          })}
          <div className="cd-phase">{phaseLabel(dates)}</div>
        </div>
      ) : (
        <div className="cd-editor show">
          {rows.map((r) => (
            <label key={r.key}>
              {r.name}
              <input
                type="date"
                value={form[r.key]}
                onChange={(e) => setForm((f) => ({ ...f, [r.key]: e.target.value }))}
              />
            </label>
          ))}
          <div className="cd-note">
            Contest = รอบ 19 ก.ค. · National/Bangkok ยังเป็น<b>ประมาณการ</b> แก้เป็นวันจริงเมื่อประกาศ
          </div>
        </div>
      )}
    </div>
  );
}
