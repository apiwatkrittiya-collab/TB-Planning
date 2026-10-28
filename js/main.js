// ============ Router & Init ============

const VIEWS = {
  dashboard: { title: '📊 แดชบอร์ดบริหาร', render: renderDashboard },
  'dash-po': { title: '📑 แดชบอร์ด PO/WO', render: renderDashPo },
  'dash-proc': { title: '🪚 แดชบอร์ดแปรรูป', render: renderDashProc },
  'dash-assy': { title: '🔨 แดชบอร์ดประกอบ', render: renderDashAssy },
  po: { title: '📥 รับออเดอร์ PO', render: renderPo },
  wo: { title: '📋 ใบสั่งผลิต WO', render: renderWo },
  woodwait: { title: '🪵 สถานะรอไม้ดิบ', render: renderWoodWait },
  queue: { title: '⚙️ จัดคิวเครื่องจักร', render: renderQueue },
  heatmap: { title: '🗓️ ฮีตแมปและปฏิทิน', render: renderHeatmap },
  proc: { title: '🪚 ผลิตจริงแปรรูป', render: renderProc },
  assy: { title: '🔨 ผลิตจริงประกอบ', render: renderAssy },
  products: { title: '📦 สินค้า FG', render: renderProducts },
  bom: { title: '🧩 โครงสร้าง BOM', render: renderBom },
  machines: { title: '🔧 ตั้งค่าเครื่องจักร', render: renderMachines },
  downtime: { title: '🛠️ แจ้งซ่อมเครื่องจักร', render: renderDowntime },
  settings: { title: '⚙️ ตั้งค่าระบบ', render: renderSettings },
};

let currentView = 'dashboard';

function navigate(view) {
  if (!VIEWS[view]) view = 'dashboard';
  currentView = view;
  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  $('#page-title').textContent = VIEWS[view].title;
  $('#content').scrollTop = 0;
  try {
    VIEWS[view].render();
  } catch (e) {
    $('#content').innerHTML = '<div class="section-card"><div class="empty">เกิดข้อผิดพลาด: ' + esc(e.message) + '</div></div>';
    console.error(e);
  }
}

function exportJson() {
  const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'tbw-planning-' + DB.settings.refDate + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('ส่งออกข้อมูลแล้ว');
}

function init() {
  $('#today-date').textContent = '📅 ' + new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  $$('.nav-item').forEach(b => b.addEventListener('click', () => navigate(b.dataset.view)));
  $('#btn-reset').addEventListener('click', () => {
    if (!confirm('รีเซ็ตข้อมูลกลับเป็นชุดตัวอย่าง (ข้อมูลปัจจุบันจะหาย)?')) return;
    resetData(); toast('รีเซ็ตข้อมูลตัวอย่างแล้ว'); navigate(currentView);
  });
  $('#btn-export').addEventListener('click', exportJson);
  $('.modal-backdrop').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  navigate('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
