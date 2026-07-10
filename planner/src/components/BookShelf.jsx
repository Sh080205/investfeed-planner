import React, { useEffect, useState } from 'react';

// ชั้นหนังสือ — ดึงรายชื่อไฟล์สดจาก /api/books (Express เสิร์ฟไฟล์จริงที่ /books/<path>)
// รายชื่อไม่ได้เก็บใน seed เพราะเนื้อหาโฟลเดอร์เปลี่ยนได้ตลอด — เพิ่ม/ลบไฟล์ในโฟลเดอร์
// "Reseach skill" แล้วรีเฟรชหน้าก็อัปเดตเอง · ใช้ได้เมื่อเปิดแอปผ่าน InvestFeed server เท่านั้น
export default function BookShelf() {
  const [state, setState] = useState({ loading: true, error: null, books: [] });
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch('/api/books')
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then((data) => setState({ loading: false, error: null, books: data.books || [] }))
      .catch((e) => setState({ loading: false, error: e.message, books: [] }));
  }, []);

  if (state.loading) return <div className="book-hint">กำลังโหลดรายชื่อหนังสือ…</div>;

  if (state.error) {
    return (
      <div className="book-hint">
        เชื่อมต่อ server ไม่ได้ ({state.error})<br />
        หน้านี้ต้องเปิดผ่าน InvestFeed server เช่น <span className="mono">http://localhost:3000/planner</span>
        <br />— ดับเบิลคลิก start-app.cmd (หรือ shortcut บน Desktop) แล้วกดปุ่ม 📅 จากหน้าข่าว
      </div>
    );
  }

  const folderOf = (b) => b.folder || 'ทั่วไป';
  const q = query.trim().toLowerCase();
  const books = q ? state.books.filter((b) => b.name.toLowerCase().includes(q)) : state.books;

  // จัดกลุ่มตามโฟลเดอร์ย่อย (เรียงตามลำดับที่พบ)
  const folders = [];
  for (const b of books) if (!folders.includes(folderOf(b))) folders.push(folderOf(b));

  return (
    <>
      <input
        className="book-search"
        type="search"
        placeholder="ค้นหาชื่อหนังสือ/สไลด์…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {books.length === 0 && <div className="book-hint">ไม่พบไฟล์ที่ตรงกับคำค้น</div>}
      {folders.map((f) => (
        <div className="group" key={f}>
          <div className="group-head">
            <div className="group-title">📁 {f}</div>
            <div className="group-badge">{books.filter((b) => folderOf(b) === f).length} ไฟล์</div>
          </div>
          {books
            .filter((b) => folderOf(b) === f)
            .map((b) => (
              <a
                className="ml-card static book-card"
                key={b.path}
                href={'/books/' + b.path.split('/').map(encodeURIComponent).join('/')}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="ml-body">
                  <div className="ml-meta">
                    {b.ext.toUpperCase()} · {b.sizeMB} MB · {b.ext === 'pdf' ? 'เปิดอ่านในแท็บใหม่' : 'ดาวน์โหลดไปเปิด'}
                  </div>
                  <div className="ml-activity">{b.ext === 'pdf' ? '📕' : '📙'} {b.name}</div>
                </div>
              </a>
            ))}
        </div>
      ))}
    </>
  );
}
