const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function generateCleanChenErd() {
  const width = 1540;
  const height = 1060;

  // Colors
  const cTitle = '#2563EB';
  const cEntityBorder = '#1E3A8A';
  const cEntityFill = '#FFFFFF';
  const cEntityText = '#0F172A';

  const cRelBorder = '#0D9488';
  const cRelFill = '#F0FDF4';
  const cRelText = '#0F766E';

  const cPkBorder = '#D97706';
  const cPkFill = '#FEF3C7';
  const cPkText = '#92400E';

  const cAttBorder = '#94A3B8';
  const cAttFill = '#FFFFFF';
  const cAttText = '#334155';

  const cLine = '#475569';
  const cCardText = '#1E293B';

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="1" dy="2" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.08" />
    </filter>
    <filter id="subtle" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="1" dy="1.5" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.05" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="#FFFFFF" />

  <!-- Title Banner (Top Center, y=20..62) -->
  <rect x="420" y="20" width="700" height="42" rx="6" fill="${cTitle}" filter="url(#shadow)" />
  <text x="770" y="47" font-family="'Segoe UI', Arial, sans-serif" font-size="16" font-weight="700" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">Entity Relationship Diagram (ERD) Log Book Kegiatan KEK</text>

  <!-- CONNECTOR LINES -->
  <g stroke="${cLine}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <!-- biro to attributes -->
    <line x1="280" y1="130" x2="190" y2="95" />
    <line x1="330" y1="130" x2="270" y2="75" />
    <line x1="380" y1="130" x2="380" y2="75" />
    <line x1="280" y1="160" x2="190" y2="165" />

    <!-- biro to tim_biro via menaungi -->
    <line x1="310" y1="182" x2="225" y2="230" />
    <line x1="225" y1="230" x2="180" y2="285" />

    <!-- tim_biro to attributes -->
    <line x1="120" y1="295" x2="70" y2="255" />
    <line x1="105" y1="310" x2="60" y2="310" />
    <line x1="120" y1="325" x2="70" y2="365" />

    <!-- biro to pengguna via mempekerjakan -->
    <line x1="430" y1="155" x2="650" y2="155" />
    <line x1="650" y1="155" x2="870" y2="155" />

    <!-- tim_biro to pengguna via beranggotakan -->
    <line x1="255" y1="300" x2="520" y2="240" />
    <line x1="520" y1="240" x2="870" y2="175" />

    <!-- pengguna to attributes (placed safely below banner y > 75) -->
    <line x1="910" y1="130" x2="870" y2="90" />
    <line x1="970" y1="130" x2="970" y2="90" />
    <line x1="1030" y1="145" x2="1110" y2="130" />
    <line x1="1030" y1="165" x2="1110" y2="180" />

    <!-- biro to kegiatan via menyelenggarakan -->
    <line x1="380" y1="182" x2="450" y2="300" />
    <line x1="450" y1="300" x2="580" y2="420" />

    <!-- pengguna to kegiatan via memimpin/PIC -->
    <line x1="930" y1="182" x2="830" y2="290" />
    <line x1="830" y1="290" x2="730" y2="420" />

    <!-- kegiatan to attributes (spread cleanly) -->
    <line x1="660" y1="420" x2="660" y2="365" />
    <line x1="745" y1="430" x2="860" y2="375" />
    <line x1="745" y1="465" x2="870" y2="525" />
    <line x1="680" y1="480" x2="710" y2="535" />
    <line x1="575" y1="430" x2="460" y2="365" />
    <line x1="575" y1="450" x2="450" y2="430" />
    <line x1="610" y1="480" x2="520" y2="545" />

    <!-- kegiatan to peserta_kegiatan via mengundang -->
    <line x1="575" y1="460" x2="380" y2="495" />
    <line x1="380" y1="495" x2="275" y2="535" />

    <!-- pengguna to peserta_kegiatan via menghadiri -->
    <line x1="890" y1="182" x2="510" y2="365" />
    <line x1="510" y1="365" x2="270" y2="520" />

    <!-- peserta_kegiatan to attributes -->
    <line x1="140" y1="520" x2="75" y2="485" />
    <line x1="140" y1="550" x2="75" y2="570" />

    <!-- kegiatan to lampiran_kegiatan via lampiran berkas (clear horizontal line) -->
    <line x1="745" y1="450" x2="980" y2="450" />
    <line x1="980" y1="450" x2="1170" y2="450" />

    <!-- lampiran_kegiatan to attributes -->
    <line x1="1310" y1="435" x2="1390" y2="405" />
    <line x1="1325" y1="450" x2="1405" y2="450" />
    <line x1="1310" y1="465" x2="1390" y2="495" />

    <!-- kegiatan to tindak_lanjut via menetapkan -->
    <line x1="660" y1="480" x2="660" y2="580" />
    <line x1="660" y1="580" x2="660" y2="680" />

    <!-- pengguna to tindak_lanjut via penugasan PIC -->
    <line x1="960" y1="182" x2="440" y2="640" />
    <line x1="440" y1="640" x2="575" y2="695" />

    <!-- tindak_lanjut to attributes -->
    <line x1="575" y1="695" x2="440" y2="695" />
    <line x1="585" y1="725" x2="465" y2="755" />
    <line x1="630" y1="732" x2="540" y2="795" />
    <line x1="745" y1="715" x2="860" y2="735" />

    <!-- tindak_lanjut to riwayat_tindak_lanjut via mencatat log -->
    <line x1="660" y1="732" x2="660" y2="810" />
    <line x1="660" y1="810" x2="660" y2="900" />

    <!-- riwayat_tindak_lanjut to attributes -->
    <line x1="570" y1="915" x2="430" y2="895" />
    <line x1="600" y1="952" x2="510" y2="985" />
    <line x1="750" y1="925" x2="855" y2="925" />
  </g>

  <!-- CARDINALITY LABELS (1 and N) -->
  <g font-family="'Segoe UI', Arial, sans-serif" font-size="13.5" font-weight="700" fill="${cCardText}">
    <!-- biro - tim_biro -->
    <text x="310" y="205">1</text>
    <text x="205" y="270">N</text>

    <!-- biro - pengguna -->
    <text x="440" y="148">1</text>
    <text x="850" y="148">N</text>

    <!-- tim_biro - pengguna -->
    <text x="270" y="290">1</text>
    <text x="855" y="190">N</text>

    <!-- biro - kegiatan -->
    <text x="400" y="210">1</text>
    <text x="560" y="400">N</text>

    <!-- pengguna - kegiatan -->
    <text x="915" y="215">1</text>
    <text x="750" y="400">N</text>

    <!-- kegiatan - peserta_kegiatan -->
    <text x="545" y="455">1</text>
    <text x="300" y="525">N</text>

    <!-- pengguna - peserta_kegiatan -->
    <text x="870" y="215">1</text>
    <text x="285" y="505">N</text>

    <!-- kegiatan - lampiran_kegiatan -->
    <text x="760" y="442">1</text>
    <text x="1150" y="442">N</text>

    <!-- kegiatan - tindak_lanjut -->
    <text x="672" y="505">1</text>
    <text x="672" y="665">N</text>

    <!-- pengguna - tindak_lanjut -->
    <text x="945" y="215">1</text>
    <text x="555" y="685">N</text>

    <!-- tindak_lanjut - riwayat_tindak_lanjut -->
    <text x="672" y="760">1</text>
    <text x="672" y="885">N</text>
  </g>

  <!-- RELATIONSHIP DIAMONDS (Belah Ketupat) -->
  <g stroke="${cRelBorder}" stroke-width="1.8" fill="${cRelFill}" filter="url(#subtle)">
    <!-- menaungi (cx=225, cy=230) -->
    <polygon points="225,208 285,230 225,252 165,230" />
    <!-- mempekerjakan (cx=650, cy=155) -->
    <polygon points="650,133 725,155 650,177 575,155" />
    <!-- beranggotakan (cx=520, cy=240) -->
    <polygon points="520,218 590,240 520,262 450,240" />
    <!-- menyelenggarakan (cx=450, cy=300) -->
    <polygon points="450,278 530,300 450,322 370,300" />
    <!-- memimpin / PIC (cx=830, cy=290) -->
    <polygon points="830,268 900,290 830,312 760,290" />
    <!-- mengundang (cx=380, cy=495) -->
    <polygon points="380,473 440,495 380,517 320,495" />
    <!-- menghadiri (cx=510, cy=365) -->
    <polygon points="510,343 570,365 510,387 450,365" />
    <!-- lampiran berkas (cx=980, cy=450) -->
    <polygon points="980,428 1050,450 980,472 910,450" />
    <!-- menetapkan (cx=660, cy=580) -->
    <polygon points="660,558 725,580 660,602 595,580" />
    <!-- penugasan PIC (cx=440, cy=640) -->
    <polygon points="440,618 510,640 440,662 370,640" />
    <!-- mencatat log (cx=660, cy=810) -->
    <polygon points="660,788 725,810 660,832 595,810" />
  </g>

  <!-- RELATIONSHIP LABELS -->
  <g font-family="'Segoe UI', Arial, sans-serif" font-size="11.5" font-weight="600" fill="${cRelText}" text-anchor="middle">
    <text x="225" y="234">menaungi</text>
    <text x="650" y="159">mempekerjakan</text>
    <text x="520" y="244">beranggotakan</text>
    <text x="450" y="304">menyelenggarakan</text>
    <text x="830" y="294">memimpin / PIC</text>
    <text x="380" y="499">mengundang</text>
    <text x="510" y="369">menghadiri</text>
    <text x="980" y="454">lampiran berkas</text>
    <text x="660" y="584">menetapkan</text>
    <text x="440" y="644">penugasan PIC</text>
    <text x="660" y="814">mencatat log</text>
  </g>

  <!-- ENTITY RECTANGLES -->
  <g stroke="${cEntityBorder}" stroke-width="2.2" fill="${cEntityFill}" filter="url(#shadow)">
    <!-- biro (w=155, h=52, x=275, y=130) -->
    <rect x="275" y="130" width="155" height="52" rx="4" />
    <!-- tim_biro (w=150, h=52, x=105, y=285) -->
    <rect x="105" y="285" width="150" height="52" rx="4" />
    <!-- pengguna (w=160, h=52, x=870, y=130) -->
    <rect x="870" y="130" width="160" height="52" rx="4" />
    <!-- kegiatan (w=170, h=60, x=575, y=420) -->
    <rect x="575" y="420" width="170" height="60" rx="4" />
    <!-- peserta_kegiatan (w=160, h=52, x=115, y=510) -->
    <rect x="115" y="510" width="160" height="52" rx="4" />
    <!-- lampiran_kegiatan (w=160, h=52, x=1170, y=425) -->
    <rect x="1170" y="425" width="160" height="52" rx="4" />
    <!-- tindak_lanjut (w=170, h=52, x=575, y=680) -->
    <rect x="575" y="680" width="170" height="52" rx="4" />
    <!-- riwayat_tindak_lanjut (w=180, h=52, x=570, y=900) -->
    <rect x="570" y="900" width="180" height="52" rx="4" />
  </g>

  <!-- ENTITY TEXT -->
  <g font-family="'Segoe UI', Arial, sans-serif" font-size="14.5" font-weight="700" fill="${cEntityText}" text-anchor="middle">
    <text x="352" y="162">biro</text>
    <text x="180" y="317">tim_biro</text>
    <text x="950" y="162">pengguna</text>
    <text x="660" y="457">kegiatan</text>
    <text x="195" y="542">peserta_kegiatan</text>
    <text x="1250" y="457">lampiran_kegiatan</text>
    <text x="660" y="712">tindak_lanjut</text>
    <text x="660" y="932">riwayat_tindak_lanjut</text>
  </g>

  <!-- ATTRIBUTE ELLIPSES (PK and Regular) -->
  <!-- PK Ellipses (Golden/Amber) -->
  <g stroke="${cPkBorder}" stroke-width="1.8" fill="${cPkFill}" filter="url(#subtle)">
    <!-- id_biro* -->
    <ellipse cx="145" cy="95" rx="46" ry="17" />
    <!-- id_tim* -->
    <ellipse cx="45" cy="250" rx="42" ry="17" />
    <!-- id_pengguna* (placed clean at right side) -->
    <ellipse cx="1160" cy="130" rx="52" ry="17" />
    <!-- id_kegiatan* -->
    <ellipse cx="660" cy="350" rx="52" ry="17" />
    <!-- id_peserta* -->
    <ellipse cx="48" cy="475" rx="48" ry="17" />
    <!-- id_lampiran* -->
    <ellipse cx="1435" cy="400" rx="52" ry="17" />
    <!-- id_tindak_lanjut* -->
    <ellipse cx="385" cy="695" rx="60" ry="17" />
    <!-- id_riwayat* -->
    <ellipse cx="385" cy="890" rx="48" ry="17" />
  </g>

  <!-- PK Labels (Underlined Bold) -->
  <g font-family="'Segoe UI', Arial, sans-serif" font-size="11" font-weight="700" fill="${cPkText}" text-anchor="middle">
    <text x="145" y="99" text-decoration="underline">id_biro*</text>
    <text x="45" y="254" text-decoration="underline">id_tim*</text>
    <text x="1160" y="134" text-decoration="underline">id_pengguna*</text>
    <text x="660" y="354" text-decoration="underline">id_kegiatan*</text>
    <text x="48" y="479" text-decoration="underline">id_peserta*</text>
    <text x="1435" y="404" text-decoration="underline">id_lampiran*</text>
    <text x="385" y="699" text-decoration="underline">id_tindak_lanjut*</text>
    <text x="380" y="894" text-decoration="underline">id_riwayat*</text>
  </g>

  <!-- Regular Attributes (Slate/White) -->
  <g stroke="${cAttBorder}" stroke-width="1.3" fill="${cAttFill}" filter="url(#subtle)">
    <!-- biro atts -->
    <ellipse cx="255" cy="65" rx="44" ry="15" />
    <ellipse cx="370" cy="65" rx="46" ry="15" />
    <ellipse cx="145" cy="165" rx="46" ry="15" />

    <!-- tim_biro atts -->
    <ellipse cx="40" cy="310" rx="38" ry="15" />
    <ellipse cx="45" cy="365" rx="42" ry="15" />

    <!-- pengguna atts (below y=70) -->
    <ellipse cx="865" cy="85" rx="48" ry="15" />
    <ellipse cx="975" cy="85" rx="38" ry="15" />
    <ellipse cx="1155" cy="180" rx="35" ry="15" />

    <!-- kegiatan atts (cleanly separated) -->
    <ellipse cx="410" cy="365" rx="52" ry="15" />
    <ellipse cx="400" cy="430" rx="50" ry="15" />
    <ellipse cx="470" cy="565" rx="48" ry="15" />
    <ellipse cx="910" cy="375" rx="55" ry="15" />
    <ellipse cx="720" cy="545" rx="52" ry="15" />
    <ellipse cx="920" cy="525" rx="54" ry="15" />

    <!-- peserta_kegiatan atts -->
    <ellipse cx="48" cy="575" rx="54" ry="15" />

    <!-- lampiran_kegiatan atts -->
    <ellipse cx="1450" cy="450" rx="48" ry="15" />
    <ellipse cx="1440" cy="505" rx="42" ry="15" />

    <!-- tindak_lanjut atts (NO skala_prioritas!) -->
    <ellipse cx="410" cy="755" rx="52" ry="15" />
    <ellipse cx="500" cy="805" rx="50" ry="15" />
    <ellipse cx="905" cy="745" rx="60" ry="15" />

    <!-- riwayat_tindak_lanjut atts (NO persentase_progres!) -->
    <ellipse cx="465" cy="990" rx="52" ry="15" />
    <ellipse cx="905" cy="925" rx="48" ry="15" />
  </g>

  <!-- Regular Attribute Labels -->
  <g font-family="'Segoe UI', Arial, sans-serif" font-size="10.5" font-weight="500" fill="${cAttText}" text-anchor="middle">
    <!-- biro atts -->
    <text x="255" y="69">kode_biro</text>
    <text x="370" y="69">nama_biro</text>
    <text x="145" y="169">status_aktif</text>

    <!-- tim_biro atts -->
    <text x="40" y="314">kode_tim</text>
    <text x="45" y="369">nama_tim</text>

    <!-- pengguna atts -->
    <text x="865" y="89">nama_lengkap</text>
    <text x="975" y="89">email</text>
    <text x="1155" y="184">peran</text>

    <!-- kegiatan atts -->
    <text x="410" y="369">lokasi_kegiatan</text>
    <text x="400" y="434">status_kegiatan</text>
    <text x="470" y="569">catatan_hasil</text>
    <text x="910" y="379">nomor_kegiatan</text>
    <text x="720" y="549">judul_kegiatan</text>
    <text x="920" y="529">tanggal_kegiatan</text>

    <!-- peserta_kegiatan atts -->
    <text x="48" y="579">status_kehadiran</text>

    <!-- lampiran_kegiatan atts -->
    <text x="1450" y="454">nama_berkas</text>
    <text x="1440" y="509">kategori</text>

    <!-- tindak_lanjut atts -->
    <text x="410" y="759">judul_tindakan</text>
    <text x="500" y="809">tenggat_waktu</text>
    <text x="905" y="749">status_tindak_lanjut</text>

    <!-- riwayat_tindak_lanjut atts -->
    <text x="465" y="994">catatan_progres</text>
    <text x="905" y="929">status_terbaru</text>
  </g>
</svg>`;

  return svg;
}

async function run() {
  const svg = generateCleanChenErd();

  const svgPath = path.join(__dirname, '..', 'public', 'erd_chen_diagram.svg');
  const pngPath = path.join(__dirname, '..', 'public', 'erd_chen_diagram.png');
  const docsPngPath = path.join(__dirname, '..', 'docs', 'erd_diagram_standar.png');
  const publicPngStandar = path.join(__dirname, '..', 'public', 'erd_diagram_standar.png');
  const scratchPng = 'C:/Users/nappz/.gemini/antigravity-ide/brain/b9fa66d1-1095-4cd4-abd9-f1c376cc4de1/scratch/clean_chen_erd.png';

  fs.writeFileSync(svgPath, svg, 'utf8');
  console.log('Saved ' + svgPath);

  // Convert to high-res PNG with Sharp
  await sharp(Buffer.from(svg))
    .png({ quality: 100 })
    .toFile(pngPath);
  console.log('Saved ' + pngPath);

  fs.copyFileSync(pngPath, docsPngPath);
  fs.copyFileSync(pngPath, publicPngStandar);
  fs.copyFileSync(pngPath, scratchPng);
  console.log('Copied to docs, public, and scratch!');
}

run().catch(console.error);
