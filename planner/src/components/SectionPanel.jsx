import React from 'react';
import { DAY_ORDER } from '../data/constants.js';
import { statusKey } from '../data/store.js';
import ItemCard from './ItemCard.jsx';
import BookShelf from './BookShelf.jsx';

// อ่าน payload ของการลาก — { type: 'move', id } = ย้ายการ์ดเดิม · { type: 'new' } = กล่องข้อความใหม่
function readDragPayload(e) {
  try {
    return JSON.parse(e.dataTransfer.getData('text/plain'));
  } catch {
    return null;
  }
}

export default function SectionPanel({
  section, doc, weekKey,
  onCycle, onAdd, onEdit, onDelete, onResetWeek, onMoveItem,
  icpcView, onIcpcView,
}) {
  const stMap = doc.statuses[statusKey(section, weekKey)] || {};
  const stateOf = (item) => stMap[item.id] || 'pending';
  const isDays = section.layout === 'days'; // layout รายวัน = ลากการ์ดได้

  // ICPC: กรองตามแผนหลัง National ที่เลือก — รายการที่ไม่มี track แสดงเสมอ
  let items = section.items;
  if (section.id === 'icpc' && icpcView !== 'all') {
    items = items.filter((i) => !i.track || i.track === icpcView);
  }

  /* ---------- drag & drop (เฉพาะ layout รายวัน) ---------- */
  function dropOnDay(e, day) {
    e.preventDefault();
    const p = readDragPayload(e);
    if (!p) return;
    if (p.type === 'move') onMoveItem(section, p.id, day, null); // วางบนพื้นคอลัมน์ = ต่อท้ายวันนั้น
    else if (p.type === 'new') onAdd({ day }); // กล่องข้อความใหม่ → เปิดฟอร์มโดยเลือกวันให้แล้ว
  }
  function dropOnCard(e, day, targetItem) {
    const p = readDragPayload(e);
    if (!p) return;
    if (p.type === 'move' && p.id !== targetItem.id) onMoveItem(section, p.id, day, targetItem.id); // แทรกหน้าการ์ดเป้า
    else if (p.type === 'new') onAdd({ day });
  }

  const card = (item, day) => (
    <ItemCard
      key={item.id}
      section={section}
      item={item}
      state={stateOf(item)}
      draggable={isDays}
      onCycle={() => onCycle(section, item)}
      onEdit={() => onEdit(item)}
      onDelete={() => onDelete(section, item)}
      onDropOnCard={isDays ? (e) => dropOnCard(e, day, item) : undefined}
    />
  );

  /* ---------- layout 'days': คอลัมน์ จ–อา (โชว์ครบทุกวันเพื่อเป็นเป้าวาง) ---------- */
  function renderDays() {
    return (
      <div className="day-grid">
        {DAY_ORDER.map((day) => {
          const dayItems = items.filter((i) => i.day === day);
          return (
            <div
              className="day-col"
              key={day}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
              onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
              onDrop={(e) => { e.currentTarget.classList.remove('drag-over'); dropOnDay(e, day); }}
            >
              <div className="day-col-header mono">
                <span>{day}</span>
                <button className="icon-btn" title={'เพิ่มรายการวัน' + day} onClick={() => onAdd({ day })}>+</button>
              </div>
              {dayItems.map((item) => card(item, day))}
              {!dayItems.length && <div className="day-empty">ลากการ์ดมาวางที่นี่</div>}
            </div>
          );
        })}
      </div>
    );
  }

  /* ---------- layout 'group': จัดกลุ่มตามหัวข้อ (เรียงตามลำดับที่พบ) ---------- */
  function renderGroups() {
    const groups = [];
    for (const i of items) {
      const g = i.group || '';
      if (!groups.includes(g)) groups.push(g);
    }
    return groups.map((gname) => {
      const groupItems = items.filter((i) => (i.group || '') === gname);
      const doneCount = groupItems.filter((i) => stateOf(i) === 'done').length;
      return (
        <div className="group" key={gname || '(no-group)'}>
          <div className="group-head">
            <div className="group-title">{gname || 'อื่น ๆ'}</div>
            {section.checkable !== false && (
              <div className="group-badge">{doneCount}/{groupItems.length}</div>
            )}
            <button className="icon-btn" title="เพิ่มรายการในกลุ่มนี้"
              onClick={() => onAdd({ group: gname, track: groupItems[0]?.track || '' })}>+</button>
          </div>
          {groupItems.map((item) => card(item))}
        </div>
      );
    });
  }

  const note = section.note + (section.resettable ? ' · WEEK ' + weekKey : '');

  return (
    <>
      <div className="ml-panel-note">
        <span>{note}</span>
        <span className="note-actions">
          {section.id === 'icpc' && (
            <select
              className="view-select mono"
              value={icpcView}
              onChange={(e) => onIcpcView(e.target.value)}
              title="สลับแผนหลัง National"
            >
              <option value="all">หลัง National: ดูทั้งสองแผน</option>
              <option value="qualified">หลัง National: ✅ ผ่านเข้า Regional</option>
              <option value="notq">หลัง National: 🔁 ไม่ผ่าน</option>
            </select>
          )}
          {section.resettable && (
            <button className="ml-reset" onClick={() => onResetWeek(section)}>รีเซ็ตสัปดาห์นี้</button>
          )}
          {/* ชิปลากสร้างกล่องข้อความใหม่ — ลากไปวางบนคอลัมน์วัน */}
          {isDays && (
            <span
              className="drag-chip mono"
              draggable
              title="ลากไปวางบนคอลัมน์วัน เพื่อเพิ่มงานของวันนั้น"
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'new' }));
              }}
            >
              ✥ กล่องข้อความ
            </span>
          )}
          {/* ชั้นหนังสือเป็นรายการสดจาก server — ไม่มีการเพิ่ม/แก้รายการเอง */}
          {section.layout !== 'books' && (
            <button className="ml-reset add" onClick={() => onAdd({})}>+ เพิ่มรายการ</button>
          )}
        </span>
      </div>

      <div id="mlList">
        {section.layout === 'books' ? <BookShelf />
          : section.layout === 'days' ? renderDays()
          : renderGroups()}
      </div>
    </>
  );
}
