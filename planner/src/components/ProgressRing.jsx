import React from 'react';

const CIRC = 207; // เส้นรอบวง r=33 (ค่าเดียวกับ v2)

export default function ProgressRing({ pct, done, total }) {
  return (
    <div className="ring-card">
      <div className="ring-wrap">
        <svg width="78" height="78" viewBox="0 0 78 78">
          <circle className="ring-bg" cx="39" cy="39" r="33" />
          <circle
            className="ring-fg"
            cx="39" cy="39" r="33"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC - (CIRC * pct) / 100}
          />
        </svg>
        <div className="ring-label">{pct}%</div>
      </div>
      <div className="ring-caption">
        ความคืบหน้ารวม<br />
        <b>{done}/{total}</b> งาน
      </div>
    </div>
  );
}
