// ============ Views: PO, WO, คิวเครื่องจักร, ผลิตจริง, รอไม้ดิบ ============

// ---------- 5 รับออเดอร์ PO ----------
function renderPo() {
  const rows = DB.po.map((p, i) => {
    const prod = productByName(p.product);
    const wos = DB.wo.reduce((acc, w, wi) => { if (w.poId === i) acc.push(wi); return acc; }, []);
    const opened = wos.reduce((s, wi) => s + (Number(DB.wo[wi].qty) || 0), 0);
    const done = wos.reduce((s, wi) => s + woDoneCount(wi), 0);
    const pending = Math.max(0, (Number(p.qty) || 0) - done);
    return '<tr><td class="mono">P' + String(i + 1).padStart(2, '0') + '</td>' +
      '<td>' + esc(p.date) + '</td>' +
      '<td class="mono">' + esc(p.poNo) + '</td>' +
      '<td>' + esc(p.customer) + '</td>' +
      '<td>' + esc(p.product) + '</td>' +
      '<td>' + esc(prod ? prod.group : '') + '</td>' +
      '<td class="num">' + fmtNum(p.qty) + '</td>' +
      '<td class="num">' + fmtM3((Number(p.qty) || 0) * fgPerUnit(p.product)) + '</td>' +
      '<td class="num">' + fmtM3((Number(p.qty) || 0) * rawPerUnit(p.product)) + '</td>' +
      '<td>' + esc(p.due) + '</td>' +
      '<td class="num">' + fmtNum(opened) + '</td>' +
      '<td class="num">' + fmtNum(done) + '</td>' +
      '<td class="num">' + fmtNum(pending) + '</td>' +
      '<td>' + badge(poLineStatus(i)) + '</td>' +
      '<td>' + esc(p.note) + '</td>' +
      '<td class="actions"><button class="btn small secondary" onclick="openPoForm(' + i + ')">แก้ไข</button>' +
      (pending > 0 ? '<button class="btn small green" onclick="openWoFromPo(' + i + ')">＋เปิด WO</button>' : '') +
      '<button class="btn small danger" onclick="delPo(' + i + ')">ลบ</button></td></tr>';
  }).join('');

  $('#content').innerHTML = `
    <div class="filters">
      <input type="search" id="po-search" placeholder="ค้นหาเลข PO / สินค้า / ลูกค้า..." oninput="filterPo()">
      <select id="po-cust" onchange="filterPo()">${opts(DB.settings.customers, '', 'ทุกลูกค้า')}</select>
      <select id="po-status" onchange="filterPo()"><option value="">ทุกสถานะ</option><option>รอเปิด WO</option><option>เปิดบางส่วน</option><option>เปิดครบ/กำลังผลิต</option><option>ครบตาม PO</option></select>
      <div class="spacer"></div><button class="btn" onclick="openPoForm(-1)">＋ เพิ่มบรรทัด PO</button>
    </div>
    ${sectionCard('📥 กระดานรับใบสั่งซื้อลูกค้า (PO)', tableHtml(
      ['#','วันที่','เลขที่ PO','ลูกค้า','สินค้า','กลุ่ม','ยอดสั่ง','FG m³','Raw m³','กำหนดส่ง','เปิด WO','เสร็จ','ค้าง','สถานะ','หมายเหตุ',''],
      rows
    ))}
  `;
}

function filterPo() {
  const q = ($('#po-search')?.value || '').toLowerCase();
  const cust = $('#po-cust')?.value || '';
  const st = $('#po-status')?.value || '';
  const rows = DB.po.map((p, i) => ({ p, i })).filter(({ p, i }) => {
    const mq = !q || p.poNo.toLowerCase().includes(q) || p.product.toLowerCase().includes(q) || p.customer.toLowerCase().includes(q);
    const mc = !cust || p.customer === cust;
    const status = poLineStatus(i);
    let ms = true;
    if (st === 'รอเปิด WO') ms = status.includes('รอเปิด');
    else if (st === 'เปิดบางส่วน') ms = status.includes('บางส่วน');
    else if (st === 'เปิดครบ/กำลังผลิต') ms = status.includes('เปิด WO ครบ');
    else if (st === 'ครบตาม PO') ms = status.includes('ครบตาม');
    return mq && mc && ms;
  }).map(({ p, i }) => {
    const prod = productByName(p.product);
    const wos = DB.wo.reduce((a, w, wi) => { if (w.poId === i) a.push(wi); return a; }, []);
    const opened = wos.reduce((s, wi) => s + (Number(DB.wo[wi].qty) || 0), 0);
    const done = wos.reduce((s, wi) => s + woDoneCount(wi), 0);
    const pending = Math.max(0, p.qty - done);
    return '<tr><td class="mono">P' + String(i + 1).padStart(2, '0') + '</td><td>' + esc(p.date) + '</td><td class="mono">' + esc(p.poNo) + '</td><td>' + esc(p.customer) + '</td><td>' + esc(p.product) + '</td><td>' + esc(prod ? prod.group : '') + '</td><td class="num">' + fmtNum(p.qty) + '</td><td class="num">' + fmtM3(p.qty * fgPerUnit(p.product)) + '</td><td class="num">' + fmtM3(p.qty * rawPerUnit(p.product)) + '</td><td>' + esc(p.due) + '</td><td class="num">' + fmtNum(opened) + '</td><td class="num">' + fmtNum(done) + '</td><td class="num">' + fmtNum(pending) + '</td><td>' + badge(poLineStatus(i)) + '</td><td>' + esc(p.note) + '</td><td class="actions"><button class="btn small secondary" onclick="openPoForm(' + i + ')">แก้ไข</button>' + (pending > 0 ? '<button class="btn small green" onclick="openWoFromPo(' + i + ')">＋เปิด WO</button>' : '') + '<button class="btn small danger" onclick="delPo(' + i + ')">ลบ</button></td></tr>';
  }).join('');
  const tb = document.querySelector('#content .table-wrap tbody');
  if (tb) tb.innerHTML = rows || '<tr><td colspan="16" class="empty">ไม่พบข้อมูล</td></tr>';
}

