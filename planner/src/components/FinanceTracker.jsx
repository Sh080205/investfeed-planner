import React, { useState, useMemo } from 'react';

// ---------- ตัวช่วย ----------
const money = (n) => '฿' + (n || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 });
const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const monthKeyOf = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
const isoOf = (d) =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const todayISO = () => isoOf(new Date());
// วันสุดท้ายของเดือนที่ ISO นั้นอยู่ (ใช้เป็นค่าตั้งต้น/ปุ่มลัด "สิ้นเดือน")
const endOfMonthISO = (iso) => {
  const [y, m] = (iso || todayISO()).split('-').map(Number);
  return isoOf(new Date(y, m, 0));
};
const addDaysISO = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number);
  return isoOf(new Date(y, m - 1, d + n));
};
// จำนวนวันจากวันนี้ถึงวันเป้าหมาย แบบนับวันนี้ด้วย (วันนี้ = 1) — 0 = วันเป้าหมายผ่านไปแล้ว
const daysThrough = (iso) => {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const target = new Date(iso + 'T00:00:00');
  return Math.max(0, Math.round((target - t) / 86400000) + 1);
};
const fmtThaiDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return d + ' ' + TH_MONTHS[m - 1] + ' ' + String((y + 543) % 100);
};

// หมวดตั้งต้น (พิมพ์หมวดใหม่เองได้ผ่าน datalist)
const CATS = {
  expense: ['อาหาร', 'เดินทาง', 'หนังสือ/การเรียน', 'ของใช้', 'สังสรรค์/บันเทิง', 'สุขภาพ', 'อื่น ๆ'],
  income: ['เงินจากบ้าน/ค่าขนม', 'TA / งานพิเศษ', 'ทุน/รางวัล', 'อื่น ๆ'],
};

