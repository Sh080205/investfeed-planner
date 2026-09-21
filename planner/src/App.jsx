import React, { useState, useEffect, useMemo } from 'react';
import { STATES, isoWeekKey, itemStatusKey } from './data/constants.js';
import { loadDoc, saveDoc, downloadJSON, upgradeDoc, restoreSectionFromSeed, BACKUP_KEY } from './data/store.js';
import { applyLegacy } from './data/migrate.js';
import { findNextSlot, validateSprint, dayLabelOf, fmtDateShort } from './data/sprint.js';
import Sidebar from './components/Sidebar.jsx';
import SectionPanel from './components/SectionPanel.jsx';
import ItemEditor from './components/ItemEditor.jsx';
import WeekReview from './components/WeekReview.jsx';

/** ดาวน์โหลด string JSON เป็นไฟล์ */
function downloadText(text, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function App() {
  // doc = ข้อมูลทั้งหมดของแอป (sections/items/statuses/settings/sprint) — โหลดครั้งเดียวตอน mount
  const [doc, setDoc] = useState(() => loadDoc());
  const [activeId, setActiveId] = useState('weekly');
  // editor: null = ปิด | {sectionId, itemId:null=เพิ่มใหม่, defaults} = เปิดฟอร์ม
  const [editor, setEditor] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [backupError, setBackupError] = useState(null);
  const weekKey = isoWeekKey();
  const [viewWeek, setViewWeek] = useState(weekKey); // สัปดาห์ที่บอร์ด weekly กำลังแสดง

  // ทุกการแก้ไข doc ต้องวิ่งผ่าน update() เพื่อให้บันทึกลง localStorage เสมอ
  const update = (fn) =>
    setDoc((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      fn(next);
      saveDoc(next);
      return next;
    });

  const active = doc.sections.find((s) => s.id === activeId) || doc.sections[0];
  const findItem = (d, sectionId, itemId) =>
    d.sections.find((s) => s.id === sectionId)?.items.find((i) => i.id === itemId);

  /* ---------- validation ของแผน — เตือนใน console + แถบบนบอร์ด ไม่ทำให้แอปพัง ---------- */
  const issues = useMemo(() => {
    try { return validateSprint(doc); } catch (e) { return ['ตรวจแผนไม่สำเร็จ: ' + e.message]; }
  }, [doc]);
  useEffect(() => { if (issues.length) console.warn('[Final Sprint] พบปัญหาในแผน:\n' + issues.join('\n')); }, [issues]);

  /* ---------- backup ก่อนอัปเกรด → ให้ server เขียนเป็นไฟล์ backup/…json (ลองทุกครั้งที่เปิดจนสำเร็จ) ---------- */
  useEffect(() => {
    const mig = doc.sprintMigration;
    if (!mig || mig.backupFile) return;
    let raw = null;
    try { raw = localStorage.getItem(BACKUP_KEY); } catch { /* ignore */ }
    if (!raw) return;
    fetch('/api/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: JSON.parse(raw) }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then((res) => update((d) => { d.sprintMigration.backupFile = res.file; }))
      .catch((err) => {
        console.warn('ส่ง backup ให้ server ไม่สำเร็จ', err);
        setBackupError(String(err.message || err));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function downloadPreUpgradeBackup() {
    let raw = null;
    try { raw = localStorage.getItem(BACKUP_KEY); } catch { /* ignore */ }
    if (!raw) { alert('ไม่พบสำเนาก่อนอัปเกรดในเบราว์เซอร์นี้'); return; }
    downloadText(raw, 'mission_log_backup_' + new Date().toISOString().slice(0, 10) + '.json');
  }

  /* ---------- สถานะการ์ด: คลิกวน ⏳ → 🔄 → ✅ (การ์ดผูกวันที่เก็บสถานะถาวร) ---------- */
  function cycleStatus(section, item, wk = weekKey) {
    if (section.checkable === false) return;
    update((d) => {
      const key = itemStatusKey(section, item, wk);
      const map = d.statuses[key] || (d.statuses[key] = {});
      const cur = map[item.id] || 'pending';
      map[item.id] = STATES[(STATES.indexOf(cur) + 1) % STATES.length];
    });
  }

  /* ---------- CRUD รายการ ---------- */
  function saveItem(sectionId, itemId, values) {
    update((d) => {
      const sec = d.sections.find((s) => s.id === sectionId);
      if (itemId) {
        const it = sec.items.find((i) => i.id === itemId);
        Object.assign(it, values);
        if (values.date === '') delete it.date; // ติ๊ก "ทุกสัปดาห์" = เลิกผูกวันที่
      } else {
        // id ใหม่สร้างจาก timestamp — ไม่ชนกับ id เดิมใน seed แน่นอน
        const it = { id: 'u' + Date.now().toString(36), ...values };
        if (!it.date) delete it.date;
        sec.items.push(it);
      }
    });
    setEditor(null);
  }

  function deleteItem(section, item) {
    if (!window.confirm('ลบรายการนี้?\n\n' + item.activity)) return;
    update((d) => {
      const sec = d.sections.find((s) => s.id === section.id);
      sec.items = sec.items.filter((i) => i.id !== item.id);
    });
  }

  function resetWeek(section, wk) {
    update((d) => { delete d.statuses[section.id + ':' + wk]; });
  }

  /** คืนการ์ดของแท็บนี้กลับค่าตั้งต้น — ใช้ตอนเผลอลบหรือแก้จนเละ */
  function resetSection(section) {
    const msg =
      'คืนค่าเริ่มต้นของแท็บ "' + section.tab + '" ?\n\n' +
      '✓ ไม่หาย: การ์ดในถาด (พร้อมวันที่จองไว้) และรายการที่คุณเพิ่มเอง\n' +
      '✗ จะกลับเป็นค่าตั้งต้น: การ์ดที่ลบไป (กลับมา) และการแก้ข้อความ/เวลาในการ์ดเดิม';
    if (!window.confirm(msg)) return;
    update((d) => { restoreSectionFromSeed(d, section.id); });
  }

  /* ---------- Finance (รายรับรายจ่าย) ---------- */
  function addTx(tx) {
    update((d) => {
      if (!d.finance) d.finance = { transactions: [] };
      d.finance.transactions.push({ id: 'tx' + Date.now().toString(36), ...tx });
    });
  }
  function deleteTx(id) {
    update((d) => {
      if (d.finance) d.finance.transactions = d.finance.transactions.filter((t) => t.id !== id);
    });
  }
  /** ตั้งวันที่เงินคงเหลือต้องใช้ถึง (ใช้คำนวณเงินต่อวัน) */
  function setBudgetUntil(iso) {
    update((d) => {
      if (!d.finance) d.finance = { transactions: [] };
      d.finance.budgetUntil = iso;
    });
  }

  /* ---------- ลากการ์ดย้ายวัน/จัดลำดับ ----------
     beforeId = วางแทรกหน้าการ์ดไหน (null = ต่อท้ายวันนั้น)
     date = วันที่ของคอลัมน์บนบอร์ดผูกวันที่ ('' / undefined = บอร์ดรายวันแบบเดิม) */
  function moveItem(section, itemId, day, beforeId, date) {
    update((d) => {
      const sec = d.sections.find((s) => s.id === section.id);
      const from = sec.items.findIndex((i) => i.id === itemId);
      if (from < 0) return;
      const it = sec.items[from];
      if (it.energy === 'locked' && !it.unlocked) return; // การ์ด locked ห้ามย้ายจนกว่าจะปลดล็อก
      sec.items.splice(from, 1);
      it.day = day;
      if (date) it.date = date;
      else if (day === '') delete it.date; // กลับเข้าถาด = ไม่ผูกวันที่
      const at = beforeId ? sec.items.findIndex((i) => i.id === beforeId) : -1;
      if (at < 0) sec.items.push(it);
      else sec.items.splice(at, 0, it);
    });
  }

  /* ---------- เลื่อนการ์ดไปช่องว่างถัดไป (พลังงานตรงกัน ไม่ทับ locked/BUFFER) ---------- */
  function moveToNextSlot(section, item) {
    const slot = findNextSlot(doc, item);
    if (!slot) {
      alert('ไม่เจอช่องว่างที่พลังงานตรงกัน (' + (item.energy || 'light') + ') ภายใน 21 วันข้างหน้า\n→ ลากย้ายเอง หรือแก้เวลาในการ์ดแทน');
      return;
    }
    const proj = doc.sprint?.projects.find((p) => p.id === item.project);
    const late = proj?.deadline && slot.date > proj.deadline;
    const msg =
      'เลื่อน "' + item.activity + '"\n' +
      (item.date ? fmtDateShort(item.date) + ' ' : '') + (item.time || '') +
      '  →  ' + dayLabelOf(slot.date) + ' ' + fmtDateShort(slot.date) + ' ' + slot.start + '–' + slot.end +
      (late ? '\n\n⚠ เลย deadline ของ ' + proj.tag + ' (' + fmtDateShort(proj.deadline) + ')' : '');
    if (!window.confirm(msg)) return;
    update((d) => {
      Object.assign(findItem(d, section.id, item.id), {
        date: slot.date, day: dayLabelOf(slot.date),
        start: slot.start, end: slot.end, time: slot.start + '–' + slot.end,
      });
    });
  }

  /* ---------- Project / pause ---------- */
  function updateProject(pid, patch) {
    update((d) => { Object.assign(d.sprint.projects.find((p) => p.id === pid), patch); });
  }
  function togglePause(sectionId) {
    update((d) => {
      const cur = d.settings.paused || [];
      d.settings.paused = cur.includes(sectionId) ? cur.filter((x) => x !== sectionId) : [...cur, sectionId];
    });
  }

  /* ---------- Import: รองรับทั้ง backup ของแอปนี้ และไฟล์จาก migrate-helper ---------- */
  function onImportFile(file) {
    file.text().then((text) => {
      let obj;
      try { obj = JSON.parse(text); } catch { alert('ไฟล์ไม่ใช่ JSON ที่ถูกต้อง'); return; }

      if (obj && obj.legacyV2) {
        // ไฟล์จาก migrate-helper.html → เทสถานะ planner_v2 เดิมเข้าข้อมูลปัจจุบัน
        update((d) => {
          d.migratedCount = applyLegacy(d, obj.legacyV2);
          d.migrationNoticeDismissed = false;
        });
      } else if (obj && obj.schemaVersion && Array.isArray(obj.sections)) {
        if (!window.confirm('นำเข้าไฟล์ backup และแทนที่ข้อมูลทั้งหมดในแอป?')) return;
        upgradeDoc(obj); // เผื่อเป็นไฟล์ backup จาก schema เวอร์ชันเก่า
        saveDoc(obj);
        setDoc(obj);
      } else {
        alert('ไม่รู้จักรูปแบบไฟล์นี้');
      }
    });
  }

  const mig = doc.sprintMigration;
  const editSection = editor && doc.sections.find((s) => s.id === editor.sectionId);

  return (
    <div className="app">
      <Sidebar
        doc={doc}
        weekKey={weekKey}
        activeId={active.id}
        onSelect={setActiveId}
        onSaveDates={(dates) => update((d) => { Object.assign(d.settings.dates, dates); })}
        onExport={() => downloadJSON(doc)}
        onImportFile={onImportFile}
      />

      <main className="content">
        {doc.migratedCount > 0 && !doc.migrationNoticeDismissed && (
          <div className="banner">
            <span>✓ นำเข้าข้อมูลจาก planner เดิมสำเร็จ {doc.migratedCount} รายการ (สถานะที่เคยติ๊ก + วันแข่ง)</span>
            <button className="ml-reset" onClick={() => update((d) => { d.migrationNoticeDismissed = true; })}>
              ปิด
            </button>
          </div>
        )}

        {mig && !mig.dismissed && (
          <div className={'banner' + (backupError && !mig.backupFile ? ' warn' : '')}>
            <span>
              ✓ อัปเกรดเป็น Final Sprint แล้ว · ล้างการ์ดเก่า {mig.removed} ใบ ·{' '}
              {mig.backupFile
                ? <>backup อยู่ที่ <code>backup/{mig.backupFile}</code></>
                : backupError
                  ? <>ส่ง backup ให้ server ไม่ได้ ({backupError}) — กดดาวน์โหลดสำเนาเก็บไว้เอง</>
                  : <>กำลังเขียน backup…</>}
            </span>
            <span className="note-actions">
              <button className="ml-reset" onClick={downloadPreUpgradeBackup}>⬇ สำเนาก่อนอัปเกรด</button>
              <button className="ml-reset" onClick={() => update((d) => { d.sprintMigration.dismissed = true; })}>ปิด</button>
            </span>
          </div>
        )}

        <SectionPanel
          section={active}
          doc={doc}
          weekKey={weekKey}
          viewWeek={viewWeek}
          onViewWeek={setViewWeek}
          issues={issues}
          onCycle={cycleStatus}
          onAdd={(defaults) => setEditor({ sectionId: active.id, itemId: null, defaults })}
          onEdit={(item) => setEditor({ sectionId: active.id, itemId: item.id })}
          onDelete={deleteItem}
          onResetWeek={resetWeek}
          onResetSection={resetSection}
          onMoveItem={moveItem}
          onMoveNext={moveToNextSlot}
          onUpdateProject={updateProject}
          onOpenReview={() => setReviewOpen(true)}
          onTogglePause={togglePause}
          icpcView={doc.settings.icpcView || 'all'}
          onIcpcView={(v) => update((d) => { d.settings.icpcView = v; })}
          finance={doc.finance || { transactions: [] }}
          onAddTx={addTx}
          onDeleteTx={deleteTx}
          onSetBudgetUntil={setBudgetUntil}
        />
      </main>

      {editor && editSection && (
        <ItemEditor
          section={editSection}
          sprint={doc.sprint}
          item={editor.itemId ? editSection.items.find((i) => i.id === editor.itemId) : null}
          defaults={editor.defaults}
          onSave={(values) => saveItem(editor.sectionId, editor.itemId, values)}
          onClose={() => setEditor(null)}
        />
      )}

      {reviewOpen && (
        <WeekReview
          doc={doc}
          weekKey={viewWeek}
          onMoveNext={(item) => moveToNextSlot(doc.sections.find((s) => s.id === 'weekly'), item)}
          onClose={() => setReviewOpen(false)}
        />
      )}
    </div>
  );
}