function openPoForm(i) {
  const p = i >= 0 ? DB.po[i] : {};
  modal('บรรทัด PO', `
    <form onsubmit="submitPo(event, ${i})">
      <div class="field-row">
        <div class="field"><label>วันที่รับ PO</label><input name="date" type="date" required value="${p.date || ''}"></div>
        <div class="field"><label>เลขที่ PO</label><input name="poNo" required value="${esc(p.poNo)}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>ลูกค้า</label><select name="customer">${opts(DB.settings.customers, p.customer)}</select></div>
        <div class="field"><label>กำหนดส่ง</label><input name="due" type="date" required value="${p.due || ''}"></div>
      </div>
      <div class="field"><label>ชื่อสินค้า</label><select name="product" required>${opts(DB.products.map(x => x.name), p.product, 'เลือกสินค้า...')}</select><div class="form-hint">ดึงขนาด / คิวไม้ / เวลาผลิตจากฐานข้อมูล FG อัตโนมัติ</div></div>
      <div class="field"><label>ยอดสั่ง (ชิ้น)</label><input name="qty" type="number" required value="${p.qty ?? ''}"></div>
      <div class="field"><label>หมายเหตุ</label><input name="note" value="${esc(p.note)}"></div>
      <div class="form-actions"><button type="button" class="btn secondary" onclick="closeModal()">ยกเลิก</button><button class="btn">บันทึก</button></div>
    </form>`);
}

function submitPo(ev, i) {
  ev.preventDefault();
  const f = ev.target;
  const data = { date: f.date.value, poNo: f.poNo.value.trim(), customer: f.customer.value, due: f.due.value, product: f.product.value, qty: Number(f.qty.value), note: f.note.value.trim() };
  if (i >= 0) DB.po[i] = data; else DB.po.push(data);
  save(); closeModal(); toast('บันทึก PO แล้ว'); renderPo();
}
function delPo(i) {
  if (!confirm('ลบบรรทัด PO นี้? (WO ที่อ้างอิงจะยังอยู่)')) return;
  DB.po.splice(i, 1);
  // fix poId references
  DB.wo.forEach(w => { if (w.poId > i) w.poId--; else if (w.poId === i) w.poId = -1; });
  save(); toast('ลบแล้ว'); renderPo();
}

// เปิด WO จาก PO
function openWoFromPo(poIdx) {
  renderWo();
  openWoForm(-1, poIdx);
}

// ---------- 6 ใบสั่งผลิต WO ----------
function renderWo() {
  const rows = DB.wo.map((w, i) => {
    const po = w.poId >= 0 ? DB.po[w.poId] : null;
    const done = woDoneCount(i);
    const left = woLeftToMake(i);
    const extra = woExtraWood(i);
    const ot = woOtHours(i);
    const start = woStartLatest(i);
    return '<tr><td class="mono">' + esc(w.no) + '</td>' +
      '<td class="mono">' + (po ? esc(po.poNo) : '-') + '</td>' +
      '<td>' + esc(po ? po.customer : w.customer) + '</td>' +
      '<td>' + esc(w.product) + '</td>' +
      '<td>' + esc(productByName(w.product)?.group || '') + '</td>' +
      '<td>' + esc(w.rawActual || (productByName(w.product)?.rawWood || '')) + '</td>' +
      '<td>' + badge(w.priority) + '</td>' +
      '<td class="num">' + fmtNum(w.qty) + '</td>' +
      '<td>' + esc(w.due) + '</td>' +
      '<td>' + esc(start) + '</td>' +
      '<td>' + badge(w.wood) + '</td>' +
      '<td class="num">' + fmtNum(done) + '</td>' +
      '<td class="num">' + fmtNum(left) + '</td>' +
      '<td>' + badge(w.status) + '</td>' +
      '<td>' + badge(woPlanVerdict(i)) + '</td>' +
      '<td class="num">' + (extra ? fmtM3(extra) : '-') + '</td>' +
      '<td class="num">' + (ot ? ot : '-') + '</td>' +
      '<td class="actions"><button class="btn small secondary" onclick="openWoForm(' + i + ')">แก้ไข</button>' +
      (left > 0 ? '<button class="btn small green" onclick="queueFromWo(' + i + ')">⚡ลงคิว</button>' : '') +
      '<button class="btn small danger" onclick="delWo(' + i + ')">ลบ</button></td></tr>';
  }).join('');

  $('#content').innerHTML = `
    <div class="filters">
      <input type="search" id="wo-search" placeholder="ค้นหาเลข WO / สินค้า / ลูกค้า..." oninput="filterWo()">
      <select id="wo-status" onchange="filterWo()"><option value="">ทุกสถานะ</option>${DB.settings.woStatuses.map(s => '<option>' + esc(s) + '</option>').join('')}</select>
      <select id="wo-wood" onchange="filterWo()"><option value="">ทุกสถานะไม้</option>${DB.settings.woodStatuses.map(s => '<option>' + esc(s) + '</option>').join('')}</select>
      <div class="spacer"></div><button class="btn" onclick="openWoForm(-1)">＋ เปิดใบสั่งผลิต WO</button>
    </div>
    ${sectionCard('📋 กระดานควบคุมใบสั่งผลิต (WO) · เบิกไม้เพิ่ม + ชม.OT ดึงจากหน้าผลิตจริงอัตโนมัติ', tableHtml(
      ['เลข WO','PO','ลูกค้า','สินค้า','กลุ่ม','ไม้ดิบ','ความด่วน','สั่ง','นัดส่ง','เริ่มผ่าช้าสุด','ไม้ว','เสร็จ','ค้าง','สถานะ','ฟันธงแผน','เบิกเพิ่ม m³','OT ชม.',''],
      rows
    ))}
  `;
}

