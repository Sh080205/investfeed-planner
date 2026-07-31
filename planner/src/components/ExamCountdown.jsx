import React from 'react';
import { FINALS, daysUntil } from '../data/constants.js';

// ข้อความวันเหลือ — คืน null ถ้าสอบผ่านไปแล้ว
function fmtDays(n) {
  if (n > 1) return 'อีก ' + n + ' วัน';
  if (n === 1) return 'พรุ่งนี้!';
  if (n === 0) return 'วันนี้!';
  return null;
}

// การ์ดนับถอยหลังสอบไฟนอล — โชว์วิชาถัดไปตัวใหญ่ + วิชาที่เหลือ
// ซ่อนตัวเองอัตโนมัติเมื่อสอบครบทุกวิชาแล้ว (ไม่ต้องมาลบทีหลัง)
export default function ExamCountdown() {
  const upcoming = FINALS.filter((e) => daysUntil(e.date) >= 0);
  if (!upcoming.length) return null;

  const next = upcoming[0];
  return (
    <div className="cd-card exam-cd">
      <div className="cd-head">
        <div className="ml-eyebrow"><span className="dot dot-exam" />นับถอยหลังสอบกลางภาค</div>
      </div>

      <div className="exam-next">
        <div className="exam-next-label">สอบถัดไป</div>
        <div className="exam-next-days">{fmtDays(daysUntil(next.date))}</div>
        <div className="exam-next-name">{next.subject}</div>
        <div className="exam-next-meta">{next.label} · {next.time} · ห้อง {next.room}</div>
      </div>

      {upcoming.length > 1 && (
        <div className="exam-list">
          {upcoming.slice(1).map((e) => (
            <div className="exam-row" key={e.date}>
              <span className="exam-row-name">{e.subject}</span>
              <span className="exam-row-days mono">{fmtDays(daysUntil(e.date))}</span>
            </div>
          ))}
        </div>
      )}

      <div className="cd-note">กลางภาค 17–23 ส.ค. · เหลือ {upcoming.length}/{FINALS.length} วิชา · สอบทุกวัน</div>
    </div>
  );
}
