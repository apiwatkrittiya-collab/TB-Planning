// ============ Views: ตั้งค่าระบบ, เครื่องจักร, แจ้งซ่อม, สินค้า FG, BOM ============

// ---------- 16 ตั้งค่าระบบ ----------
function renderSettings() {
  const s = DB.settings;
  $('#content').innerHTML = `
    ${sectionCard('⚙️ พารามิเตอร์โรงงาน', `
      <form onsubmit="submitSettings(event)">
        <div class="field-row-3">
          <div class="field"><label>ชม.ทำงานปกติ/วัน</label><input name="workHoursPerDay" type="number" step="0.01" value="${s.workHoursPerDay}"></div>
          <div class="field"><label>วันล็อกแผนล่วงหน้า (Frozen Days)</label><input name="frozenDays" type="number" value="${s.frozenDays}"></div>
          <div class="field"><label>วันอ้างอิงปัจจุบัน (Reference Date)</label><input name="refDate" type="date" value="${s.refDate}"></div>
        </div>
        <div class="field-row-3">
          <div class="field"><label>% Yield ไม้แปรรูป</label><input name="yieldWood" type="number" step="0.01" value="${s.yieldWood}"></div>
          <div class="field"><label>% Yield งานพาเลท/คอกไม้</label><input name="yieldPallet" type="number" step="0.01" value="${s.yieldPallet}"></div>
          <div class="field"><label>% Yield งานไม้อัด/เฟรม</label><input name="yieldPlywood" type="number" step="0.01" value="${s.yieldPlywood}"></div>
        </div>
        <div class="field-row">
          <div class="field"><label>ตัวคูณงานง่าย (0.8x)</label><input name="mEasy" type="number" step="0.01" value="${s.multipliers.easy}"></div>
          <div class="field"><label>ตัวคูณงานมาตรฐาน (1.0x)</label><input name="mStd" type="number" step="0.01" value="${s.multipliers.std}"></div>
          <div class="field"><label>ตัวคูณงานซับซ้อน (1.3x)</label><input name="mComplex" type="number" step="0.01" value="${s.multipliers.complex}"></div>
          <div class="field"><label>ตัวคูณงานยาก (1.6x)</label><input name="mHard" type="number" step="0.01" value="${s.multipliers.hard}"></div>
        </div>
        <div class="form-actions"><button class="btn">💾 บันทึกพารามิเตอร์</button></div>
      </form>`)}

    <div class="two-col">
      ${sectionCard('📋 รายการตัวเลือก Dropdown (1 บรรทัด = 1 ตัวเลือก)', `
        <form onsubmit="submitLists(event)">
          <div class="field"><label>ลูกค้า</label><textarea name="customers" rows="5">${esc(s.customers.join('\n'))}</textarea></div>
          <div class="field"><label>ความด่วน</label><textarea name="priorities" rows="4">${esc(s.priorities.join('\n'))}</textarea></div>
          <div class="field"><label>สถานะ WO</label><textarea name="woStatuses" rows="6">${esc(s.woStatuses.join('\n'))}</textarea></div>
          <div class="field"><label>สถานะไม้ดิบ</label><textarea name="woodStatuses" rows="4">${esc(s.woodStatuses.join('\n'))}</textarea></div>
          <div class="field"><label>ระดับความยากง่าย MTO</label><textarea name="difficulties" rows="4">${esc(s.difficulties.join('\n'))}</textarea></div>
          <div class="field"><label>สาเหตุหน้างาน</label><textarea name="reasons" rows="8">${esc(s.reasons.join('\n'))}</textarea></div>
          <div class="form-actions"><button class="btn">💾 บันทึกรายการตัวเลือก</button></div>
        </form>`)}

      ${sectionCard('⏱️ มาตรฐานเวลาผลิตตามขนาดงาน (Speed Tier)', `
        <p class="form-hint">แก้ไขได้โดยตรงที่ตารางสินค้า (คอลัมน์ "ประเภทขนาดงาน") เวลานาที/ชิ้นมีค่าเริ่มต้นตามตารางนี้:</p>
        ${tableHtml(
          ['ประเภทขนาดงาน','ผ่า (นาที/ชิ้น)','ไส (นาที/ชิ้น)','ตัด (นาที/ชิ้น)','ประกอบ (นาที/ใบ)'],
          Object.entries(s.speedTiers).map(([k, v]) =>
            '<tr><td>' + esc(k) + '</td>' + v.map(x => '<td class="num">' + x.toFixed(3) + '</td>').join('') + '</tr>'
          ).join('')
        )}`)}
    </div>
  `;
}

