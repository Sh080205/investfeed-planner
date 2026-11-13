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

  // วันนี้ใช้ไปเท่าไร เทียบกับงบต่อวัน (เฉพาะเดือนปัจจุบัน)
  const today = todayISO();
  const spentToday = monthTx.filter((t) => t.type === 'expense' && t.date === today).reduce((s, t) => s + t.amount, 0);
  const usedPct = income > 0 ? Math.min(100, Math.round((expense / income) * 100)) : null;

  // รายการจัดกลุ่มตามวัน (ใหม่→เก่า) + ยอดสุทธิของวัน
  const byDay = useMemo(() => {
    const groups = [];
    for (const t of monthTx) {
      const last = groups[groups.length - 1];
      if (last && last.date === t.date) last.items.push(t);
      else groups.push({ date: t.date, items: [t] });
    }
    for (const g of groups) g.net = g.items.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
    return groups;
  }, [monthTx]);
  const dayLabel = (iso) => (iso === today ? 'วันนี้' : iso === addDaysISO(today, -1) ? 'เมื่อวาน' : fmtThaiDate(iso));

  return (
    <div className="fin">
      {/* ---- หัว: เดือนที่ดู ---- */}
      <div className="fin-month">
        <button className="icon-btn" onClick={() => shiftMonth(-1)} aria-label="เดือนก่อน">‹</button>
        <span className="fin-month-label">{TH_MONTHS[m - 1]} {y + 543}</span>
        <button className="icon-btn" onClick={() => shiftMonth(1)} aria-label="เดือนถัดไป">›</button>
        {!isCurrentMonth && (
          <button className="ml-reset" onClick={() => setMonth(monthKeyOf(new Date()))}>กลับเดือนนี้</button>
        )}
      </div>

      {/* ---- คำตอบหลัก: เหลือเท่าไร ใช้ได้วันละเท่าไร ---- */}
      <section className={'fin-hero' + (balance < 0 ? ' neg' : '')}>
        <div className="fin-hero-main">
          <div className="fin-label">คงเหลือเดือนนี้</div>
          <div className="fin-balance num">{balance < 0 ? '−' : ''}{money(Math.abs(balance))}</div>
          {isCurrentMonth && balance > 0 && daysLeft > 0 && (
            <div className="fin-perday">
              ใช้ได้วันละ <b className="num">~{money(perDay)}</b>
              <span className="fin-perday-sub">ถึง {fmtThaiDate(budgetUntil)} · อีก {daysLeft} วัน</span>
            </div>
          )}
          {isCurrentMonth && balance > 0 && daysLeft === 0 && (
            <div className="fin-note warn">วันที่ตั้งไว้ผ่านไปแล้ว — เลือกวันใหม่ด้านล่าง</div>
          )}
          {balance < 0 && <div className="fin-note warn">ใช้เกินรายรับเดือนนี้ {money(-balance)}</div>}
          {isCurrentMonth && perDay > 0 && (
            <div className={'fin-today' + (spentToday > perDay ? ' over' : '')}>
              วันนี้ใช้ไป <b className="num">{money(spentToday)}</b>
              {spentToday > perDay ? ' · เกินงบวันนี้' : ' · ยังอยู่ในงบ'}
            </div>
          )}
        </div>

        <div className="fin-hero-side">
          <div className="fin-stat">
            <span className="fin-label">รายรับ</span>
            <span className="fin-stat-val inc num">{money(income)}</span>
          </div>
          <div className="fin-stat">
            <span className="fin-label">รายจ่าย</span>
            <span className="fin-stat-val exp num">{money(expense)}</span>
          </div>
          {usedPct !== null && (
            <>
              <div className="fin-meter" role="img" aria-label={'ใช้ไปแล้ว ' + usedPct + '% ของรายรับ'}>
                <span className="fin-meter-fill" style={{ width: usedPct + '%' }} />
              </div>
              <div className="fin-meter-label">ใช้ไปแล้ว {usedPct}% ของรายรับ</div>
            </>
          )}
        </div>

        {/* ตั้งเองว่าเงินก้อนนี้ต้องใช้ถึงวันไหน → คำนวณเงินต่อวันจากวันนั้น */}
        {isCurrentMonth && (
          <div className="fin-until">
            <label className="fin-until-row">
              <span>ต้องใช้ถึงวันที่</span>
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
      </section>

      {/* ---- ฟอร์มบันทึกรายการ ---- */}
      <form className="fin-form" onSubmit={submit}>
        <div className="fin-form-head">
          <span className="fin-form-title">บันทึกรายการ</span>
          <div className="fin-toggle" role="radiogroup" aria-label="ชนิดรายการ">
            <button type="button" role="radio" aria-checked={form.type === 'expense'} className={form.type === 'expense' ? 'active exp' : ''}
              onClick={() => setForm((f) => ({ ...f, type: 'expense', category: '' }))}>รายจ่าย</button>
            <button type="button" role="radio" aria-checked={form.type === 'income'} className={form.type === 'income' ? 'active inc' : ''}
              onClick={() => setForm((f) => ({ ...f, type: 'income', category: '' }))}>รายรับ</button>
          </div>
        </div>
        <div className="fin-form-row">
          <label className="fin-field amt">
            <span>จำนวนเงิน</span>
            <input className="fin-amt num" type="number" inputMode="decimal" min="0" step="0.01"
              placeholder="0" value={form.amount} onChange={set('amount')} required />
          </label>
          <label className="fin-field">
            <span>หมวด</span>
            <input type="text" list="fin-cats" placeholder={CATS[form.type][0]} value={form.category} onChange={set('category')} />
          </label>
          <datalist id="fin-cats">
            {CATS[form.type].map((cat) => <option key={cat} value={cat} />)}
          </datalist>
          <label className="fin-field date">
            <span>วันที่</span>
            <input type="date" value={form.date} onChange={set('date')} />
          </label>
        </div>
        <div className="fin-form-row">
          <label className="fin-field">
            <span>โน้ต (ไม่บังคับ)</span>
            <input type="text" placeholder="เช่น ข้าวเที่ยงโรงอาหาร" value={form.note} onChange={set('note')} />
          </label>
          <button type="submit" className={'btn primary fin-submit ' + form.type}>
            บันทึก{form.type === 'expense' ? 'รายจ่าย' : 'รายรับ'}
          </button>
        </div>
      </form>

      {/* ---- รายการ (ซ้าย) + แยกหมวด (ขวา) ---- */}
      <div className="fin-cols">
        <section className="fin-txs">
          <h2 className="fin-h">รายการ <span className="fin-count num">{monthTx.length}</span></h2>
          {monthTx.length === 0 && <div className="fin-empty">ยังไม่มีรายการในเดือนนี้ — บันทึกจากฟอร์มด้านบนได้เลย</div>}
          {byDay.map((g) => (
            <div className="fin-day" key={g.date}>
              <div className="fin-day-head">
                <span>{dayLabel(g.date)}</span>
                <span className={'num ' + (g.net >= 0 ? 'inc' : 'exp')}>{g.net >= 0 ? '+' : '−'}{money(Math.abs(g.net))}</span>
              </div>
              {g.items.map((t) => (
                <div className="fin-tx" key={t.id}>
                  <span className={'fin-tx-dot ' + (t.type === 'income' ? 'inc' : 'exp')} aria-hidden="true" />
                  <div className="fin-tx-main">
                    <span className="fin-tx-cat">{t.category}</span>
                    {t.note && <span className="fin-tx-note">{t.note}</span>}
                  </div>
                  <span className={'fin-tx-amt num ' + t.type}>
                    {t.type === 'income' ? '+' : '−'}{money(t.amount)}
                  </span>
                  <button className="icon-btn danger fin-del" title="ลบรายการนี้" aria-label={'ลบ ' + t.category + ' ' + money(t.amount)} onClick={() => onDeleteTx(t.id)}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ))}
        </section>

        {byCat.length > 0 && (
          <section className="fin-bycat">
            <h2 className="fin-h">รายจ่ายแยกหมวด</h2>
            {byCat.map(([cat, amt]) => {
              const pct = expense ? Math.round((amt / expense) * 100) : 0;
              return (
                <div className="fin-cat-row" key={cat}>
                  <div className="fin-cat-top">
                    <span className="fin-cat-name">{cat}</span>
                    <span className="fin-cat-amt num">{money(amt)} <span className="fin-cat-pct">{pct}%</span></span>
                  </div>
                  <span className="fin-cat-bar"><span className="fin-cat-fill" style={{ width: pct + '%' }} /></span>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
