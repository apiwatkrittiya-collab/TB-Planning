// ============ Views: แดชบอร์ด 4 หน้า + ฮีตแมป/ปฏิทิน ============

function genDates(start, n) {
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(addDays(start, i));
  return arr;
}

// ---------- 1 แดชบอร์ดบริหาร ----------
function renderDashboard() {
  const wo = DB.wo;
  const verdicts = wo.map((w, i) => woPlanVerdict(i));
  const onPlan = verdicts.filter(v => v.includes('ตามแผน') || v.includes('เสร็จครบ')).length;
  const offPlan = verdicts.filter(v => v.includes('ผิดแผน')).length;
  const waitWood = wo.filter(w => w.wood !== '🟢 ไม้พร้อม').length;
  const critical = wo.filter(w => w.priority.includes('ด่วนวิกฤต') || w.type.includes('เคลม')).length;
  const fgTotal = round2(wo.reduce((s, w) => s + (Number(w.qty) || 0) * fgPerUnit(w.product), 0));
  const rawTotal = round2(wo.reduce((s, w) => s + (Number(w.qty) || 0) * rawPerUnit(w.product), 0));
  const extraTotal = round2(DB.procLogs.reduce((s, l) => s + (Number(l.extra) || 0), 0));
  const otTotal = round1(DB.procLogs.reduce((s, l) => s + (Number(l.ot) || 0), 0) + DB.assyLogs.reduce((s, l) => s + (Number(l.ot) || 0), 0));

  const kpi = statCards([
    { label: '🟢 ตามแผน/เสร็จครบ', value: onPlan, accent: 'ใบงานในแผน', accentCls: 'green' },
    { label: '🔴 ผิดแผน/ติดปัญหา', value: offPlan, accent: 'ต้องเร่งจัดการ', accentCls: 'red' },
    { label: '🟠 รอไม้ดิบ/รออบ KD', value: waitWood, accent: 'ใบงานรอไม้', accentCls: 'amber' },
    { label: '🚨 ด่วนวิกฤต + เคลม', value: critical, accent: critical ? 'ต้องการความสนใจ!' : 'ไม่มีงานเร่งด่วน ✓', accentCls: critical ? 'red' : 'green' },
    { label: '📦 คิวไม้สำเร็จ (FG m³)', value: fmtM3(fgTotal), accent: 'รวมทุก WO', accentCls: 'blue' },
    { label: '🌲 คิวไม้ดิบ (Raw m³)', value: fmtM3(rawTotal), accent: 'รวมทุก WO', accentCls: 'blue' },
    { label: '🪵 เบิกไม้เพิ่มจริง (m³)', value: fmtM3(extraTotal), accent: 'หน้างาน', accentCls: 'amber' },
    { label: '⏱️ ชม. OT หน้างาน', value: otTotal, accent: 'แปรรูป+ประกอบ', accentCls: 'amber' },
  ]);

  // Customer summary
  const custRows = DB.settings.customers.map(c => {
    const wos = wo.filter(w => w.customer === c);
    if (wos.length === 0) return '';
    const ord = wos.reduce((s, w) => s + (Number(w.qty) || 0), 0);
    const done = wo.map((w, i) => w.customer === c ? woDoneCount(i) : 0).reduce((a, b) => a + b, 0);
    const fg = round2(wos.reduce((s, w) => s + (Number(w.qty) || 0) * fgPerUnit(w.product), 0));
    const raw = round2(wos.reduce((s, w) => s + (Number(w.qty) || 0) * rawPerUnit(w.product), 0));
    return '<tr><td><b>' + esc(c) + '</b></td><td class="num">' + wos.length + '</td><td class="num">' + fmtNum(ord) + '</td><td class="num">' + fmtNum(done) + '</td><td class="num">' + fmtNum(Math.max(0, ord - done)) + '</td><td class="num">' + fmtM3(fg) + '</td><td class="num">' + fmtM3(raw) + '</td></tr>';
  }).join('');

  // Work group summary
  const grpRows = DB.settings.workGroups.map(g => {
    const wos = wo.filter(w => productByName(w.product)?.group === g);
    const ord = wos.reduce((s, w) => s + (Number(w.qty) || 0), 0);
    const raw = round2(wos.reduce((s, w) => s + (Number(w.qty) || 0) * rawPerUnit(w.product), 0));
    return '<tr><td><b>' + esc(g) + '</b></td><td class="num">' + wos.length + '</td><td class="num">' + fmtNum(ord) + '</td><td class="num">' + fmtM3(raw) + '</td></tr>';
  }).join('');

  // Reasons
  const reasonRows = DB.settings.reasons.map(r => {
    const wos = wo.filter(w => w.reason === r);
    const extra = DB.procLogs.filter(l => { const q = DB.queue[l.queueIdx]; return q && woByIndex(q.woIdx)?.reason === r; }).reduce((s, l) => s + (Number(l.extra) || 0), 0);
    const ot = DB.procLogs.filter(l => { const q = DB.queue[l.queueIdx]; return q && woByIndex(q.woIdx)?.reason === r; }).reduce((s, l) => s + (Number(l.ot) || 0), 0);
    return '<tr><td>' + badge(r) + '</td><td class="num">' + wos.length + '</td><td class="num">' + (extra ? fmtM3(extra) : '-') + '</td><td class="num">' + (ot ? ot : '-') + '</td></tr>';
  }).join('');

  // Standup: queue of refDate + leftover
  const today = DB.settings.refDate;
  const standupRows = DB.queue.map((q, i) => ({ q, i })).filter(({ q }) => q.date === today || (q.date < today && (q.qty - queueDoneQty(q)) > 0))
    .map(({ q, i }) => {
      const wo = woByIndex(q.woIdx);
      return '<tr><td>' + esc(q.date) + '</td><td class="mono">' + esc(wo ? wo.no : '') + '</td><td>' + esc(wo ? wo.customer : '') + '</td><td>' + esc(q.step) + '</td><td class="mono">' + esc(q.machine) + '</td><td class="num">' + fmtNum(q.qty) + '</td><td class="num">' + fmtNum(queueDoneQty(q)) + '</td><td class="num">' + fmtNum(Math.max(0, q.qty - queueDoneQty(q))) + '</td><td>' + badge(queueStatus(q)) + '</td></tr>';
    }).join('');

  $('#content').innerHTML = kpi + `
    <div class="two-col">
      ${sectionCard('🏢 สรุปแยกตามลูกค้า', tableHtml(['ลูกค้า','WO','สั่ง','เสร็จ','ค้าง','FG m³','Raw m³'], custRows))}
      ${sectionCard('🌲 สรุปตามกลุ่มงานไม้', tableHtml(['กลุ่มงาน','WO','ยอดสั่ง','Raw m³'], grpRows))}
    </div>
    <div class="two-col">
      ${sectionCard('🔍 วิเคราะห์สาเหตุหน้างาน', tableHtml(['สาเหตุ','WO','เบิกเพิ่ม m³','OT ชม.'], reasonRows))}
      ${sectionCard('📊 เทียบคิวไม้ FG vs Raw รายลูกค้า', barChartCust())}
    </div>
    ${sectionCard('🌅 ตารางประชุมเช้า · คิวงานวันที่ ' + esc(today) + ' และงานค้างข้ามวัน', tableHtml(['วันที่','WO','ลูกค้า','ขั้นตอน','เครื่อง','สั่ง','เสร็จ','ค้าง','สถานะ'], standupRows, { empty: 'ไม่มีคิวงานในวันที่เลือก' }))}
  `;
}

