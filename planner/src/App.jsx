import React, { useState } from 'react';
import { STATES, isoWeekKey } from './data/constants.js';
import { loadDoc, saveDoc, statusKey, downloadJSON, upgradeDoc, restoreSectionFromSeed } from './data/store.js';
import { applyLegacy } from './data/migrate.js';
import Sidebar from './components/Sidebar.jsx';
import SectionPanel from './components/SectionPanel.jsx';
import ItemEditor from './components/ItemEditor.jsx';

export default function App() {
  // doc = ข้อมูลทั้งหมดของแอป (sections/items/statuses/settings) — โหลดครั้งเดียวตอน mount
  const [doc, setDoc] = useState(() => loadDoc());
  const [activeId, setActiveId] = useState('icpc');
  // editor: null = ปิด | {sectionId, itemId:null=เพิ่มใหม่, defaults} = เปิดฟอร์ม
  const [editor, setEditor] = useState(null);
  const weekKey = isoWeekKey();

  // ทุกการแก้ไข doc ต้องวิ่งผ่าน update() เพื่อให้บันทึกลง localStorage เสมอ
  const update = (fn) =>
    setDoc((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      fn(next);
      saveDoc(next);
      return next;
    });

  const active = doc.sections.find((s) => s.id === activeId) || doc.sections[0];

  /* ---------- สถานะการ์ด: คลิกวน ⏳ → 🔄 → ✅ ---------- */
  function cycleStatus(section, item) {
    if (section.checkable === false) return;
    update((d) => {
      const key = statusKey(section, weekKey);
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
        Object.assign(sec.items.find((i) => i.id === itemId), values);
      } else {
        // id ใหม่สร้างจาก timestamp — ไม่ชนกับ id เดิมใน seed แน่นอน
        sec.items.push({ id: 'u' + Date.now().toString(36), ...values });
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

  function resetWeek(section) {
    update((d) => { delete d.statuses[statusKey(section, weekKey)]; });
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

  /* ---------- ลากการ์ดย้ายวัน/จัดลำดับ (layout รายวัน) ----------
     beforeId = วางแทรกหน้าการ์ดไหน (null = ต่อท้ายวันนั้น) */
  function moveItem(section, itemId, day, beforeId) {
    update((d) => {
      const sec = d.sections.find((s) => s.id === section.id);
      const from = sec.items.findIndex((i) => i.id === itemId);
      if (from < 0) return;
      const [it] = sec.items.splice(from, 1);
      it.day = day;
      const at = beforeId ? sec.items.findIndex((i) => i.id === beforeId) : -1;
      if (at < 0) sec.items.push(it);
      else sec.items.splice(at, 0, it);
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

        <SectionPanel
          section={active}
          doc={doc}
          weekKey={weekKey}
          onCycle={cycleStatus}
          onAdd={(defaults) => setEditor({ sectionId: active.id, itemId: null, defaults })}
          onEdit={(item) => setEditor({ sectionId: active.id, itemId: item.id })}
          onDelete={deleteItem}
          onResetWeek={resetWeek}
          onResetSection={resetSection}
          onMoveItem={moveItem}
          icpcView={doc.settings.icpcView || 'all'}
          onIcpcView={(v) => update((d) => { d.settings.icpcView = v; })}
          finance={doc.finance || { transactions: [] }}
          onAddTx={addTx}
          onDeleteTx={deleteTx}
          onSetBudgetUntil={setBudgetUntil}
        />
      </main>

      {editor && (
        <ItemEditor
          section={doc.sections.find((s) => s.id === editor.sectionId)}
          item={
            editor.itemId
              ? doc.sections.find((s) => s.id === editor.sectionId).items.find((i) => i.id === editor.itemId)
              : null
          }
          defaults={editor.defaults}
          onSave={(values) => saveItem(editor.sectionId, editor.itemId, values)}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}
