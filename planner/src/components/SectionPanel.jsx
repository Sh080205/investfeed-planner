import React from 'react';
import { DAY_ORDER } from '../data/constants.js';
import { statusKey } from '../data/store.js';
import ItemCard from './ItemCard.jsx';
import BookShelf from './BookShelf.jsx';

export default function SectionPanel({
  section, doc, weekKey,
  onCycle, onAdd, onEdit, onDelete, onResetWeek,
  icpcView, onIcpcView,
}) {
  const stMap = doc.statuses[statusKey(section, weekKey)] || {};
  const stateOf = (item) => stMap[item.id] || 'pending';

  // ICPC: กรองตามแผนหลังแข่งที่เลือก — รายการที่ไม่มี track แสดงเสมอ
  let items = section.items;
  if (section.id === 'icpc' && icpcView !== 'all') {
    items = items.filter((i) => !i.track || i.track === icpcView);
  }

  const card = (item) => (
    <ItemCard
      key={item.id}
      section={section}
      item={item}
      state={stateOf(item)}
      onCycle={() => onCycle(section, item)}
      onEdit={() => onEdit(item)}
      onDelete={() => onDelete(section, item)}
    />
  );

  /* ---------- layout 'days': คอลัมน์ จ–อา ---------- */
  function renderDays() {
    return (
      <div className="day-grid">
        {DAY_ORDER.map((day) => {
          const dayItems = items.filter((i) => i.day === day);
          if (!dayItems.length) return null;
          return (
            <div className="day-col" key={day}>
              <div className="day-col-header mono">
                <span>{day}</span>
                <button className="icon-btn" title={'เพิ่มรายการวัน' + day}
                  onClick={() => onAdd({ day })}>+</button>
              </div>
              {dayItems.map(card)}
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
          {groupItems.map(card)}
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