function submitSettings(ev) {
  ev.preventDefault();
  const f = ev.target, s = DB.settings;
  s.workHoursPerDay = Number(f.workHoursPerDay.value);
  s.frozenDays = Number(f.frozenDays.value);
  s.refDate = f.refDate.value;
  s.yieldWood = Number(f.yieldWood.value);
  s.yieldPallet = Number(f.yieldPallet.value);
  s.yieldPlywood = Number(f.yieldPlywood.value);
  s.multipliers.easy = Number(f.mEasy.value);
  s.multipliers.std = Number(f.mStd.value);
  s.multipliers.complex = Number(f.mComplex.value);
  s.multipliers.hard = Number(f.mHard.value);
  save(); toast('บันทึกพารามิเตอร์แล้ว'); renderSettings();
}

function submitLists(ev) {
  ev.preventDefault();
  const f = ev.target, s = DB.settings;
  const read = n => (f[n].value || '').split('\n').map(x => x.trim()).filter(Boolean);
  s.customers = read('customers'); s.priorities = read('priorities');
  s.woStatuses = read('woStatuses'); s.woodStatuses = read('woodStatuses');
  s.difficulties = read('difficulties'); s.reasons = read('reasons');
  save(); toast('บันทึกรายการตัวเลือกแล้ว'); renderSettings();
}

// ---------- 14 ตั้งค่าเครื่องจักร ----------
function renderMachines() {
  const list = DB.machines;
  const rows = list.map((m, i) => {
    const av = availHours(m.code, DB.settings.refDate);
    const sched = round2(scheduledHours(m.code, DB.settings.refDate));
    const load = loadPercent(m.code, DB.settings.refDate);
    const st = machineStatusOn(m.code, DB.settings.refDate);
    const loadCls = load >= 9.99 ? 'red' : (load > 1 ? 'red' : (load > 0.75 ? 'amber' : 'green'));
    return '<tr>' +
      '<td class="mono"><b>' + esc(m.code) + '</b></td>' +
      '<td>' + esc(m.name) + '</td>' +
      '<td>' + esc(m.line) + '</td>' +
      '<td>' + esc(m.step) + '</td>' +
      '<td class="num">' + fmtNum(m.setup) + '</td>' +
      '<td class="num">' + fmtNum(m.capacity) + '</td>' +
      '<td class="num">' + round2(av) + '</td>' +
      '<td class="num">' + sched + '</td>' +
      '<td>' + badge(load >= 9.99 ? '🔴 เครื่องเสีย' : Math.round(load * 100) + '%') + '</td>' +
      '<td>' + badge(st) + '</td>' +
      '<td>' + esc(m.backup) + '</td>' +
      '<td class="actions"><button class="btn small secondary" onclick="openMachineForm(' + i + ')">แก้ไข</button>' +
      '<button class="btn small danger" onclick="delMachine(' + i + ')">ลบ</button></td>' +
      '</tr>';
  }).join('');

  $('#content').innerHTML = `
    <div class="filters">
      <input type="search" id="m-search" placeholder="ค้นหารหัส/ชื่อเครื่อง..." oninput="renderMachinesFilter()">
      <select id="m-line" onchange="renderMachinesFilter()"><option value="">ทุกสายงาน</option><option>แปรรูป</option><option>ประกอบ</option></select>
      <div class="spacer"></div>
      <button class="btn" onclick="openMachineForm(-1)">＋ เพิ่มเครื่องจักร</button>
    </div>
    ${sectionCard('🔧 ทะเบียนเครื่องจักร (21 เครื่อง) · ชม.พร้อมใช้หักซ่อมวันนี้ = ' + DB.settings.refDate, tableHtml(
      ['รหัส','ชื่อเครื่องจักร','สายงาน','ขั้นตอน','Setup (นาที)','กำลังผลิต/วัน','พร้อมใช้วันนี้ (ชม.)','จองคิววันนี้ (ชม.)','โหลด','สถานะ','เครื่องสำรอง',''],
      rows
    ))}
  `;
}