function barChartCust() {
  const rows = DB.settings.customers.map(c => {
    const wos = DB.wo.filter(w => w.customer === c);
    if (!wos.length) return null;
    return { c, fg: wos.reduce((s, w) => s + (Number(w.qty) || 0) * fgPerUnit(w.product), 0), raw: wos.reduce((s, w) => s + (Number(w.qty) || 0) * rawPerUnit(w.product), 0) };
  }).filter(Boolean);
  const max = Math.max(1, ...rows.map(r => r.raw));
  return '<div style="padding:6px 0;">' + rows.map(r =>
    '<div class="bar-row"><div class="bar-label">' + esc(r.c) + '</div>' +
    '<div class="bar-track"><div class="bar-fill" style="width:' + Math.round(r.fg / max * 100) + '%;background:#0284c7;"></div></div>' +
    '<div class="bar-val">FG ' + fmtM3(r.fg) + '</div></div>' +
    '<div class="bar-row"><div class="bar-label"></div>' +
    '<div class="bar-track"><div class="bar-fill" style="width:' + Math.round(r.raw / max * 100) + '%;background:#f59e0b;"></div></div>' +
    '<div class="bar-val">Raw ' + fmtM3(r.raw) + '</div></div>'
  ).join('') + '<div class="form-hint" style="margin-top:6px;">🔵 FG m³ &nbsp; 🟠 Raw m³</div></div>';
}