function filterWo() {
  const q = ($('#wo-search')?.value || '').toLowerCase();
  const st = $('#wo-status')?.value || '';
  const wd = $('#wo-wood')?.value || '';
  const rows = DB.wo.map((w, i) => ({ w, i })).filter(({ w, i }) => {
    const po = w.poId >= 0 ? DB.po[w.poId] : null;
    const mq = !q || w.no.toLowerCase().includes(q) || w.product.toLowerCase().includes(q) || (po && po.customer.toLowerCase().includes(q));
    const ms = !st || w.status === st;
    const mw = !wd || w.wood === wd;
    return mq && ms && mw;
  }).map(({ w, i }) => {
    const po = w.poId >= 0 ? DB.po[w.poId] : null;
    const done = woDoneCount(i), left = woLeftToMake(i);
    return '<tr><td class="mono">' + esc(w.no) + '</td><td class="mono">' + (po ? esc(po.poNo) : '-') + '</td><td>' + esc(po ? po.customer : w.customer) + '</td><td>' + esc(w.product) + '</td><td>' + esc(productByName(w.product)?.group || '') + '</td><td>' + esc(w.rawActual || (productByName(w.product)?.rawWood || '')) + '</td><td>' + badge(w.priority) + '</td><td class="num">' + fmtNum(w.qty) + '</td><td>' + esc(w.due) + '</td><td>' + esc(woStartLatest(i)) + '</td><td>' + badge(w.wood) + '</td><td class="num">' + fmtNum(done) + '</td><td class="num">' + fmtNum(left) + '</td><td>' + badge(w.status) + '</td><td>' + badge(woPlanVerdict(i)) + '</td><td class="num">' + (woExtraWood(i) ? fmtM3(woExtraWood(i)) : '-') + '</td><td class="num">' + (woOtHours(i) ? woOtHours(i) : '-') + '</td><td class="actions"><button class="btn small secondary" onclick="openWoForm(' + i + ')">แก้ไข</button>' + (left > 0 ? '<button class="btn small green" onclick="queueFromWo(' + i + ')">⚡ลงคิว</button>' : '') + '<button class="btn small danger" onclick="delWo(' + i + ')">ลบ</button></td></tr>';
  }).join('');
  const tb = document.querySelector('#content .table-wrap tbody');
  if (tb) tb.innerHTML = rows || '<tr><td colspan="18" class="empty">ไม่พบข้อมูล</td></tr>';
}

function openWoForm(i, presetPoIdx) {
  const w = i >= 0 ? DB.wo[i] : {};
  const poIdx = (w.poId >= 0 ? w.poId : (presetPoIdx != null ? presetPoIdx : -1));
  const poOptions = '<option value="">เลือกอ้างอิง PO...</option>' + DB.po.map((p, idx) => '<option value="' + idx + '"' + (poIdx === idx ? ' selected' : '') + '>' + esc('P' + String(idx + 1).padStart(2, '0') + ' | ' + p.poNo + ' | ' + p.customer + ' | ' + p.product) + '</option>').join('');
  modal('ใบสั่งผลิต WO', `
    <form onsubmit="submitWo(event, ${i})">
      <div class="field-row">
        <div class="field"><label>เลขที่ WO</label><input name="no" required value="${esc(w.no)}"></div>
        <div class="field"><label>อ้างอิงบรรทัด PO</label><select name="poId" onchange="woAutoFill(this.value)">${poOptions}</select></div>
      </div>
      <div class="field-row">
        <div class="field"><label>ลูกค้า (Auto/ปรับได้)</label><input name="customer" value="${esc(w.customer)}"></div>
        <div class="field"><label>ชื่อสินค้า</label><select name="product">${opts(DB.products.map(x => x.name), w.product, 'เลือก...')}</select></div>
      </div>
      <div class="field-row">
        <div class="field"><label>ความด่วน</label><select name="priority">${opts(DB.settings.priorities, w.priority)}</select></div>
        <div class="field"><label>ประเภทงาน</label><select name="type">${opts(DB.settings.woTypes, w.type)}</select></div>
      </div>
      <div class="field-row">
        <div class="field"><label>ยอดสั่งผลิต WO</label><input name="qty" type="number" required value="${w.qty ?? ''}"></div>
        <div class="field"><label>วันนัดส่ง</label><input name="due" type="date" required value="${w.due || ''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>สถานะไม้ดิบ</label><select name="wood">${opts(DB.settings.woodStatuses, w.wood)}</select></div>
        <div class="field"><label>สถานะ WO</label><select name="status">${opts(DB.settings.woStatuses, w.status)}</select></div>
      </div>
      <div class="field-row">
        <div class="field"><label>ไม้ดิบใช้จริง (พิมพ์ทับถ้าใช้ไม้อื่นในลาน)</label><input name="rawActual" value="${esc(w.rawActual)}"></div>
        <div class="field"><label>สาเหตุหน้างาน</label><select name="reason">${opts(DB.settings.reasons, w.reason)}</select></div>
      </div>
      <div class="form-actions"><button type="button" class="btn secondary" onclick="closeModal()">ยกเลิก</button><button class="btn">บันทึก</button></div>
    </form>`);
}