function renderMachinesFilter() {
  const q = ($('#m-search')?.value || '').toLowerCase();
  const line = $('#m-line')?.value || '';
  const rows = DB.machines.map((m, i) => ({ m, i })).filter(({ m }) => {
    const mq = !q || m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q);
    const ml = !line || m.line === line;
    return mq && ml;
  }).map(({ m, i }) => {
    const av = availHours(m.code, DB.settings.refDate);
    const sched = round2(scheduledHours(m.code, DB.settings.refDate));
    const load = loadPercent(m.code, DB.settings.refDate);
    const st = machineStatusOn(m.code, DB.settings.refDate);
    return '<tr><td class="mono"><b>' + esc(m.code) + '</b></td><td>' + esc(m.name) + '</td><td>' + esc(m.line) + '</td><td>' + esc(m.step) + '</td><td class="num">' + fmtNum(m.setup) + '</td><td class="num">' + fmtNum(m.capacity) + '</td><td class="num">' + round2(av) + '</td><td class="num">' + sched + '</td><td>' + badge(load >= 9.99 ? '🔴 เครื่องเสีย' : Math.round(load * 100) + '%') + '</td><td>' + badge(st) + '</td><td>' + esc(m.backup) + '</td><td class="actions"><button class="btn small secondary" onclick="openMachineForm(' + i + ')">แก้ไข</button><button class="btn small danger" onclick="delMachine(' + i + ')">ลบ</button></td></tr>';
  }).join('');
  const tb = document.querySelector('#content .table-wrap tbody');
  if (tb) tb.innerHTML = rows || '<tr><td colspan="12" class="empty">ไม่พบข้อมูล</td></tr>';
}

function openMachineForm(i) {
  const m = i >= 0 ? DB.machines[i] : {};
  modal(m.code ? 'แก้ไขเครื่องจักร ' + m.code : 'เพิ่มเครื่องจักร', `
    <form onsubmit="submitMachine(event, ${i})">
      <div class="field-row">
        <div class="field"><label>รหัสเครื่อง</label><input name="code" required value="${esc(m.code)}"></div>
        <div class="field"><label>สายงาน</label><select name="line"><option${m.line === 'ประกอบ' ? ' selected' : ''}>แปรรูป</option><option${m.line === 'ประกอบ' ? ' selected' : ''}>ประกอบ</option></select></div>
      </div>
      <div class="field"><label>ชื่อเครื่องจักร</label><input name="name" required value="${esc(m.name)}"></div>
      <div class="field-row">
        <div class="field"><label>กลุ่มขั้นตอน</label><select name="step">${opts(DB.settings.steps, m.step, '')}</select></div>
        <div class="field"><label>เครื่องสำรองแนะนำ</label><input name="backup" value="${esc(m.backup)}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>เวลาตั้งเครื่อง Setup (นาที)</label><input name="setup" type="number" value="${m.setup || 15}"></div>
        <div class="field"><label>กำลังผลิตมาตรฐาน/วัน (ชิ้น)</label><input name="capacity" type="number" value="${m.capacity || 1000}"></div>
      </div>
      <div class="form-actions"><button type="button" class="btn secondary" onclick="closeModal()">ยกเลิก</button><button class="btn">บันทึก</button></div>
    </form>`);
}

function submitMachine(ev, i) {
  ev.preventDefault();
  const f = ev.target;
  const data = { code: f.code.value.trim(), line: f.line.value, name: f.name.value.trim(), step: f.step.value, backup: f.backup.value.trim(), setup: Number(f.setup.value), capacity: Number(f.capacity.value) };
  if (i >= 0) DB.machines[i] = data; else DB.machines.push(data);
  save(); closeModal(); toast('บันทึกเครื่องจักรแล้ว'); renderMachines();
}