export default function FinanceTracker({ finance, onAddTx, onDeleteTx, onSetBudgetUntil }) {
  const txns = finance?.transactions || [];
  const [month, setMonth] = useState(() => monthKeyOf(new Date())); // 'YYYY-MM' ที่กำลังดู
  const [form, setForm] = useState(() => ({
    type: 'expense', amount: '', category: '', note: '', date: todayISO(),
  }));
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // ธุรกรรมของเดือนที่เลือก เรียงใหม่→เก่า
  const monthTx = useMemo(
    () => txns.filter((t) => (t.date || '').startsWith(month)).sort((a, b) => (b.date > a.date ? 1 : -1)),
    [txns, month]
  );

  const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense; // เงินที่ใช้ได้ของเดือนนี้ (รับ − จ่าย)

  // เงินใช้ได้ต่อวัน — หารด้วยจำนวนวันถึง "วันที่ต้องใช้เงินก้อนนี้ถึง" (ปรับได้เอง)
  // ค่าตั้งต้น = สิ้นเดือนนี้ · เก็บที่ doc.finance.budgetUntil
  const now = new Date();
  const [y, m] = month.split('-').map(Number);
  const isCurrentMonth = month === monthKeyOf(now);
  const budgetUntil = finance?.budgetUntil || endOfMonthISO(todayISO());
  const daysLeft = daysThrough(budgetUntil); // นับวันนี้ด้วย · 0 = วันเป้าหมายผ่านไปแล้ว
  const perDay = balance > 0 && daysLeft > 0 ? balance / daysLeft : 0;

  // รายจ่ายแยกหมวด (มาก→น้อย) ไว้ดูว่าเงินหมดไปกับอะไร
  const byCat = useMemo(() => {
    const map = {};
    monthTx.filter((t) => t.type === 'expense').forEach((t) => {
      map[t.category || 'อื่น ๆ'] = (map[t.category || 'อื่น ๆ'] || 0) + t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthTx]);

  function shiftMonth(delta) {
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(monthKeyOf(d));
  }

  function submit(e) {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!(amt > 0)) return; // ต้องเป็นจำนวนบวก
    onAddTx({
      type: form.type,
      amount: amt,
      category: form.category.trim() || (form.type === 'expense' ? 'อื่น ๆ' : 'รายรับ'),
      note: form.note.trim(),
      date: form.date || todayISO(),
    });
    // เคลียร์เฉพาะจำนวน/โน้ต เก็บ type/หมวด/วันไว้ กรอกรายการถัดไปเร็ว
    setForm((f) => ({ ...f, amount: '', note: '' }));
  }

  return (
    <div className="fin">
      {/* ---- แถบเลือกเดือน ---- */}
      <div className="fin-month">
        <button className="icon-btn" onClick={() => shiftMonth(-1)} aria-label="เดือนก่อน">‹</button>
        <span className="fin-month-label mono">{TH_MONTHS[m - 1]} {y + 543}</span>
        <button className="icon-btn" onClick={() => shiftMonth(1)} aria-label="เดือนถัดไป">›</button>
      </div>

      {/* ---- สรุปยอด ---- */}
      <div className="fin-summary">
        <div className="fin-tile income">
          <div className="fin-tile-label">รายรับ</div>
          <div className="fin-tile-val">{money(income)}</div>
        </div>
        <div className="fin-tile expense">
          <div className="fin-tile-label">รายจ่าย</div>
          <div className="fin-tile-val">{money(expense)}</div>
        </div>
        <div className={'fin-tile balance' + (balance < 0 ? ' neg' : '')}>
          <div className="fin-tile-label">เงินที่ใช้ได้ (คงเหลือ)</div>
          <div className="fin-tile-val big">{money(balance)}</div>

          {/* ตั้งเองว่าเงินก้อนนี้ต้องใช้ถึงวันไหน → คำนวณเงินต่อวันจากวันนั้น */}
          {isCurrentMonth && (
            <div className="fin-until">
              <label className="fin-until-row">
                <span>ใช้ถึงวันที่</span>
                <input
                  type="date"
                  value={budgetUntil}
                  min={todayISO()}
                  onChange={(e) => e.target.value && onSetBudgetUntil(e.target.value)}
                />
              </label>
              <div className="fin-until-presets">
                <button type="button" onClick={() => onSetBudgetUntil(endOfMonthISO(todayISO()))}>สิ้นเดือน</button>
                <button type="button" onClick={() => onSetBudgetUntil(addDaysISO(todayISO(), 6))}>+7 วัน</button>
                <button type="button" onClick={() => onSetBudgetUntil(addDaysISO(todayISO(), 13))}>+14 วัน</button>
              </div>
            </div>
          )}

          {isCurrentMonth && balance > 0 && daysLeft > 0 && (
            <div className="fin-tile-sub">
              ใช้ได้ <b>~{money(perDay)}/วัน</b> · ถึง {fmtThaiDate(budgetUntil)} (อีก {daysLeft} วัน)
            </div>
          )}
          {isCurrentMonth && balance > 0 && daysLeft === 0 && (
            <div className="fin-tile-sub warn">วันที่กำหนดผ่านไปแล้ว — ตั้งวันใหม่</div>
          )}
          {balance < 0 && <div className="fin-tile-sub warn">ใช้เกินรายรับเดือนนี้แล้ว</div>}
        </div>
      </div>

      {/* ---- ฟอร์มเพิ่มธุรกรรม ---- */}
      <form className="fin-form" onSubmit={submit}>
        <div className="fin-toggle">
          <button type="button" className={form.type === 'expense' ? 'active exp' : ''}
            onClick={() => setForm((f) => ({ ...f, type: 'expense', category: '' }))}>− รายจ่าย</button>
          <button type="button" className={form.type === 'income' ? 'active inc' : ''}
            onClick={() => setForm((f) => ({ ...f, type: 'income', category: '' }))}>+ รายรับ</button>
        </div>
        <div className="fin-form-row">
          <input className="fin-amt" type="number" inputMode="decimal" min="0" step="0.01"
            placeholder="จำนวนเงิน" value={form.amount} onChange={set('amount')} required />
          <input type="text" list="fin-cats" placeholder="หมวด" value={form.category} onChange={set('category')} />
          <datalist id="fin-cats">
            {CATS[form.type].map((c) => <option key={c} value={c} />)}
          </datalist>
          <input type="date" value={form.date} onChange={set('date')} />
        </div>
        <div className="fin-form-row">
          <input type="text" placeholder="โน้ต (ไม่บังคับ)" value={form.note} onChange={set('note')} />
          <button type="submit" className="btn primary">เพิ่ม</button>
        </div>
      </form>

      {/* ---- รายจ่ายแยกหมวด ---- */}
      {byCat.length > 0 && (
        <div className="fin-bycat">
          <div className="fin-section-head mono">รายจ่ายแยกหมวด</div>
          {byCat.map(([cat, amt]) => (
            <div className="fin-cat-row" key={cat}>
              <span className="fin-cat-name">{cat}</span>
              <span className="fin-cat-bar">
                <span className="fin-cat-fill" style={{ width: (expense ? (amt / expense) * 100 : 0) + '%' }} />
              </span>
              <span className="fin-cat-amt mono">{money(amt)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ---- รายการธุรกรรม ---- */}
      <div className="fin-section-head mono">รายการ ({monthTx.length})</div>
      {monthTx.length === 0 && <div className="fin-empty">ยังไม่มีรายการในเดือนนี้ — เพิ่มด้านบนได้เลย</div>}
      <div className="fin-list">
        {monthTx.map((t) => (
          <div className="fin-tx" key={t.id}>
            <div className="fin-tx-main">
              <span className={'tag ' + (t.type === 'income' ? 'income-tag' : 'expense-tag')}>{t.category}</span>
              {t.note && <span className="fin-tx-note">{t.note}</span>}
            </div>
            <span className="fin-tx-date mono">{t.date?.slice(8) + '/' + t.date?.slice(5, 7)}</span>
            <span className={'fin-tx-amt mono ' + t.type}>
              {t.type === 'income' ? '+' : '−'}{money(t.amount).slice(1)}
            </span>
            <button className="icon-btn danger" title="ลบ" onClick={() => onDeleteTx(t.id)}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}