function woAutoFill(poListVal) {
  const m = $('#modal');
  if (poListVal === '' || poListVal == null) return;
  const poIdx = parseInt(poListVal, 10);
  const po = DB.po[poIdx];
  if (!po) return;
  m.querySelector('input[name="customer"]').value = po.customer;
  m.querySelector('select[name="product"]').value = po.product;
  m.querySelector('input[name="due"]').value = po.due;
  m.querySelector('input[name="qty"]').value = po.qty;
}

function submitWo(ev, i) {
  ev.preventDefault();
  const f = ev.target;
  let poId = (f.poId.value === '') ? -1 : parseInt(f.poId.value, 10);
  const data = { no: f.no.value.trim(), poId, customer: f.customer.value.trim(), product: f.product.value, priority: f.priority.value, type: f.type.value, qty: Number(f.qty.value), due: f.due.value, wood: f.wood.value, status: f.status.value, rawActual: f.rawActual.value.trim(), reason: f.reason.value };
  if (i >= 0) DB.wo[i] = data; else DB.wo.push(data);
  save(); closeModal(); toast('บันทึก WO แล้ว'); renderWo();
}
function delWo(i) {
  if (!confirm('ลบ WO "' + DB.wo[i].no + '"?')) return;
  DB.wo.splice(i, 1);
  // fix queue.woIdx references
  DB.queue.forEach(q => { if (q.woIdx > i) q.woIdx--; });
  save(); toast('ลบแล้ว'); renderWo();
}

// ---------- 8 จัดคิวเครื่องจักร ----------
function renderQueue() {
  const rows = DB.queue.map((q, i) => {
    const wo = woByIndex(q.woIdx);
    const m = machineByCode(q.machine);
    const label = queueLabel(q);
    const hrs = round2(queueHoursM(q));
    const used = round2(queueUsedHours(q));
    const done = queueDoneQty(q);
    const left = Math.max(0, q.qty - done);
    return '<tr><td class="mono">' + label + '</td>' +
      '<td>' + esc(q.date) + '</td>' +
      '<td class="mono">' + (wo ? esc(wo.no) : '-') + '</td>' +
      '<td>' + esc(wo ? wo.customer : '') + '</td>' +
      '<td>' + esc(wo ? wo.product : '') + '</td>' +
      '<td>' + esc(q.step) + '</td>' +
      '<td class="mono">' + esc(q.machine) + '</td>' +
      '<td>' + badge(q.diff) + '</td>' +
      '<td class="num">' + fmtNum(q.qty) + '</td>' +
      '<td class="num">' + round3(stepMinutes(wo ? wo.product : '', q.step, q.diff)) + '</td>' +
      '<td class="num">' + hrs + '</td>' +
      '<td class="num">' + (q.manual !== '' && q.manual != null ? q.manual : '-') + '</td>' +
      '<td class="num">' + used + '</td>' +
      '<td class="num">' + fmtM3(q.qty * rawPerUnit(wo ? wo.product : '')) + '</td>' +
      '<td class="num">' + round2(availHours(q.machine, q.date)) + '</td>' +
      '<td class="num">' + Math.round(loadPercent(q.machine, q.date) * 100) + '%</td>' +
      '<td class="num">' + fmtNum(done) + '</td>' +
      '<td class="num">' + fmtNum(left) + '</td>' +
      '<td>' + badge(queueStatus(q)) + '</td>' +
      '<td class="actions"><button class="btn small secondary" onclick="openQueueForm(' + i + ')">แก้ไข</button><button class="btn small danger" onclick="delQueue(' + i + ')">ลบ</button></td></tr>';
  }).join('');

  $('#content').innerHTML = `
    <div class="filters">
      <input type="search" id="q-search" placeholder="ค้นหา WO / เครื่อง / สินค้า..." oninput="filterQueue()">
      <select id="q-line" onchange="filterQueue()"><option value="">ทุกสายงาน</option><option>แปรรูป</option><option>ประกอบ</option></select>
      <div class="spacer"></div>
      <button class="btn secondary" onclick="autoQueueFromWo()">⚡ แตกคิวอัตโนมัติจาก WO</button>
      <button class="btn" onclick="openQueueForm(-1)">＋ เพิ่มคิวงาน</button>
    </div>
    ${sectionCard('⚙️ กระดานจัดคิวรายเครื่อง · ชม.พร้อมใช้หักซ่อมวันนั้น · % โหลดอัตโนมัติ', tableHtml(
      ['ป้ายคิว','วันที่','WO','ลูกค้า','สินค้า','ขั้นตอน','เครื่อง','ความยาก','สั่งทำ','นาที/ชิ้น','ชม.คำนวณ','ชม.เหมา','ชม.ใช้จริง','Raw m³','พร้อมใช้','โหลด','ทำได้','ค้าง','สถานะ',''],
      rows
    ))}
  `;
}

function round3(x) { return Math.round((x + Number.EPSILON) * 1000) / 1000; }

