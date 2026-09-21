import React, { useState } from 'react';
import { DAY_ORDER, TAG_LABEL, TRACK_LABEL } from '../data/constants.js';
import { dayLabelOf, spanOf, fromMin, todayISO } from '../data/sprint.js';

// ฟอร์มเพิ่ม/แก้ไขรายการ (modal) — ฟิลด์ปรับตาม layout ของ section:
//   days  → วัน + เวลา + สถานที่
//   days + dated (บอร์ด weekly ช่วง Final Sprint) → วันที่ + เวลาเริ่ม/จบ + พลังงาน + โปรเจค + milestone
//   group → กลุ่ม (พิมพ์ใหม่หรือเลือกจากที่มี) + โน้ต/meta
//   icpc  → เพิ่ม dropdown "แผน" (แผนหลัก / หลังแข่งติดรอบ / หลังแข่งไม่ติด)
export default function ItemEditor({ section, sprint, item, defaults, onSave, onClose }) {
  const dated = !!section.dated;
  const locked = item?.energy === 'locked';
  const [unlock, setUnlock] = useState(!!item?.unlocked);
  const timeLocked = locked && !unlock; // การ์ด locked แก้วัน/เวลาไม่ได้จนกว่าจะติ๊กปลดล็อก

  const [form, setForm] = useState(() => {
    const sp = item ? spanOf(item) : null;
    const date = item ? item.date || '' : defaults?.date || (dated ? todayISO() : '');
    return {
      activity: item?.activity || '',
      day: item?.day || defaults?.day || DAY_ORDER[0],
      time: item?.time || '',
      group: item?.group || defaults?.group || '',
      meta: item?.meta || '',
      cat: item?.cat || defaults?.cat || (section.items[0]?.cat ?? 'plan'),
      url: item?.url || '',
      track: item?.track || defaults?.track || '',
      // ฟิลด์ของบอร์ดผูกวันที่
      recurring: dated && !!item && !item.date, // การ์ดรูทีน (ไม่ผูกวันที่) = โผล่ทุกสัปดาห์
      date,
      start: item?.start || (sp ? fromMin(sp[0]) : ''),
      end: item?.end || (sp ? fromMin(sp[1]) : ''),
      energy: item?.energy || 'light',
      project: item?.project || '',
      milestone: item?.milestone || '',
      detail: item?.detail || '',
    };
  });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const existingGroups = [...new Set(section.items.map((i) => i.group).filter(Boolean))];
  const projects = sprint?.projects || [];
  const milestones = (sprint?.milestones || []).filter(
    (m) => !form.project || m.project === form.project || m.project === 'all'
  );

  function submit(e) {
    e.preventDefault();
    if (!form.activity.trim()) return;

    const values = {
      activity: form.activity.trim(),
      cat: form.cat,
      meta: form.meta.trim(),
      url: form.url.trim(),
    };
    if (dated) {
      if (form.start && form.end && form.start >= form.end) {
        alert('เวลาเริ่มต้องน้อยกว่าเวลาจบ');
        return;
      }
      if (!form.recurring && !form.date) {
        alert('เลือกวันที่ หรือติ๊ก "ทุกสัปดาห์"');
        return;
      }
      if (!timeLocked) {
        values.date = form.recurring ? '' : form.date;
        values.day = form.recurring ? form.day : dayLabelOf(form.date);
        values.start = form.start || undefined;
        values.end = form.end || undefined;
        values.time = form.start && form.end ? form.start + '–' + form.end : '';
        values.energy = form.energy;
      }
      values.project = form.project || null;
      values.milestone = form.milestone || null;
      values.detail = form.detail.trim();
      if (locked) values.unlocked = unlock;
    } else if (section.layout === 'days') {
      values.day = form.day;
      values.time = form.time.trim();
    } else {
      values.group = form.group.trim() || 'อื่น ๆ';
    }
    if (section.id === 'icpc') values.track = form.track;
    onSave(values);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>{item ? '✎ แก้ไขรายการ' : '+ เพิ่มรายการ'} · {section.tab}</h3>

        <label className="field">
          รายการ / กิจกรรม *
          <textarea rows={2} required autoFocus value={form.activity} onChange={set('activity')} />
        </label>

        {dated ? (
          <>
            {locked && (
              <label className="field-check lock-toggle">
                <input type="checkbox" checked={unlock} onChange={(e) => setUnlock(e.target.checked)} />
                🔓 ปลดล็อกเพื่อแก้วัน/เวลา (บล็อกนี้ถูกล็อกไว้ — ปกติไม่ควรย้าย)
              </label>
            )}
            <label className="field-check">
              <input type="checkbox" checked={form.recurring} disabled={timeLocked}
                onChange={(e) => setForm((f) => ({ ...f, recurring: e.target.checked }))} />
              ทุกสัปดาห์ (ไม่ผูกวันที่)
            </label>
            <div className="field-row">
              {form.recurring ? (
                <label className="field">
                  วัน
                  <select value={form.day} onChange={set('day')} disabled={timeLocked}>
                    {DAY_ORDER.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </label>
              ) : (
                <label className="field">
                  วันที่
                  <input type="date" value={form.date} onChange={set('date')} disabled={timeLocked} />
                </label>
              )}
              <label className="field">
                เริ่ม
                <input type="time" value={form.start} onChange={set('start')} disabled={timeLocked} />
              </label>
              <label className="field">
                จบ
                <input type="time" value={form.end} onChange={set('end')} disabled={timeLocked} />
              </label>
            </div>
            <div className="field-row">
              <label className="field">
                พลังงาน
                <select value={form.energy} onChange={set('energy')} disabled={timeLocked}>
                  <option value="deep">deep — คิดหนัก (ลงช่วงพีค)</option>
                  <option value="light">light — งานเบา/ท่อง/ดริล</option>
                  <option value="locked">locked — ล็อกเวลาไว้</option>
                </select>
              </label>
              <label className="field">
                โปรเจค
                <select value={form.project} onChange={(e) => setForm((f) => ({ ...f, project: e.target.value, milestone: '' }))}>
                  <option value="">— ไม่สังกัด —</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.tag} · {p.name}</option>)}
                </select>
              </label>
            </div>
            <label className="field">
              Milestone
              <select value={form.milestone} onChange={set('milestone')}>
                <option value="">— ไม่มี —</option>
                {milestones.map((m) => <option key={m.id} value={m.id}>{m.id} · {m.name} (ภายใน {m.due})</option>)}
              </select>
            </label>
            <label className="field">
              รายละเอียด / output ที่ต้องได้
              <textarea rows={2} value={form.detail} onChange={set('detail')} />
            </label>
          </>
        ) : section.layout === 'days' ? (
          <>
            <label className="field">
              วัน
              <select value={form.day} onChange={set('day')}>
                {DAY_ORDER.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <div className="field-row">
              <label className="field">
                เวลา
                <input type="text" placeholder="เช่น 9:00–12:00" value={form.time} onChange={set('time')} />
              </label>
              <label className="field">
                สถานที่ / ห้อง
                <input type="text" placeholder="เช่น ห้อง 17304" value={form.meta} onChange={set('meta')} />
              </label>
            </div>
          </>
        ) : (
          <>
            <label className="field">
              กลุ่ม / หัวข้อ
              <input type="text" list="group-options" placeholder="พิมพ์ชื่อกลุ่มใหม่ หรือเลือกจากที่มี"
                value={form.group} onChange={set('group')} />
              <datalist id="group-options">
                {existingGroups.map((g) => <option key={g} value={g} />)}
              </datalist>
            </label>
            <label className="field">
              โน้ตกำกับ (แสดงเหนือชื่อรายการ เช่น วันที่ · จำนวนข้อ)
              <input type="text" placeholder="เช่น พฤ 2 ก.ค. · 3 ข้อ" value={form.meta} onChange={set('meta')} />
            </label>
          </>
        )}

        {section.id === 'icpc' && (
          <label className="field">
            แผน
            <select value={form.track} onChange={set('track')}>
              {Object.entries(TRACK_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        )}

        <div className="field-row">
          {!(dated && form.project) && (
            <label className="field">
              หมวด (สีป้าย)
              <select value={form.cat} onChange={set('cat')}>
                {Object.entries(TAG_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          )}
          <label className="field">
            ลิงก์ (ถ้ามี)
            <input type="url" placeholder="https://…" value={form.url} onChange={set('url')} />
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>ยกเลิก</button>
          <button type="submit" className="btn primary">{item ? 'บันทึก' : 'เพิ่ม'}</button>
        </div>
      </form>
    </div>
  );
}
