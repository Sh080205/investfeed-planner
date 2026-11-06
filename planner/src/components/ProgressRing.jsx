import React from 'react';

const R = 22;
const CIRC = 2 * Math.PI * R; // เส้นรอบวงของวงแหวน (ย่อจาก r=33 ให้ sidebar สั้นลง)

export default function ProgressRing({ pct, done, total }) {
  return (
    <div className="ring-card">
      <div className="ring-wrap">
        <svg width="54" height="54" viewBox="0 0 54 54" aria-hidden="true">
          <circle className="ring-bg" cx="27" cy="27" r={R} />
          <circle
            className="ring-fg"
            cx="27" cy="27" r={R}
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