function filterQueue() {
  const q = ($('#q-search')?.value || '').toLowerCase();
  const line = $('#q-line')?.value || '';
  const rows = DB.queue.map((x, i) => ({ x, i })).filter(({ x, i }) => {
    const wo = woByIndex(x.woIdx);
    const mq = !q || (wo && wo.no.toLowerCase().includes(q)) || x.machine.toLowerCase().includes(q) || (wo && wo.product.toLowerCase().includes(q));
    const m = machineByCode(x.machine);
    const ml = !line || (m ? m.line === line : false);
    return mq && ml;
  }).map(({ x, i }) => {
    const wo = woByIndex(x.woIdx);
    const done = queueDoneQty(x), left = Math.max(0, x.qty - done);
    return '<tr><td class="mono">' + queueLabel(x) + '</td><td>' + esc(x.date) + '</td><td class="mono">' + (wo ? esc(wo.no) : '-') + '</td><td>' + esc(wo ? wo.customer : '') + '</td><td>' + esc(wo ? wo.product : '') + '</td><td>' + esc(x.step) + '</td><td class="mono">' + esc(x.machine) + '</td><td>' + badge(x.diff) + '</td><td class="num">' + fmtNum(x.qty) + '</td><td class="num">' + round3(stepMinutes(wo ? wo.product : '', x.step, x.diff)) + '</td><td class="num">' + round2(queueHoursM(x)) + '</td><td class="num">' + (x.manual !== '' && x.manual != null ? x.manual : '-') + '</td><td class="num">' + round2(queueUsedHours(x)) + '</td><td class="num">' + fmtM3(x.qty * rawPerUnit(wo ? wo.product : '')) + '</td><td class="num">' + round2(availHours(x.machine, x.date)) + '</td><td class="num">' + Math.round(loadPercent(x.machine, x.date) * 100) + '%</td><td class="num">' + fmtNum(done) + '</td><td class="num">' + fmtNum(left) + '</td><td>' + badge(queueStatus(x)) + '</td><td class="actions"><button class="btn small secondary" onclick="openQueueForm(' + i + ')">แก้ไข</button><button class="btn small danger" onclick="delQueue(' + i + ')">ลบ</button></td></tr>';
  }).join('');
  const tb = document.querySelector('#content .table-wrap tbody');
  if (tb) tb.innerHTML = rows || '<tr><td colspan="20" class="empty">ไม่พบข้อมูล</td></tr>';
}

const STEP_DEFAULT_MACHINE = {
  '1. ผ่าไม้': 'H1', '2. ไส 4 หน้า': 'P1', '3. ตัดความยาว': 'C-01',
  '4. ตัดไม้อัด': 'PWC', '5. ตัดเต๋า': 'C-04', '6. ประกอบ': 'ASSY-1', '7. อบ IPPC': 'HT-01',
};

function queueStepsFor(wo) {
  const group = productByName(wo.product)?.group;
  if (group === 'พาเลท/คอกไม้') return ['1. ผ่าไม้', '3. ตัดความยาว', '6. ประกอบ'];
  if (group === 'ไม้อัด/เฟรม') return ['4. ตัดไม้อัด', '6. ประกอบ'];
  return ['1. ผ่าไม้', '3. ตัดความยาว'];
}

function autoQueueFromWo() {
  const scheduled = new Set(DB.queue.map(q => q.woIdx));
  let added = 0;
  DB.wo.forEach((w, i) => {
    if (woLeftToMake(i) <= 0) return;
    if (scheduled.has(i)) return;
    const steps = queueStepsFor(w);
    steps.forEach(s => {
      DB.queue.push({ date: w.due || DB.settings.refDate, woIdx: i, step: s, machine: STEP_DEFAULT_MACHINE[s], diff: '🔵 งานมาตรฐาน (1.0x)', qty: parseInt(w.qty) || 0, manual: '' });
      added++;
    });
  });
  save(); toast('แตกคิวอัตโนมัติ ' + added + ' คิวงาน'); renderQueue();
}

function queueFromWo(woIdx) {
  if (DB.queue.some(q => q.woIdx === woIdx)) { toast('WO นี้มีคิวอยู่แล้ว'); return; }
  const w = DB.wo[woIdx];
  queueStepsFor(w).forEach(s => {
    DB.queue.push({ date: w.due || DB.settings.refDate, woIdx, step: s, machine: STEP_DEFAULT_MACHINE[s], diff: '🔵 งานมาตรฐาน (1.0x)', qty: parseInt(w.qty) || 0, manual: '' });
  });
  save(); toast('ลงคิว WO ' + w.no + ' แล้ว'); renderWo();
}

function openQueueForm(i) {
  const q = i >= 0 ? DB.queue[i] : {};
  const woOpts = DB.wo.map((w, idx) => '<option value="' + idx + '"' + (q.woIdx === idx ? ' selected' : '') + '>' + esc(w.no + ' | ' + w.customer + ' | ' + w.product) + '</option>').join('');
  modal('คิวงานเครื่องจักร', `
    <form onsubmit="submitQueue(event, ${i})">
      <div class="field-row">
        <div class="field"><label>วันที่ผลิต</label><input name="date" type="date" required value="${q.date || ''}"></div>
        <div class="field"><label>WO</label><select name="woIdx" required>${woOpts}</select></div>
      </div>
      <div class="field-row">
        <div class="field"><label>ขั้นตอน</label><select name="step">${opts(DB.settings.steps, q.step)}</select></div>
        <div class="field"><label>เครื่องจักร</label><select name="machine">${opts(DB.machines.map(m => m.code), q.machine)}</select></div>
      </div>
      <div class="field-row">
        <div class="field"><label>ความยากง่าย MTO</label><select name="diff">${opts(DB.settings.difficulties, q.diff)}</select></div>
        <div class="field"><label>จำนวนสั่งทำ</label><input name="qty" type="number" required value="${q.qty ?? ''}"></div>
      </div>
      <div class="field"><label>ชม.เหมา (ว่าง = คำนวณอัตโนมัติ)</label><input name="manual" type="number" step="0.1" value="${q.manual ?? ''}"><div class="form-hint">ถ้าใส่ ระบบจะใช้ค่านี้แทนชม.คำนวณอัตโนมัติ</div></div>
      <div class="form-actions"><button type="button" class="btn secondary" onclick="closeModal()">ยกเลิก</button><button class="btn">บันทึก</button></div>
    </form>`);
}