// ---------- 2 แดชบอร์ด PO/WO ----------
function renderDashPo() {
  const poNos = [...new Set(DB.po.map(p => p.poNo))];
  const totalQty = DB.po.reduce((s, p) => s + (Number(p.qty) || 0), 0);
  const opened = DB.wo.reduce((s, w) => s + (Number(w.qty) || 0), 0);
  const done = DB.wo.reduce((s, w, i) => s + woDoneCount(i), 0);

  const kpi = statCards([
    { label: '📑 จำนวนเลข PO', value: poNos.length, accentCls: 'blue' },
    { label: '🔢 ยอดสั่งรวม (ชิ้น)', value: fmtNum(totalQty), accentCls: 'blue' },
    { label: '📋 เปิด WO แล้ว', value: fmtNum(opened), accentCls: 'blue' },
    { label: '⚠️ ยังไม่เปิด WO', value: fmtNum(Math.max(0, totalQty - opened)), accentCls: 'amber' },
    { label: '✅ ผลิตเสร็จสะสม', value: fmtNum(done), accentCls: 'green' },
    { label: '⏳ ค้างส่งลูกค้า', value: fmtNum(Math.max(0, totalQty - done)), accentCls: 'amber' },
  ]);

  const rows = poNos.map(po => {
    const lines = DB.po.map((p, i) => ({ p, i })).filter(x => x.p.poNo === po);
    const cust = lines[0].p.customer;
    const qty = lines.reduce((s, x) => s + (Number(x.p.qty) || 0), 0);
    const earliest = lines.map(x => x.p.due).sort()[0];
    const doneSum = lines.reduce((s, x) => {
      return s + DB.wo.reduce((a, w, wi) => w.poId === x.i ? a + woDoneCount(wi) : a, 0);
    }, 0);
    const openSum = lines.reduce((s, x) => s + DB.wo.reduce((a, w) => w.poId === x.i ? a + (Number(w.qty) || 0) : a, 0), 0);
    const left = Math.max(0, qty - doneSum);
    let status = '✅ ครบตาม PO';
    if (left > 0 && openSum >= qty) status = '🔵 กำลังผลิต';
    else if (left > 0 && openSum > 0) status = '🟡 เปิด WO บางส่วน';
    else if (left > 0) status = '🟠 รอเปิด WO';
    return '<tr><td class="mono"><b>' + esc(po) + '</b></td><td>' + esc(cust) + '</td><td class="num">' + lines.length + '</td><td>' + esc(earliest) + '</td><td class="num">' + fmtNum(qty) + '</td><td class="num">' + fmtNum(openSum) + '</td><td class="num">' + fmtNum(doneSum) + '</td><td class="num">' + fmtNum(left) + '</td><td>' + badge(status) + '</td></tr>';
  }).join('');

  $('#content').innerHTML = kpi + `
    ${sectionCard('📑 สรุปความคืบหน้าตามเลขที่ PO', tableHtml(['เลขที่ PO','ลูกค้า','รายการ','กำหนดส่งเร็วสุด','ยอดสั่ง','เปิด WO','เสร็จ','คงเหลือ','สถานะ'], rows))}
  `;
}