function delMachine(i) {
  const m = DB.machines[i];
  if (!confirm('ลบเครื่อง ' + m.code + '? (คิวงานที่อ้างอิงจะยังอยู่)')) return;
  DB.machines.splice(i, 1); save(); toast('ลบแล้ว'); renderMachines();
}

// ---------- 15 แจ้งซ่อมเครื่องจักร ----------
function renderDowntime() {
  const rows = DB.downtime.map((d, i) => {
    const days = d.from && d.to ? Math.round((new Date(d.to) - new Date(d.from)) / 86400000) + 1 : 0;
    const total = round2((Number(d.hours) || 0) * days);
    const m = machineByCode(d.machineCode);
    return '<tr><td class="mono">REP-' + String(i + 1).padStart(3, '0') + '</td>' +
      '<td class="mono">' + esc(d.machineCode) + '</td>' +
      '<td>' + esc(m ? m.name : '') + '</td>' +
      '<td>' + esc(m ? m.line : '') + '</td>' +
      '<td>' + esc(d.from) + '</td><td>' + esc(d.to) + '</td>' +
      '<td class="num">' + fmtNum(d.hours, 2) + '</td>' +
      '<td class="num">' + days + '</td>' +
      '<td class="num">' + fmtNum(total, 2) + '</td>' +
      '<td>' + badge(d.type) + '</td>' +
      '<td>' + esc(d.assignee) + '</td>' +
      '<td>' + badge(d.status) + '</td>' +
      '<td>' + esc(d.cause) + '</td>' +
      '<td class="actions"><button class="btn small secondary" onclick="openDowntimeForm(' + i + ')">แก้ไข</button><button class="btn small danger" onclick="delDowntime(' + i + ')">ลบ</button></td></tr>';
  }).join('');

  $('#content').innerHTML = `
    <div class="filters"><div class="spacer"></div><button class="btn" onclick="openDowntimeForm(-1)">＋ บันทึกแจ้งซ่อม</button></div>
    ${sectionCard('🛠️ บันทึกช่วงวัน/ชั่วโมงที่เครื่องเสียหรือหยุดซ่อม (Downtime Log)', tableHtml(
      ['รหัสแจ้ง', 'เครื่อง', 'ชื่อเครื่อง', 'สายงาน', 'ตั้งแต่', 'ถึง', 'ชม./วัน', 'รวมวัน', 'รวมชม.', 'ประเภท', 'ผู้รับผิดชอบ', 'สถานะ', 'สาเหตุ/การแก้ไข', ''],
      rows
    ))}
  `;
}

function openDowntimeForm(i) {
  const d = i >= 0 ? DB.downtime[i] : {};
  modal('บันทึกแจ้งซ่อมเครื่องจักร', `
    <form onsubmit="submitDowntime(event, ${i})">
      <div class="field-row">
        <div class="field"><label>เครื่องจักร</label><select name="machineCode" required>${opts(DB.machines.map(m => m.code), d.machineCode)}</select></div>
        <div class="field"><label>ชม.ที่เสีย (ชม.)</label><input name="hours" type="number" step="0.1" required value="${d.hours ?? ''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>ตั้งแต่วันที่</label><input name="from" type="date" required value="${d.from || ''}"></div>
        <div class="field"><label>ถึงวันที่</label><input name="to" type="date" required value="${d.to || d.from || ''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>ประเภทการหยุด</label><select name="type">${opts(DB.settings.repairTypes, d.type)}</select></div>
        <div class="field"><label>สถานะ</label><select name="status">${opts(DB.settings.repairStatuses, d.status)}</select></div>
      </div>
      <div class="field"><label>ผู้รับผิดชอบซ่อม</label><input name="assignee" value="${esc(d.assignee)}"></div>
      <div class="field"><label>สาเหตุ/อาการเสีย และการแก้ไข</label><textarea name="cause">${esc(d.cause)}</textarea></div>
      <div class="form-actions"><button type="button" class="btn secondary" onclick="closeModal()">ยกเลิก</button><button class="btn">บันทึก</button></div>
    </form>`);
}