function submitQueue(ev, i) {
  ev.preventDefault();
  const f = ev.target;
  const data = { date: f.date.value, woIdx: parseInt(f.woIdx.value, 10), step: f.step.value, machine: f.machine.value, diff: f.diff.value, qty: Number(f.qty.value), manual: f.manual.value === '' ? '' : Number(f.manual.value) };
  if (i >= 0) DB.queue[i] = data; else DB.queue.push(data);
  save(); closeModal(); toast('บันทึกคิวงานแล้ว'); renderQueue();
}
function delQueue(i) {
  if (!confirm('ลบคิวงานนี้?')) return;
  DB.queue.splice(i, 1);
  // fix log refs
  DB.procLogs.forEach(l => { if (l.queueIdx > i) l.queueIdx--; });
  DB.assyLogs.forEach(l => { if (l.queueIdx > i) l.queueIdx--; });
  save(); toast('ลบแล้ว'); renderQueue();
}

// ---------- 10 + 11 ผลิตจริง ----------
function queueOptionHtml(onlyLine, selectedIdx) {
  return DB.queue.map((q, i) => {
    const wo = woByIndex(q.woIdx);
    const m = machineByCode(q.machine);
    if (onlyLine && m && m.line !== onlyLine) return '';
    const label = queueLabel(q);
    return '<option value="' + i + '"' + (selectedIdx === i ? ' selected' : '') + '>' + esc(label + ' | ' + q.date + ' | ' + (wo ? wo.no : '') + ' | ' + q.step + ' (' + q.machine + ')') + '</option>';
  }).join('');
}

function renderProc() {
  const rows = DB.procLogs.map((l, i) => {
    const q = DB.queue[l.queueIdx];
    const wo = q ? woByIndex(q.woIdx) : null;
    const min = wo ? stepMinutes(wo.product, q.step, q.diff) : 0;
    const timeMins = Math.round((Number(l.ok) || 0) * min + (Number(l.ot) || 0) * 60);
    const raw = round4((Number(l.ok) || 0) * rawPerUnit(wo ? wo.product : '') + (Number(l.extra) || 0));
    const fg = round4((Number(l.ok) || 0) * fgPerUnit(wo ? wo.product : ''));
    const yld = raw > 0 ? fg / raw : 0;
    return '<tr><td class="mono">' + (q ? queueLabel(q) : '') + '</td>' +
      '<td>' + esc(l.date) + '</td>' +
      '<td class="mono">' + (wo ? esc(wo.no) : '') + '</td>' +
      '<td>' + esc(wo ? wo.customer : '') + '</td>' +
      '<td>' + esc(wo ? wo.product : '') + '</td>' +
      '<td>' + esc(q ? q.step : '') + '</td>' +
      '<td class="mono">' + esc(q ? q.machine : '') + '</td>' +
      '<td class="num">' + fmtNum(l.ok) + '</td>' +
      '<td class="num">' + fmtNum(l.ng || 0) + '</td>' +
      '<td class="num">' + (l.ot || 0) + '</td>' +
      '<td class="num">' + fmtNum(l.rWood || 0) + '</td>' +
      '<td class="num">' + (l.extra ? fmtM3(l.extra) : '-') + '</td>' +
      '<td class="num">' + fmtNum(timeMins) + '</td>' +
      '<td class="num">' + fmtM3(raw) + '</td>' +
      '<td class="num">' + fmtM3(fg) + '</td>' +
      '<td class="num">' + (yld * 100).toFixed(1) + '%</td>' +
      '<td>' + badge(l.reason) + '</td>' +
      '<td class="actions"><button class="btn small danger" onclick="delProcLog(' + i + ')">ลบ</button></td></tr>';
  }).join('');

  $('#content').innerHTML = `
    <div class="filters"><div class="spacer"></div><button class="btn" onclick="openProcForm()">＋ บันทึกยอดแปรรูป</button></div>
    ${sectionCard('🪚 บันทึกผลผลิตจริงสายแปรรูป (เลือกป้ายคิวงาน 1 คลิก → กรอกยอด OK)', tableHtml(
      ['ป้ายคิว','วันที่','WO','ลูกค้า','สินค้า','ขั้นตอน','เครื่อง','OK','NG','OT','ไม้ R/SFG','เบิกเพิ่ม m³','เวลาจริง(นาที)','Raw m³','FG m³','Yield','สาเหตุ',''],
      rows
    ))}
  `;
}

