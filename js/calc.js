// ============ Business calculations ============

function productByName(name) { return DB.products.find(p => p.name === name); }
function machineByCode(code) { return DB.machines.find(m => m.code === code); }
function woByIndex(i) { return DB.wo[i]; }
function poByIndex(i) { return DB.po[i]; }

function parseDifficulty(diff) {
  if (/0\.8/.test(diff)) return DB.settings.multipliers.easy;
  if (/1\.3/.test(diff)) return DB.settings.multipliers.complex;
  if (/1\.6/.test(diff)) return DB.settings.multipliers.hard;
  return DB.settings.multipliers.std;
}

// คิวไม้ที่ต้องใช้จาก BOM (m3 ต่อ 1 ชิ้น)
function bomRawPerUnit(productName) {
  const items = DB.bom.filter(b => b.product === productName);
  if (items.length === 0) return 0;
  let sum = 0;
  items.forEach(b => { if (b.rawM3 && b.per) sum += (b.rawM3 / b.per) * b.qty; });
  return sum;
}

// คิวไม้ดิบต่อ 1 ชิ้น (จาก BOM ถ้ามี ไม่งั้น fgM3/yield)
function rawPerUnit(productName) {
  const p = productByName(productName);
  if (!p) return 0;
  const b = bomRawPerUnit(productName);
  if (b > 0) return b;
  return p.fgM3 / p.yield;
}

// fg m3 ต่อหน่วย
function fgPerUnit(productName) {
  const p = productByName(productName);
  return p ? p.fgM3 : 0;
}

// เวลาต่อชิ้น (นาที) สำหรับขั้นตอนของสินค้า × difficulty
function stepMinutes(productName, step, diff) {
  const p = productByName(productName);
  if (!p) return 0;
  const t = DB.settings.speedTiers[p.tier] || [0,0,0,0];
  let base = 0;
  if (step === '1. ผ่าไม้') base = t[0];
  else if (step === '2. ไส 4 หน้า') base = t[1];
  else if (step === '3. ตัดความยาว' || step === '4. ตัดไม้อัด' || step === '5. ตัดเต๋า') base = t[2];
  else if (step === '6. ประกอบ' || step === '7. อบ IPPC') base = t[3];
  return base * parseDifficulty(diff);
}

// ชม.คำนวณของคิวงาน = (setup + qty×min/unit)/60
function queueHoursM(q) {
  const wo = woByIndex(q.woIdx);
  const m = machineByCode(q.machine);
  const setup = m ? m.setup : 15;
  const min = stepMinutes(wo ? wo.product : '', q.step, q.diff);
  return round2((setup + q.qty * min) / 60);
}

// ชม.ที่ใช้จริง = manual ถ้ามี ไม่งั้นคำนวณ
function queueUsedHours(q) { return (q.manual !== '' && q.manual != null) ? Number(q.manual) : queueHoursM(q); }

// ชม.พร้อมใช้ของเครื่องในวันที่ (ลบ downtime)
function availHours(machineCode, date) {
  const wh = Number(DB.settings.workHoursPerDay) || 0;
  let dt = 0;
  DB.downtime.forEach(d => {
    if (d.machineCode === machineCode && d.from <= date && d.to >= date) dt += Number(d.hours) || 0;
  });
  return Math.max(0, wh - dt);
}

// รวมชม.ที่จัดคิวของเครื่องในวัน
function scheduledHours(machineCode, date) {
  return DB.queue.filter(q => q.machine === machineCode && q.date === date)
    .reduce((s, q) => s + queueUsedHours(q), 0);
}

function loadPercent(machineCode, date) {
  const av = availHours(machineCode, date);
  if (av <= 0) return 9.99;
  return scheduledHours(machineCode, date) / av;
}

function machineStatusOn(machineCode, date) {
  const wh = Number(DB.settings.workHoursPerDay) || 0;
  const dt = DB.downtime.filter(d => d.machineCode === machineCode && d.from <= date && d.to >= date)
    .reduce((s, d) => s + (Number(d.hours) || 0), 0);
  if (dt >= wh) return '🔴 เครื่องเสียเต็มวัน';
  if (dt > 0) return '🟠 ซ่อมบางช่วง (เหลือ ' + round1(wh - dt) + ' ชม.)';
  return '🟢 ปกติ';
}

// ---- Production aggregations ----

// ยอดผลิตเสร็จของ WO (ประกอบ → ใช้ assy; แปรรูป → ใช้ proc สูงสุด)
function woDoneCount(woIdx) {
  const wo = woByIndex(woIdx);
  if (!wo) return 0;
  const group = productByName(wo.product)?.group;
  if (group === 'พาเลท/คอกไม้') {
    return DB.assyLogs.filter(a => { const q = DB.queue[a.queueIdx]; return q && q.woIdx === woIdx && q.step === '6. ประกอบ'; })
      .reduce((s, a) => s + (Number(a.ok) || 0), 0);
  }
  const oks = DB.procLogs.filter(a => { const q = DB.queue[a.queueIdx]; return q && q.woIdx === woIdx; })
    .map(a => Number(a.ok) || 0);
  return oks.length ? Math.max(...oks) : 0;
}