// ---------- 3 แดชบอร์ดแปรรูป ----------
function renderDashProc() {
  const procMachines = DB.machines.filter(m => m.line === 'แปรรูป');
  const rawPlan = round2(DB.queue.filter(q => machineByCode(q.machine)?.line === 'แปรรูป')
    .reduce((s, q) => s + q.qty * rawPerUnit(woByIndex(q.woIdx)?.product || ''), 0));
  const rawActual = round4(DB.procLogs.reduce((s, l) => s + (Number(l.ok) || 0) * rawPerUnit(woByIndex(DB.queue[l.queueIdx]?.woIdx)?.product || '') + (Number(l.extra) || 0), 0));
  const extra = round2(DB.procLogs.reduce((s, l) => s + (Number(l.extra) || 0), 0));
  const ot = round1(DB.procLogs.reduce((s, l) => s + (Number(l.ot) || 0), 0));
  const rWood = DB.procLogs.reduce((s, l) => s + (Number(l.rWood) || 0), 0);
  const yields = DB.procLogs.map(l => { const raw = (Number(l.ok) || 0) * rawPerUnit(woByIndex(DB.queue[l.queueIdx]?.woIdx)?.product || '') + (Number(l.extra) || 0); const fg = (Number(l.ok) || 0) * fgPerUnit(woByIndex(DB.queue[l.queueIdx]?.woIdx)?.product || ''); return raw > 0 ? fg / raw : null; }).filter(x => x != null);
  const avgYield = yields.length ? yields.reduce((a, b) => a + b, 0) / yields.length : 0;

  const kpi = statCards([
    { label: '🌲 คิวไม้ดิบตามแผน (m³)', value: fmtM3(rawPlan), accentCls: 'blue' },
    { label: '🪵 ใช้จริงรวม (m³)', value: fmtM3(rawActual), accentCls: 'blue' },
    { label: '⚠️ เบิกไม้เพิ่ม (m³)', value: fmtM3(extra), accent: extra ? 'ต้องตรวจสอบ' : 'ไม่มี' , accentCls: extra ? 'amber' : 'green' },
    { label: '💎 เฉลี่ย Yield', value: (avgYield * 100).toFixed(1) + '%', accentCls: 'green' },
    { label: '⏱️ ชม. OT สะสม', value: ot, accentCls: 'amber' },
    { label: '♻️ ไม้ R/SFG (ท่อน)', value: fmtNum(rWood), accentCls: 'green' },
  ]);

  const today = DB.settings.refDate;
  const rows = procMachines.map(m => {
    const av = availHours(m.code, today);
    const sched = round2(scheduledHours(m.code, today));
    const ordered = DB.queue.filter(q => q.machine === m.code).reduce((s, q) => s + q.qty, 0);
    const done = DB.procLogs.filter(l => DB.queue[l.queueIdx]?.machine === m.code).reduce((s, l) => s + (Number(l.ok) || 0), 0);
    const ng = DB.procLogs.filter(l => DB.queue[l.queueIdx]?.machine === m.code).reduce((s, l) => s + (Number(l.ng) || 0), 0);
    const otm = DB.procLogs.filter(l => DB.queue[l.queueIdx]?.machine === m.code).reduce((s, l) => s + (Number(l.ot) || 0), 0);
    return '<tr><td class="mono"><b>' + esc(m.code) + '</b></td><td>' + esc(m.name) + '</td><td class="num">' + round2(av) + '</td><td class="num">' + sched + '</td><td class="num">' + fmtNum(ordered) + '</td><td class="num">' + fmtNum(done) + '</td><td class="num">' + fmtNum(ng) + '</td><td class="num">' + (otm || '-') + '</td></tr>';
  }).join('');

  $('#content').innerHTML = kpi + `
    ${sectionCard('⚙️ วิเคราะห์รายเครื่องจักรสายแปรรูป (17 เครื่อง) — ชม.พร้อมใช้หักซ่อม', tableHtml(['รหัส','เครื่อง','พร้อมใช้ (ชม.)','จองคิว (ชม.)','สั่ง (ชิ้น)','เสร็จ (ชิ้น)','NG','OT'], rows))}
  `;
}