function openProcForm() {
  modal('บันทึกยอดผลิตแปรรูป', `
    <form onsubmit="submitProc(event)">
      <div class="field"><label>1️⃣ เลือกคิวงานแปรรูป</label><select name="queueIdx" required>${queueOptionHtml('แปรรูป')}</select></div>
      <div class="field-row">
        <div class="field"><label>วันที่ทำจริง</label><input name="date" type="date" required value="${DB.settings.refDate}"></div>
        <div class="field"><label>2️⃣ ผลิตได้งานดี OK</label><input name="ok" type="number" required value=""></div>
      </div>
      <div class="field-row">
        <div class="field"><label>ของเสีย NG</label><input name="ng" type="number" value="0"></div>
        <div class="field"><label>ชม. OT (ถ้ามี)</label><input name="ot" type="number" step="0.1" value="0"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>ไม้ R/SFG เก็บเข้ากอง (ท่อน)</label><input name="rWood" type="number" value="0"></div>
        <div class="field"><label>เบิกไม้ดิบเพิ่ม (m³)</label><input name="extra" type="number" step="0.001" value="0"></div>
      </div>
      <div class="field"><label>สาเหตุหน้างาน</label><select name="reason">${opts(DB.settings.reasons, '🟢 ตามแผนปกติ')}</select></div>
      <div class="form-actions"><button type="button" class="btn secondary" onclick="closeModal()">ยกเลิก</button><button class="btn">บันทึก</button></div>
    </form>`);
}

function submitProc(ev) {
  ev.preventDefault();
  const f = ev.target;
  DB.procLogs.push({ queueIdx: parseInt(f.queueIdx.value, 10), date: f.date.value, ok: Number(f.ok.value), ng: Number(f.ng.value || 0), ot: Number(f.ot.value || 0), rWood: Number(f.rWood.value || 0), extra: Number(f.extra.value || 0), reason: f.reason.value });
  save(); closeModal(); toast('บันทึกยอดแปรรูปแล้ว'); renderProc();
}
function delProcLog(i) { DB.procLogs.splice(i, 1); save(); toast('ลบแล้ว'); renderProc(); }

function renderAssy() {
  const rows = DB.assyLogs.map((l, i) => {
    const q = DB.queue[l.queueIdx];
    const wo = q ? woByIndex(q.woIdx) : null;
    const min = wo ? stepMinutes(wo.product, q.step, q.diff) : 0;
    const timeMins = Math.round((Number(l.ok) || 0) * min + (Number(l.ot) || 0) * 60);
    const fg = round4((Number(l.ok) || 0) * fgPerUnit(wo ? wo.product : ''));
    const m = q ? machineByCode(q.machine) : null;
    return '<tr><td class="mono">' + (q ? queueLabel(q) : '') + '</td>' +
      '<td>' + esc(l.date) + '</td>' +
      '<td class="mono">' + (wo ? esc(wo.no) : '') + '</td>' +
      '<td>' + esc(wo ? wo.customer : '') + '</td>' +
      '<td>' + esc(wo ? wo.product : '') + '</td>' +
      '<td>' + esc(q ? q.step : '') + '</td>' +
      '<td>' + esc(q ? (m.name || q.machine) : '') + '</td>' +
      '<td class="num">' + fmtNum(l.ok) + '</td>' +
      '<td class="num">' + fmtNum(l.ng || 0) + '</td>' +
      '<td class="num">' + (l.ot || 0) + '</td>' +
      '<td>' + badge(l.ippc) + '</td>' +
      '<td class="num">' + fmtNum(timeMins) + '</td>' +
      '<td class="num">' + fmtM3(fg) + '</td>' +
      '<td>' + esc(l.note) + '</td>' +
      '<td class="actions"><button class="btn small danger" onclick="delAssyLog(' + i + ')">ลบ</button></td></tr>';
  }).join('');

  $('#content').innerHTML = `
    <div class="filters"><div class="spacer"></div><button class="btn" onclick="openAssyForm()">＋ บันทึกยอดประกอบ</button></div>
    ${sectionCard('🔨 บันทึกผลผลิตจริงสายประกอบ & อบ IPPC (กรอกยอดประกอบเสร็จ 1 ช่อง)', tableHtml(
      ['ป้ายคิว','วันที่','WO','ลูกค้า','สินค้า','ขั้นตอน','ทีม/เตา','OK','NG','OT','IPPC','เวลาจริง','FG m³','หมายเหตุ',''],
      rows
    ))}
  `;
}

function openAssyForm() {
  modal('บันทึกยอดประกอบ', `
    <form onsubmit="submitAssy(event)">
      <div class="field"><label>1️⃣ เลือกคิวงานประกอบ</label><select name="queueIdx" required>${queueOptionHtml('ประกอบ')}</select></div>
      <div class="field-row">
        <div class="field"><label>วันที่ประกอบจริง</label><input name="date" type="date" required value="${DB.settings.refDate}"></div>
        <div class="field"><label>2️⃣ ประกอบเสร็จ (ใบ/ชุด)</label><input name="ok" type="number" required value=""></div>
      </div>
      <div class="field-row">
        <div class="field"><label>งานเสีย/ซ่อม NG</label><input name="ng" type="number" value="0"></div>
        <div class="field"><label>ชม. OT (ถ้ามี)</label><input name="ot" type="number" step="0.1" value="0"></div>
      </div>
      <div class="field"><label>สถานะปั๊ม IPPC / พ่นสี</label><input name="ippc" value="🟢 ปั๊มเรียบร้อย"></div>
      <div class="field"><label>หมายเหตุหน้างาน</label><input name="note" value=""></div>
      <div class="form-actions"><button type="button" class="btn secondary" onclick="closeModal()">ยกเลิก</button><button class="btn">บันทึก</button></div>
    </form>`);
}