// เบิกไม้เพิ่มสะสม (WO)
function woExtraWood(woIdx) {
  return DB.procLogs.filter(a => { const q = DB.queue[a.queueIdx]; return q && q.woIdx === woIdx; })
    .reduce((s, a) => s + (Number(a.extra) || 0), 0);
}

// OT สะสม (WO) ทั้งแปรรูป + ประกอบ
function woOtHours(woIdx) {
  const p = DB.procLogs.filter(a => { const q = DB.queue[a.queueIdx]; return q && q.woIdx === woIdx; })
    .reduce((s, a) => s + (Number(a.ot) || 0), 0);
  const c = DB.assyLogs.filter(a => { const q = DB.queue[a.queueIdx]; return q && q.woIdx === woIdx; })
    .reduce((s, a) => s + (Number(a.ot) || 0), 0);
  return round1(p + c);
}

function woLeftToMake(woIdx) {
  const wo = woByIndex(woIdx);
  if (!wo) return 0;
  return Math.max(0, (Number(wo.qty) || 0) - woDoneCount(woIdx));
}

// วันเริ่มผ่าช้าสุด (backtrack) = due − ceil(raw/4) − 1
function woStartLatest(woIdx) {
  const wo = woByIndex(woIdx);
  if (!wo || !wo.due) return '';
  const raw = (Number(wo.qty) || 0) * rawPerUnit(wo.product);
  const days = Math.max(1, Math.ceil(raw / 4));
  return addDays(wo.due, -(days + 1));
}

// วันนัดส่งเร็วสุดของ PO (จาก WO ที่อ้างอิง)
function poEarliestDue(poIdx) {
  const dues = DB.wo.filter(w => w.poId === poIdx && w.due).map(w => w.due);
  return dues.length ? dues.sort()[0] : '';
}

// ---- Status calculators (ฟันธงแผน) ----
function woPlanVerdict(woIdx) {
  const wo = woByIndex(woIdx);
  if (!wo) return '';
  const left = woLeftToMake(woIdx);
  const today = DB.settings.refDate;
  if (left === 0) return '✅ เสร็จครบตามแผน';
  if (wo.due < today) return '🔴 ผิดแผน (เลยกำหนดส่ง)';
  if (wo.wood !== '🟢 ไม้พร้อม') return '🟠 ผิดแผน (ติดปัญหาไม้ดิบ)';
  if (woExtraWood(woIdx) > 0 || woOtHours(woIdx) > 0) return '🔵 ตามแผน (มี OT/เบิกไม้เพิ่ม)';
  return '🟢 ตามแผนปกติ';
}

// สถานะ PO (ต่อบรรทัด)
function poLineStatus(poIdx) {
  const po = poByIndex(poIdx);
  if (!po) return '';
  const wos = DB.wo.filter(w => w.poId === poIdx);
  const opened = wos.reduce((s, w) => s + (Number(w.qty) || 0), 0);
  const done = wos.reduce((s, w, i) => s + woDoneCount(DB.wo.indexOf(w)), 0);
  if (done >= po.qty) return '✅ ครบตาม PO';
  if (opened >= po.qty) return '🔵 เปิด WO ครบแล้ว';
  if (opened > 0) return '🟡 เปิด WO บางส่วน';
  return '🟠 รอเปิด WO';
}

// คิวงาน status
function queueStatus(q) {
  const done = queueDoneQty(q);
  if (loadPercent(q.machine, q.date) >= 9.99) return '🔴 เครื่องเสีย! ต้องโยกงาน';
  if (done >= q.qty) return '✅ เสร็จครบ';
  if (q.date < DB.settings.refDate) return '🌅 งานค้างข้ามวัน';
  if (loadPercent(q.machine, q.date) > 1) return '🔴 โหลดเกินชม.';
  return '🟢 ตามแผน';
}

// ยอดทำได้จริงของคิวงาน
function queueDoneQty(q) {
  const m = machineByCode(q.machine);
  const line = m ? m.line : '';
  if (line === 'ประกอบ') {
    return DB.assyLogs.filter(a => a.queueIdx === DB.queue.indexOf(q)).reduce((s,a)=>s+(Number(a.ok)||0),0);
  }
  return DB.procLogs.filter(a => a.queueIdx === DB.queue.indexOf(q)).reduce((s,a)=>s+(Number(a.ok)||0),0);
}

// label ของคิวงาน (ป้าย 1 คลิก)
function queueLabel(q) {
  const wo = woByIndex(q.woIdx);
  const idx = DB.queue.indexOf(q);
  return 'J' + String(idx+1).padStart(3,'0');
}

// ---- Helpers ----
function round2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }
function round1(x) { return Math.round((x + Number.EPSILON) * 10) / 10; }
function round4(x) { return Math.round((x + Number.EPSILON) * 10000) / 10000; }

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function fmtNum(x, d) { const n = Number(x) || 0; return n.toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
function fmtM3(x) { return fmtNum(x, 3); }