// ---------- 4 แดชบอร์ดประกอบ ----------
function renderDashAssy() {
  const assyMachines = DB.machines.filter(m => m.line === 'ประกอบ');
  const jobs = DB.queue.filter(q => machineByCode(q.machine)?.line === 'ประกอบ').length;
  const ordered = DB.queue.filter(q => machineByCode(q.machine)?.line === 'ประกอบ').reduce((s, q) => s + q.qty, 0);
  const done = DB.assyLogs.reduce((s, l) => s + (Number(l.ok) || 0), 0);
  const ot = round1(DB.assyLogs.reduce((s, l) => s + (Number(l.ot) || 0), 0));
  // ready to assemble: ประกอบ queue where all proc steps of same WO done
  let ready = 0, waiting = 0;
  DB.queue.filter(q => machineByCode(q.machine)?.line === 'ประกอบ').forEach(q => {
    const woIdx = q.woIdx;
    const procSteps = DB.queue.filter(x => x.woIdx === woIdx && machineByCode(x.machine)?.line === 'แปรรูป');
    const allDone = procSteps.every(x => queueDoneQty(x) >= x.qty);
    if (allDone) ready++; else waiting++;
  });

  const kpi = statCards([
    { label: '🔨 คิวงานประกอบ (จ๊อบ)', value: jobs, accentCls: 'blue' },
    { label: '🔢 ยอดสั่งประกอบ (ใบ)', value: fmtNum(ordered), accentCls: 'blue' },
    { label: '✅ ประกอบเสร็จ (ใบ)', value: fmtNum(done), accentCls: 'green' },
    { label: '⏱️ ชม. OT สะสม', value: ot, accentCls: 'amber' },
    { label: '🟢 พร้อมตอกทันที', value: ready, accentCls: 'green' },
    { label: '🟠 ยังรอไม้แปรรูป', value: waiting, accentCls: 'amber' },
  ]);

  const rows = assyMachines.map(m => {
    const orderedM = DB.queue.filter(q => q.machine === m.code).reduce((s, q) => s + q.qty, 0);
    const doneM = DB.assyLogs.filter(l => DB.queue[l.queueIdx]?.machine === m.code).reduce((s, l) => s + (Number(l.ok) || 0), 0);
    const otm = DB.assyLogs.filter(l => DB.queue[l.queueIdx]?.machine === m.code).reduce((s, l) => s + (Number(l.ot) || 0), 0);
    return '<tr><td class="mono"><b>' + esc(m.code) + '</b></td><td>' + esc(m.name) + '</td><td class="num">' + fmtNum(orderedM) + '</td><td class="num">' + fmtNum(doneM) + '</td><td class="num">' + (otm || '-') + '</td></tr>';
  }).join('');

  const boardRows = DB.queue.filter(q => machineByCode(q.machine)?.line === 'ประกอบ').map((q, i) => {
    const wo = woByIndex(q.woIdx);
    const procSteps = DB.queue.filter(x => x.woIdx === q.woIdx && machineByCode(x.machine)?.line === 'แปรรูป');
    const allDone = procSteps.every(x => queueDoneQty(x) >= x.qty);
    return '<tr><td>' + esc(q.date) + '</td><td class="mono">' + esc(wo ? wo.no : '') + '</td><td>' + esc(wo ? wo.customer : '') + '</td><td>' + esc(q.machine) + '</td><td class="num">' + fmtNum(q.qty) + '</td><td class="num">' + fmtNum(queueDoneQty(q)) + '</td><td>' + badge(allDone ? '🟢 พร้อมตอก' : '🟠 รอไม้แปรรูป') + '</td><td>' + badge(queueStatus(q)) + '</td></tr>';
  }).join('');

  $('#content').innerHTML = kpi + `
    <div class="two-col">
      ${sectionCard('🔨 สรุปรายทีมประกอบ', tableHtml(['ทีม/เตา','ชื่อ','สั่ง (ใบ)','เสร็จ (ใบ)','OT'], rows))}
      ${sectionCard('📋 กระดานความพร้อมชุดไม้ก่อนตอก (Staging)', tableHtml(['วันที่','WO','ลูกค้า','ทีม','สั่ง','ทำได้','ความพร้อม','สถานะ'], boardRows, { empty: 'ไม่มีคิวงานประกอบ' }))}
    </div>
  `;
}

