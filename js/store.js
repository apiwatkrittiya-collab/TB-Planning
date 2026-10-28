// ============ TBW Planning — Data Store (localStorage) ============
const LS_KEY = 'tbw_planning_v1';

// ---- Enums / Dropdown defaults (editable in ตั้งค่าระบบ) ----
const DEFAULTS = {
  workHoursPerDay: 7.83,
  refDate: '2026-10-22',
  frozenDays: 2,
  yieldWood: 0.85,
  yieldPallet: 0.75,
  yieldPlywood: 0.90,
  multipliers: { easy: 0.8, std: 1.0, complex: 1.3, hard: 1.6 },

  customers: ['AVU','SCMF','WGI','AMZ','SNPK','DIE','MNS','TYO','OPT','TPG','NIHON','PR','ACM'],
  priorities: ['🟢 ปกติ', '🔵 งานเสริม', '🟠 ด่วน', '🔴 ด่วนวิกฤต'],
  woStatuses: ['⚪ รอวางแผน','📋 ลงแผนแล้ว','🔵 กำลังแปรรูป','🔨 กำลังประกอบ','♨️ อบ IPPC','✅ พร้อมจัดส่ง','🚚 จัดส่งแล้ว','🔴 เลื่อนส่ง'],
  woodStatuses: ['🟢 ไม้พร้อม','🟡 รอสั่งซื้อ','🟠 รออบ KD','🔴 ไม้ขาด'],
  difficulties: ['🟢 งานง่าย/ซอยเร็ว (0.8x)','🔵 งานมาตรฐาน (1.0x)','🟠 งานซับซ้อน/ละเอียด (1.3x)','🔴 งานยากพิเศษ/คอกใหญ่ (1.6x)'],
  workGroups: ['ไม้แปรรูป','พาเลท/คอกไม้','ไม้อัด/เฟรม','ลูกเต๋า/ไม้ประกบ'],
  steps: ['1. ผ่าไม้','2. ไส 4 หน้า','3. ตัดความยาว','4. ตัดไม้อัด','5. ตัดเต๋า','6. ประกอบ','7. อบ IPPC'],
  reasons: ['🟢 ตามแผนปกติ','🟡 รอไม้ดิบเข้าลาน','🟠 ติดรออบไม้ KD','🔴 เครื่องจักรเสีย/ซ่อม','🟠 คิวงานแปรรูปแน่น (เร่ง OT)','🔴 ไม้แตก/ตาไม้หลุด (เบิกไม้เพิ่ม)','🚨 งานแก้/งานเคลมด่วนแทรก (เร่ง OT)','🟣 ลูกค้าเลื่อนรับของ'],
  woTypes: ['🟢 งานปกติ','🚨 งานเคลม','🟠 งานซ่อม'],
  repairTypes: ['🔴 เครื่องเสียฉุกเฉิน','🟠 ซ่อมต่อเนื่อง','🔵 ซ่อมบำรุงตามแผน (PM)','🟡 วางแผนซ่อม'],
  repairStatuses: ['🔴 กำลังซ่อม','🟠 ซ่อมบางช่วง','🟡 วางแผนซ่อม','✅ ซ่อมเสร็จ'],

  // Speed tiers [rip, plane, cut, assy] นาที/ชิ้น
  speedTiers: {
    '1. ไม้แปรรูปขนาดเล็ก/สั้น (<1 เมตร)': [0.080, 0.060, 0.050, 0.000],
    '2. ไม้แปรรูปขนาดกลางมาตรฐาน (1-2.5 เมตร)': [0.125, 0.100, 0.075, 0.000],
    '3. ไม้แปรรูปขนาดใหญ่/ยาวพิเศษ (>2.5 เมตร)': [0.150, 0.120, 0.100, 0.000],
    '4. ลูกเต๋าพาเลท / ไม้ท่อนประกบ': [0.080, 0.000, 0.120, 0.000],
    '5. ไม้อัดซอย / เฟรมไม้อัดประกอบ': [0.000, 0.000, 0.220, 1.200],
    '6. พาเลทไม้สนขนาดมาตรฐาน (1.5-2 นาที/ใบ)': [0.750, 0.000, 0.550, 1.800],
    '7. พาเลทรับน้ำหนักสูง / สเปคส่งออกพิเศษ': [0.900, 0.000, 0.700, 2.200],
    '8. คอกไม้สน / ลังไม้ขนาดใหญ่พิเศษ': [1.500, 0.000, 1.200, 4.500],
  },
};

