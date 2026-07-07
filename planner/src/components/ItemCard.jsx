import React from 'react';
import { STATE_LABEL, TAG_LABEL } from '../data/constants.js';

export default function ItemCard({ section, item, state, onCycle, onEdit, onDelete }) {
  const checkable = section.checkable !== false;
  // บรรทัด meta ของการ์ด: เวลา · สถานที่/โน้ต (อันไหนว่างก็ข้าม)
  const metaText = [item.time, item.meta].filter(Boolean).join(' · ');

  const handleKey = (e) => {
    if (checkable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onCycle();
    }
  };

  return (
    <div
      className={'ml-card' + (checkable && state === 'done' ? ' done' : '') + (checkable ? '' : ' static')}
      role={checkable ? 'button' : undefined}
      tabIndex={0}
      aria-pressed={checkable ? state === 'done' : undefined}
      onClick={checkable ? onCycle : undefined}
      onKeyDown={handleKey}
    >
      {/* ปุ่มแก้ไข/ลบ — stopPropagation กันไม่ให้ไปโดน cycle สถานะ */}
      <div className="card-actions">
        <button className="icon-btn" title="แก้ไข" aria-label="แก้ไข"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}>✎</button>
        <button className="icon-btn danger" title="ลบ" aria-label="ลบ"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}>🗑</button>
      </div>

      {checkable && <div className={'verdict ' + state}>{STATE_LABEL[state]}</div>}

      <div className="ml-body">
        {metaText && <div className="ml-meta">{metaText}</div>}
        <div className={'ml-activity' + (checkable && state === 'done' ? ' strike' : '')}>
          {item.activity}
        </div>
      </div>

      <div className="card-foot">
        <div className={'tag ' + item.cat}>{TAG_LABEL[item.cat] || String(item.cat).toUpperCase()}</div>
        {item.url && (
          <a className="card-link" href={item.url} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}>
            เปิด ↗
          </a>
        )}
      </div>
    </div>
  );
}