// ---------- 9 ฮีตแมปและปฏิทิน ----------
function renderHeatmap() {
  const days = genDates(DB.settings.refDate, 10);
  const rows = DB.machines.map(m => {
    return '<tr><td class="mono"><b>' + esc(m.code) + '</b></td><td>' + esc(m.name) + '</td>' +
      days.map(d => {
        const load = loadPercent(m.code, d);
        let cls = 'hm-gray', txt = '-';
        if (load >= 9.99) { cls = 'hm-red'; txt = 'เสีย'; }
        else if (load > 1) { cls = 'hm-red'; txt = Math.round(load * 100) + '%'; }
        else if (load > 0.75) { cls = 'hm-amber'; txt = Math.round(load * 100) + '%'; }
        else if (load > 0) { cls = 'hm-green'; txt = Math.round(load * 100) + '%'; }
        return '<td><div class="hm-cell ' + cls + '">' + txt + '</div></td>';
      }).join('') + '</tr>';
  }).join('');

  // Delivery calendar (next 14 days)
  const calDays = genDates(DB.settings.refDate, 14);
  const dayNames = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const calHtml = calDays.map(d => {
    const dues = DB.wo.map((w, i) => ({ w, i })).filter(({ w }) => w.due === d);
    const dow = new Date(d + 'T00:00:00').getDay();
    const cards = dues.map(({ w, i }) =>
      '<div class="cal-card"><b>' + esc(w.no) + '</b> · ' + esc(w.customer) + '<br>' + esc(w.product) + '<br>' + fmtNum(w.qty) + ' ชิ้น · ' + badge(w.status) + '</div>'
    ).join('');
    return '<div class="cal-day"><div class="cal-day-head">' + dayNames[dow] + ' ' + esc(d.slice(5)) + '</div>' + (cards || '<div class="form-hint">-</div>') + '</div>';
  }).join('');

  $('#content').innerHTML = `
    ${sectionCard('🔥 ส่วน 1: ฮีตแมปโหลดเครื่องจักรรายวัน (เทียบชม.พร้อมใช้หลังหักซ่อม · สีแดง = โหลดเกิน/เครื่องเสีย)', `
      <div class="heatmap-wrap"><table class="heatmap">
        <thead><tr><th>เครื่อง</th><th>ชื่อ</th>${days.map(d => '<th>' + esc(d.slice(5)) + '</th>').join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`)}
    ${sectionCard('🚚 ส่วน 2: ปฏิทินกำหนดส่งสินค้า 14 วันถัดไป', '<div class="cal-grid">' + calHtml + '</div>')}
  `;
}
