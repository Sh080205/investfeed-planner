import React, { useState } from 'react';
import { projectStats, fmtDateShort } from '../data/sprint.js';

const daysLeftLabel = (n) =>
  n === null ? '' : n > 1 ? 'อีก ' + n + ' วัน' : n === 1 ? 'พรุ่งนี้' : n === 0 ? 'วันนี้!' : 'เลยมา ' + -n + ' วัน';

// แถบโปรเจคเหนือบอร์ด weekly — % (done/ทั้งหมด), วันเหลือ, milestone ถัดไป, แก้ deadline + ติ๊กยืนยัน
// เตือน (สีส้ม) เมื่อเหลือ ≤3 วันและ % < 70
export default function ProjectBar({ doc, onUpdateProject }) {
  const [editing, setEditing] = useState(null); // id ของโปรเจคที่กำลังแก้ deadline

  return (
    <div className="project-bar">
      {doc.sprint.projects.map((p) => {
        const st = projectStats(doc, p);
        return (
          <div key={p.id} className={'proj-chip proj-' + p.tag.toLowerCase() + (st.warn ? ' warn' : '')}>
            <div className="proj-head">
              <span className="proj-tag">{p.tag}</span>
              <span className="proj-pct mono">{st.pct}% <small>({st.done}/{st.total})</small></span>
            </div>
            <div className="proj-name">{p.name}</div>
            <div className="proj-track"><div className="proj-fill" style={{ width: st.pct + '%' }} /></div>

            <div className="proj-meta">
              {editing === p.id ? (
                <input
                  type="date"
                  autoFocus
                  value={p.deadline || ''}
                  onChange={(e) => e.target.value && onUpdateProject(p.id, { deadline: e.target.value })}
                  onBlur={() => setEditing(null)}
                />
              ) : (
                <button className="linklike mono" title="กดเพื่อแก้ deadline" onClick={() => setEditing(p.id)}>
                  {p.deadline ? '⏰ ' + fmtDateShort(p.deadline) + ' · ' + daysLeftLabel(st.daysLeft) : '⏰ ไม่มีกำหนดส่ง'}
                </button>
              )}
              {p.deadline && !p.confirmed && <span className="unconfirmed">⚠ ยังไม่ยืนยัน</span>}
            </div>

            {st.next && (
              <div className="proj-next" title={st.next.name}>
                ถัดไป {st.next.id} · {fmtDateShort(st.next.due)} — {st.next.name}
              </div>
            )}

            {p.deadline && (
              <label className="proj-confirm">
                <input type="checkbox" checked={!!p.confirmed}
                  onChange={(e) => onUpdateProject(p.id, { confirmed: e.target.checked })} />
                ยืนยัน deadline แล้ว
              </label>
            )}
          </div>
        );
      })}
    </div>
  );
}