function submitDowntime(ev, i) {
  ev.preventDefault();
  const f = ev.target;
  const data = { machineCode: f.machineCode.value, hours: Number(f.hours.value), from: f.from.value, to: f.to.value, type: f.type.value, status: f.status.value, assignee: f.assignee.value.trim(), cause: f.cause.value.trim() };
  if (i >= 0) DB.downtime[i] = data; else DB.downtime.push(data);
  save(); closeModal(); toast('บันทึกแล้ว'); renderDowntime();
}
function delDowntime(i) { if (!confirm('ลบรายการแจ้งซ่อมนี้?')) return; DB.downtime.splice(i, 1); save(); toast('ลบแล้ว'); renderDowntime(); }

// ---------- 12 สินค้า FG ----------
function renderProducts() {
  const rows = DB.products.map((p, i) => {
    const raw = rawPerUnit(p.name);
    const bom = bomRawPerUnit(p.name);
    const t = DB.settings.speedTiers[p.tier] || [0,0,0,0];
    return '<tr><td class="mono">FG-' + String(i + 1).padStart(3, '0') + '</td>' +
      '<td>' + esc(p.name) + '</td>' +
      '<td>' + esc(p.group) + '</td>' +
      '<td>' + esc(p.size) + '</td>' +
      '<td>' + esc(p.rawWood) + '</td>' +
      '<td>' + esc(p.tier) + '</td>' +
      '<td class="num">' + fmtM3(p.fgM3) + '</td>' +
      '<td class="num">' + (p.yield * 100).toFixed(0) + '%</td>' +
      '<td class="num">' + fmtM3(raw) + '</td>' +
      '<td class="num">' + (bom > 0 ? fmtM3(bom) : '-') + '</td>' +
      '<td class="num">' + t[0].toFixed(3) + '</td><td class="num">' + t[1].toFixed(3) + '</td><td class="num">' + t[2].toFixed(3) + '</td><td class="num">' + t[3].toFixed(3) + '</td>' +
      '<td class="actions"><button class="btn small secondary" onclick="openProductForm(' + i + ')">แก้ไข</button><button class="btn small danger" onclick="delProduct(' + i + ')">ลบ</button></td></tr>';
  }).join('');

  $('#content').innerHTML = `
    <div class="filters"><input type="search" id="p-search" placeholder="ค้นหาชื่อสินค้า..." oninput="renderProductsFilter()"><div class="spacer"></div><button class="btn" onclick="openProductForm(-1)">＋ เพิ่มสินค้า FG</button></div>
    ${sectionCard('📦 ฐานข้อมูลสินค้าสำเร็จรูป (เลือก "ประเภทขนาดงาน" เพื่อดึงเวลาผลิตอัตโนมัติ)', tableHtml(
      ['รหัส','ชื่อ FG','กลุ่มงาน','ขนาดสำเร็จ','ไม้ดิบมาตรฐาน','ประเภทขนาดงาน','คิว FG m³/ชิ้น','Yield','คิวไม้ดิบ/ชิ้น','จาก BOM','ผ่า','ไส','ตัด','ประกอบ',''],
      rows
    ))}
  `;
}

