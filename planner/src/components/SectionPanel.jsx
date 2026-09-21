import React from 'react';
import { DAY_ORDER, itemStatusKey } from '../data/constants.js';
import { SPRINT, datesOfWeek, shiftWeek, fmtDateShort, spanOf, isPaused, todayISO } from '../data/sprint.js';
import ItemCard from './ItemCard.jsx';
import BookShelf from './BookShelf.jsx';
import FinanceTracker from './FinanceTracker.jsx';
import ProjectBar from './ProjectBar.jsx';

// อ่าน payload ของการลาก — { type: 'move', id } = ย้ายการ์ดเดิม · { type: 'new' } = กล่องข้อความใหม่
function readDragPayload(e) {
  try {
    return JSON.parse(e.dataTransfer.getData('text/plain'));
  } catch {
    return null;
  }
}

const isLocked = (it) => it.energy === 'locked' && !it.unlocked;
// เรียงการ์ดในคอลัมน์ตามเวลาเริ่ม (การ์ดไม่ระบุเวลาอยู่ท้าย คงลำดับเดิม)
const byStart = (a, b) => ((spanOf(a) || [9999])[0] - (spanOf(b) || [9999])[0]);

export default function SectionPanel({
  section, doc, weekKey, viewWeek, onViewWeek, issues = [],
  onCycle, onAdd, onEdit, onDelete, onResetWeek, onResetSection, onMoveItem, onMoveNext,
  onUpdateProject, onOpenReview, onTogglePause,
  icpcView, onIcpcView,
  finance, onAddTx, onDeleteTx, onSetBudgetUntil,
}) {
  const dated = !!section.dated;              // บอร์ด weekly แบบผูกวันที่ (Final Sprint)
  const wk = dated ? viewWeek : weekKey;      // สัปดาห์ที่ใช้เก็บสถานะของการ์ดรูทีน
  const weekDates = dated ? datesOfWeek(viewWeek) : null;
  const today = todayISO();
  const stateOf = (item) => (doc.statuses[itemStatusKey(section, item, wk)] || {})[item.id] || 'pending';
  const isDays = section.layout === 'days'; // layout รายวัน = ลากการ์ดได้
  const projectOf = (item) => doc.sprint?.projects.find((p) => p.id === item.project) || null;
  const milestoneOf = (item) => doc.sprint?.milestones.find((m) => m.id === item.milestone) || null;

  /* ---------- แท็บที่พักไว้ (icpc ช่วง Final Sprint) — ซ่อนการ์ด ไม่นับ progress ---------- */
  if (isPaused(doc, section.id)) {
    return (
      <>
        <div className="ml-panel-note">
          <span>{section.note}</span>
          <span className="note-actions">
            <button className="ml-reset" onClick={() => onTogglePause(section.id)}>▶ เปิดใช้ต่อ</button>
          </span>
        </div>
        <div className="paused-panel">
          <div className="paused-title">⏸ {section.tab} — {SPRINT.app.pauseNote}</div>
          <div>ซ่อนการ์ดไว้ {section.items.length} ใบ และไม่นับเข้า progress · ข้อมูลกับสถานะที่ติ๊กไว้ยังอยู่ครบ</div>
        </div>
      </>
    );
  }

  // ICPC: กรองตามแผนหลัง National ที่เลือก — รายการที่ไม่มี track แสดงเสมอ
  let items = section.items;
  if (section.id === 'icpc' && icpcView !== 'all') {
    items = items.filter((i) => !i.track || i.track === icpcView);
  }

  /* ---------- drag & drop (เฉพาะ layout รายวัน) — iso = วันที่ของคอลัมน์บนบอร์ดผูกวันที่ ---------- */
  function dropOnDay(e, day, iso) {
    e.preventDefault();
    const p = readDragPayload(e);
    if (!p) return;
    if (p.type === 'move') onMoveItem(section, p.id, day, null, iso); // วางบนพื้นคอลัมน์ = ต่อท้ายวันนั้น
    else if (p.type === 'new') onAdd({ day, date: iso }); // กล่องข้อความใหม่ → เปิดฟอร์มโดยเลือกวันให้แล้ว
  }
  // ชนิดถาดของการ์ด pool: null = ไม่ใช่ pool · 'book' = ถาดหนังสือ · 'subject' = ถาดวิชา
  const poolKind = (it) => (it && it.pool ? (it.kind === 'book' ? 'book' : 'subject') : null);

  function dropOnCard(e, day, targetItem, iso) {
    const p = readDragPayload(e);
    if (!p) return;
    // ปลายทางเป็นการ์ดในถาด (day==='') → อนุญาตเฉพาะจัดลำดับ pool "ชนิดเดียวกัน"
    // กันการ์ดปกติหาย + กันเอาการ์ดวิชาไปปนถาดหนังสือ (และกลับกัน)
    if (day === '') {
      if (p.type === 'move' && p.id !== targetItem.id) {
        const it = section.items.find((i) => i.id === p.id);
        if (it && poolKind(it) && poolKind(it) === poolKind(targetItem)) {
          onMoveItem(section, p.id, '', targetItem.id);
        }
      }
      return;
    }
    if (p.type === 'move' && p.id !== targetItem.id) onMoveItem(section, p.id, day, targetItem.id, iso);
    else if (p.type === 'new') onAdd({ day, date: iso });
  }
  // วางลงถาด = พักการ์ด (day='') — รับเฉพาะการ์ด pool "ชนิดตรงกับถาด" กันปนกันและกันการ์ดปกติหาย
  function dropOnTray(e, kind) {
    e.preventDefault();
    const p = readDragPayload(e);
    if (!p || p.type !== 'move') return;
    const it = section.items.find((i) => i.id === p.id);
    if (it && poolKind(it) === kind) onMoveItem(section, p.id, '', null);
  }

  const card = (item, day, iso) => (
    <ItemCard
      key={item.id}
      section={section}
      item={item}
      state={stateOf(item)}
      project={projectOf(item)}
      milestone={milestoneOf(item)}
      draggable={isDays && !isLocked(item)}
      onCycle={() => onCycle(section, item, wk)}
      onEdit={() => onEdit(item)}
      onDelete={() => onDelete(section, item)}
      onMoveNext={dated && item.date && !isLocked(item) ? () => onMoveNext(section, item) : undefined}
      onDropOnCard={isDays ? (e) => dropOnCard(e, day, item, iso) : undefined}
    />
  );

  /* ---------- ถาด (tray) 1 อัน — ใช้ทั้งถาดวิชาและถาดหนังสือ แยกกันด้วย kind ---------- */
  function renderTray(kind, label, emptyText, extraClass) {
    const parked = items.filter((i) => i.pool && poolKind(i) === kind && !i.day);
    return (
      <div
        className={'tray ' + extraClass}
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
        onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
        onDrop={(e) => { e.currentTarget.classList.remove('drag-over'); dropOnTray(e, kind); }}
      >
        <div className="tray-head mono">{label}</div>
        <div className="tray-cards">
          {parked.length === 0
            ? <div className="tray-empty">{emptyText}</div>
            : parked.map((item) => card(item, ''))}
        </div>
      </div>
    );
  }

  /* ---------- layout 'days': คอลัมน์ จ–อา (+ วันที่จริงถ้าเป็นบอร์ดผูกวันที่) + ถาด ---------- */
  function renderDays() {
    const hasSubjectPool = items.some((i) => poolKind(i) === 'subject');
    const hasBookPool = items.some((i) => poolKind(i) === 'book');
    return (
      <>
        {dated && (
          <div className="week-nav">
            <button className="icon-btn" onClick={() => onViewWeek(shiftWeek(viewWeek, -1))} aria-label="สัปดาห์ก่อน">‹</button>
            <span className="week-label mono">
              {viewWeek.replace('-W', ' · W')} · {fmtDateShort(weekDates[0])} – {fmtDateShort(weekDates[6])}
            </span>
            <button className="icon-btn" onClick={() => onViewWeek(shiftWeek(viewWeek, 1))} aria-label="สัปดาห์ถัดไป">›</button>
            {viewWeek !== weekKey && (
              <button className="ml-reset" onClick={() => onViewWeek(weekKey)}>กลับสัปดาห์นี้</button>
            )}
          </div>
        )}

        <div className="day-grid">
          {DAY_ORDER.map((day, idx) => {
            const iso = dated ? weekDates[idx] : undefined;
            let dayItems = items.filter((i) => (dated && i.date ? i.date === iso : i.day === day));
            if (dated) dayItems = [...dayItems].sort(byStart);
            return (
              <div
                className={'day-col' + (iso === today ? ' is-today' : '')}
                key={day}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                onDrop={(e) => { e.currentTarget.classList.remove('drag-over'); dropOnDay(e, day, iso); }}
              >
                <div className="day-col-header mono">
                  <span>{day}{iso && <span className="day-date"> · {fmtDateShort(iso)}</span>}</span>
                  <button className="icon-btn" title={'เพิ่มรายการวัน' + day} onClick={() => onAdd({ day, date: iso })}>+</button>
                </div>
                {dayItems.map((item) => card(item, day, iso))}
                {!dayItems.length && <div className="day-empty">ลากการ์ดมาวางที่นี่</div>}
              </div>
            );
          })}
        </div>

        {hasSubjectPool && renderTray(
          'subject',
          '📚 ถาดวิชา — ลากขึ้นไปวางในวันเพื่อจองเวลาอ่าน · ลากกลับมาที่นี่เพื่อเก็บ',
          'จองครบทุกวิชาแล้ว — ลากการ์ดจากวันกลับมาที่นี่เพื่อเก็บ',
          'subject-tray'
        )}
        {hasBookPool && renderTray(
          'book',
          '📕 ถาดหนังสือ — ลากเล่มที่อยากอ่านขึ้นไปวางในวัน · ลากกลับมาที่นี่เพื่อเก็บ (แยกจากถาดวิชา)',
          'จองครบทุกเล่มแล้ว — ลากการ์ดจากวันกลับมาที่นี่เพื่อเก็บ',
          'book-tray'
        )}
      </>
    );
  }

  /* ---------- layout 'group': จัดกลุ่มตามหัวข้อ (เรียงตามลำดับที่พบ) ---------- */
  function renderGroups() {
    if (!items.length) return <div className="empty-state">ยังไม่มีรายการ — กด "+ เพิ่มรายการ" เพื่อเริ่ม</div>;
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

  const note = section.note + (section.resettable && !dated ? ' · WEEK ' + weekKey : '');
  const canPause = SPRINT.pause.includes(section.id);

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
          {canPause && (
            <button className="ml-reset" onClick={() => onTogglePause(section.id)}>⏸ พักไว้</button>
          )}
          {dated && (
            <button className="ml-reset" onClick={onOpenReview}>📋 สรุปสัปดาห์</button>
          )}
          {section.resettable && (
            <button className="ml-reset" onClick={() => onResetWeek(section, wk)}
              title="ล้างสถานะของการ์ดรูทีน (ไม่ผูกวันที่) ในสัปดาห์นี้ — การ์ดผูกวันที่ไม่ถูกแตะ">
              รีเซ็ตสัปดาห์นี้
            </button>
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
          {/* books/money มีฟอร์ม/รายการของตัวเอง ไม่ใช้ปุ่มเพิ่ม/คืนค่าการ์ดทั่วไป */}
          {section.layout !== 'books' && section.layout !== 'money' && (
            <>
              <button
                className="ml-reset"
                title="คืนการ์ดที่เผลอลบ/แก้ผิด กลับเป็นค่าตั้งต้น (ของที่เพิ่มเองไม่หาย)"
                onClick={() => onResetSection(section)}
              >
                ↺ คืนค่าเริ่มต้น
              </button>
              <button className="ml-reset add" onClick={() => onAdd({})}>+ เพิ่มรายการ</button>
            </>
          )}
        </span>
      </div>

      {dated && issues.length > 0 && (
        <div className="banner warn issues">
          <b>⚠ แผนมีปัญหา {issues.length} จุด</b>
          <ul>{issues.slice(0, 8).map((m, i) => <li key={i}>{m}</li>)}</ul>
          {issues.length > 8 && <div>…และอีก {issues.length - 8} จุด (ดูใน console)</div>}
        </div>
      )}

      {dated && doc.sprint && <ProjectBar doc={doc} onUpdateProject={onUpdateProject} />}

      <div id="mlList">
        {section.layout === 'money'
          ? <FinanceTracker finance={finance} onAddTx={onAddTx} onDeleteTx={onDeleteTx} onSetBudgetUntil={onSetBudgetUntil} />
          : section.layout === 'books' ? <BookShelf />
          : section.layout === 'days' ? renderDays()
          : renderGroups()}
      </div>
    </>
  );
}
