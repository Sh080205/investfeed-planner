// ค่าคงที่ที่ใช้ร่วมกันทั้งแอป

export const STORAGE_KEY = 'planner-v3:doc';      // ข้อมูลทั้งหมดของแอปใหม่ เก็บเป็น JSON ก้อนเดียว
export const LEGACY_PREFIX = 'mission-log-v2:';   // prefix ของ planner_v2 เดิม (ใช้ตอน migrate)

export const STATES = ['pending', 'running', 'done'];
export const STATE_LABEL = { pending: '⏳ PENDING', running: '🔄 RUNNING', done: '✅ AC' };

export const DAY_ORDER = [
  'จันทร์ MON', 'อังคาร TUE', 'พุธ WED', 'พฤหัส THU', 'ศุกร์ FRI', 'เสาร์ SAT', 'อาทิตย์ SUN',
];

// ป้ายหมวดของการ์ด (เลือกได้ในฟอร์มแก้ไข)
export const TAG_LABEL = {
  icpc: 'ICPC', ai: 'AI PROJECT', review: 'COURSE', skill: 'SKILL', plan: 'PLAN',
  fitness: 'FITNESS', road: 'ROADMAP', course: 'ELECTIVE', learn: 'FREE', class: 'CLASS',
  eng: 'ENGLISH',
};

// แผนหลัง National ของ section ICPC — รายการที่ไม่มี track จะแสดงเสมอ
export const TRACK_LABEL = {
  '': 'แผนหลัก (แสดงเสมอ)',
  qualified: 'หลัง National · ผ่านเข้า Regional',
  notq: 'หลัง National · ไม่ผ่าน',
};

/* ---------- ISO week key เช่น "2026-W27" (ใช้รีเซ็ตตารางรายสัปดาห์) ---------- */
export function isoWeekKey(dateInput = new Date()) {
  const d = new Date(Date.UTC(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate()));
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(
    ((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7
  );
  return d.getUTCFullYear() + '-W' + String(week).padStart(2, '0');
}

export function daysUntil(iso) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso + 'T00:00:00');
  return Math.round((target - today) / 86400000);
}

// ข้อความเฟสใต้ countdown — อิงระยะห่างจาก National (เส้นทางยาวสู่ ICPC 2027)
// แล้วค่อยไล่ต่อไป Bangkok Regional หลัง National ผ่านไป
export function phaseLabel(dates) {
  const dNat = daysUntil(dates.national);
  if (dNat >= 0) {
    if (dNat === 0) return '🏁 วันแข่ง National — เต็มที่!';
    if (dNat <= 7) return 'TAPER · ลดโหลด พักให้พอ';
    if (dNat <= 30) return 'GRIND · โค้งสุดท้ายก่อน National';
    if (dNat <= 100) return 'TEAM MODE · ซ้อมทีมจริงจัง';
    if (dNat <= 240) return 'RAMP-UP · เพิ่มความเข้มข้น + ตั้งทีม';
    return 'FOUNDATION · เก็บ topic หลักให้แน่น';
  }
  const dBkk = daysUntil(dates.bangkok);
  if (dBkk === 0) return '🏁 วันแข่ง Bangkok Regional!';
  if (dBkk > 0 && dBkk <= 7) return 'TAPER · ก่อน Bangkok Regional';
  if (dBkk > 0) return 'มุ่ง Bangkok Regional';
  return 'จบฤดูกาล — วางแผนรอบถัดไป';
}