function renderProductsFilter() {
  const q = ($('#p-search')?.value || '').toLowerCase();
  const rows = DB.products.map((p, i) => ({ p, i })).filter(({ p }) => !q || p.name.toLowerCase().includes(q) || p.group.toLowerCase().includes(q)).map(({ p, i }) => {
    const raw = rawPerUnit(p.name);
    const t = DB.settings.speedTiers[p.tier] || [0,0,0,0];
    return '<tr><td class="mono">FG-' + String(i + 1).padStart(3, '0') + '</td><td>' + esc(p.name) + '</td><td>' + esc(p.group) + '</td><td>' + esc(p.size) + '</td><td>' + esc(p.rawWood) + '</td><td>' + esc(p.tier) + '</td><td class="num">' + fmtM3(p.fgM3) + '</td><td class="num">' + (p.yield * 100).toFixed(0) + '%</td><td class="num">' + fmtM3(raw) + '</td><td class="num">-</td><td class="num">' + t[0].toFixed(3) + '</td><td class="num">' + t[1].toFixed(3) + '</td><td class="num">' + t[2].toFixed(3) + '</td><td class="num">' + t[3].toFixed(3) + '</td><td class="actions"><button class="btn small secondary" onclick="openProductForm(' + i + ')">แก้ไข</button><button class="btn small danger" onclick="delProduct(' + i + ')">ลบ</button></td></tr>';
  }).join('');
  const tb = document.querySelector('#content .table-wrap tbody');
  if (tb) tb.innerHTML = rows || '<tr><td colspan="15" class="empty">ไม่พบข้อมูล</td></tr>';
}

function openProductForm(i) {
  const p = i >= 0 ? DB.products[i] : {};
  modal('สินค้า FG', `
    <form onsubmit="submitProduct(event, ${i})">
      <div class="field"><label>ชื่อสินค้า FG</label><input name="name" required value="${esc(p.name)}"></div>
      <div class="field-row">
        <div class="field"><label>กลุ่มงานหลัก</label><select name="group">${opts(DB.settings.workGroups, p.group)}</select></div>
        <div class="field"><label>% Yield (ทศนิยม เช่น 0.85)</label><input name="yield" type="number" step="0.01" required value="${p.yield ?? 0.85}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>ขนาดสำเร็จ (กxยxส)</label><input name="size" value="${esc(p.size)}"></div>
        <div class="field"><label>ไม้ดิบมาตรฐาน</label><input name="rawWood" value="${esc(p.rawWood)}"></div>
      </div>
      <div class="field"><label>ประเภทขนาดงาน (ดึงเวลาผลิตอัตโนมัติ)</label><select name="tier">${opts(Object.keys(DB.settings.speedTiers), p.tier, '')}</select></div>
      <div class="field"><label>คิวไม้สำเร็จ FG (m³/ชิ้น)</label><input name="fgM3" type="number" step="0.000001" required value="${p.fgM3 ?? ''}"></div>
      <div class="form-actions"><button type="button" class="btn secondary" onclick="closeModal()">ยกเลิก</button><button class="btn">บันทึก</button></div>
    </form>`);
}

function submitProduct(ev, i) {
  ev.preventDefault();
  const f = ev.target;
  const data = { name: f.name.value.trim(), group: f.group.value, yield: Number(f.yield.value), size: f.size.value.trim(), rawWood: f.rawWood.value.trim(), tier: f.tier.value, fgM3: Number(f.fgM3.value) };
  // ensure unique name
  const dup = DB.products.find((p, idx) => p.name === data.name && idx !== i);
  if (dup) { alert('มีสินค้าชื่อ "' + data.name + '" อยู่แล้ว'); return; }
  if (i >= 0) DB.products[i] = data; else DB.products.push(data);
  save(); closeModal(); toast('บันทึกสินค้าแล้ว'); renderProducts();
}
function delProduct(i) {
  if (!confirm('ลบสินค้า "' + DB.products[i].name + '"?')) return;
  DB.products.splice(i, 1); save(); toast('ลบแล้ว'); renderProducts();
}