// ---- Seed data ----
function seedData() {
  return {
    settings: JSON.parse(JSON.stringify(DEFAULTS)),

    machines: [
      { code:'H1', line:'แปรรูป', step:'1. ผ่าไม้', name:'Rip Saw 1 (ผ่าไม้ใหญ่ MJ3971)', setup:20, capacity:3600, backup:'H2, H3, H4' },
      { code:'H2', line:'แปรรูป', step:'1. ผ่าไม้', name:'Rip Saw 2 (ผ่าไม้ MJ350B)', setup:20, capacity:3600, backup:'H1, H3, H4' },
      { code:'H3', line:'แปรรูป', step:'1. ผ่าไม้', name:'Rip Saw 3 (ผ่าไม้ MJ350B)', setup:20, capacity:3600, backup:'H1, H2, H4' },
      { code:'H4', line:'แปรรูป', step:'1. ผ่าไม้', name:'Rip Saw 4 (ผ่าไม้ MJ350B)', setup:20, capacity:3600, backup:'H1, H2, H3' },
      { code:'P1', line:'แปรรูป', step:'2. ไส 4 หน้า', name:'Planer 4-side (เครื่องไส 4 หน้า)', setup:30, capacity:4500, backup:'H1, S-01' },
      { code:'PWC', line:'แปรรูป', step:'4. ตัดไม้อัด', name:'Plycut (ซอยไม้อัดคู่ GEWINN)', setup:20, capacity:2000, backup:'CNC-01, C-04' },
      { code:'CNC-01', line:'แปรรูป', step:'4. ตัดไม้อัด', name:'CNC Router 1', setup:25, capacity:1000, backup:'CNC-02, CNC-03' },
      { code:'CNC-02', line:'แปรรูป', step:'4. ตัดไม้อัด', name:'CNC Router 2', setup:25, capacity:1000, backup:'CNC-01, CNC-03' },
      { code:'CNC-03', line:'แปรรูป', step:'4. ตัดไม้อัด', name:'CNC Router 3', setup:25, capacity:1000, backup:'CNC-01, CNC-02' },
      { code:'CNC-04', line:'แปรรูป', step:'4. ตัดไม้อัด', name:'CNC Router 4', setup:25, capacity:1000, backup:'CNC-01, CNC-02' },
      { code:'C-01', line:'แปรรูป', step:'3. ตัดความยาว', name:'Crosscut 1 (ตัดความยาว Auto)', setup:15, capacity:9000, backup:'C-02, C-03, C-05' },
      { code:'C-02', line:'แปรรูป', step:'3. ตัดความยาว', name:'Crosscut 2 (ตัดความยาว)', setup:15, capacity:4500, backup:'C-01, C-03, C-05' },
      { code:'C-03', line:'แปรรูป', step:'3. ตัดความยาว', name:'Crosscut 3 (ตัดความยาว)', setup:15, capacity:4500, backup:'C-01, C-02, C-05' },
      { code:'C-04', line:'แปรรูป', step:'5. ตัดเต๋า', name:'Cut Block (เลื่อยตัดเต๋า SHOWA)', setup:15, capacity:3500, backup:'C-03, C-05' },
      { code:'C-05', line:'แปรรูป', step:'3. ตัดความยาว', name:'Crosscut 5 (ตัดความยาว)', setup:15, capacity:4500, backup:'C-01, C-02, C-03' },
      { code:'S-01', line:'แปรรูป', step:'ขัดไม้', name:'Sanding (เครื่องขัดไม้)', setup:15, capacity:2000, backup:'RT-01' },
      { code:'RT-01', line:'แปรรูป', step:'เซาะร่อง', name:'Router Manual', setup:15, capacity:1500, backup:'CNC-01' },
      { code:'HT-01', line:'ประกอบ', step:'7. อบ IPPC', name:'เตาอบความร้อน IPPC', setup:30, capacity:1000, backup:'อบภายนอก' },
      { code:'ASSY-1', line:'ประกอบ', step:'6. ประกอบ', name:'ทีมประกอบพาเลท 1', setup:15, capacity:250, backup:'ASSY-2, ASSY-3' },
      { code:'ASSY-2', line:'ประกอบ', step:'6. ประกอบ', name:'ทีมประกอบพาเลท 2', setup:15, capacity:250, backup:'ASSY-1, ASSY-3' },
      { code:'ASSY-3', line:'ประกอบ', step:'6. ประกอบ', name:'ทีมประกอบพาเลท 3', setup:15, capacity:250, backup:'ASSY-1, ASSY-2' },
    ],

    downtime: [
      { machineCode:'H2', from:'2026-10-22', to:'2026-10-22', hours:7.83, type:'🔴 เครื่องเสียฉุกเฉิน', assignee:'พี่หนุ่ม / พี่ภาณุ', status:'🔴 กำลังซ่อม', cause:'มอเตอร์สายพานหลักร้อนจัด รอเปลี่ยนตลับลูกปืน (เสียเต็มวัน)' },
      { machineCode:'H2', from:'2026-10-23', to:'2026-10-23', hours:3.5, type:'🟠 ซ่อมต่อเนื่องช่วงเช้า', assignee:'พี่หนุ่ม', status:'🟠 ซ่อมบางช่วง', cause:'ประกอบสายพานและเทสต์รันช่วงเช้า (บ่ายเดินเครื่องได้ปกติ)' },
      { machineCode:'CNC-04', from:'2026-10-24', to:'2026-10-24', hours:4, type:'🔵 ซ่อมบำรุงตามแผน (PM)', assignee:'พี่ภาณุ', status:'🟡 วางแผนซ่อม', cause:'ตั้งศูนย์หัวกัดและหล่อลื่นรางสไลด์ 4 ชม.' },
    ],

    products: [
      { name:'WOOD 70x90x1950 mm.', group:'ไม้แปรรูป', size:'70x90x1950', rawWood:'KD 75x100x4000', tier:'2. ไม้แปรรูปขนาดกลางมาตรฐาน (1-2.5 เมตร)', fgM3:0.012285, yield:0.85 },
      { name:'WOOD 35x70x370 mm.', group:'ไม้แปรรูป', size:'35x70x370', rawWood:'KD 40x75x4000', tier:'1. ไม้แปรรูปขนาดเล็ก/สั้น (<1 เมตร)', fgM3:0.000906, yield:0.85 },
      { name:'WOOD 90x90x3200 mm.', group:'ไม้แปรรูป', size:'90x90x3200', rawWood:'KD 100x100x3600', tier:'3. ไม้แปรรูปขนาดใหญ่/ยาวพิเศษ (>2.5 เมตร)', fgM3:0.02592, yield:0.82 },
      { name:'WOOD 22x90x2300 mm.', group:'ไม้แปรรูป', size:'22x90x2300', rawWood:'KD 25x100x4800', tier:'2. ไม้แปรรูปขนาดกลางมาตรฐาน (1-2.5 เมตร)', fgM3:0.004554, yield:0.80 },
      { name:'WOOD 22x90x3200 mm.', group:'ไม้แปรรูป', size:'22x90x3200', rawWood:'KD 25x100x3600', tier:'3. ไม้แปรรูปขนาดใหญ่/ยาวพิเศษ (>2.5 เมตร)', fgM3:0.006336, yield:0.80 },
      { name:'WOOD 22x90x2010 mm.', group:'ไม้แปรรูป', size:'22x90x2010', rawWood:'KD 25x100x4200', tier:'2. ไม้แปรรูปขนาดกลางมาตรฐาน (1-2.5 เมตร)', fgM3:0.00398, yield:0.82 },
      { name:'PALLET 1000X1200X136 mm.', group:'พาเลท/คอกไม้', size:'1000x1200x136', rawWood:'KD Set 22x90+70x90', tier:'6. พาเลทไม้สนขนาดมาตรฐาน (1.5-2 นาที/ใบ)', fgM3:0.16, yield:0.75 },
      { name:'One way Plywood Frame 15x1000x1200mm.', group:'ไม้อัด/เฟรม', size:'15x1000x1200', rawWood:'Plywood 15x1220x2440', tier:'5. ไม้อัดซอย / เฟรมไม้อัดประกอบ', fgM3:0.018, yield:0.90 },
      { name:'ไม้สนอบ - 60x90x1950 MM', group:'ไม้แปรรูป', size:'60x90x1950', rawWood:'KD 65x100x4000', tier:'2. ไม้แปรรูปขนาดกลางมาตรฐาน (1-2.5 เมตร)', fgM3:0.01053, yield:0.85 },
      { name:'ไม้สนอบ - 25x150x1330 MM', group:'ไม้แปรรูป', size:'25x150x1330', rawWood:'KD 30x155x4000', tier:'2. ไม้แปรรูปขนาดกลางมาตรฐาน (1-2.5 เมตร)', fgM3:0.004988, yield:0.85 },
      { name:'ไม้สนสด-12x150x1090 mm', group:'ไม้แปรรูป', size:'12x150x1090', rawWood:'GN 25x150x4400', tier:'2. ไม้แปรรูปขนาดกลางมาตรฐาน (1-2.5 เมตร)', fgM3:0.001962, yield:0.80 },
      { name:'ไม้สนสด-38x80x780 mm', group:'ไม้แปรรูป', size:'38x80x780', rawWood:'GN 40x85x4000', tier:'1. ไม้แปรรูปขนาดเล็ก/สั้น (<1 เมตร)', fgM3:0.002371, yield:0.82 },
      { name:'พาเลทไม้สน (SCMF) 720x1200x138 mm', group:'พาเลท/คอกไม้', size:'720x1200x138', rawWood:'KD Set SCMF Std', tier:'6. พาเลทไม้สนขนาดมาตรฐาน (1.5-2 นาที/ใบ)', fgM3:0.025, yield:0.75 },
      { name:'คอกไม้สน (SCMF) 745x3515x1130 mm', group:'พาเลท/คอกไม้', size:'745x3515x1130', rawWood:'KD Set SCMF Crate', tier:'8. คอกไม้สน / ลังไม้ขนาดใหญ่พิเศษ', fgM3:0.085, yield:0.72 },
      { name:'PALLET 1000X1200X150 MM.', group:'พาเลท/คอกไม้', size:'1000x1200x150', rawWood:'KD Set WGI Heavy', tier:'7. พาเลทรับน้ำหนักสูง / สเปคส่งออกพิเศษ', fgM3:0.031844, yield:0.75 },
      { name:'พาเลทไม้สน (MNS) 985x1050x140 mm', group:'พาเลท/คอกไม้', size:'985x1050x140', rawWood:'KD Set MNS Export', tier:'6. พาเลทไม้สนขนาดมาตรฐาน (1.5-2 นาที/ใบ)', fgM3:0.02245, yield:0.76 },
      { name:'FG-75x75x90 [เต๋าไม้อบ]', group:'ลูกเต๋า/ไม้ประกบ', size:'75x75x90', rawWood:'KD 75x75x4000', tier:'4. ลูกเต๋าพาเลท / ไม้ท่อนประกบ', fgM3:0.000506, yield:0.85 },
      { name:'ไม้ท่อนประกบ 25x150x400 MM.', group:'ลูกเต๋า/ไม้ประกบ', size:'25x150x400', rawWood:'KD 25x150x4000', tier:'4. ลูกเต๋าพาเลท / ไม้ท่อนประกบ', fgM3:0.00264, yield:0.80 },
      { name:'WOODEN PALLET 1120X1000X110 MM', group:'พาเลท/คอกไม้', size:'1120x1000x110', rawWood:'GKD 75x150x4800', tier:'6. พาเลทไม้สนขนาดมาตรฐาน (1.5-2 นาที/ใบ)', fgM3:0.02177, yield:0.75 },
      { name:'ไม้สนอบ - 27x85x1500 mm', group:'ไม้แปรรูป', size:'27x85x1500', rawWood:'KD 30x90x3000', tier:'2. ไม้แปรรูปขนาดกลางมาตรฐาน (1-2.5 เมตร)', fgM3:0.003442, yield:0.85 },
      { name:'ไม้อัดตัด Size 1100x20x15 mm', group:'ไม้อัด/เฟรม', size:'1100x20x15', rawWood:'Plywood 15x1220x2440', tier:'5. ไม้อัดซอย / เฟรมไม้อัดประกอบ', fgM3:0.00033, yield:0.90 },
    ],

    bom: [
      { product:'WOODEN PALLET 1120X1000X110 MM', part:'ไม้คานริม 75x90x1000', t:75, w:90, l:1000, qty:1.5, rawWood:'GKD 75x150x4800', rawM3:0.054, per:4 },
      { product:'WOODEN PALLET 1120X1000X110 MM', part:'ไม้คานกลาง 36x90x1000', t:36, w:90, l:1000, qty:3, rawWood:'GKD 75x150x4800', rawM3:0.054, per:8 },
      { product:'WOODEN PALLET 1120X1000X110 MM', part:'ไม้พื้นบน/ล่าง 10x100x1120', t:10, w:100, l:1120, qty:10, rawWood:'R/KD 10x100x4000', rawM3:0.004, per:3 },
      { product:'PALLET 1000X1200X150 MM.', part:'ไม้พื้นบน 22x90x1200', t:22, w:90, l:1200, qty:7, rawWood:'KD 25x100x4800', rawM3:0.012, per:4 },
      { product:'PALLET 1000X1200X150 MM.', part:'ไม้คานรับพื้น 22x90x1000', t:22, w:90, l:1000, qty:3, rawWood:'KD 25x100x4200', rawM3:0.0105, per:4 },
      { product:'PALLET 1000X1200X150 MM.', part:'ลูกเต๋าพาเลท 90x90x100', t:90, w:90, l:100, qty:9, rawWood:'KD 100x100x4000', rawM3:0.04, per:38 },
      { product:'PALLET 1000X1200X150 MM.', part:'ไม้พื้นล่าง 22x90x1200', t:22, w:90, l:1200, qty:3, rawWood:'KD 25x100x4800', rawM3:0.012, per:4 },
      { product:'พาเลทไม้สน (SCMF) 720x1200x138 mm', part:'ไม้พื้นบน/ล่าง 18x90x1200', t:18, w:90, l:1200, qty:9, rawWood:'KD 22x100x4800', rawM3:0.01056, per:4 },
      { product:'พาเลทไม้สน (SCMF) 720x1200x138 mm', part:'ไม้คาน 45x90x720', t:45, w:90, l:720, qty:3, rawWood:'KD 50x100x4000', rawM3:0.02, per:5 },
      { product:'พาเลทไม้สน (MNS) 985x1050x140 mm', part:'ไม้พื้น MNS 18x90x1050', t:18, w:90, l:1050, qty:10, rawWood:'KD 22x100x4200', rawM3:0.00924, per:4 },
      { product:'พาเลทไม้สน (MNS) 985x1050x140 mm', part:'ไม้คาน MNS 40x90x985', t:40, w:90, l:985, qty:3, rawWood:'KD 45x100x4000', rawM3:0.018, per:4 },
      { product:'One way Plywood Frame 15x1000x1200mm.', part:'แผ่นขอบเฟรมไม้อัด 15x100x1200', t:15, w:100, l:1200, qty:4, rawWood:'Plywood 15x1220x2440', rawM3:0.044652, per:24 },
      { product:'One way Plywood Frame 15x1000x1200mm.', part:'แผ่นขวางเฟรมไม้อัด 15x100x1000', t:15, w:100, l:1000, qty:4, rawWood:'Plywood 15x1220x2440', rawM3:0.044652, per:28 },
    ],

    po: [
      { date:'2026-10-15', poNo:'BP0P67331', customer:'AVU', product:'WOOD 70x90x1950 mm.', qty:100, due:'2026-10-22', note:'แพ็คมัดละ 50 ท่อน' },
      { date:'2026-10-15', poNo:'BP0P67331', customer:'AVU', product:'WOOD 35x70x370 mm.', qty:100, due:'2026-10-22', note:'มัด 3x10 ชิ้น/แถว' },
      { date:'2026-10-15', poNo:'BP0P67331', customer:'AVU', product:'WOOD 90x90x3200 mm.', qty:200, due:'2026-10-23', note:'ไม้ประกบ 2 ท่อน' },
      { date:'2026-10-16', poNo:'BP0P67162', customer:'AVU', product:'WOOD 22x90x2300 mm.', qty:900, due:'2026-10-27', note:'แบ่งส่ง 500 + 400' },
      { date:'2026-10-16', poNo:'BP0P67162', customer:'AVU', product:'WOOD 22x90x3200 mm.', qty:300, due:'2026-10-24', note:'มัดละ 300 ท่อน' },
      { date:'2026-10-17', poNo:'BP0P67758', customer:'AVU', product:'WOOD 22x90x2010 mm.', qty:600, due:'2026-10-24', note:'มัดละ 500 ท่อน' },
      { date:'2026-10-17', poNo:'BP0P67758', customer:'AVU', product:'PALLET 1000X1200X136 mm.', qty:50, due:'2026-10-24', note:'ปั๊ม IPPC 2 จุด' },
      { date:'2026-10-18', poNo:'PRPM2608-CL', customer:'ACM', product:'One way Plywood Frame 15x1000x1200mm.', qty:150, due:'2026-10-23', note:'งานเคลมด่วน เช็คฉาก' },
      { date:'2026-10-18', poNo:'26-04325', customer:'DIE', product:'ไม้สนอบ - 60x90x1950 MM', qty:340, due:'2026-10-25', note:'ความชื้นไม่เกิน 18%' },
      { date:'2026-10-18', poNo:'26-04325', customer:'DIE', product:'ไม้สนอบ - 25x150x1330 MM', qty:600, due:'2026-10-25', note:'คัดตาไม้หลุด' },
      { date:'2026-10-19', poNo:'2569/049', customer:'SNPK', product:'ไม้สนสด-12x150x1090 mm', qty:1100, due:'2026-10-24', note:'ผ่าก่อนค่อยตัด' },
      { date:'2026-10-19', poNo:'2569/049', customer:'SNPK', product:'ไม้สนสด-38x80x780 mm', qty:1070, due:'2026-10-25', note:'มัดตามสเปค' },
      { date:'2026-10-19', poNo:'PO26003103', customer:'SCMF', product:'พาเลทไม้สน (SCMF) 720x1200x138 mm', qty:30, due:'2026-10-23', note:'แผนเรียกเข้ารอบเช้า' },
      { date:'2026-10-19', poNo:'PO26003103', customer:'SCMF', product:'คอกไม้สน (SCMF) 745x3515x1130 mm', qty:8, due:'2026-10-24', note:'คอกยาวพิเศษ 3.5 ม.' },
      { date:'2026-10-20', poNo:'POL26-1236', customer:'WGI', product:'PALLET 1000X1200X150 MM.', qty:400, due:'2026-10-30', note:'พ่นสีแดง แบ่งส่ง' },
      { date:'2026-10-20', poNo:'PO-576609', customer:'MNS', product:'พาเลทไม้สน (MNS) 985x1050x140 mm', qty:270, due:'2026-10-31', note:'แบ่งส่ง 120 + 150' },
      { date:'2026-10-20', poNo:'PRPM26080004', customer:'ACM', product:'One way Plywood Frame 15x1000x1200mm.', qty:1000, due:'2026-10-27', note:'ล็อตปกติ' },
      { date:'2026-10-20', poNo:'SO26082102', customer:'PR', product:'FG-75x75x90 [เต๋าไม้อบ]', qty:2000, due:'2026-10-25', note:'เต๋าไม้อบ' },
      { date:'2026-10-20', poNo:'TGPO264732', customer:'TPG', product:'ไม้ท่อนประกบ 25x150x400 MM.', qty:1500, due:'2026-10-26', note:'อัดกาวประกบ' },
      { date:'2026-10-21', poNo:'TYT202610-001', customer:'TYO', product:'WOODEN PALLET 1120X1000X110 MM', qty:40, due:'2026-10-27', note:'ปั๊ม IPPC' },
      { date:'2026-10-21', poNo:'PO-5601113', customer:'OPT', product:'ไม้สนอบ - 27x85x1500 mm', qty:400, due:'2026-10-28', note:'งานเสริม' },
      { date:'2026-10-21', poNo:'NO.69/0809', customer:'AMZ', product:'ไม้อัดตัด Size 1100x20x15 mm', qty:3000, due:'2026-10-29', note:'ซอยไม้อัดเส้นเล็ก' },
    ],

    wo: [
      { no:'69/0001', poId:0, product:'WOOD 70x90x1950 mm.', customer:'AVU', priority:'🟢 ปกติ', qty:100, due:'2026-10-22', wood:'🟢 ไม้พร้อม', status:'🚚 จัดส่งแล้ว', type:'🟢 งานปกติ', reason:'🟢 ตามแผนปกติ', rawActual:'' },
      { no:'69/0001', poId:1, product:'WOOD 35x70x370 mm.', customer:'AVU', priority:'🟢 ปกติ', qty:100, due:'2026-10-22', wood:'🟢 ไม้พร้อม', status:'✅ พร้อมจัดส่ง', type:'🟢 งานปกติ', reason:'🟢 ตามแผนปกติ', rawActual:'' },
      { no:'69/0001', poId:2, product:'WOOD 90x90x3200 mm.', customer:'AVU', priority:'🟠 ด่วน', qty:150, due:'2026-10-23', wood:'🟢 ไม้พร้อม', status:'🔵 กำลังแปรรูป', type:'🟢 งานปกติ', reason:'🔴 ไม้แตก/ตาไม้หลุด (เบิกไม้เพิ่ม)', rawActual:'KD 100x100x4000' },
      { no:'69/0002', poId:3, product:'WOOD 22x90x2300 mm.', customer:'AVU', priority:'🟠 ด่วน', qty:500, due:'2026-10-23', wood:'🟢 ไม้พร้อม', status:'🔵 กำลังแปรรูป', type:'🟢 งานปกติ', reason:'🟢 ตามแผนปกติ', rawActual:'' },
      { no:'69/0002', poId:4, product:'WOOD 22x90x3200 mm.', customer:'AVU', priority:'🟢 ปกติ', qty:300, due:'2026-10-24', wood:'🟢 ไม้พร้อม', status:'📋 ลงแผนแล้ว', type:'🟢 งานปกติ', reason:'🟢 ตามแผนปกติ', rawActual:'KD 25x100x4200' },
      { no:'69/0003', poId:3, product:'WOOD 22x90x2300 mm.', customer:'AVU', priority:'🟢 ปกติ', qty:400, due:'2026-10-27', wood:'🟢 ไม้พร้อม', status:'📋 ลงแผนแล้ว', type:'🟢 งานปกติ', reason:'🟢 ตามแผนปกติ', rawActual:'' },
      { no:'69/0004', poId:5, product:'WOOD 22x90x2010 mm.', customer:'AVU', priority:'🟢 ปกติ', qty:600, due:'2026-10-24', wood:'🟢 ไม้พร้อม', status:'🔵 กำลังแปรรูป', type:'🟢 งานปกติ', reason:'🟢 ตามแผนปกติ', rawActual:'' },
      { no:'69/0004', poId:6, product:'PALLET 1000X1200X136 mm.', customer:'AVU', priority:'🟠 ด่วน', qty:50, due:'2026-10-24', wood:'🟢 ไม้พร้อม', status:'📋 ลงแผนแล้ว', type:'🟢 งานปกติ', reason:'🟢 ตามแผนปกติ', rawActual:'' },
      { no:'69/0005', poId:7, product:'One way Plywood Frame 15x1000x1200mm.', customer:'ACM', priority:'🔴 ด่วนวิกฤต', qty:150, due:'2026-10-23', wood:'🟢 ไม้พร้อม', status:'🔨 กำลังประกอบ', type:'🚨 งานเคลม', reason:'🚨 งานแก้/งานเคลมด่วนแทรก (เร่ง OT)', rawActual:'' },
      { no:'69/0006', poId:8, product:'ไม้สนอบ - 60x90x1950 MM', customer:'DIE', priority:'🟢 ปกติ', qty:340, due:'2026-10-25', wood:'🟢 ไม้พร้อม', status:'📋 ลงแผนแล้ว', type:'🟢 งานปกติ', reason:'🟢 ตามแผนปกติ', rawActual:'' },
      { no:'69/0006', poId:9, product:'ไม้สนอบ - 25x150x1330 MM', customer:'DIE', priority:'🟢 ปกติ', qty:600, due:'2026-10-25', wood:'🟢 ไม้พร้อม', status:'📋 ลงแผนแล้ว', type:'🟢 งานปกติ', reason:'🟢 ตามแผนปกติ', rawActual:'' },
      { no:'69/0007', poId:10, product:'ไม้สนสด-12x150x1090 mm', customer:'SNPK', priority:'🟠 ด่วน', qty:1100, due:'2026-10-24', wood:'🟢 ไม้พร้อม', status:'🔵 กำลังแปรรูป', type:'🟢 งานปกติ', reason:'🟢 ตามแผนปกติ', rawActual:'' },
      { no:'69/0007', poId:11, product:'ไม้สนสด-38x80x780 mm', customer:'SNPK', priority:'🟢 ปกติ', qty:1070, due:'2026-10-25', wood:'🟢 ไม้พร้อม', status:'📋 ลงแผนแล้ว', type:'🟢 งานปกติ', reason:'🟢 ตามแผนปกติ', rawActual:'' },
      { no:'69/0008', poId:12, product:'พาเลทไม้สน (SCMF) 720x1200x138 mm', customer:'SCMF', priority:'🔴 ด่วนวิกฤต', qty:30, due:'2026-10-23', wood:'🟢 ไม้พร้อม', status:'✅ พร้อมจัดส่ง', type:'🟢 งานปกติ', reason:'🟢 ตามแผนปกติ', rawActual:'' },
      { no:'69/0008', poId:13, product:'คอกไม้สน (SCMF) 745x3515x1130 mm', customer:'SCMF', priority:'🟠 ด่วน', qty:8, due:'2026-10-24', wood:'🟢 ไม้พร้อม', status:'📋 ลงแผนแล้ว', type:'🟠 งานซ่อม', reason:'🟢 ตามแผนปกติ', rawActual:'' },
      { no:'69/0009', poId:14, product:'PALLET 1000X1200X150 MM.', customer:'WGI', priority:'🔴 ด่วนวิกฤต', qty:200, due:'2026-10-25', wood:'🟢 ไม้พร้อม', status:'📋 ลงแผนแล้ว', type:'🟢 งานปกติ', reason:'🟢 ตามแผนปกติ', rawActual:'' },
      { no:'69/0010', poId:14, product:'PALLET 1000X1200X150 MM.', customer:'WGI', priority:'🟢 ปกติ', qty:200, due:'2026-10-30', wood:'🟡 รอสั่งซื้อ', status:'⚪ รอวางแผน', type:'🟢 งานปกติ', reason:'🟡 รอไม้ดิบเข้าลาน', rawActual:'' },
      { no:'69/0011', poId:15, product:'พาเลทไม้สน (MNS) 985x1050x140 mm', customer:'MNS', priority:'🟠 ด่วน', qty:120, due:'2026-10-26', wood:'🟢 ไม้พร้อม', status:'📋 ลงแผนแล้ว', type:'🟢 งานปกติ', reason:'🟢 ตามแผนปกติ', rawActual:'' },
      { no:'69/0012', poId:15, product:'พาเลทไม้สน (MNS) 985x1050x140 mm', customer:'MNS', priority:'🔵 งานเสริม', qty:150, due:'2026-10-31', wood:'🔴 ไม้ขาด', status:'⚪ รอวางแผน', type:'🟢 งานปกติ', reason:'🟡 รอไม้ดิบเข้าลาน', rawActual:'' },
      { no:'69/0013', poId:16, product:'One way Plywood Frame 15x1000x1200mm.', customer:'ACM', priority:'🟢 ปกติ', qty:1000, due:'2026-10-27', wood:'🟢 ไม้พร้อม', status:'📋 ลงแผนแล้ว', type:'🟢 งานปกติ', reason:'🟢 ตามแผนปกติ', rawActual:'' },
      { no:'69/0014', poId:17, product:'FG-75x75x90 [เต๋าไม้อบ]', customer:'PR', priority:'🟢 ปกติ', qty:2000, due:'2026-10-25', wood:'🟢 ไม้พร้อม', status:'📋 ลงแผนแล้ว', type:'🟢 งานปกติ', reason:'🟢 ตามแผนปกติ', rawActual:'' },
      { no:'69/0015', poId:18, product:'ไม้ท่อนประกบ 25x150x400 MM.', customer:'TPG', priority:'🟠 ด่วน', qty:1500, due:'2026-10-26', wood:'🟢 ไม้พร้อม', status:'📋 ลงแผนแล้ว', type:'🟢 งานปกติ', reason:'🟢 ตามแผนปกติ', rawActual:'' },
      { no:'69/0756', poId:19, product:'WOODEN PALLET 1120X1000X110 MM', customer:'TYO', priority:'🟠 ด่วน', qty:40, due:'2026-10-27', wood:'🟢 ไม้พร้อม', status:'🔨 กำลังประกอบ', type:'🟢 งานปกติ', reason:'🟢 ตามแผนปกติ', rawActual:'GKD 75x150x4800 + R/KD 10x100x4000' },
      { no:'69/0017', poId:20, product:'ไม้สนอบ - 27x85x1500 mm', customer:'OPT', priority:'🔵 งานเสริม', qty:400, due:'2026-10-28', wood:'🟠 รออบ KD', status:'⚪ รอวางแผน', type:'🟢 งานปกติ', reason:'🟠 ติดรออบไม้ KD', rawActual:'' },
      { no:'69/0018', poId:21, product:'ไม้อัดตัด Size 1100x20x15 mm', customer:'AMZ', priority:'🟢 ปกติ', qty:3000, due:'2026-10-29', wood:'🟢 ไม้พร้อม', status:'📋 ลงแผนแล้ว', type:'🟢 งานปกติ', reason:'🟢 ตามแผนปกติ', rawActual:'' },
    ],

    queue: [
      { date:'2026-10-21', woIdx:0, step:'1. ผ่าไม้', machine:'H1', diff:'🔵 งานมาตรฐาน (1.0x)', qty:100, manual:'' },
      { date:'2026-10-21', woIdx:0, step:'3. ตัดความยาว', machine:'C-01', diff:'🔵 งานมาตรฐาน (1.0x)', qty:100, manual:'' },
      { date:'2026-10-21', woIdx:1, step:'3. ตัดความยาว', machine:'C-01', diff:'🟢 งานง่าย/ซอยเร็ว (0.8x)', qty:100, manual:'' },
      { date:'2026-10-21', woIdx:2, step:'1. ผ่าไม้', machine:'H1', diff:'🟠 งานซับซ้อน/ละเอียด (1.3x)', qty:150, manual:3.5 },
      { date:'2026-10-21', woIdx:3, step:'1. ผ่าไม้', machine:'H3', diff:'🔵 งานมาตรฐาน (1.0x)', qty:500, manual:6.0 },
      { date:'2026-10-22', woIdx:3, step:'2. ไส 4 หน้า', machine:'P1', diff:'🔵 งานมาตรฐาน (1.0x)', qty:500, manual:'' },
      { date:'2026-10-22', woIdx:6, step:'1. ผ่าไม้', machine:'H3', diff:'🔵 งานมาตรฐาน (1.0x)', qty:600, manual:'' },
      { date:'2026-10-22', woIdx:4, step:'1. ผ่าไม้', machine:'H2', diff:'🔵 งานมาตรฐาน (1.0x)', qty:300, manual:'' },
      { date:'2026-10-22', woIdx:8, step:'4. ตัดไม้อัด', machine:'PWC', diff:'🔵 งานมาตรฐาน (1.0x)', qty:150, manual:'' },
      { date:'2026-10-22', woIdx:8, step:'6. ประกอบ', machine:'ASSY-1', diff:'🔵 งานมาตรฐาน (1.0x)', qty:150, manual:'' },
      { date:'2026-10-22', woIdx:11, step:'1. ผ่าไม้', machine:'H4', diff:'🔵 งานมาตรฐาน (1.0x)', qty:1100, manual:'' },
      { date:'2026-10-22', woIdx:12, step:'3. ตัดความยาว', machine:'C-01', diff:'🔵 งานมาตรฐาน (1.0x)', qty:30, manual:'' },
      { date:'2026-10-22', woIdx:12, step:'6. ประกอบ', machine:'ASSY-2', diff:'🔵 งานมาตรฐาน (1.0x)', qty:30, manual:'' },
      { date:'2026-10-23', woIdx:7, step:'1. ผ่าไม้', machine:'H1', diff:'🔵 งานมาตรฐาน (1.0x)', qty:50, manual:'' },
      { date:'2026-10-23', woIdx:7, step:'6. ประกอบ', machine:'ASSY-1', diff:'🔵 งานมาตรฐาน (1.0x)', qty:50, manual:'' },
      { date:'2026-10-23', woIdx:7, step:'7. อบ IPPC', machine:'HT-01', diff:'🔵 งานมาตรฐาน (1.0x)', qty:50, manual:2.5 },
      { date:'2026-10-23', woIdx:14, step:'6. ประกอบ', machine:'ASSY-2', diff:'🔴 งานยากพิเศษ/คอกใหญ่ (1.6x)', qty:8, manual:4.0 },
      { date:'2026-10-23', woIdx:9, step:'1. ผ่าไม้', machine:'H2', diff:'🔵 งานมาตรฐาน (1.0x)', qty:200, manual:'' },
      { date:'2026-10-23', woIdx:10, step:'3. ตัดความยาว', machine:'C-03', diff:'🔵 งานมาตรฐาน (1.0x)', qty:600, manual:'' },
      { date:'2026-10-24', woIdx:11, step:'3. ตัดความยาว', machine:'C-02', diff:'🔵 งานมาตรฐาน (1.0x)', qty:1070, manual:'' },
      { date:'2026-10-24', woIdx:15, step:'1. ผ่าไม้', machine:'H2', diff:'🟠 งานซับซ้อน/ละเอียด (1.3x)', qty:200, manual:'' },
      { date:'2026-10-24', woIdx:15, step:'6. ประกอบ', machine:'ASSY-1', diff:'🟠 งานซับซ้อน/ละเอียด (1.3x)', qty:200, manual:'' },
      { date:'2026-10-24', woIdx:20, step:'5. ตัดเต๋า', machine:'C-04', diff:'🟢 งานง่าย/ซอยเร็ว (0.8x)', qty:2000, manual:'' },
      { date:'2026-10-24', woIdx:22, step:'1. ผ่าไม้', machine:'H3', diff:'🔵 งานมาตรฐาน (1.0x)', qty:40, manual:'' },
      { date:'2026-10-24', woIdx:22, step:'3. ตัดความยาว', machine:'C-01', diff:'🔵 งานมาตรฐาน (1.0x)', qty:40, manual:'' },
      { date:'2026-10-25', woIdx:22, step:'6. ประกอบ', machine:'ASSY-2', diff:'🔵 งานมาตรฐาน (1.0x)', qty:40, manual:'' },
    ],

    procLogs: [
      { queueIdx:0, date:'2026-10-21', ok:100, ng:0, ot:0, rWood:5, extra:0, reason:'🟢 ตามแผนปกติ' },
      { queueIdx:1, date:'2026-10-21', ok:100, ng:0, ot:0, rWood:0, extra:0, reason:'🟢 ตามแผนปกติ' },
      { queueIdx:2, date:'2026-10-21', ok:100, ng:1, ot:0, rWood:0, extra:0, reason:'🟢 ตามแผนปกติ' },
      { queueIdx:3, date:'2026-10-21', ok:90, ng:4, ot:2.0, rWood:6, extra:0.25, reason:'🔴 ไม้แตก/ตาไม้หลุด (เบิกไม้เพิ่ม)' },
      { queueIdx:4, date:'2026-10-21', ok:320, ng:5, ot:0, rWood:12, extra:0, reason:'🟢 ตามแผนปกติ' },
      { queueIdx:6, date:'2026-10-22', ok:400, ng:3, ot:0, rWood:8, extra:0, reason:'🟢 ตามแผนปกติ' },
      { queueIdx:8, date:'2026-10-22', ok:150, ng:2, ot:1.5, rWood:0, extra:0.3, reason:'🚨 งานแก้/งานเคลมด่วนแทรก (เร่ง OT)' },
      { queueIdx:11, date:'2026-10-22', ok:30, ng:0, ot:0, rWood:10, extra:0, reason:'🟢 ตามแผนปกติ' },
      { queueIdx:23, date:'2026-10-24', ok:40, ng:0, ot:0, rWood:30, extra:0, reason:'🟢 ตามแผนปกติ' },
      { queueIdx:24, date:'2026-10-24', ok:40, ng:0, ot:0, rWood:135, extra:0, reason:'🟢 ตามแผนปกติ' },
    ],

    assyLogs: [
      { queueIdx:12, date:'2026-10-22', ok:30, ng:0, ot:0, ippc:'🟢 ปั๊มเรียบร้อย', note:'ตอกพาเลท SCMF 720x1200 ครบ 30 ใบ พร้อมส่ง!' },
      { queueIdx:9, date:'2026-10-22', ok:100, ng:0, ot:1.5, ippc:'🔵 ไม่ต้องปั๊ม', note:'เร่งงานเคลม ACM เปิด OT 1.5 ชม. ได้ 100 ใบ' },
    ],

    woodStock: [
      { size:'KD 75x100x4000', stock:10, inbound:0, eta:'2026-10-22' },
      { size:'KD 40x75x4000', stock:5, inbound:0, eta:'2026-10-22' },
      { size:'KD 100x100x4000', stock:8, inbound:5, eta:'2026-10-22' },
      { size:'KD 100x100x3600', stock:2, inbound:0, eta:'2026-10-22' },
      { size:'KD 25x100x4800', stock:15, inbound:10, eta:'2026-10-22' },
      { size:'KD 25x100x3600', stock:0.5, inbound:5, eta:'2026-10-24' },
      { size:'KD 25x100x4200', stock:16, inbound:0, eta:'2026-10-22' },
      { size:'KD Set 22x90+70x90', stock:15, inbound:0, eta:'2026-10-22' },
      { size:'Plywood 15x1220x2440', stock:35, inbound:10, eta:'2026-10-22' },
      { size:'KD 65x100x4000', stock:8, inbound:0, eta:'2026-10-22' },
      { size:'KD 30x155x4000', stock:6, inbound:0, eta:'2026-10-22' },
      { size:'GN 25x150x4400', stock:12, inbound:0, eta:'2026-10-22' },
      { size:'GN 40x85x4000', stock:10, inbound:0, eta:'2026-10-22' },
      { size:'KD Set SCMF Std', stock:5, inbound:0, eta:'2026-10-22' },
      { size:'KD Set SCMF Crate', stock:3, inbound:0, eta:'2026-10-22' },
      { size:'KD Set WGI Heavy', stock:9, inbound:15, eta:'2026-10-28' },
      { size:'KD Set MNS Export', stock:4.5, inbound:0, eta:'2026-10-29' },
      { size:'KD 75x75x4000', stock:5, inbound:0, eta:'2026-10-22' },
      { size:'KD 25x150x4000', stock:8, inbound:0, eta:'2026-10-22' },
      { size:'GKD 75x150x4800 + R/KD 10x100x4000', stock:5, inbound:0, eta:'2026-10-22' },
      { size:'KD 30x90x3000', stock:0.5, inbound:4, eta:'2026-10-26' },
    ],
  };
}

// ---- Store ----
let DB = load();

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      // merge settings defaults in case schema changed
      d.settings = Object.assign({}, DEFAULTS, d.settings || {});
      d.settings.speedTiers = Object.assign({}, DEFAULTS.speedTiers, (d.settings.speedTiers || {}));
      return d;
    }
  } catch (e) {}
  const s = seedData();
  localStorage.setItem(LS_KEY, JSON.stringify(s));
  return s;
}

function save() { localStorage.setItem(LS_KEY, JSON.stringify(DB)); }
function resetData() { DB = seedData(); save(); }

function uid(p) { return p + '-' + Math.random().toString(36).slice(2, 8); }
