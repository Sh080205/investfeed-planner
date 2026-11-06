import React from 'react';
import { STATE_LABEL } from '../data/constants.js';

// ตัวบอกสถานะแบบเล็ก (แทนป้าย ⏳ PENDING เต็มแถว): ○ รอทำ · ◐ กำลังทำ · ✓ เสร็จ
// คลิกที่การ์ด/แถวเพื่อวนสถานะเหมือนเดิม — ตัวนี้แสดงผลอย่างเดียว ข้อความเต็มอยู่ใน sr-only + title
export default function StatusMark({ state = 'pending' }) {
  return (
    <span className={'status-mark ' + state} title={STATE_LABEL[state]}>
      <span aria-hidden="true">{state === 'done' ? '✓' : ''}</span>
      <span className="sr-only">{STATE_LABEL[state]}</span>
    </span>
  );
}
