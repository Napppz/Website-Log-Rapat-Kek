const fs = require('fs');
const path = require('path');

function generateChenErdXml() {
  const entities = [
    {
      id: 'ent_biro',
      name: 'biro',
      x: 350,
      y: 220,
      w: 160,
      h: 60
    },
    {
      id: 'ent_user',
      name: 'pengguna',
      x: 1050,
      y: 220,
      w: 160,
      h: 60
    },
    {
      id: 'ent_seq',
      name: 'penomoran_rapat_biro',
      x: 80,
      y: 440,
      w: 180,
      h: 60
    },
    {
      id: 'ent_meeting',
      name: 'rapat',
      x: 700,
      y: 580,
      w: 160,
      h: 65
    },
    {
      id: 'ent_action',
      name: 'tindak_lanjut',
      x: 350,
      y: 920,
      w: 160,
      h: 60
    },
    {
      id: 'ent_minutes',
      name: 'notulen_rapat',
      x: 1050,
      y: 920,
      w: 170,
      h: 60
    }
  ];

  // Attributes (ellipses) connected to each entity
  const attributes = [
    // --- biro attributes ---
    { id: 'att_b_id', entId: 'ent_biro', name: '&lt;u&gt;&lt;b&gt;id_biro&lt;/b&gt;&lt;/u&gt;', x: 200, y: 120, w: 100, h: 42, isPk: true },
    { id: 'att_b_code', entId: 'ent_biro', name: 'kode_biro', x: 320, y: 110, w: 85, h: 40 },
    { id: 'att_b_name', entId: 'ent_biro', name: 'nama_biro', x: 420, y: 110, w: 85, h: 40 },
    { id: 'att_b_short', entId: 'ent_biro', name: 'nama_singkat', x: 520, y: 120, w: 90, h: 40 },
    { id: 'att_b_desc', entId: 'ent_biro', name: 'deskripsi', x: 190, y: 200, w: 95, h: 40 },
    { id: 'att_b_act', entId: 'ent_biro', name: 'status_aktif', x: 190, y: 260, w: 85, h: 40 },

    // --- user attributes ---
    { id: 'att_u_id', entId: 'ent_user', name: '&lt;u&gt;&lt;b&gt;id_pengguna&lt;/b&gt;&lt;/u&gt;', x: 1260, y: 120, w: 100, h: 42, isPk: true },
    { id: 'att_u_name', entId: 'ent_user', name: 'nama_lengkap', x: 1150, y: 110, w: 95, h: 40 },
    { id: 'att_u_email', entId: 'ent_user', name: 'email', x: 1050, y: 110, w: 85, h: 40 },
    { id: 'att_u_pass', entId: 'ent_user', name: 'kata_sandi', x: 950, y: 120, w: 90, h: 40 },
    { id: 'att_u_role', entId: 'ent_user', name: 'peran', x: 1260, y: 200, w: 85, h: 40 },
    { id: 'att_u_act', entId: 'ent_user', name: 'status_aktif', x: 1260, y: 260, w: 85, h: 40 },

    // --- penomoran_rapat_biro attributes ---
    { id: 'att_s_id', entId: 'ent_seq', name: '&lt;u&gt;&lt;b&gt;id_penomoran&lt;/b&gt;&lt;/u&gt;', x: 50, y: 550, w: 105, h: 42, isPk: true },
    { id: 'att_s_num', entId: 'ent_seq', name: 'nomor_terakhir', x: 175, y: 550, w: 105, h: 40 },

    // --- rapat attributes ---
    { id: 'att_m_id', entId: 'ent_meeting', name: '&lt;u&gt;&lt;b&gt;id_rapat&lt;/b&gt;&lt;/u&gt;', x: 730, y: 470, w: 100, h: 42, isPk: true },
    { id: 'att_m_num', entId: 'ent_meeting', name: 'nomor_rapat', x: 570, y: 680, w: 115, h: 40 },
    { id: 'att_m_title', entId: 'ent_meeting', name: 'judul_rapat', x: 700, y: 700, w: 85, h: 40 },
    { id: 'att_m_date', entId: 'ent_meeting', name: 'tanggal_rapat', x: 800, y: 700, w: 95, h: 40 },
    { id: 'att_m_time', entId: 'ent_meeting', name: 'waktu_mulai', x: 890, y: 680, w: 90, h: 40 },
    { id: 'att_m_loc', entId: 'ent_meeting', name: 'lokasi_rapat', x: 880, y: 490, w: 90, h: 40 },
    { id: 'att_m_stat', entId: 'ent_meeting', name: 'status_rapat', x: 620, y: 490, w: 85, h: 40 },

    // --- tindak_lanjut attributes ---
    { id: 'att_a_id', entId: 'ent_action', name: '&lt;u&gt;&lt;b&gt;id_tindak_lanjut&lt;/b&gt;&lt;/u&gt;', x: 215, y: 920, w: 110, h: 42, isPk: true },
    { id: 'att_a_title', entId: 'ent_action', name: 'judul_tindakan', x: 230, y: 1010, w: 95, h: 40 },
    { id: 'att_a_desc', entId: 'ent_action', name: 'deskripsi_tindakan', x: 330, y: 1025, w: 110, h: 40 },
    { id: 'att_a_due', entId: 'ent_action', name: 'tenggat_waktu', x: 450, y: 1025, w: 95, h: 40 },
    { id: 'att_a_stat', entId: 'ent_action', name: 'status_tindak_lanjut', x: 555, y: 1010, w: 110, h: 40 },
    { id: 'att_a_prio', entId: 'ent_action', name: 'skala_prioritas', x: 205, y: 840, w: 90, h: 40 },

    // --- notulen_rapat attributes ---
    { id: 'att_n_id', entId: 'ent_minutes', name: '&lt;u&gt;&lt;b&gt;id_notulen&lt;/b&gt;&lt;/u&gt;', x: 1260, y: 920, w: 100, h: 42, isPk: true },
    { id: 'att_n_agenda', entId: 'ent_minutes', name: 'agenda_pembahasan', x: 970, y: 1025, w: 115, h: 40 },
    { id: 'att_n_disc', entId: 'ent_minutes', name: 'hasil_pembahasan', x: 1095, y: 1030, w: 105, h: 40 },
    { id: 'att_n_dec', entId: 'ent_minutes', name: 'poin_keputusan', x: 1210, y: 1030, w: 95, h: 40 },
    { id: 'att_n_conc', entId: 'ent_minutes', name: 'kesimpulan', x: 1310, y: 1010, w: 90, h: 40 }
  ];

  // Relationships (Rhombus / Diamond)
  const relationships = [
    {
      id: 'rel_memiliki',
      name: 'memiliki',
      x: 700,
      y: 220,
      w: 160,
      h: 60,
      ent1: 'ent_biro',
      card1: '1',
      ent2: 'ent_user',
      card2: 'N'
    },
    {
      id: 'rel_mengatur',
      name: 'mengatur',
      x: 180,
      y: 335,
      w: 130,
      h: 55,
      ent1: 'ent_biro',
      card1: '1',
      ent2: 'ent_seq',
      card2: '1'
    },
    {
      id: 'rel_menyelenggarakan',
      name: 'menyelenggarakan',
      x: 440,
      y: 420,
      w: 165,
      h: 60,
      ent1: 'ent_biro',
      card1: '1',
      ent2: 'ent_meeting',
      card2: 'N'
    },
    {
      id: 'rel_melibatkan',
      name: 'melibatkan\n(lintas biro)',
      x: 320,
      y: 560,
      w: 145,
      h: 65,
      ent1: 'ent_meeting',
      card1: 'M',
      ent2: 'ent_biro',
      card2: 'N'
    },
    {
      id: 'rel_memimpin',
      name: 'memimpin\n&amp; notulis',
      x: 955,
      y: 420,
      w: 145,
      h: 60,
      ent1: 'ent_user',
      card1: '1',
      ent2: 'ent_meeting',
      card2: 'N'
    },
    {
      id: 'rel_menghadiri',
      name: 'menghadiri',
      x: 1090,
      y: 560,
      w: 145,
      h: 60,
      ent1: 'ent_user',
      card1: 'M',
      ent2: 'ent_meeting',
      card2: 'N'
    },
    {
      id: 'rel_menghasilkan',
      name: 'menghasilkan',
      x: 940,
      y: 770,
      w: 150,
      h: 60,
      ent1: 'ent_meeting',
      card1: '1',
      ent2: 'ent_minutes',
      card2: '1'
    },
    {
      id: 'rel_menetapkan',
      name: 'menetapkan',
      x: 470,
      y: 770,
      w: 150,
      h: 60,
      ent1: 'ent_meeting',
      card1: '1',
      ent2: 'ent_action',
      card2: 'N'
    },
    {
      id: 'rel_pic_biro',
      name: 'penugasan\n(biro)',
      x: 230,
      y: 730,
      w: 120,
      h: 55,
      ent1: 'ent_biro',
      card1: '1',
      ent2: 'ent_action',
      card2: 'N'
    },
    {
      id: 'rel_pic_user',
      name: 'penugasan\n(pegawai)',
      x: 715,
      y: 922,
      w: 130,
      h: 55,
      ent1: 'ent_user',
      card1: '1',
      ent2: 'ent_action',
      card2: 'N'
    }
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="Mozilla/5.0" version="21.0.0" type="device">
  <diagram id="sim-rapat-chen-erd" name="ERD Chen - SIM-RAPAT KEK RI">
    <mxGraphModel dx="1600" dy="1200" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1550" pageHeight="1150" background="#ffffff" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <!-- Title Banner -->
        <mxCell id="title_banner" value="ENTITY RELATIONSHIP DIAGRAM (ERD) - NOTASI CHEN&#xa;SIM-RAPAT KEK RI (SEKRETARIAT JENDERAL DEWAN NASIONAL KAWASAN EKONOMI KHUSUS)" style="rounded=1;arcSize=8;fillColor=#215865;strokeColor=#183E47;strokeWidth=1.5;fontColor=#ffffff;fontStyle=1;fontSize=14;align=center;verticalAlign=middle;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="250" y="25" width="1050" height="46" as="geometry" />
        </mxCell>
`;

  // 1. Entities (Rectangles)
  entities.forEach(e => {
    xml += `
        <!-- Entity: ${e.name} -->
        <mxCell id="${e.id}" value="${e.name}" style="shape=rectangle;rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#183E47;strokeWidth=2.2;fontColor=#183E47;fontStyle=1;fontSize=14;align=center;verticalAlign=middle;fontFamily=Helvetica;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" as="geometry" />
        </mxCell>
`;
  });

  // 2. Attributes (Ellipses) & Connectors to Entity
  attributes.forEach(a => {
    const stroke = a.isPk ? '#B7791F' : '#64748B';
    const strokeW = a.isPk ? '2' : '1.2';
    const fill = a.isPk ? '#FFFBEB' : '#FFFFFF';
    const fontColor = a.isPk ? '#B7791F' : '#1E293B';
    
    xml += `
        <!-- Attribute: ${a.id} -->
        <mxCell id="${a.id}" value="${a.name}" style="shape=ellipse;whiteSpace=wrap;html=1;fillColor=${fill};strokeColor=${stroke};strokeWidth=${strokeW};fontColor=${fontColor};fontStyle=0;fontSize=11;align=center;verticalAlign=middle;fontFamily=Helvetica;" vertex="1" parent="1">
          <mxGeometry x="${a.x}" y="${a.y}" width="${a.w}" height="${a.h}" as="geometry" />
        </mxCell>
        <!-- Edge Attribute to Entity -->
        <mxCell id="edge_${a.id}" style="endArrow=none;html=1;strokeColor=#94A3B8;strokeWidth=1.2;" edge="1" parent="1" source="${a.entId}" target="${a.id}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
`;
  });

  // 3. Relationships (Rhombus / Diamonds) & Connectors with Cardinalities
  relationships.forEach(r => {
    xml += `
        <!-- Relationship: ${r.name.replace('\n', ' ')} -->
        <mxCell id="${r.id}" value="${r.name}" style="shape=rhombus;whiteSpace=wrap;html=1;fillColor=#E8F5F7;strokeColor=#215865;strokeWidth=2;fontColor=#215865;fontStyle=1;fontSize=11;align=center;verticalAlign=middle;fontFamily=Helvetica;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" as="geometry" />
        </mxCell>
        
        <!-- Edge 1: ${r.ent1} <-> ${r.id} -->
        <mxCell id="edge_${r.id}_1" style="endArrow=none;html=1;strokeColor=#215865;strokeWidth=1.8;" edge="1" parent="1" source="${r.ent1}" target="${r.id}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="lbl_${r.id}_1" value="${r.card1}" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#215865;backgroundColor=#ffffff;" vertex="1" connectable="0" parent="edge_${r.id}_1">
          <mxGeometry x="-0.7" y="0" relative="1" as="geometry">
            <mxPoint x="0" y="-10" as="offset" />
          </mxGeometry>
        </mxCell>

        <!-- Edge 2: ${r.id} <-> ${r.ent2} -->
        <mxCell id="edge_${r.id}_2" style="endArrow=none;html=1;strokeColor=#215865;strokeWidth=1.8;" edge="1" parent="1" source="${r.id}" target="${r.ent2}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="lbl_${r.id}_2" value="${r.card2}" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=12;fontStyle=1;fontColor=#215865;backgroundColor=#ffffff;" vertex="1" connectable="0" parent="edge_${r.id}_2">
          <mxGeometry x="0.7" y="0" relative="1" as="geometry">
            <mxPoint x="0" y="-10" as="offset" />
          </mxGeometry>
        </mxCell>
`;
  });

  // 4. Attribute for relationship 'menghadiri' (attendanceStatus)
  xml += `
        <!-- Attribute on Relationship menghadiri -->
        <mxCell id="att_rel_attendance" value="status_kehadiran" style="shape=ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#64748B;strokeWidth=1.2;fontColor=#1E293B;fontSize=11;align=center;verticalAlign=middle;fontFamily=Helvetica;" vertex="1" parent="1">
          <mxGeometry x="1270" y="570" width="115" height="40" as="geometry" />
        </mxCell>
        <mxCell id="edge_rel_attendance" style="endArrow=none;dashed=1;html=1;strokeColor=#64748B;strokeWidth=1.2;" edge="1" parent="1" source="rel_menghadiri" target="att_rel_attendance">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Legend Box: Notasi Chen (moved to clean empty area) -->
        <mxCell id="legend_box" value="&lt;b&gt;STANDAR NOTASI CHEN (ERD)&lt;/b&gt;&lt;br&gt;&lt;br&gt;▪ &lt;b&gt;Persegi Panjang&lt;/b&gt; : Entitas (Tabel)&lt;br&gt;▪ &lt;b&gt;Belah Ketupat&lt;/b&gt; : Relasi Antar-Entitas&lt;br&gt;▪ &lt;b&gt;Elips&lt;/b&gt; : Atribut Data&lt;br&gt;▪ &lt;b&gt;&lt;u&gt;Teks Garis Bawah&lt;/u&gt;&lt;/b&gt; : Primary Key (Kunci Utama)&lt;br&gt;▪ &lt;b&gt;1 / N / M&lt;/b&gt; : Derajat Kardinalitas Relasi" style="rounded=1;arcSize=8;whiteSpace=wrap;html=1;fillColor=#F8FAFC;strokeColor=#64748B;strokeWidth=1.2;fontColor=#1E293B;fontSize=11;align=left;verticalAlign=top;spacingLeft=14;spacingTop=10;fontFamily=Helvetica;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="60" y="660" width="220" height="150" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

  return xml;
}

const xmlOutput = generateChenErdXml();
const docsPath = path.join(__dirname, '..', 'docs', 'ERD_SIM_RAPAT.drawio');
const publicPath = path.join(__dirname, '..', 'public', 'ERD_SIM_RAPAT.drawio');

fs.writeFileSync(docsPath, xmlOutput, 'utf8');
fs.writeFileSync(publicPath, xmlOutput, 'utf8');

console.log('Successfully updated Classic Chen Notation ERD Draw.io files:');
console.log(' - ' + docsPath);
console.log(' - ' + publicPath);
