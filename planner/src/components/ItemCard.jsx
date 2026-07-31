import React from 'react';
import { STATE_LABEL, TAG_LABEL, TAG_FAMILY } from '../data/constants.js';

export default function ItemCard({
  section, item, state,
  onCycle, onEdit, onDelete,
  draggable = false, onDropOnCard,
}) {
  const checkable = section.checkable !== false;
  // บรรทัด meta ของการ์ด: เวลา · สถานที่/โน้ต (อันไหนว่างก็ข้าม)
  const metaText = [item.time, item.meta].filter(Boolean).join(' · ');

  const handleKey = (e) => {
    if (checkable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onCycle();
    }
  };

  /* ---------- drag & drop (เปิดเฉพาะ layout รายวัน) ---------- */
  const dragProps = draggable
    ? {
        draggable: true,
        onDragStart: (e) => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'move', id: item.id }));
          e.currentTarget.classList.add('dragging');
        },
        onDragEnd: (e) => e.currentTarget.classList.remove('dragging'),
        onDragOver: (e) => e.preventDefault(),
        // วางบนการ์ด = แทรกหน้าการ์ดนี้ (stopPropagation กันไม่ให้คอลัมน์รับซ้ำ)
        onDrop: (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onDropOnCard) onDropOnCard(e);
        },
      }
    : {};

  return (
    <div
      className={'ml-card' + (checkable && state === 'done' ? ' done' : '') + (checkable ? '' : ' static')}
      role={checkable ? 'button' : undefined}
      tabIndex={0}
      aria-pressed={checkable ? state === 'done' : undefined}
      onClick={checkable ? onCycle : undefined}
      onKeyDown={handleKey}
      {...dragProps}
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
        {/* สีป้ายมาจาก "ตระกูล" (4 สี) ส่วนข้อความยังบอกหมวดละเอียดเหมือนเดิม */}
        <div className={'tag fam-' + (TAG_FAMILY[item.cat] || 'study')}>
          {TAG_LABEL[item.cat] || String(item.cat).toUpperCase()}
        </div>
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
