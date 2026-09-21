import React from 'react';
import { STATE_LABEL, TAG_LABEL, TAG_FAMILY } from '../data/constants.js';

const ENERGY_LABEL = { deep: 'DEEP', light: 'LIGHT', locked: '🔒 LOCKED' };

export default function ItemCard({
  section, item, state, project = null, milestone = null,
  onCycle, onEdit, onDelete, onMoveNext,
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

  /* ---------- drag & drop (เปิดเฉพาะ layout รายวัน · การ์ด locked ลากไม่ได้) ---------- */
  const dragProps = draggable
    ? {
        draggable: true,
        onDragStart: (e) => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'move', id: item.id }));
          e.currentTarget.classList.add('dragging');
        },
        onDragEnd: (e) => e.currentTarget.classList.remove('dragging'),
      }
    : {};
  // การ์ดทุกใบในบอร์ดรายวันรับการวางได้ (รวมใบที่ลากไม่ได้) — วางบนการ์ด = แทรกหน้าการ์ดนี้
  const dropProps = onDropOnCard
    ? {
        onDragOver: (e) => e.preventDefault(),
        onDrop: (e) => {
          e.preventDefault();
          e.stopPropagation(); // กันไม่ให้คอลัมน์รับซ้ำ
          onDropOnCard(e);
        },
      }
    : {};

  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };

  return (
    <div
      className={'ml-card' + (checkable && state === 'done' ? ' done' : '') + (checkable ? '' : ' static')
        + (item.buffer ? ' is-buffer' : '') + (item.energy === 'locked' ? ' is-locked' : '')}
      role={checkable ? 'button' : undefined}
      tabIndex={0}
      aria-pressed={checkable ? state === 'done' : undefined}
      onClick={checkable ? onCycle : undefined}
      onKeyDown={handleKey}
      {...dragProps}
      {...dropProps}
    >
      {/* ปุ่มบนการ์ด — stopPropagation กันไม่ให้ไปโดน cycle สถานะ */}
      <div className="card-actions">
        {onMoveNext && (
          <button className="icon-btn" title="เลื่อนไปช่องว่างถัดไป (พลังงานเดียวกัน)" aria-label="เลื่อนไปช่องว่างถัดไป"
            onClick={stop(onMoveNext)}>⏭</button>
        )}
        <button className="icon-btn" title="แก้ไข" aria-label="แก้ไข" onClick={stop(onEdit)}>✎</button>
        <button className="icon-btn danger" title="ลบ" aria-label="ลบ" onClick={stop(onDelete)}>🗑</button>
      </div>

      {checkable && <div className={'verdict ' + state}>{STATE_LABEL[state]}</div>}

      <div className="ml-body">
        {metaText && <div className="ml-meta">{metaText}</div>}
        <div className={'ml-activity' + (checkable && state === 'done' ? ' strike' : '')}>
          {item.activity}
        </div>
        {item.detail && <div className="ml-detail">{item.detail}</div>}
      </div>

      <div className="card-foot">
        <div className="card-tags">
          {/* การ์ดของโปรเจค: ป้ายสีตามโปรเจค + milestone · การ์ดทั่วไป: ป้ายตามตระกูลหมวด */}
          {project ? (
            <span className={'tag proj-' + project.tag.toLowerCase()} title={milestone ? milestone.id + ' — ' + milestone.name : project.name}>
              {project.tag}{milestone ? ' · ' + milestone.id : ''}
            </span>
          ) : (
            <span className={'tag fam-' + (TAG_FAMILY[item.cat] || 'study')}>
              {TAG_LABEL[item.cat] || String(item.cat).toUpperCase()}
            </span>
          )}
          {item.energy && (
            <span className={'energy e-' + item.energy + (item.unlocked ? ' unlocked' : '')}
              title={item.energy === 'locked' ? (item.unlocked ? 'ปลดล็อกแล้ว — ย้าย/แก้เวลาได้' : 'ล็อกเวลาไว้ — ปลดล็อกในหน้าแก้ไข') : undefined}>
              {item.energy === 'locked' && item.unlocked ? '🔓 UNLOCKED' : ENERGY_LABEL[item.energy] || item.energy}
            </span>
          )}
          {item.buffer && <span className="energy e-buffer">BUFFER</span>}
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