function submitAssy(ev) {
  ev.preventDefault();
  const f = ev.target;
  DB.assyLogs.push({ queueIdx: parseInt(f.queueIdx.value, 10), date: f.date.value, ok: Number(f.ok.value), ng: Number(f.ng.value || 0), ot: Number(f.ot.value || 0), ippc: f.ippc.value.trim(), note: f.note.value.trim() });
  save(); closeModal(); toast('บันทึกยอดประกอบแล้ว'); renderAssy();
}
function delAssyLog(i) { DB.assyLogs.splice(i, 1); save(); toast('ลบแล้ว'); renderAssy(); }

// ---------- 7 สถานะรอไม้ดิบ ----------
function renderWoodWait() {
  const waiting = DB.wo.map((w, i) => ({ w, i })).filter(({ w }) => w.wood !== '🟢 ไม้พร้อม');
  const waitRows = waiting.map(({ w, i }) =>
    '<tr><td class="mono">' + esc(w.no) + '</td><td>' + esc(w.customer) + '</td><td>' + esc(w.product) + '</td>' +
    '<td>' + esc(w.rawActual || (productByName(w.product)?.rawWood || '')) + '</td>' +
    '<td class="num">' + fmtNum(w.qty) + '</td><td class="num">' + fmtM3(w.qty * rawPerUnit(w.product)) + '</td>' +
    '<td>' + esc(w.due) + '</td><td>' + badge(w.wood) + '</td><td>' + badge(w.reason) + '</td></tr>'
  ).join('');

  const stockRows = DB.woodStock.map((s, i) => {
    let demand = 0, count = 0;
    DB.wo.forEach(w => {
      const eff = w.rawActual || (productByName(w.product)?.rawWood || '');
      if (eff === s.size) { demand += w.qty * rawPerUnit(w.product); count++; }
    });
    const balance = round3((s.stock || 0) + (s.inbound || 0) - demand);
    let st = '🟢 ไม้พร้อม (สต็อกพอ)';
    if (balance < 0) st = '🔴 ไม้ขาด! ต้องสั่งซื้อเพิ่ม';
    else if (balance < demand * 0 || (s.inbound > 0 && balance < demand)) st = '🟠 รออบ KD / รอไม้เข้า';
    return '<tr><td>' + esc(s.size) + '</td>' +
      '<td class="num">' + count + '</td>' +
      '<td class="num">' + fmtM3(demand) + '</td>' +
      '<td class="num">' + fmtM3(s.stock || 0) + '</td>' +
      '<td class="num">' + fmtM3(s.inbound || 0) + '</td>' +
      '<td>' + esc(s.eta) + '</td>' +
      '<td class="num">' + fmtM3(balance) + '</td>' +
      '<td>' + badge(st) + '</td>' +
      '<td class="actions"><button class="btn small secondary" onclick="openWoodStockForm(' + i + ')">แก้ไข</button><button class="btn small danger" onclick="delWoodStock(' + i + ')">ลบ</button></td></tr>';
  }).join('');

  $('#content').innerHTML = `
    ${sectionCard('🚨 1. รายการ WO ที่กำลังรอไม้ดิบ / รออบ KD', tableHtml(
      ['WO','ลูกค้า','สินค้า','ไม้ที่ต้องใช้','ยอดสั่ง','คิวไม้ต้องใช้','นัดส่ง','สถานะไม้','สาเหตุ'],
      waitRows, { empty: '✅ ทุกใบงานมีไม้พร้อมผลิตครบ 100%' }
    ))}
    <div class="filters" style="margin-top:18px;"><div class="spacer"></div><button class="btn" onclick="openWoodStockForm(-1)">＋ เพิ่มไม้ดิบในลาน</button></div>
    ${sectionCard('🪵 2. สต็อกไม้ดิบในลาน & ดุลยภาพความพร้อม', tableHtml(
      ['ขนาดไม้ดิบ','WO ที่ใช้','คิวไม้ต้องใช้ (m³)','สต็อกหน้าลาน','ระหว่างอบ/สั่งซื้อ','ETA','ดุลยภาพ','สถานะ',''],
      stockRows
    ))}
  `;
}

function openWoodStockForm(i) {
  const s = i >= 0 ? DB.woodStock[i] : {};
  modal('ไม้ดิบในลาน', `
    <form onsubmit="submitWoodStock(event, ${i})">
      <div class="field"><label>ขนาดไม้ดิบ</label><input name="size" required value="${esc(s.size)}"></div>
      <div class="field-row">
        <div class="field"><label>สต็อกหน้าลานพร้อมใช้ (m³)</label><input name="stock" type="number" step="0.001" value="${s.stock ?? ''}"></div>
        <div class="field"><label>ระหว่างอบ KD / สั่งซื้อ (m³)</label><input name="inbound" type="number" step="0.001" value="${s.inbound ?? 0}"></div>
      </div>
      <div class="field"><label>วันที่ไม้พร้อมใช้ (ETA)</label><input name="eta" type="date" value="${s.eta || ''}"></div>
      <div class="form-actions"><button type="button" class="btn secondary" onclick="closeModal()">ยกเลิก</button><button class="btn">บันทึก</button></div>
    </form>`);
}
function submitWoodStock(ev, i) {
  ev.preventDefault();
  const f = ev.target;
  const data = { size: f.size.value.trim(), stock: Number(f.stock.value || 0), inbound: Number(f.inbound.value || 0), eta: f.eta.value };
  if (i >= 0) DB.woodStock[i] = data; else DB.woodStock.push(data);
  save(); closeModal(); toast('บันทึกแล้ว'); renderWoodWait();
}
function delWoodStock(i) { DB.woodStock.splice(i, 1); save(); toast('ลบแล้ว'); renderWoodWait(); }
