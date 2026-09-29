const fs = require('fs');
const path = require('path');

function generatePerfectLrs() {
  // Dimensions & Positions
  // Canvas width: 1150, height: 1000
  // Title at top: y = 20..60. NO LINES anywhere near y < 75!
  
  // Table Coordinates:
  // Column 1: x = 80..300 (w = 220)
  // Column 2: x = 440..670 (w = 230)
  // Column 3: x = 800..1020 (w = 220)
  
  // Row 1: y = 90
  // Row 2: y = 380 (Meeting at y = 360)
  // Row 3: y = 730

  const tables = [
    {
      id: 'biro',
      name: 'biro',
      x: 80,
      y: 90,
      w: 220,
      headerH: 30,
      bodyH: 175,
      fields: [
        { name: 'biro_id [PK]', type: 'pk' },
        { name: 'code', type: 'norm' },
        { name: 'name', type: 'norm' },
        { name: 'shortName', type: 'norm' },
        { name: 'description', type: 'norm' },
        { name: 'isActive', type: 'norm' },
        { name: 'createdAt', type: 'norm' },
        { name: 'updatedAt', type: 'norm' }
      ]
    },
    {
      id: 'biro_seq',
      name: 'biro_meeting_sequence',
      x: 440,
      y: 90,
      w: 230,
      headerH: 30,
      bodyH: 120,
      fields: [
        { name: 'sequence_id [PK]', type: 'pk' },
        { name: 'biro_id [FK]', type: 'fk' },
        { name: 'currentNumber', type: 'norm' },
        { name: 'createdAt', type: 'norm' },
        { name: 'updatedAt', type: 'norm' }
      ]
    },
    {
      id: 'user',
      name: 'user',
      x: 800,
      y: 90,
      w: 220,
      headerH: 30,
      bodyH: 195,
      fields: [
        { name: 'user_id [PK]', type: 'pk' },
        { name: 'biro_id [FK]', type: 'fk' },
        { name: 'name', type: 'norm' },
        { name: 'email', type: 'norm' },
        { name: 'password', type: 'norm' },
        { name: 'role', type: 'norm' },
        { name: 'isActive', type: 'norm' },
        { name: 'createdAt', type: 'norm' },
        { name: 'updatedAt', type: 'norm' }
      ]
    },
    {
      id: 'meeting_biro',
      name: 'meeting_biro',
      x: 80,
      y: 400,
      w: 220,
      headerH: 30,
      bodyH: 65,
      fields: [
        { name: 'meeting_id [PK, FK]', type: 'pkfk' },
        { name: 'biro_id [PK, FK]', type: 'pkfk' }
      ]
    },
    {
      id: 'meeting',
      name: 'meeting',
      x: 440,
      y: 360,
      w: 230,
      headerH: 30,
      bodyH: 285,
      fields: [
        { name: 'meeting_id [PK]', type: 'pk' },
        { name: 'meeting_number', type: 'norm' },
        { name: 'title', type: 'norm' },
        { name: 'primary_biro_id [FK]', type: 'fk' },
        { name: 'chairperson_id [FK]', type: 'fk' },
        { name: 'secretary_id [FK]', type: 'fk' },
        { name: 'previous_meeting_id [FK]', type: 'fk' },
        { name: 'date', type: 'norm' },
        { name: 'startTime', type: 'norm' },
        { name: 'endTime', type: 'norm' },
        { name: 'location', type: 'norm' },
        { name: 'status', type: 'norm' },
        { name: 'createdAt', type: 'norm' },
        { name: 'updatedAt', type: 'norm' }
      ]
    },
    {
      id: 'meeting_participant',
      name: 'meeting_participant',
      x: 800,
      y: 380,
      w: 220,
      headerH: 30,
      bodyH: 120,
      fields: [
        { name: 'participant_id [PK]', type: 'pk' },
        { name: 'meeting_id [FK]', type: 'fk' },
        { name: 'user_id [FK]', type: 'fk' },
        { name: 'attendanceStatus', type: 'norm' },
        { name: 'createdAt', type: 'norm' }
      ]
    },
    {
      id: 'action_item',
      name: 'action_item',
      x: 80,
      y: 720,
      w: 220,
      headerH: 30,
      bodyH: 245,
      fields: [
        { name: 'action_item_id [PK]', type: 'pk' },
        { name: 'meeting_id [FK]', type: 'fk' },
        { name: 'pic_biro_id [FK]', type: 'fk' },
        { name: 'pic_user_id [FK]', type: 'fk' },
        { name: 'title', type: 'norm' },
        { name: 'description', type: 'norm' },
        { name: 'dueDate', type: 'norm' },
        { name: 'status', type: 'norm' },
        { name: 'priority', type: 'norm' },
        { name: 'completedAt', type: 'norm' },
        { name: 'createdAt', type: 'norm' },
        { name: 'updatedAt', type: 'norm' }
      ]
    },
    {
      id: 'meeting_minutes',
      name: 'meeting_minutes',
      x: 440,
      y: 720,
      w: 230,
      headerH: 30,
      bodyH: 175,
      fields: [
        { name: 'minutes_id [PK]', type: 'pk' },
        { name: 'meeting_id [FK]', type: 'fk' },
        { name: 'agenda', type: 'norm' },
        { name: 'discussion', type: 'norm' },
        { name: 'decisions', type: 'norm' },
        { name: 'conclusion', type: 'norm' },
        { name: 'createdAt', type: 'norm' },
        { name: 'updatedAt', type: 'norm' }
      ]
    },
    {
      id: 'legend',
      name: 'Petunjuk Notasi LRS',
      x: 800,
      y: 720,
      w: 220,
      headerH: 30,
      bodyH: 175,
      fields: [
        { name: '[PK]  : Primary Key (Kuning)', type: 'pk' },
        { name: '[FK]  : Foreign Key (Biru)', type: 'fk' },
        { name: '1     : Relasi Derajat 1', type: 'norm' },
        { name: 'M     : Relasi Derajat Banyak', type: 'norm' },
        { name: '1 -> M: Satu ke Banyak', type: 'norm' },
        { name: '1 -> 1: Satu ke Satu Unik', type: 'norm' },
        { name: 'Panah : Menunjuk Kunci Tamu', type: 'norm' }
      ]
    }
  ];

  // Zero-collision, clean internal routing (NO line crosses any table, NO line crosses title!)
  const edges = [
    // 1. Biro -> Biro_meeting_sequence (1:1)
    {
      id: 'edge_biro_seq',
      name: 'Biro -> Sequence (1:1)',
      src: 'biro_body',
      tgt: 'biro_seq_body',
      srcPt: { x: 300, y: 135 },
      tgtPt: { x: 440, y: 135 },
      points: [],
      srcCard: '1',
      tgtCard: '1'
    },
    // 2. Biro -> User (1:M via biro_id) - Routes through the gap below biro_seq (y = 230)
    {
      id: 'edge_biro_user',
      name: 'Biro -> User (1:M)',
      src: 'biro_body',
      tgt: 'user_body',
      srcPt: { x: 300, y: 245 },
      tgtPt: { x: 800, y: 245 },
      points: [
        { x: 370, y: 245 },
        { x: 370, y: 235 },
        { x: 735, y: 235 },
        { x: 735, y: 245 }
      ],
      srcCard: '1',
      tgtCard: 'M'
    },
    // 3. Biro -> Meeting_biro (1:M via biro_id) - Straight vertical down
    {
      id: 'edge_biro_meeting_biro',
      name: 'Biro -> Meeting_biro (1:M)',
      src: 'biro_body',
      tgt: 'meeting_biro_header',
      srcPt: { x: 140, y: 295 },
      tgtPt: { x: 140, y: 400 },
      points: [],
      srcCard: '1',
      tgtCard: 'M'
    },
    // 4. Meeting -> Meeting_biro (1:M via meeting_id) - Straight horizontal left
    {
      id: 'edge_meeting_meeting_biro',
      name: 'Meeting -> Meeting_biro (1:M)',
      src: 'meeting_body',
      tgt: 'meeting_biro_body',
      srcPt: { x: 440, y: 435 },
      tgtPt: { x: 300, y: 435 },
      points: [],
      srcCard: '1',
      tgtCard: 'M'
    },
    // 5. Biro -> Meeting (1:M via primary_biro_id) - Enters Meeting TOP at x = 500
    {
      id: 'edge_biro_meeting',
      name: 'Biro -> Meeting (1:M)',
      src: 'biro_body',
      tgt: 'meeting_header',
      srcPt: { x: 250, y: 295 },
      tgtPt: { x: 500, y: 360 },
      points: [
        { x: 250, y: 330 },
        { x: 500, y: 330 }
      ],
      srcCard: '1',
      tgtCard: 'M'
    },
    // 6. User -> Meeting (1:M via chairperson/secretary) - Enters Meeting TOP at x = 600
    {
      id: 'edge_user_meeting',
      name: 'User -> Meeting (1:M)',
      src: 'user_body',
      tgt: 'meeting_header',
      srcPt: { x: 850, y: 315 },
      tgtPt: { x: 600, y: 360 },
      points: [
        { x: 850, y: 330 },
        { x: 600, y: 330 }
      ],
      srcCard: '1',
      tgtCard: 'M'
    },
    // 7. User -> Meeting_participant (1:M via user_id) - Straight vertical down
    {
      id: 'edge_user_participant',
      name: 'User -> Participant (1:M)',
      src: 'user_body',
      tgt: 'meeting_participant_header',
      srcPt: { x: 910, y: 315 },
      tgtPt: { x: 910, y: 380 },
      points: [],
      srcCard: '1',
      tgtCard: 'M'
    },
    // 8. Meeting -> Meeting_participant (1:M via meeting_id) - Straight horizontal right
    {
      id: 'edge_meeting_participant',
      name: 'Meeting -> Participant (1:M)',
      src: 'meeting_body',
      tgt: 'meeting_participant_body',
      srcPt: { x: 670, y: 435 },
      tgtPt: { x: 800, y: 435 },
      points: [],
      srcCard: '1',
      tgtCard: 'M'
    },
    // 9. Meeting -> Meeting (Recursive via previous_meeting_id) - Loop on right side below participant
    {
      id: 'edge_meeting_self',
      name: 'Meeting -> Meeting (Recursive 0..1:M)',
      src: 'meeting_body',
      tgt: 'meeting_body',
      srcPt: { x: 670, y: 530 },
      tgtPt: { x: 670, y: 590 },
      points: [
        { x: 735, y: 530 },
        { x: 735, y: 590 }
      ],
      srcCard: '1',
      tgtCard: 'M'
    },
    // 10. Meeting -> Meeting_minutes (1:1 via meeting_id) - Straight vertical down
    {
      id: 'edge_meeting_minutes',
      name: 'Meeting -> Minutes (1:1)',
      src: 'meeting_body',
      tgt: 'meeting_minutes_header',
      srcPt: { x: 555, y: 675 },
      tgtPt: { x: 555, y: 720 },
      points: [],
      srcCard: '1',
      tgtCard: '1'
    },
    // 11. Meeting -> Action_item (1:M via meeting_id) - Leaves Meeting bottom-left
    {
      id: 'edge_meeting_action',
      name: 'Meeting -> Action_item (1:M)',
      src: 'meeting_body',
      tgt: 'action_item_header',
      srcPt: { x: 470, y: 675 },
      tgtPt: { x: 260, y: 720 },
      points: [
        { x: 470, y: 695 },
        { x: 260, y: 695 }
      ],
      srcCard: '1',
      tgtCard: 'M'
    },
    // 12. Biro -> Action_item (1:M via pic_biro_id) - Left corridor (x = 40)
    {
      id: 'edge_biro_action',
      name: 'Biro -> Action_item (1:M)',
      src: 'biro_body',
      tgt: 'action_item_body',
      srcPt: { x: 80, y: 180 },
      tgtPt: { x: 80, y: 810 },
      points: [
        { x: 40, y: 180 },
        { x: 40, y: 810 }
      ],
      srcCard: '1',
      tgtCard: 'M'
    },
    // 13. User -> Action_item (1:M via pic_user_id) - Internal corridor between columns (x = 755 -> y = 680 -> x = 200)
    {
      id: 'edge_user_action',
      name: 'User -> Action_item (1:M)',
      src: 'user_body',
      tgt: 'action_item_header',
      srcPt: { x: 820, y: 315 },
      tgtPt: { x: 200, y: 720 },
      points: [
        { x: 820, y: 350 },
        { x: 755, y: 350 },
        { x: 755, y: 680 },
        { x: 200, y: 680 }
      ],
      srcCard: '1',
      tgtCard: 'M'
    }
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="Mozilla/5.0" version="21.0.0" type="device">
  <diagram id="sim-rapat-lrs" name="LRS - SIM-RAPAT KEK RI">
    <mxGraphModel dx="1400" dy="950" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1150" pageHeight="1020" background="#ffffff" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <!-- Title Banner (y=20 to 58, NO lines cross here!) -->
        <mxCell id="title_banner" value="LOGICAL RECORD STRUCTURE (LRS)&#xa;SIM-RAPAT KEK RI (SEKRETARIAT JENDERAL DEWAN NASIONAL KAWASAN EKONOMI KHUSUS)" style="rounded=1;arcSize=8;fillColor=#215865;strokeColor=#183E47;strokeWidth=1.5;fontColor=#ffffff;fontStyle=1;fontSize=13;align=center;verticalAlign=middle;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="80" y="20" width="940" height="42" as="geometry" />
        </mxCell>
`;

  // Tables
  tables.forEach(t => {
    const isLegend = t.id === 'legend';
    const headerFill = isLegend ? '#334155' : '#215865';
    const headerStroke = isLegend ? '#1E293B' : '#183E47';
    
    // Header Cell
    xml += `
        <!-- Table: ${t.name} -->
        <mxCell id="${t.id}_header" value="${t.name}" style="rounded=1;arcSize=10;whiteSpace=wrap;html=1;fillColor=${headerFill};strokeColor=${headerStroke};strokeWidth=1.5;fontColor=#ffffff;fontStyle=1;fontSize=12;align=center;verticalAlign=middle;fontFamily=Helvetica;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="${t.x}" y="${t.y}" width="${t.w}" height="${t.headerH}" as="geometry" />
        </mxCell>
`;

    // Construct body text HTML with clear colors and line spacing
    let bodyHtml = t.fields.map(f => {
      if (f.type === 'pk') {
        return `&lt;div style=&quot;line-height: 1.5;&quot;&gt;&lt;b style=&quot;color: #B7791F;&quot;&gt;${f.name}&lt;/b&gt;&lt;/div&gt;`;
      } else if (f.type === 'pkfk') {
        return `&lt;div style=&quot;line-height: 1.5;&quot;&gt;&lt;b style=&quot;color: #D97706;&quot;&gt;${f.name}&lt;/b&gt;&lt;/div&gt;`;
      } else if (f.type === 'fk') {
        return `&lt;div style=&quot;line-height: 1.5;&quot;&gt;&lt;b style=&quot;color: #0284C7;&quot;&gt;${f.name}&lt;/b&gt;&lt;/div&gt;`;
      } else {
        return `&lt;div style=&quot;line-height: 1.5; color: #334155;&quot;&gt;${f.name}&lt;/div&gt;`;
      }
    }).join('');

    const bodyY = t.y + t.headerH + 2;
    xml += `        <mxCell id="${t.id}_body" value="${bodyHtml}" style="rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#94A3B8;strokeWidth=1.2;fontColor=#1E293B;fontStyle=0;fontSize=11;align=left;verticalAlign=top;spacingLeft=12;spacingTop=8;spacingRight=8;spacingBottom=8;fontFamily=Helvetica;shadow=1;" vertex="1" parent="1">
          <mxGeometry x="${t.x}" y="${bodyY}" width="${t.w}" height="${t.bodyH}" as="geometry" />
        </mxCell>
`;
  });

  // Edges with Draw.io native edgeLabel (NEVER colliding, always clean!)
  edges.forEach(e => {
    let pointsXml = '';
    if (e.points && e.points.length > 0) {
      pointsXml = `
            <Array as="points">
${e.points.map(p => `              <mxPoint x="${p.x}" y="${p.y}" />`).join('\n')}
            </Array>`;
    }

    xml += `
        <!-- Edge: ${e.name} -->
        <mxCell id="${e.id}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#215865;strokeWidth=1.5;endArrow=classic;endFill=1;endSize=6;" edge="1" parent="1" source="${e.src}" target="${e.tgt}">
          <mxGeometry relative="1" as="geometry">
            <mxPoint x="${e.srcPt.x}" y="${e.srcPt.y}" as="sourcePoint" />
            <mxPoint x="${e.tgtPt.x}" y="${e.tgtPt.y}" as="targetPoint" />${pointsXml}
          </mxGeometry>
        </mxCell>
        <!-- Source Cardinality Label -->
        <mxCell id="${e.id}_c_src" value="${e.srcCard}" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=11;fontStyle=1;fontColor=#215865;backgroundColor=#ffffff;" vertex="1" connectable="0" parent="${e.id}">
          <mxGeometry x="-0.8" y="0" relative="1" as="geometry">
            <mxPoint x="0" y="-10" as="offset" />
          </mxGeometry>
        </mxCell>
        <!-- Target Cardinality Label -->
        <mxCell id="${e.id}_c_tgt" value="${e.tgtCard}" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=11;fontStyle=1;fontColor=#215865;backgroundColor=#ffffff;" vertex="1" connectable="0" parent="${e.id}">
          <mxGeometry x="0.8" y="0" relative="1" as="geometry">
            <mxPoint x="0" y="-10" as="offset" />
          </mxGeometry>
        </mxCell>
`;
  });

  xml += `      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

  return xml;
}

const xmlOutput = generatePerfectLrs();
const docsPath = path.join(__dirname, '..', 'docs', 'LRS_SIM_RAPAT.drawio');
const publicPath = path.join(__dirname, '..', 'public', 'LRS_SIM_RAPAT.drawio');

fs.writeFileSync(docsPath, xmlOutput, 'utf8');
fs.writeFileSync(publicPath, xmlOutput, 'utf8');

console.log('Successfully generated PERFECT Scribd-style LRS Draw.io files:');
console.log(' - ' + docsPath);
console.log(' - ' + publicPath);
