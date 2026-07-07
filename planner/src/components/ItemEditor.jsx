import React, { useState } from 'react';
import { DAY_ORDER, TAG_LABEL, TRACK_LABEL } from '../data/constants.js';

// ฟอร์มเพิ่ม/แก้ไขรายการ (modal) — ฟิลด์ปรับตาม layout ของ section:
//   days  → วัน + เวลา + สถานที่
//   group → กลุ่ม (พิมพ์ใหม่หรือเลือกจากที่มี) + โน้ต/meta
//   icpc  → เพิ่ม dropdown "แผน" (แผนหลัก / หลังแข่งติดรอบ / หลังแข่งไม่ติด)
export default function ItemEditor({ section, item, defaults, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    activity: item?.activity || '',
    day: item?.day || defaults?.day || DAY_ORDER[0],
    time: item?.time || '',
    group: item?.group || defaults?.group || '',
    meta: item?.meta || '',
    cat: item?.cat || defaults?.cat || (section.items[0]?.cat ?? 'plan'),
    url: item?.url || '',
    track: item?.track || defaults?.track || '',
  }));
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const existingGroups = [...new Set(section.items.map((i) => i.group).filter(Boolean))];

  function submit(e) {
    e.preventDefault();
    if (!form.activity.trim()) return;

    const values = {
      activity: form.activity.trim(),
      cat: form.cat,
      meta: form.meta.trim(),
      url: form.url.trim(),
    };
    if (section.layout === 'days') {
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
          <textarea rows={3} required autoFocus value={form.activity} onChange={set('activity')} />
        </label>

        {section.layout === 'days' ? (
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
          <label className="field">
            หมวด (สีป้าย)
            <select value={form.cat} onChange={set('cat')}>
              {Object.entries(TAG_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
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
