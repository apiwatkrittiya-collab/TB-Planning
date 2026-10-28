// ============ UI helpers & components ============

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function badge(text) {
  if (!text) return '';
  const t = String(text);
  let cls = 'gray';
  if (/(🚨|🔴|ผิดแผน|ไม้ขาด|เครื่องเสีย|งานเคลม|โหลดเกิน|กำลังซ่อม|ด่วนวิกฤต|เลื่อนส่ง|เสีย!)/.test(t)) cls = 'red';
  else if (/(🟠|🟡|🌅|⏳|รออบ|รอสั่งซื้อ|รอไม้|ซ่อมบางช่วง|งานค้าง|รอเปิด|งานซ่อม|วางแผนซ่อม)/.test(t)) cls = 'amber';
  else if (/(🔵|🟣|🔨|♨️|📋|กำลังผลิต|กำลังแปรรูป|กำลังประกอบ|ลงแผน|เปิด WO ครบ|งานเสริม)/.test(t)) cls = 'blue';
  else if (/(🟢|✅|🚚|ไม้พร้อม|พร้อมตอก|พร้อมจัดส่ง|จัดส่ง|ครบตาม|เสร็จครบ|ตามแผน|ปกติ|ซ่อมเสร็จ|เรียบร้อย)/.test(t)) cls = 'green';
  return '<span class="badge ' + cls + '">' + esc(t) + '</span>';
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), 2200);
}

function modal(title, bodyHtml, opt) {
  opt = opt || {};
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = bodyHtml;
  const m = $('#modal');
  m.querySelector('.modal').className = 'modal' + (opt.lg ? ' modal-lg' : '');
  m.classList.remove('hidden');
}
function closeModal() { $('#modal').classList.add('hidden'); }

function tableHtml(headers, rowsHtml, { empty = 'ไม่มีข้อมูล', frozen } = {}) {
  const head = '<thead><tr>' + headers.map(h => '<th>' + h + '</th>').join('') + '</tr></thead>';
  const body = rowsHtml || '<tr><td colspan="' + headers.length + '" class="empty">' + empty + '</td></tr>';
  return '<div class="table-wrap"><table>' + head + '<tbody>' + body + '</tbody></table></div>';
}

function statCards(cards) {
  return '<div class="stats-grid">' + cards.map(c =>
    '<div class="stat-card"><div class="label">' + c.label + '</div>' +
    '<div class="value">' + c.value + '</div>' +
    (c.accent ? '<div class="accent ' + (c.accentCls || '') + '">' + c.accent + '</div>' : '') +
    '</div>'
  ).join('') + '</div>';
}

// dropdown option builder from list, marks selected
function opts(list, selected, placeholder) {
  let h = placeholder ? '<option value="">' + esc(placeholder) + '</option>' : '';
  list.forEach(item => {
    h += '<option value="' + esc(item) + '"' + (item === selected ? ' selected' : '') + '>' + esc(item) + '</option>';
  });
  return h;
}

function sectionCard(title, innerHtml, actionsHtml) {
  return '<div class="section-card"><div class="section-head"><h2>' + title + '</h2>' +
    (actionsHtml || '') + '</div>' + innerHtml + '</div>';
}