// ---------- 13 โครงสร้าง BOM ----------
function renderBom() {
  const prodNames = DB.products.map(p => p.name);
  const grouped = {};
  DB.bom.forEach((b, i) => { (grouped[b.product] = grouped[b.product] || []).push(i); });

  const rows = DB.bom.map((b, i) => {
    const wip = (b.t * b.w * b.l) / 1000000000;
    const total = wip * b.qty;
    const rawPerFg = b.rawM3 / b.per * b.qty;
    const yld = rawPerFg > 0 ? total / rawPerFg : 0;
    return '<tr><td class="mono">BOM-' + String(i + 1).padStart(3, '0') + '</td>' +
      '<td>' + esc(b.product) + '</td>' +
      '<td>' + esc(b.part) + '</td>' +
      '<td class="num">' + b.t + '</td><td class="num">' + b.w + '</td><td class="num">' + b.l + '</td>' +
      '<td class="num">' + b.qty + '</td>' +
      '<td class="num">' + fmtM3(wip) + '</td>' +
      '<td class="num">' + fmtM3(total) + '</td>' +
      '<td>' + esc(b.rawWood) + '</td>' +
      '<td class="num">' + fmtM3(b.rawM3) + '</td>' +
      '<td class="num">' + b.per + '</td>' +
      '<td class="num">' + fmtM3(rawPerFg) + '</td>' +
      '<td class="num">' + (yld * 100).toFixed(0) + '%</td>' +
      '<td class="actions"><button class="btn small secondary" onclick="openBomForm(' + i + ')">แก้ไข</button><button class="btn small danger" onclick="delBom(' + i + ')">ลบ</button></td></tr>';
  }).join('');

  $('#content').innerHTML = `
    <div class="filters"><div class="spacer"></div><button class="btn" onclick="openBomForm(-1)">＋ เพิ่มชิ้นส่วน BOM</button></div>
    ${sectionCard('🧩 ชิ้นส่วนย่อย WIP BOM (คำนวณคิวไม้และเวลาผลิตอัตโนมัติ)', tableHtml(
      ['รหัส','สินค้า FG แม่','ชิ้นส่วนย่อย','หนา','กว้าง','ยาว','ชิ้น/FG','คิว WIP/ชิ้น','รวม/FG','ไม้ดิบตั้งต้น','คิวท่อน','ซอยได้','ใช้/FG','Yield',''],
      rows
    ))}
  `;
}

function openBomForm(i) {
  const b = i >= 0 ? DB.bom[i] : {};
  modal('ชิ้นส่วน BOM', `
    <form onsubmit="submitBom(event, ${i})">
      <div class="field"><label>สินค้า FG แม่</label><select name="product" required>${opts(DB.products.map(p => p.name), b.product)}</select></div>
      <div class="field"><label>ชื่อชิ้นส่วนย่อย (WIP Part)</label><input name="part" required value="${esc(b.part)}"></div>
      <div class="field-row-3">
        <div class="field"><label>หนา (มม.)</label><input name="t" type="number" step="0.5" value="${b.t ?? ''}"></div>
        <div class="field"><label>กว้าง (มม.)</label><input name="w" type="number" step="0.5" value="${b.w ?? ''}"></div>
        <div class="field"><label>ยาว (มม.)</label><input name="l" type="number" step="0.5" value="${b.l ?? ''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>จำนวนชิ้น/1 FG</label><input name="qty" type="number" step="0.5" value="${b.qty ?? ''}"></div>
        <div class="field"><label>ไม้ดิบตั้งต้น</label><input name="rawWood" value="${esc(b.rawWood)}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>คิวไม้ดิบ/1 ท่อน (m³)</label><input name="rawM3" type="number" step="0.000001" value="${b.rawM3 ?? ''}"></div>
        <div class="field"><label>1 ท่อนซอยได้กี่ชิ้น WIP</label><input name="per" type="number" value="${b.per ?? ''}"></div>
      </div>
      <div class="form-actions"><button type="button" class="btn secondary" onclick="closeModal()">ยกเลิก</button><button class="btn">บันทึก</button></div>
    </form>`);
}

function submitBom(ev, i) {
  ev.preventDefault();
  const f = ev.target;
  const data = { product: f.product.value, part: f.part.value.trim(), t: Number(f.t.value), w: Number(f.w.value), l: Number(f.l.value), qty: Number(f.qty.value), rawWood: f.rawWood.value.trim(), rawM3: Number(f.rawM3.value), per: Number(f.per.value) };
  if (i >= 0) DB.bom[i] = data; else DB.bom.push(data);
  save(); closeModal(); toast('บันทึก BOM แล้ว'); renderBom();
}
function delBom(i) { if (!confirm('ลบชิ้นส่วน BOM นี้?')) return; DB.bom.splice(i, 1); save(); toast('ลบแล้ว'); renderBom(); }
