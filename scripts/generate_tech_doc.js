const fs = require('fs');

const TARGET_DOC_ID = '1UlcjKxBuI8320KcQnWZUAUfVI9i08yggW7Kh1aTPiBg';

async function getValidAccessToken() {
  const keys = JSON.parse(fs.readFileSync('C:/Users/nappz/.config/google-drive-mcp/gcp-oauth.keys.json', 'utf8'));
  const tokens = JSON.parse(fs.readFileSync('C:/Users/nappz/.config/google-drive-mcp/tokens.json', 'utf8'));
  const account = tokens.accounts[tokens.defaultAccount];

  const clientId = keys.installed?.client_id || keys.web?.client_id;
  const clientSecret = keys.installed?.client_secret || keys.web?.client_secret;

  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('refresh_token', account.refreshToken);
  params.append('grant_type', 'refresh_token');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  const data = await res.json();
  if (data.access_token) {
    account.accessToken = data.access_token;
    account.expiryDate = Date.now() + (data.expires_in * 1000);
    account.lastRefreshedAt = Date.now();
    fs.writeFileSync('C:/Users/nappz/.config/google-drive-mcp/tokens.json', JSON.stringify(tokens, null, 2));
    return data.access_token;
  }
  return account.accessToken;
}

// Proportional image sizes so Heading + Image + Caption + Explanation always fit on the same page
const IMAGE_PLACEHOLDERS = [
  {
    token: '[[IMAGE_LOGO_KEK]]',
    uri: 'https://drive.google.com/uc?id=1AKT1iBrvuP-BNA7K_4hYfptOuGY0OGns&export=download',
    width: 80,
    height: 80
  },
  {
    token: '[[IMAGE_USE_CASE]]',
    uri: 'https://drive.google.com/uc?id=1UhBx0itPWdDI6qze2R3BeFmXWeq1nvUt&export=download',
    width: 240,
    height: 231
  },
  {
    token: '[[IMAGE_ACTIVITY_1]]',
    uri: 'https://drive.google.com/uc?id=1TXIowJidE0XQ4Cp3v_DAzHWQzgQ_4OtA&export=download',
    width: 204,
    height: 230
  },
  {
    token: '[[IMAGE_ACTIVITY_2]]',
    uri: 'https://drive.google.com/uc?id=1bDeIE8O58v-S5gXEMy3GtOkVZLaE1NqV&export=download',
    width: 253,
    height: 230
  },
  {
    token: '[[IMAGE_ACTIVITY_3]]',
    uri: 'https://drive.google.com/uc?id=1q_S5PGMZNXiTqfLIchFxpPKrvQZOoGEB&export=download',
    width: 302,
    height: 230
  },
  {
    token: '[[IMAGE_ARCHITECTURE]]',
    uri: 'https://drive.google.com/uc?id=1uR11sH_TPdPj9YIAE8NNd-Ko_NjuW0oM&export=download',
    width: 360,
    height: 240
  },
  {
    token: '[[IMAGE_ERD]]',
    uri: 'https://drive.google.com/uc?id=1z9adGxKYry7qTjenm4-5SFWYpYAuHu-z&export=download',
    width: 360,
    height: 241
  },
  {
    token: '[[IMAGE_LRS]]',
    uri: 'https://drive.google.com/uc?id=1ozG8cPsuXSXRSo-g506oGG558TV6WhK1&export=download',
    width: 275,
    height: 250
  }
];

async function replacePlaceholderWithImage(docId, accessToken, placeholder) {
  const res = await fetch(`https://docs.googleapis.com/v1/documents/${docId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const doc = await res.json();

  let targetStart = null;
  let targetEnd = null;
  let pStart = null;

  for (const el of doc.body.content) {
    if (el.paragraph) {
      const fullText = el.paragraph.elements?.map(e => e.textRun?.content || '').join('') || '';
      const idx = fullText.indexOf(placeholder.token);
      if (idx !== -1) {
        pStart = el.startIndex;
        targetStart = el.startIndex + idx;
        targetEnd = targetStart + placeholder.token.length;
        break;
      }
    }
  }

  if (targetStart === null) {
    console.warn(`Placeholder ${placeholder.token} not found!`);
    return;
  }

  console.log(`Inserting image for ${placeholder.token} at index ${targetStart}...`);

  const requests = [
    {
      deleteContentRange: {
        range: { startIndex: targetStart, endIndex: targetEnd }
      }
    },
    {
      insertInlineImage: {
        uri: placeholder.uri,
        location: { index: targetStart },
        objectSize: {
          width: { magnitude: placeholder.width, unit: 'PT' },
          height: { magnitude: placeholder.height, unit: 'PT' }
        }
      }
    },
    {
      updateParagraphStyle: {
        range: { startIndex: pStart, endIndex: pStart + 2 },
        paragraphStyle: {
          alignment: 'CENTER',
          keepWithNext: placeholder.token !== '[[IMAGE_LOGO_KEK]]',
          keepLinesTogether: true
        },
        fields: 'alignment,keepWithNext,keepLinesTogether'
      }
    }
  ];

  const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requests })
  });

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Failed to insert image ${placeholder.token}: ${errText}`);
  }
  console.log(`Successfully inserted image for ${placeholder.token}!`);
}

async function applyCleanPagination(docId, accessToken) {
  console.log('5. Merapikan tata letak halaman (keepWithNext, keepLinesTogether & compact table cells) agar tidak ada subbab/gambar/tabel yang terpotong...');
  const res = await fetch(`https://docs.googleapis.com/v1/documents/${docId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const doc = await res.json();
  const content = doc.body.content || [];

  const keepWithNextRanges = [];
  const keepLinesRanges = [];
  const compactCellRanges = [];
  const pageBreakBeforeRanges = [];

  for (let i = 0; i < content.length; i++) {
    const el = content[i];

    if (el.paragraph) {
      const styleType = el.paragraph.paragraphStyle?.namedStyleType || '';
      const hasInlineImage = el.paragraph.elements?.some(e => Boolean(e.inlineObjectElement));
      const text = (el.paragraph.elements?.map(e => e.textRun?.content || '').join('') || '').trim();

      // Add clean pageBreakBefore on specific section/table headings that would otherwise split a table across pages
      if (
        text === '3.4. Technology Stack' ||
        text === '4.3. Spesifikasi Basis Data (Data Dictionary)' ||
        text === 'Tabel 4.4. Spesifikasi Tabel Kegiatan (kegiatan)' ||
        text === 'Tabel 4.5. Spesifikasi Tabel Peserta Kegiatan (peserta_kegiatan)' ||
        text === 'Tabel 4.8. Spesifikasi Tabel Berkas Lampiran Kegiatan (lampiran_kegiatan)' ||
        text === '5. Struktur Folder Sistem'
      ) {
        pageBreakBeforeRanges.push({ startIndex: el.startIndex, endIndex: el.endIndex });
      }

      // All non-empty paragraphs: keepLinesTogether + avoidWidowAndOrphan
      if (el.startIndex && el.endIndex > el.startIndex) {
        keepLinesRanges.push({ startIndex: el.startIndex, endIndex: el.endIndex });
      }

      // 1. Every Heading (H1, H2, H3, H4) must stick to the element after it
      if (styleType.startsWith('HEADING_')) {
        keepWithNextRanges.push({ startIndex: el.startIndex, endIndex: el.endIndex });
      }

      // 2. If this paragraph contains a diagram image (not the top logo at i <= 2):
      //    - Glue up to 3 preceding paragraphs (sub-heading + intro text)
      //    - Glue the image paragraph itself
      //    - Glue the caption paragraph (i + 1) AND the first explanation paragraph/item (i + 2, i + 3)
      //      so a diagram is NEVER left at the bottom of a page without its explanation below it!
      if (hasInlineImage && i > 3) {
        keepWithNextRanges.push({ startIndex: el.startIndex, endIndex: el.endIndex });
        for (let back = 1; back <= 3; back++) {
          const prev = content[i - back];
          if (prev && prev.paragraph && prev.startIndex) {
            keepWithNextRanges.push({ startIndex: prev.startIndex, endIndex: prev.endIndex });
            const prevStyle = prev.paragraph.paragraphStyle?.namedStyleType || '';
            if (prevStyle === 'HEADING_3' || prevStyle === 'HEADING_4') {
              const aboveHeading = content[i - back - 1];
              if (aboveHeading && aboveHeading.paragraph && (aboveHeading.paragraph.paragraphStyle?.namedStyleType || '').startsWith('HEADING_')) {
                keepWithNextRanges.push({ startIndex: aboveHeading.startIndex, endIndex: aboveHeading.endIndex });
              }
              break;
            }
          }
        }
        // Also glue caption (i + 1) and the explanation intro (i + 2) so the explanation starts on the SAME page as the diagram!
        for (let fwd = 1; fwd <= 2; fwd++) {
          const nextEl = content[i + fwd];
          if (nextEl && nextEl.paragraph && nextEl.startIndex) {
            keepWithNextRanges.push({ startIndex: nextEl.startIndex, endIndex: nextEl.endIndex });
          }
        }
      }

      // 3. Any paragraph starting with "Gambar ", "Tabel ", or ending with ":"
      if (text.startsWith('Gambar ') || text.startsWith('Tabel ') || text.endsWith(':')) {
        keepWithNextRanges.push({ startIndex: el.startIndex, endIndex: el.endIndex });
      }
    }

    // 4. If this element is a Table:
    //    - Glue the 1-2 paragraphs above the table (table title / intro sentence)
    //    - Make all table cell paragraphs compact (spaceAbove=1pt, spaceBelow=1pt, lineSpacing=105)
    //    - Glue ALL rows (except the very last row) so that NO table is ever split in half across two pages!
    if (el.table) {
      for (let back = 1; back <= 2; back++) {
        const prev = content[i - back];
        if (prev && prev.paragraph && prev.startIndex) {
          keepWithNextRanges.push({ startIndex: prev.startIndex, endIndex: prev.endIndex });
        }
      }

      const rows = el.table.tableRows || [];
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const isBeforeLastRow = r < rows.length - 1;
        for (const cell of row.tableCells || []) {
          for (const cellEl of cell.content || []) {
            if (cellEl.paragraph && cellEl.startIndex) {
              const rng = { startIndex: cellEl.startIndex, endIndex: cellEl.endIndex };
              compactCellRanges.push(rng);
              if (isBeforeLastRow) {
                keepWithNextRanges.push(rng);
              }
            }
          }
        }
      }
    }
  }

  const requests = [];

  for (const rng of keepLinesRanges) {
    requests.push({
      updateParagraphStyle: {
        range: rng,
        paragraphStyle: {
          keepLinesTogether: true,
          avoidWidowAndOrphan: true
        },
        fields: 'keepLinesTogether,avoidWidowAndOrphan'
      }
    });
  }

  for (const rng of compactCellRanges) {
    requests.push({
      updateParagraphStyle: {
        range: rng,
        paragraphStyle: {
          spaceAbove: { magnitude: 1, unit: 'PT' },
          spaceBelow: { magnitude: 1, unit: 'PT' },
          lineSpacing: 105,
          keepLinesTogether: true,
          avoidWidowAndOrphan: true
        },
        fields: 'spaceAbove,spaceBelow,lineSpacing,keepLinesTogether,avoidWidowAndOrphan'
      }
    });
  }

  for (const rng of keepWithNextRanges) {
    requests.push({
      updateParagraphStyle: {
        range: rng,
        paragraphStyle: {
          keepWithNext: true,
          keepLinesTogether: true,
          avoidWidowAndOrphan: true
        },
        fields: 'keepWithNext,keepLinesTogether,avoidWidowAndOrphan'
      }
    });
  }

  for (const rng of pageBreakBeforeRanges) {
    requests.push({
      updateParagraphStyle: {
        range: rng,
        paragraphStyle: {
          pageBreakBefore: true,
          keepWithNext: true,
          keepLinesTogether: true
        },
        fields: 'pageBreakBefore,keepWithNext,keepLinesTogether'
      }
    });
  }

  if (requests.length > 0) {
    const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });
    if (!updateRes.ok) {
      console.warn('Warning applying pagination styles:', await updateRes.text());
    } else {
      console.log(`   Berhasil menerapkan aturan halaman (keepWithNext & compact table) pada ${keepWithNextRanges.length} blok!`);
    }
  }
}

async function main() {
  const accessToken = await getValidAccessToken();

  console.log('1. Menyusun naskah Dokumen Teknis Pengembangan Website Aplikasi Log Book Kegiatan KEK...');

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Dokumen Teknis Pengembangan Website Aplikasi Log Book Kegiatan KEK</title>
  <style>
    body {
      font-family: Cambria, Calibri, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #1a1a1a;
    }
    h1 {
      font-family: Calibri, Arial, sans-serif;
      font-size: 15.5pt;
      font-weight: bold;
      text-align: center;
      margin-top: 8pt;
      margin-bottom: 14pt;
      color: #1f3864;
      text-transform: uppercase;
    }
    h2 {
      font-family: Calibri, Arial, sans-serif;
      font-size: 13.5pt;
      font-weight: bold;
      margin-top: 14pt;
      margin-bottom: 5pt;
      color: #2f5496;
    }
    h3 {
      font-family: Calibri, Arial, sans-serif;
      font-size: 12pt;
      font-weight: bold;
      margin-top: 10pt;
      margin-bottom: 4pt;
      color: #2f5496;
    }
    h4 {
      font-family: Calibri, Arial, sans-serif;
      font-size: 11pt;
      font-weight: bold;
      margin-top: 8pt;
      margin-bottom: 3pt;
      color: #1f3864;
    }
    p {
      margin-top: 0;
      margin-bottom: 6pt;
      text-align: justify;
    }
    .center-p {
      text-align: center;
      margin-top: 4pt;
      margin-bottom: 4pt;
    }
    .caption {
      text-align: center;
      font-weight: bold;
      font-size: 10pt;
      color: #333333;
      margin-top: 2pt;
      margin-bottom: 8pt;
    }
    ul, ol {
      margin-top: 2pt;
      margin-bottom: 6pt;
      padding-left: 20pt;
    }
    li {
      margin-bottom: 2.5pt;
      text-align: justify;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4pt;
      margin-bottom: 10pt;
      font-size: 9.5pt;
    }
    table, th, td {
      border: 1px solid #000000;
    }
    th {
      background-color: #f2f4f7;
      color: #000000;
      font-weight: bold;
      text-align: center;
      padding: 5pt 7pt;
    }
    td {
      padding: 4pt 7pt;
      vertical-align: top;
    }
    .center {
      text-align: center;
    }
  </style>
</head>
<body>

  <p class="center-p">[[IMAGE_LOGO_KEK]]</p>
  <h1>DOKUMEN TEKNIS PENGEMBANGAN WEBSITE APLIKASI LOG BOOK KEGIATAN KEK</h1>

  <h2>1. Pendahuluan</h2>

  <h3>1.1. Latar Belakang</h3>
  <p>Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus (Setjen DN KEK) memiliki peran strategis dalam memberikan dukungan teknis dan administratif kepada Dewan Nasional KEK guna merumuskan kebijakan, menyelesaikan hambatan investasi, serta mengawasi perkembangan Kawasan Ekonomi Khusus (KEK) di seluruh Indonesia. Dalam menjalankan mandat tersebut, koordinasi intensif dilaksanakan melalui berbagai agenda kegiatan, baik naskah resmi masuk, disposisi pimpinan (Sekjen dan Karo), rapat koordinasi lintas biro (seperti Biro Investasi, Kerja Sama, dan Komunikasi), kegiatan internal, hingga laporan rutin bersama kementerian, lembaga, dan badan usaha pengelola KEK.</p>

  <p>Namun demikian, proses tata kelola penjadwalan dan pencatatan log book kegiatan pada Setjen KEK sebelumnya masih menghadapi berbagai tantangan operasional. Pencatatan agenda kegiatan, penataan jadwal kalender, serta pengarsipan dokumen log book pendukung (surat undangan, nota konsumsi, bahan tayang materi paparan, tautan rilis publikasi, hingga catatan hasil kegiatan) sebagian besar masih dilakukan secara konvensional atau tersebar di berbagai media terpisah (spreadsheet, grup perpesanan, dan folder penyimpanan lokal). Kondisi ini menyebabkan informasi jadwal rawan bentrok, dokumen berkas rentan tercecer, serta pencarian kembali (<em>information retrieval</em>) riwayat kegiatan memerlukan waktu yang relatif lama.</p>

  <p>Permasalahan krusial lainnya terletak pada pemantauan status progres pelaksanaan kegiatan dan butir tindak lanjut berdasarkan klasifikasi naskah. Tingginya intensitas disposisi pimpinan (Disposisi Sekjen dan Disposisi Karo) serta naskah masuk membutuhkan klasifikasi kategori yang terstruktur dan penunjukan <em>Person in Charge</em> (PIC) yang jelas. Ketiadaan sistem terpusat yang mengintegrasikan kalender jadwal dengan repositori berkas dokumen menyebabkan pimpinan kesulitan memantau realisasi pelaksanaan kegiatan secara komprehensif.</p>

  <p>Oleh karena itu, dikembangkanlah sistem berbasis website <strong>Aplikasi Log Book Kegiatan KEK</strong> yang mampu mengelola seluruh siklus penjadwalan kegiatan, sentralisasi pencatatan dokumen log book pendukung, serta pemantauan status progres tindak lanjut secara terintegrasi. Pengembangan website ini diharapkan dapat meningkatkan tertib administrasi, mempercepat akses informasi kegiatan lintas biro dan tim kerja, serta mendukung prinsip transparansi dan akuntabilitas di lingkungan Sekretariat Jenderal Dewan Nasional KEK.</p>

  <h3>1.2. Tujuan Dokumen</h3>
  <p>Dokumen teknis ini disusun dengan tujuan untuk:</p>
  <ol>
    <li>Menjadi acuan teknis dalam pengembangan, pengujian, dan pengelolaan website Aplikasi Log Book Kegiatan KEK.</li>
    <li>Memberikan gambaran menyeluruh terkait arsitektur sistem, pemodelan diagram UML, dan desain antarmuka sistem.</li>
    <li>Mendokumentasikan struktur sistem, desain database (ERD, LRS, dan spesifikasi tabel basis data), serta alur proses bisnis utama.</li>
    <li>Memudahkan proses pengembangan lanjutan dan pemeliharaan sistem secara berkelanjutan.</li>
    <li>Menjadi referensi resmi bagi tim teknis, pengembang, dan pemangku kepentingan terkait di lingkungan Sekretariat Jenderal Dewan Nasional KEK.</li>
  </ol>

  <h3>1.3. Ruang Lingkup Sistem</h3>
  <p>Ruang lingkup pengembangan website Aplikasi Log Book Kegiatan KEK mencakup seluruh proses pengelolaan jadwal agenda dan pencatatan dokumen log book berbasis elektronik, antara lain:</p>
  <ol>
    <li>Pencatatan dan penjadwalan kegiatan baru berdasarkan klasifikasi kategori naskah (Naskah Masuk, Disposisi Sekjen, Disposisi Karo, Kegiatan Internal, dan Laporan Rutin).</li>
    <li>Penerbitan nomor registrasi kegiatan secara otomatis dan sinkronisasi jadwal pada kalender kegiatan terpadu.</li>
    <li>Pengelolaan daftar pihak dan aparatur terkait kegiatan (undangan internal maupun eksternal) sebagai rujukan log book kegiatan.</li>
    <li>Pencatatan dan pengarsipan berkas dokumen log book kegiatan (surat undangan, nota konsumsi, materi paparan, dan tautan rilis publikasi).</li>
    <li>Pencatatan ringkasan pokok catatan hasil kegiatan dan rencana aksi.</li>
    <li>Pengelolaan matriks tindak lanjut (<em>action items</em>), penunjukan staf PIC penanggung jawab, serta penetapan tenggat waktu (<em>deadline</em>).</li>
    <li>Monitoring dan pembaruan status progres kegiatan serta tindak lanjut dalam 3 tahapan resmi (<strong>Belum Dimulai</strong>, <strong>Dalam Proses</strong>, dan <strong>Selesai</strong>).</li>
    <li>Manajemen pengguna berbasis peran (Staf Pelaksana, Admin Biro/Tim, dan Super Admin/Pimpinan) serta pengelolaan data master biro dan tim kerja KEK.</li>
    <li>Fitur filter pencarian log book kegiatan, visualisasi dashboard eksekutif, serta ekspor laporan rekapitulasi (PDF/Excel/Word).</li>
  </ol>

  <h3>1.4. Definisi Istilah</h3>
  <p>Berikut beberapa istilah yang digunakan dalam dokumen ini:</p>
  <ol>
    <li><strong>Aplikasi Log Book Kegiatan:</strong> Sistem informasi berbasis web untuk pengelolaan jadwal agenda kegiatan, pencatatan dokumen log book pendukung, dan pemantauan tindak lanjut pada Sekretariat Jenderal Dewan Nasional KEK.</li>
    <li><strong>Nomor Registrasi Kegiatan:</strong> Kode pengenal unik yang diterbitkan secara otomatis oleh sistem untuk mengidentifikasi setiap rekaman agenda kegiatan.</li>
    <li><strong>Kategori Naskah:</strong> Klasifikasi sumber penugasan kegiatan yang meliputi Naskah Masuk, Disposisi Sekjen, Disposisi Karo, Kegiatan Internal, dan Laporan Rutin.</li>
    <li><strong>Dokumen Log Book:</strong> Berkas digital pendukung pelaksanaan kegiatan yang diarsipkan ke dalam sistem, mencakup surat undangan, nota konsumsi, materi paparan, catatan hasil, dan tautan rilis berita.</li>
    <li><strong>Tindak Lanjut (<em>Action Item</em>):</strong> Butir arahan komitmen penugasan hasil pembahasan kegiatan yang wajib diselesaikan oleh tim kerja dan staf PIC dalam tenggat waktu tertentu.</li>
    <li><strong>PIC (<em>Person in Charge</em>):</strong> Pegawai atau staf pelaksana yang ditunjuk sebagai penanggung jawab pelaksanaan agenda kegiatan maupun penyelesaian butir tindak lanjut.</li>
    <li><strong>Staf Pelaksana:</strong> Pengguna operasional yang bertugas melaksanakan penugasan kegiatan, mengunggah berkas eviden, dan memperbarui status progres kegiatan.</li>
    <li><strong>Admin Biro / Tim:</strong> Pengguna pengelola administrasi pada biro atau tim kerja KEK yang bertugas mencatat jadwal kegiatan, mengelola dokumen log book, dan mengelola tindak lanjut.</li>
    <li><strong>Super Admin / Pimpinan:</strong> Pengguna dengan hak akses penuh terhadap seluruh data sistem, monitoring kinerja lintas tim kerja, serta manajemen data master pengguna dan unit kerja.</li>
    <li><strong>Biro &amp; Tim Kerja:</strong> Struktur unit organisasi Eselon II dan kelompok kerja teknis di lingkungan Setjen DN KEK (seperti Biro IKK yang menaungi Tim Investasi, Tim Kerja Sama, dan Tim Komunikasi).</li>
    <li><strong>Frontend:</strong> Bagian sistem yang berinteraksi langsung dengan pengguna melalui tampilan antarmuka website.</li>
    <li><strong>Backend:</strong> Bagian sistem yang mengelola logika aplikasi, otorisasi keamanan, validasi data, dan interaksi database.</li>
  </ol>

  <h2>2. Gambaran Umum Sistem</h2>

  <h3>2.1. Deskripsi Sistem</h3>
  <p>Website Aplikasi Log Book Kegiatan merupakan sistem informasi berbasis web yang dikembangkan untuk mendukung digitalisasi tata kelola penjadwalan agenda dan pengarsipan dokumen log book kegiatan secara terpusat di lingkungan Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus. Sistem ini memungkinkan unit kerja untuk mencatat jadwal kegiatan berdasarkan klasifikasi naskah, mendokumentasikan catatan hasil kegiatan, serta menyimpan berkas pendukung dalam satu repositori terpadu.</p>

  <p>Sistem juga digunakan oleh Admin Biro/Tim, Staf Pelaksana (PIC), dan Pimpinan untuk memantau perkembangan status pelaksanaan kegiatan serta matriks tindak lanjut pasca-kegiatan secara transparan dalam tiga tahapan status resmi, yaitu <em>Belum Dimulai</em>, <em>Dalam Proses</em>, dan <em>Selesai</em>.</p>

  <p>Aplikasi Log Book Kegiatan dirancang terintegrasi antara sisi antarmuka pengguna (<em>frontend</em>) dan sisi pengelola logika bisnis serta basis data (<em>backend</em>), sehingga seluruh siklus pencatatan kegiatan kedinasan dapat dilakukan secara efektif, transparan, dan terdokumentasi dengan baik.</p>

  <h3>2.2. Aktor / Pengguna</h3>
  <p>Berdasarkan analisis kebutuhan fungsional, sistem melibatkan 3 (tiga) tingkatan peran pengguna berbasis <em>Role-Based Access Control</em> (RBAC) sebagaimana divisualisasikan pada Use Case Diagram berikut:</p>

  <p class="center-p">[[IMAGE_USE_CASE]]</p>
  <p class="caption">Gambar 2.1. Use Case Diagram Aplikasi Log Book Kegiatan KEK</p>

  <p>Adapun pembagian peran dan hak akses masing-masing pengguna adalah sebagai berikut:</p>
  <ol>
    <li><strong>Staf Pelaksana (Pegawai / PIC):</strong>
      <ul>
        <li>Melakukan autentikasi login ke dalam sistem.</li>
        <li>Melihat dashboard ringkasan dan kalender jadwal agenda kegiatan.</li>
        <li>Melakukan filter dan pencarian data pada log book kegiatan.</li>
        <li>Mengunduh berkas dokumen lampiran serta laporan rekapitulasi kegiatan.</li>
        <li>Memperbarui status progres kegiatan dan tindak lanjut ke dalam 3 tahapan (<em>Belum Dimulai</em>, <em>Dalam Proses</em>, dan <em>Selesai</em>).</li>
      </ul>
    </li>
    <li><strong>Admin Biro / Tim (Pengelola Log Book Kegiatan):</strong>
      <ul>
        <li>Memiliki seluruh hak akses Staf Pelaksana pada lingkup biro/tim kerjanya.</li>
        <li>Melakukan pencatatan dan penjadwalan kegiatan baru (Naskah Masuk, Disposisi Sekjen, Disposisi Karo, Kegiatan Internal, dan Laporan Rutin).</li>
        <li>Mengelola daftar pihak terkait / undangan kegiatan resmi.</li>
        <li>Mengunggah berkas dokumen log book kegiatan (undangan, nota konsumsi, materi paparan, dan tautan rilis) serta mencatat ringkasan hasil kegiatan.</li>
        <li>Menetapkan dan mengelola butir tindak lanjut (<em>action items</em>) beserta staf PIC penanggung jawab.</li>
        <li>Mengekspor laporan rekapitulasi kegiatan dan matriks tindak lanjut (PDF/Excel/Word).</li>
      </ul>
    </li>
    <li><strong>Super Admin / Pimpinan:</strong>
      <ul>
        <li>Memiliki hak akses penuh terhadap seluruh fitur dan data kegiatan lintas biro dan tim kerja.</li>
        <li>Memantau ringkasan eksekutif pada dashboard serta melakukan monitoring kinerja tim kerja KEK secara berkala.</li>
        <li>Meninjau kelengkapan dokumen log book, catatan hasil kegiatan, dan capaian penyelesaian tindak lanjut.</li>
        <li>Mengelola data master pengguna, biro, tim kerja, serta pengaturan hak akses sistem.</li>
      </ul>
    </li>
  </ol>

  <h3>2.3. Alur Proses Utama</h3>

  <h4>1. Alur Penjadwalan Kegiatan</h4>
  <p class="center-p">[[IMAGE_ACTIVITY_1]]</p>
  <p class="caption">Gambar 2.2. Activity Diagram Alur Penjadwalan Kegiatan</p>

  <p>Berikut merupakan alur pencatatan dan penjadwalan kegiatan baru:</p>
  <ol>
    <li>Admin Biro atau Tim Pemrakarsa memilih menu <strong>Catat Kegiatan Baru</strong> dan memilih klasifikasi kategori naskah kegiatan.</li>
    <li>Sistem menampilkan formulir input jadwal dan menerbitkan nomor registrasi kegiatan secara otomatis.</li>
    <li>Admin mengisi rincian formulir meliputi judul agenda, tanggal dan waktu pelaksanaan, lokasi/ruang kegiatan, penunjukan staf PIC, serta daftar pihak terkait.</li>
    <li>Sistem melakukan verifikasi kelengkapan data masukan wajib:
      <ul>
        <li>Jika data belum lengkap, sistem menampilkan notifikasi validasi dan menyorot kolom isian yang kurang.</li>
        <li>Jika data telah lengkap, sistem menyimpan agenda ke dalam database dengan status awal <strong>Belum Dimulai</strong>.</li>
      </ul>
    </li>
    <li>Sistem mengirimkan konfirmasi pencatatan kepada Admin Biro serta notifikasi penugasan agenda kepada Staf/PIC terkait, sekaligus menyinkronkan jadwal ke Kalender Dinas.</li>
    <li>Staf/PIC melaksanakan kegiatan (status diperbarui menjadi <strong>Dalam Proses</strong>) hingga kegiatan selesai dilaksanakan dan status ditetapkan menjadi <strong>Selesai</strong>.</li>
  </ol>

  <h4>2. Alur Pencatatan Dokumen dan Catatan Hasil Kegiatan</h4>
  <p class="center-p">[[IMAGE_ACTIVITY_2]]</p>
  <p class="caption">Gambar 2.3. Activity Diagram Alur Pencatatan Dokumen &amp; Catatan Hasil Kegiatan</p>

  <p>Berikut merupakan alur pencatatan dokumen log book dan catatan hasil kegiatan:</p>
  <ol>
    <li>Admin Biro atau Staf PIC membuka rincian kegiatan dan memilih tab <strong>Dokumen &amp; Catatan Hasil</strong>.</li>
    <li>Pengguna mengunggah berkas digital pendukung kegiatan (surat undangan, nota konsumsi, materi paparan, tautan rilis publikasi) serta menginput catatan pokok hasil kegiatan.</li>
    <li>Pengguna menekan tombol <strong>Simpan Dokumen &amp; Catatan Hasil</strong>.</li>
    <li>Sistem memvalidasi format ekstensi berkas dan ukuran berkas (maksimal 10 MB):
      <ul>
        <li>Jika tidak valid, sistem menampilkan pesan peringatan error format atau ukuran berkas melebihi batas.</li>
        <li>Jika valid, sistem mengunggah berkas ke penyimpanan dan menyimpan metadata serta catatan hasil ke dalam database.</li>
      </ul>
    </li>
    <li>Sistem menautkan dokumen ke ID registrasi kegiatan, merekam stempel waktu (<em>timestamp</em>), serta mengaktifkan fitur pratinjau dan unduh dokumen log book.</li>
    <li>Super Admin / Pimpinan meninjau kelengkapan dokumen log book dan catatan hasil kegiatan. Apabila terdapat arahan penugasan lanjutan, alur dilanjutkan ke proses pemantauan tindak lanjut.</li>
  </ol>

  <h4>3. Alur Monitoring dan Pembaruan Tindak Lanjut</h4>
  <p class="center-p">[[IMAGE_ACTIVITY_3]]</p>
  <p class="caption">Gambar 2.4. Activity Diagram Alur Monitoring &amp; Pembaruan Tindak Lanjut</p>

  <p>Berikut merupakan alur monitoring dan pembaruan status tindak lanjut kegiatan:</p>
  <ol>
    <li>Kepala Biro memberikan disposisi penugasan naskah masuk kepada Koordinator Tim terkait.</li>
    <li>Koordinator Tim menerima disposisi, mencatat butir tindak lanjut beserta batas waktu (<em>deadline</em>) ke dalam sistem dengan status awal <strong>Belum Dimulai</strong>, dan menentukan staf PIC pelaksana.</li>
    <li>Staf PIC menerima penugasan (<em>task</em>) dan melaksanakan pekerjaan tindak lanjut.</li>
    <li>Staf PIC memperbarui status progres pengerjaan dari <strong>Belum Dimulai</strong> menjadi <strong>Dalam Proses</strong> (sistem menyimpan log riwayat status tindak lanjut ke database).</li>
    <li>Setelah pekerjaan tuntas, Staf PIC mengunggah bukti hasil kegiatan dan memperbarui status menjadi <strong>Selesai</strong> (sistem merekam log audit status ke database).</li>
    <li>Sistem mengakumulasikan seluruh capaian ke dalam Dashboard Pimpinan, sehingga Kepala Biro dan Pimpinan dapat meninjau rekapitulasi capaian kerja tim serta mengekspor laporan dalam format PDF atau Excel.</li>
  </ol>

  <h3>2.4. Fitur Utama Sistem</h3>
  <p>Adapun fitur utama dalam website Aplikasi Log Book Kegiatan KEK meliputi:</p>
  <ol>
    <li>Formulir pencatatan dan penjadwalan kegiatan baru berbasis kategori naskah.</li>
    <li>Pembangkitan nomor registrasi kegiatan secara otomatis.</li>
    <li>Kalender kegiatan terpadu (visualisasi jadwal bulanan dan mingguan).</li>
    <li>Repositori pencatatan dokumen log book kegiatan (undangan, nota konsumsi, materi paparan, dan tautan rilis).</li>
    <li>Pencatatan ringkasan pokok catatan hasil kegiatan dan daftar pihak terkait.</li>
    <li>Matriks pengelolaan dan pemantauan tindak lanjut (<em>action items</em>) berbasis PIC dan tenggat waktu.</li>
    <li>Pembaruan status progres 3 tahapan resmi (<em>Belum Dimulai</em>, <em>Dalam Proses</em>, <em>Selesai</em>) beserta log riwayat progres.</li>
    <li>Dashboard eksekutif dan monitoring kinerja tim kerja KEK.</li>
    <li>Fitur filter pencarian multi-kriteria dan ekspor laporan rekapitulasi (PDF/Excel/DOCX).</li>
    <li>Manajemen data master (pengguna, unit kerja biro, dan tim kerja) serta sistem notifikasi <em>in-app</em>.</li>
  </ol>

  <h3>2.5. Batasan Sistem</h3>
  <p>Dalam pengembangannya, sistem Aplikasi Log Book Kegiatan memiliki beberapa batasan, antara lain:</p>
  <ol>
    <li>Sistem diakses melalui jaringan internet/intranet menggunakan peramban web (<em>web browser</em>) modern.</li>
    <li>Sistem berfokus pada pencatatan log book kegiatan dan dokumen pendukung, sehingga tidak menerapkan modul presensi atau absensi kehadiran fisik peserta; daftar peserta dikelola sebagai daftar pihak dan aparatur terkait kegiatan.</li>
    <li>Status progres kegiatan dan butir tindak lanjut dibatasi secara terstandar pada 3 (tiga) tahapan resmi: <strong>Belum Dimulai</strong>, <strong>Dalam Proses</strong>, dan <strong>Selesai</strong>.</li>
    <li>Pengelolaan hak akses fitur dan manipulasi data bergantung sepenuhnya pada <em>role</em> pengguna (Staf Pelaksana, Admin Biro/Tim, dan Super Admin/Pimpinan).</li>
    <li>Ukuran berkas lampiran dokumen yang diunggah dibatasi maksimal 10 MB per berkas dengan format yang didukung (PDF, DOCX, PPTX, XLSX).</li>
  </ol>

  <h2>3. Arsitektur Sistem</h2>

  <h3>3.1. Gambaran Arsitektur Sistem</h3>
  <p>Website Aplikasi Log Book Kegiatan KEK dibangun menggunakan pendekatan arsitektur <em>fullstack</em> terintegrasi berbasis <em>framework</em> <strong>Next.js (App Router)</strong> dengan bahasa pemrograman <strong>TypeScript</strong> sebagaimana ditampilkan pada diagram arsitektur berikut:</p>

  <p class="center-p">[[IMAGE_ARCHITECTURE]]</p>
  <p class="caption">Gambar 3.1. Arsitektur Sistem Aplikasi Log Book Kegiatan KEK</p>

  <p>Seluruh proses aplikasi, mulai dari penyajian antarmuka pengguna (<em>frontend</em>) hingga pengolahan logika bisnis dan akses basis data (<em>backend</em>), dijalankan dalam satu kesatuan aplikasi terpadu. Interaksi pengguna dilakukan melalui peramban web menggunakan protokol aman HTTPS, yang kemudian diproses oleh sistem melalui mekanisme Next.js <em>Server Components</em>, <em>Server Actions</em>, dan <em>Route Handlers</em>. Sistem memverifikasi sesi otorisasi pengguna menggunakan <strong>NextAuth.js (Auth.js v5)</strong>, memvalidasi masukan data dengan <strong>Zod</strong>, mengakses basis data melalui <strong>Prisma ORM</strong>, dan mengembalikan hasilnya dalam bentuk tampilan antarmuka yang responsif.</p>

  <p>Basis data yang digunakan adalah <strong>PostgreSQL (Neon Serverless Database)</strong>, yang berfungsi sebagai media penyimpanan utama seluruh entitas data sistem, termasuk data biro, tim kerja, pengguna, agenda kegiatan, peserta terkait, lampiran dokumen, tindak lanjut, dan riwayat progres.</p>

  <h3>3.2. Pola Arsitektur Sistem</h3>
  <p>Sistem ini menerapkan pemisahan tanggung jawab berlapis yang setara dengan konsep <em>Model-View-Controller</em> (MVC) pada arsitektur modern Next.js, yang terdiri dari tiga komponen utama:</p>

  <ol>
    <li><strong>Data &amp; Model Layer (Prisma ORM &amp; PostgreSQL)</strong>
      <p>Komponen ini berfungsi sebagai representasi skema struktur data dan pengelola interaksi langsung dengan basis data PostgreSQL melalui <code>prisma/schema.prisma</code>. Dalam sistem ini, lapisan model digunakan untuk:</p>
      <ul>
        <li>Mengelola struktur tabel master organisasi (<code>biro</code>, <code>tim_biro</code>, <code>pengguna</code>).</li>
        <li>Mengelola transaksi jadwal dan dokumen log book kegiatan (<code>kegiatan</code>, <code>peserta_kegiatan</code>, <code>lampiran_kegiatan</code>).</li>
        <li>Mengelola matriks penugasan dan jejak audit progres (<code>tindak_lanjut</code>, <code>riwayat_tindak_lanjut</code>).</li>
        <li>Menjaga integritas relasi antar-tabel (<em>foreign key</em>) serta menyediakan <em>query</em> basis data yang <em>type-safe</em>.</li>
      </ul>
    </li>
    <li><strong>Presentation / View Layer (React Components &amp; Tailwind CSS)</strong>
      <p>Bagian yang bertanggung jawab menampilkan antarmuka pengguna secara interaktif dan responsif. Pada sistem ini, lapisan tampilan dibangun menggunakan React (<em>Server Components</em> dan <em>Client Components</em>) serta <em>framework</em> CSS <strong>Tailwind CSS</strong>. Fungsi utama lapisan ini meliputi:</p>
      <ul>
        <li>Menampilkan dashboard eksekutif, statistik kartu KPI, dan grafik kinerja tim kerja.</li>
        <li>Menampilkan formulir pencatatan kegiatan baru dan unggah dokumen log book.</li>
        <li>Menampilkan kalender kegiatan terpadu serta tabel daftar log book kegiatan.</li>
        <li>Menampilkan matriks pemantauan status tindak lanjut dan antarmuka manajemen pengguna.</li>
      </ul>
    </li>
    <li><strong>Application / Controller Layer (Next.js Server Actions &amp; Services)</strong>
      <p>Berfungsi sebagai penghubung antara antarmuka pengguna (<em>View</em>) dan lapisan data (<em>Model</em>). Komponen ini menerima <em>request</em> dari pengguna, memproses logika bisnis aplikasi, dan menentukan <em>response</em> yang dikembalikan. Peran utamanya meliputi:</p>
      <ul>
        <li>Memproses penyimpanan jadwal kegiatan baru dan penerbitan nomor registrasi otomatis (<code>lib/id-generator.ts</code>).</li>
        <li>Melakukan validasi skema input pengguna menggunakan pustaka Zod (<code>lib/validations/</code>).</li>
        <li>Memeriksa autentikasi sesi dan otorisasi hak akses peran pengguna (<code>lib/auth/authorization.ts</code>).</li>
        <li>Mengatur alur perubahan status 3 tahapan (<em>Belum Dimulai</em>, <em>Dalam Proses</em>, <em>Selesai</em>) serta pencatatan log riwayat tindak lanjut.</li>
        <li>Mengelola proses pengunggahan berkas lampiran dan pembangkitan laporan PDF/Excel/Word.</li>
      </ul>
    </li>
  </ol>

  <h3>3.3. Alur Kerja Sistem</h3>
  <p>Alur kerja sistem secara umum adalah sebagai berikut:</p>
  <ol>
    <li>Pengguna mengakses website Aplikasi Log Book Kegiatan melalui <em>browser</em> dan melakukan autentikasi login.</li>
    <li>Pengguna melakukan aksi pada antarmuka (misalnya menyimpan jadwal kegiatan baru, mengunggah dokumen log book, atau memperbarui status tindak lanjut).</li>
    <li><em>Request</em> dikirim ke server dan diterima oleh sistem <em>routing</em> Next.js / <em>Server Actions</em>.</li>
    <li>Sistem memeriksa sesi autentikasi dan hak akses peran (RBAC) serta memvalidasi data masukan menggunakan skema Zod.</li>
    <li><em>Server Action</em> menjalankan logika bisnis dan memanggil <strong>Prisma ORM</strong> untuk berinteraksi dengan database PostgreSQL.</li>
    <li>Data hasil transaksi dari database PostgreSQL dikembalikan ke lapisan aplikasi.</li>
    <li>Sistem melakukan revalidasi halaman (<code>revalidatePath</code>) dan meneruskan data terbaru ke komponen tampilan (<em>View</em>).</li>
    <li>Tampilan halaman web yang telah diperbarui disajikan kembali kepada pengguna secara instan.</li>
  </ol>

  <h3>3.4. Technology Stack</h3>
  <p>Berikut adalah teknologi yang digunakan dalam pengembangan website Aplikasi Log Book Kegiatan KEK:</p>

  <table>
    <thead>
      <tr>
        <th style="width: 8%;" class="center">No</th>
        <th style="width: 32%;">Komponen</th>
        <th style="width: 60%;">Teknologi yang Digunakan</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="center">1</td>
        <td>Framework Aplikasi</td>
        <td>Next.js 15 / 16 (App Router) &amp; React 19</td>
      </tr>
      <tr>
        <td class="center">2</td>
        <td>Bahasa Pemrograman</td>
        <td>TypeScript 5</td>
      </tr>
      <tr>
        <td class="center">3</td>
        <td>Database</td>
        <td>PostgreSQL (Neon Serverless Database)</td>
      </tr>
      <tr>
        <td class="center">4</td>
        <td>Object Relational Mapping (ORM)</td>
        <td>Prisma ORM v6</td>
      </tr>
      <tr>
        <td class="center">5</td>
        <td>Frontend &amp; Styling Framework</td>
        <td>Tailwind CSS 4 &amp; Lucide React Icons</td>
      </tr>
      <tr>
        <td class="center">6</td>
        <td>Autentikasi &amp; Keamanan Sesi</td>
        <td>NextAuth.js (Auth.js v5) &amp; BcryptJS</td>
      </tr>
      <tr>
        <td class="center">7</td>
        <td>Validasi Skema Data</td>
        <td>Zod Schema Validation</td>
      </tr>
      <tr>
        <td class="center">8</td>
        <td>Generator Laporan Dokumen</td>
        <td>PDFKit, SheetJS (XLSX / ExcelJS), dan Docx</td>
      </tr>
      <tr>
        <td class="center">9</td>
        <td>Runtime Environment</td>
        <td>Node.js LTS</td>
      </tr>
      <tr>
        <td class="center">10</td>
        <td>Version Control</td>
        <td>Git &amp; GitHub</td>
      </tr>
    </tbody>
  </table>

  <h3>3.5. Keamanan Sistem (Arsitektur)</h3>
  <p>Dalam arsitektur ini, aspek keamanan diterapkan secara berlapis melalui fitur keamanan modern, antara lain:</p>
  <ol>
    <li>Proteksi sesi autentikasi berbasis token terenkripsi (JWT/Session Cookie HttpOnly) menggunakan <strong>NextAuth.js</strong> serta proteksi rute halaman melalui <code>middleware.ts</code>.</li>
    <li>Pengendalian hak akses berbasis peran (<em>Role-Based Access Control</em> / RBAC) untuk membatasi kewenangan antara Staf Pelaksana, Admin Biro/Tim, dan Super Admin/Pimpinan.</li>
    <li>Validasi skema masukan secara ketat di sisi klien dan server menggunakan <strong>Zod</strong> guna mencegah injeksi data tidak valid atau berbahaya.</li>
    <li>Enkripsi kata sandi pengguna secara satu arah (<em>one-way hashing</em>) menggunakan algoritma <strong>Bcrypt</strong>.</li>
    <li>Pencegahan serangan <em>SQL Injection</em> melalui penggunaan <em>parameterized queries</em> otomatis pada <strong>Prisma ORM</strong> serta komunikasi data terenkripsi melalui protokol HTTPS.</li>
  </ol>

  <h3>3.6. Kelebihan Pendekatan Arsitektur</h3>
  <p>Pendekatan arsitektur <em>fullstack</em> terpadu berbasis Next.js App Router, TypeScript, dan Prisma ORM yang digunakan dalam pengembangan website Aplikasi Log Book Kegiatan KEK memberikan sejumlah keunggulan strategis. Dengan penyatuan komponen antarmuka (<em>frontend</em>) dan pemrosesan logika bisnis (<em>backend Server Actions</em>) dalam satu basis kode terstruktur, proses pengembangan menjadi lebih cepat, konsisten, dan mudah dikelola.</p>

  <p>Selain itu, dukungan pengetikan statis (<em>type-safety</em>) secara menyeluruh dari skema basis data Prisma hingga ke komponen React mampu meminimalisasi kesalahan pemrograman (<em>runtime error</em>) serta menjamin keakuratan data log book kegiatan. Proses <em>deployment</em> dan pemeliharaan sistem juga menjadi jauh lebih efisien karena tidak memerlukan pengelolaan infrastruktur layanan terpisah yang kompleks.</p>

  <h2>4. Desain Database</h2>

  <h3>4.1. Entity Relationship Diagram (ERD)</h3>
  <p>Entity Relationship Diagram (ERD) memodelkan hubungan logis antar-entitas data dalam sistem menggunakan notasi Chen klasik akademik sebagaimana disajikan pada Gambar 4.1 berikut:</p>

  <p class="center-p">[[IMAGE_ERD]]</p>
  <p class="caption">Gambar 4.1. Entity Relationship Diagram (ERD) Aplikasi Log Book Kegiatan KEK</p>

  <p>Berdasarkan diagram ERD pada Gambar 4.1 di atas, entitas dan relasi utama dalam sistem dijelaskan sebagai berikut:</p>
  <ol>
    <li><strong>Entitas Biro (<code>biro</code>):</strong> Menyimpan data master unit kerja Eselon II di lingkungan Setjen KEK dengan atribut utama <code>id_biro</code> (Primary Key), <code>kode_biro</code>, <code>nama_biro</code>, dan <code>status_aktif</code>. Berelasi 1 ke N dengan entitas Tim Kerja Biro (<code>tim_biro</code>) melalui relasi <em>menaungi</em>, serta berelasi 1 ke N dengan entitas Kegiatan (<code>kegiatan</code>) melalui relasi <em>menyelenggarakan</em>.</li>
    <li><strong>Entitas Tim Kerja Biro (<code>tim_biro</code>):</strong> Menyimpan data kelompok kerja teknis fungsional di bawah naungan biro dengan atribut <code>id_tim</code> (Primary Key), <code>kode_tim</code>, dan <code>nama_tim</code>. Berelasi N ke 1 dengan <code>biro</code> induk melalui relasi <em>menaungi</em>, serta berelasi 1 ke N dengan entitas Pengguna (<code>pengguna</code>) melalui relasi <em>beranggotakan</em>.</li>
    <li><strong>Entitas Pengguna (<code>pengguna</code>):</strong> Menyimpan data aparatur/pegawai pengguna sistem dengan atribut <code>id_pengguna</code> (Primary Key), <code>email</code>, <code>nama_lengkap</code>, dan <code>peran</code>. Berelasi N ke 1 dengan <code>tim_biro</code>, 1 ke N dengan <code>notifikasi</code> melalui relasi <em>menerima</em>, 1 ke 1 dengan <code>kegiatan</code> melalui relasi <em>memimpin</em>, 1 ke N dengan <code>lampiran_kegiatan</code> sebagai pengunggah berkas, 1 ke N dengan <code>peserta_kegiatan</code> melalui relasi <em>menghadiri</em>, serta 1 ke N dengan <code>tindak_lanjut</code> melalui relasi <em>mengerjakan PIC</em>.</li>
    <li><strong>Entitas Notifikasi (<code>notifikasi</code>):</strong> Menyimpan pesan pemberitahuan sistem kepada aparatur terkait agenda kegiatan dan penugasan dinas dengan atribut <code>id_notifikasi</code> (Primary Key), <code>judul</code>, <code>pesan</code>, dan <code>sudah_dibaca</code>.</li>
    <li><strong>Entitas Kegiatan (<code>kegiatan</code>):</strong> Merupakan entitas sentral sistem yang mencatat pelaksanaan agenda kegiatan dengan atribut <code>id_kegiatan</code> (Primary Key), <code>nomor_kegiatan</code>, <code>judul_kegiatan</code>, <code>tanggal_kegiatan</code>, dan <code>status_kegiatan</code>. Berelasi 1 ke N dengan <code>lampiran_kegiatan</code> melalui relasi <em>melampirkan</em>, 1 ke N dengan <code>peserta_kegiatan</code> melalui relasi <em>mengundang</em>, serta 1 ke N dengan <code>tindak_lanjut</code> melalui relasi <em>menetapkan</em>.</li>
    <li><strong>Entitas Berkas Lampiran Kegiatan (<code>lampiran_kegiatan</code>):</strong> Menyimpan dokumen pendukung pelaksanaan kegiatan dengan atribut <code>id_lampiran</code> (Primary Key), <code>nama_berkas</code>, dan <code>kategori_berkas</code>.</li>
    <li><strong>Entitas Peserta Kegiatan (<code>peserta_kegiatan</code>):</strong> Menyimpan daftar aparatur atau pihak terkait yang diundang dalam kegiatan dengan atribut <code>id_peserta</code> (Primary Key) dan <code>status_kehadiran</code>.</li>
    <li><strong>Entitas Tindak Lanjut Arahan (<code>tindak_lanjut</code>):</strong> Menyimpan butir arahan komitmen penugasan hasil pembahasan kegiatan dengan atribut <code>id_tindak_lanjut</code> (Primary Key), <code>judul_tindakan</code>, dan <code>status_tindak_lanjut</code>.</li>
  </ol>

  <h3>4.2. Logical Record Structure (LRS)</h3>
  <p>Logical Record Structure (LRS) menggambarkan transformasi skema ERD ke dalam bentuk tabel-tabel relasional yang telah dinormalisasi hingga bentuk normal ketiga (3NF) sebagaimana disajikan pada Gambar 4.2 berikut:</p>

  <p class="center-p">[[IMAGE_LRS]]</p>
  <p class="caption">Gambar 4.2. Logical Record Structure (LRS) Aplikasi Log Book Kegiatan KEK</p>

  <p>Transformasi LRS pada Gambar 4.2 menghubungkan <em>Primary Key</em> (PK) dan <em>Foreign Key</em> (FK) secara konsisten antar-tabel relasional dengan derajat kardinalitas 1 ke N (<em>One-to-Many</em>). Struktur rekod logis dari 8 entitas relasional aktif pada LRS dijelaskan sebagai berikut:</p>
  <ol>
    <li><strong><code>biro</code> (Master Unit Kerja Eselon II):</strong> Terdiri atas atribut <code>id_biro</code> (PK), <code>kode_biro</code>, <code>nama_biro</code>, <code>nama_singkat</code>, dan <code>status_aktif</code>. Berelasi 1 ke N dengan <code>tim_biro</code> dan <code>kegiatan</code>.</li>
    <li><strong><code>tim_biro</code> (Kelompok Kerja Teknis):</strong> Terdiri atas atribut <code>id_tim</code> (PK), <code>id_biro</code> (FK), <code>kode_tim</code>, <code>nama_tim</code>, dan <code>status_aktif</code>. Berelasi 1 ke N dengan <code>pengguna</code>.</li>
    <li><strong><code>pengguna</code> (Akun Aparatur &amp; Autentikasi):</strong> Terdiri atas atribut <code>id_pengguna</code> (PK), <code>id_biro</code> (FK), <code>id_tim</code> (FK), <code>nama_lengkap</code>, <code>email</code>, <code>kata_sandi</code>, <code>peran</code>, dan <code>status_aktif</code>. Berelasi 1 ke N dengan <code>peserta_kegiatan</code>, <code>tindak_lanjut</code> (sebagai PIC penugasan), dan <code>riwayat_tindak_lanjut</code>.</li>
    <li><strong><code>kegiatan</code> (Transaksi Sentral Log Book Kegiatan):</strong> Terdiri atas atribut <code>id_kegiatan</code> (PK), <code>id_biro</code> (FK), <code>id_tim</code> (FK), <code>nomor_kegiatan</code>, <code>judul_kegiatan</code>, <code>tanggal_kegiatan</code>, <code>waktu_mulai</code>, <code>waktu_selesai</code>, <code>lokasi_kegiatan</code>, <code>pic_kegiatan</code>, <code>kategori_naskah</code>, <code>catatan_hasil</code>, dan <code>status_kegiatan</code>. Berelasi 1 ke N dengan <code>lampiran_kegiatan</code>, <code>peserta_kegiatan</code>, dan <code>tindak_lanjut</code>.</li>
    <li><strong><code>lampiran_kegiatan</code> (Dokumen Digital Pendukung):</strong> Terdiri atas atribut <code>id_lampiran</code> (PK), <code>id_kegiatan</code> (FK), <code>nama_berkas</code>, <code>url_berkas</code>, <code>ukuran_berkas</code>, <code>tipe_berkas</code>, <code>kategori</code>, dan <code>dibuat_pada</code>.</li>
    <li><strong><code>peserta_kegiatan</code> (Daftar Penugasan Kehadiran Aparatur):</strong> Terdiri atas atribut <code>id_peserta</code> (PK), <code>id_kegiatan</code> (FK), <code>id_pengguna</code> (FK), <code>status_kehadiran</code>, dan <code>dibuat_pada</code>.</li>
    <li><strong><code>tindak_lanjut</code> (Arahan Komitmen &amp; Action Items):</strong> Terdiri atas atribut <code>id_tindak_lanjut</code> (PK), <code>id_kegiatan</code> (FK), <code>id_biro</code> (FK), <code>id_tim</code> (FK), <code>id_pengguna</code> (FK), <code>judul_tindakan</code>, <code>deskripsi_tindakan</code>, <code>tenggat_waktu</code>, dan <code>status_tindak_lanjut</code>. Berelasi 1 ke N dengan <code>riwayat_tindak_lanjut</code>.</li>
    <li><strong><code>riwayat_tindak_lanjut</code> (Rekam Jejak Audit Progres Tugas):</strong> Terdiri atas atribut <code>id_riwayat</code> (PK), <code>id_tindak_lanjut</code> (FK), <code>id_pengguna</code> (FK), <code>status_sebelumnya</code>, <code>status_terbaru</code>, <code>catatan_progres</code>, dan <code>dibuat_pada</code>.</li>
  </ol>

  <h3>4.3. Spesifikasi Basis Data (Data Dictionary)</h3>
  <p>Spesifikasi basis data (<em>data dictionary</em>) menjelaskan rincian teknis dari setiap tabel yang digunakan dalam sistem aplikasi Log Book Kegiatan. Berdasarkan skema basis data PostgreSQL pada platform <em>serverless</em> Neon, berikut merupakan daftar 8 tabel dan spesifikasi struktur kolom yang diimplementasikan:</p>

  <h4>Tabel 4.1. Spesifikasi Tabel Pengguna (pengguna)</h4>
  <table>
    <thead>
      <tr>
        <th style="width: 8%;" class="center">No</th>
        <th style="width: 27%;">Nama Field</th>
        <th style="width: 23%;">Tipe Data</th>
        <th style="width: 42%;">Keterangan</th>
      </tr>
    </thead>
    <tbody>
      <tr><td class="center">1</td><td>id_pengguna</td><td>Varchar (UUID)</td><td>Primary Key</td></tr>
      <tr><td class="center">2</td><td>nama_lengkap</td><td>Varchar</td><td>Nama lengkap pegawai</td></tr>
      <tr><td class="center">3</td><td>email</td><td>Varchar</td><td>Alamat email resmi (Unique)</td></tr>
      <tr><td class="center">4</td><td>kata_sandi</td><td>Varchar</td><td>Password terenkripsi (Bcrypt hash)</td></tr>
      <tr><td class="center">5</td><td>peran</td><td>Enum</td><td>SUPER_ADMIN, ADMIN, PIMPINAN, STAFF</td></tr>
      <tr><td class="center">6</td><td>id_biro</td><td>Varchar (UUID)</td><td>Foreign Key (Relasi ke tabel biro)</td></tr>
      <tr><td class="center">7</td><td>id_tim</td><td>Varchar (UUID)</td><td>Foreign Key (Relasi ke tabel tim_biro, opsional)</td></tr>
      <tr><td class="center">8</td><td>status_aktif</td><td>Boolean</td><td>Status aktif akun (Default: true)</td></tr>
      <tr><td class="center">9</td><td>dibuat_pada</td><td>Timestamp</td><td>Waktu akun didaftarkan</td></tr>
      <tr><td class="center">10</td><td>diperbarui_pada</td><td>Timestamp</td><td>Waktu terakhir pembaruan profil</td></tr>
    </tbody>
  </table>

  <h4>Tabel 4.2. Spesifikasi Tabel Biro (biro)</h4>
  <table>
    <thead>
      <tr>
        <th style="width: 8%;" class="center">No</th>
        <th style="width: 27%;">Nama Field</th>
        <th style="width: 23%;">Tipe Data</th>
        <th style="width: 42%;">Keterangan</th>
      </tr>
    </thead>
    <tbody>
      <tr><td class="center">1</td><td>id_biro</td><td>Varchar (UUID)</td><td>Primary Key</td></tr>
      <tr><td class="center">2</td><td>kode_biro</td><td>Varchar</td><td>Kode singkatan unik biro (Unique)</td></tr>
      <tr><td class="center">3</td><td>nama_biro</td><td>Varchar</td><td>Nama lengkap biro pemrakarsa</td></tr>
      <tr><td class="center">4</td><td>nama_singkat</td><td>Varchar</td><td>Nomenklatur singkatan biro</td></tr>
      <tr><td class="center">5</td><td>deskripsi</td><td>Text</td><td>Uraian fungsi pokok biro</td></tr>
      <tr><td class="center">6</td><td>status_aktif</td><td>Boolean</td><td>Status aktif operasional biro</td></tr>
      <tr><td class="center">7</td><td>dibuat_pada</td><td>Timestamp</td><td>Waktu data biro dibuat</td></tr>
      <tr><td class="center">8</td><td>diperbarui_pada</td><td>Timestamp</td><td>Waktu terakhir data diperbarui</td></tr>
    </tbody>
  </table>

  <h4>Tabel 4.3. Spesifikasi Tabel Tim Kerja Biro (tim_biro)</h4>
  <table>
    <thead>
      <tr>
        <th style="width: 8%;" class="center">No</th>
        <th style="width: 27%;">Nama Field</th>
        <th style="width: 23%;">Tipe Data</th>
        <th style="width: 42%;">Keterangan</th>
      </tr>
    </thead>
    <tbody>
      <tr><td class="center">1</td><td>id_tim</td><td>Varchar (UUID)</td><td>Primary Key</td></tr>
      <tr><td class="center">2</td><td>id_biro</td><td>Varchar (UUID)</td><td>Foreign Key (Relasi ke tabel biro)</td></tr>
      <tr><td class="center">3</td><td>kode_tim</td><td>Varchar</td><td>Kode pengenal tim kerja</td></tr>
      <tr><td class="center">4</td><td>nama_tim</td><td>Varchar</td><td>Nama kelompok kerja / tim</td></tr>
      <tr><td class="center">5</td><td>deskripsi_tim</td><td>Text</td><td>Uraian bidang penugasan tim</td></tr>
      <tr><td class="center">6</td><td>status_aktif</td><td>Boolean</td><td>Status keaktifan tim kerja</td></tr>
      <tr><td class="center">7</td><td>dibuat_pada</td><td>Timestamp</td><td>Waktu tim dibentuk</td></tr>
      <tr><td class="center">8</td><td>diperbarui_pada</td><td>Timestamp</td><td>Waktu pembaruan data tim</td></tr>
    </tbody>
  </table>

  <h4>Tabel 4.4. Spesifikasi Tabel Kegiatan (kegiatan)</h4>
  <table>
    <thead>
      <tr>
        <th style="width: 8%;" class="center">No</th>
        <th style="width: 27%;">Nama Field</th>
        <th style="width: 23%;">Tipe Data</th>
        <th style="width: 42%;">Keterangan</th>
      </tr>
    </thead>
    <tbody>
      <tr><td class="center">1</td><td>id_kegiatan</td><td>Varchar (UUID)</td><td>Primary Key (Kode pengenal unik transaksi agenda kegiatan)</td></tr>
      <tr><td class="center">2</td><td>nomor_kegiatan</td><td>Varchar</td><td>Nomor registrasi agenda kegiatan (Unique)</td></tr>
      <tr><td class="center">3</td><td>judul_kegiatan</td><td>Varchar</td><td>Pokok judul pembahasan agenda kegiatan</td></tr>
      <tr><td class="center">4</td><td>id_biro</td><td>Varchar (UUID)</td><td>Foreign Key (Relasi ke tabel biro - Biro Pemrakarsa Kegiatan)</td></tr>
      <tr><td class="center">5</td><td>id_tim</td><td>Varchar (UUID)</td><td>Foreign Key (Relasi ke tabel tim_biro, opsional)</td></tr>
      <tr><td class="center">6</td><td>tanggal_kegiatan</td><td>Timestamp</td><td>Tanggal pelaksanaan agenda kegiatan</td></tr>
      <tr><td class="center">7</td><td>waktu_mulai</td><td>Varchar</td><td>Waktu mulai pelaksanaan kegiatan (Format HH:mm)</td></tr>
      <tr><td class="center">8</td><td>waktu_selesai</td><td>Varchar</td><td>Waktu penutupan pelaksanaan kegiatan (Format HH:mm)</td></tr>
      <tr><td class="center">9</td><td>lokasi_kegiatan</td><td>Varchar</td><td>Lokasi pelaksanaan kegiatan (ruang kegiatan luring atau tautan daring)</td></tr>
      <tr><td class="center">10</td><td>id_pengguna</td><td>Varchar (UUID)</td><td>Foreign Key (Relasi ke tabel pengguna - Pejabat Pimpinan Kegiatan)</td></tr>
      <tr><td class="center">11</td><td>status_kegiatan</td><td>Enum</td><td>Status tahapan kegiatan: Belum Dimulai, Dalam Proses, Selesai</td></tr>
      <tr><td class="center">12</td><td>kategori_naskah</td><td>Varchar</td><td>Klasifikasi kategori naskah acuan kegiatan</td></tr>
      <tr><td class="center">13</td><td>pic_kegiatan</td><td>Varchar</td><td>Nama staf penanggung jawab kegiatan</td></tr>
      <tr><td class="center">14</td><td>catatan_hasil</td><td>Text</td><td>Ringkasan naskah dan catatan hasil pembahasan kegiatan</td></tr>
      <tr><td class="center">15</td><td>dibuat_pada</td><td>Timestamp</td><td>Waktu agenda kegiatan didaftarkan ke sistem</td></tr>
      <tr><td class="center">16</td><td>diperbarui_pada</td><td>Timestamp</td><td>Waktu terakhir pembaruan data agenda kegiatan</td></tr>
    </tbody>
  </table>

  <h4>Tabel 4.5. Spesifikasi Tabel Peserta Kegiatan (peserta_kegiatan)</h4>
  <table>
    <thead>
      <tr>
        <th style="width: 8%;" class="center">No</th>
        <th style="width: 27%;">Nama Field</th>
        <th style="width: 23%;">Tipe Data</th>
        <th style="width: 42%;">Keterangan</th>
      </tr>
    </thead>
    <tbody>
      <tr><td class="center">1</td><td>id_peserta</td><td>Varchar (UUID)</td><td>Primary Key</td></tr>
      <tr><td class="center">2</td><td>id_kegiatan</td><td>Varchar (UUID)</td><td>Foreign Key (Relasi ke tabel kegiatan)</td></tr>
      <tr><td class="center">3</td><td>id_pengguna</td><td>Varchar (UUID)</td><td>Foreign Key (Relasi ke tabel pengguna - Peserta / Pihak Terkait Kegiatan)</td></tr>
      <tr><td class="center">4</td><td>status_kehadiran</td><td>Enum</td><td>Status konfirmasi kehadiran aparatur: INVITED, PRESENT, ABSENT, EXCUSED</td></tr>
      <tr><td class="center">5</td><td>dibuat_pada</td><td>Timestamp</td><td>Waktu undangan peserta ditambahkan</td></tr>
    </tbody>
  </table>

  <h4>Tabel 4.6. Spesifikasi Tabel Riwayat Tindak Lanjut (riwayat_tindak_lanjut)</h4>
  <table>
    <thead>
      <tr>
        <th style="width: 8%;" class="center">No</th>
        <th style="width: 27%;">Nama Field</th>
        <th style="width: 23%;">Tipe Data</th>
        <th style="width: 42%;">Keterangan</th>
      </tr>
    </thead>
    <tbody>
      <tr><td class="center">1</td><td>id_riwayat</td><td>Varchar (UUID)</td><td>Primary Key</td></tr>
      <tr><td class="center">2</td><td>id_tindak_lanjut</td><td>Varchar (UUID)</td><td>Foreign Key (Relasi ke tabel tindak_lanjut)</td></tr>
      <tr><td class="center">3</td><td>id_pengguna</td><td>Varchar (UUID)</td><td>Foreign Key (Relasi ke tabel pengguna - Aparatur PIC)</td></tr>
      <tr><td class="center">4</td><td>status_sebelumnya</td><td>Enum</td><td>Status tahapan sebelum pembaruan</td></tr>
      <tr><td class="center">5</td><td>status_terbaru</td><td>Enum</td><td>Status tahapan terkini: Belum Dimulai, Dalam Proses, Selesai</td></tr>
      <tr><td class="center">6</td><td>catatan_progres</td><td>Text</td><td>Uraian capaian realisasi progres tindak lanjut</td></tr>
      <tr><td class="center">7</td><td>dibuat_pada</td><td>Timestamp</td><td>Waktu pencatatan riwayat progres tugas</td></tr>
    </tbody>
  </table>

  <h4>Tabel 4.7. Spesifikasi Tabel Tindak Lanjut Arahan (tindak_lanjut)</h4>
  <table>
    <thead>
      <tr>
        <th style="width: 8%;" class="center">No</th>
        <th style="width: 27%;">Nama Field</th>
        <th style="width: 23%;">Tipe Data</th>
        <th style="width: 42%;">Keterangan</th>
      </tr>
    </thead>
    <tbody>
      <tr><td class="center">1</td><td>id_tindak_lanjut</td><td>Varchar (UUID)</td><td>Primary Key</td></tr>
      <tr><td class="center">2</td><td>id_kegiatan</td><td>Varchar (UUID)</td><td>Foreign Key (Relasi ke tabel kegiatan)</td></tr>
      <tr><td class="center">3</td><td>judul_tindakan</td><td>Varchar</td><td>Judul arahan / butir penugasan tindak lanjut</td></tr>
      <tr><td class="center">4</td><td>deskripsi_tindakan</td><td>Text</td><td>Uraian rincian teknis penugasan</td></tr>
      <tr><td class="center">5</td><td>id_biro</td><td>Varchar (UUID)</td><td>Foreign Key (Relasi ke tabel biro - Biro Penanggung Jawab)</td></tr>
      <tr><td class="center">6</td><td>id_tim</td><td>Varchar (UUID)</td><td>Foreign Key (Relasi ke tabel tim_biro, opsional)</td></tr>
      <tr><td class="center">7</td><td>id_pengguna</td><td>Varchar (UUID)</td><td>Foreign Key (Relasi ke tabel pengguna - Staf Aparatur PIC)</td></tr>
      <tr><td class="center">8</td><td>tenggat_waktu</td><td>Timestamp</td><td>Batas akhir penyelesaian (Due Date)</td></tr>
      <tr><td class="center">9</td><td>status_tindak_lanjut</td><td>Enum</td><td>Belum Dimulai, Dalam Proses, Selesai</td></tr>
      <tr><td class="center">10</td><td>diselesaikan_pada</td><td>Timestamp</td><td>Waktu penuntasan tugas (Opsional)</td></tr>
      <tr><td class="center">11</td><td>dibuat_pada</td><td>Timestamp</td><td>Waktu instruksi diterbitkan</td></tr>
      <tr><td class="center">12</td><td>diperbarui_pada</td><td>Timestamp</td><td>Waktu pembaruan status tindak lanjut</td></tr>
    </tbody>
  </table>

  <h4>Tabel 4.8. Spesifikasi Tabel Berkas Lampiran Kegiatan (lampiran_kegiatan)</h4>
  <table>
    <thead>
      <tr>
        <th style="width: 8%;" class="center">No</th>
        <th style="width: 27%;">Nama Field</th>
        <th style="width: 23%;">Tipe Data</th>
        <th style="width: 42%;">Keterangan</th>
      </tr>
    </thead>
    <tbody>
      <tr><td class="center">1</td><td>id_lampiran</td><td>Varchar (UUID)</td><td>Primary Key</td></tr>
      <tr><td class="center">2</td><td>id_kegiatan</td><td>Varchar (UUID)</td><td>Foreign Key (Relasi ke tabel kegiatan)</td></tr>
      <tr><td class="center">3</td><td>nama_berkas</td><td>Varchar</td><td>Nama dokumen (misal: Paparan_KEK.pdf)</td></tr>
      <tr><td class="center">4</td><td>url_berkas</td><td>Text</td><td>Alamat penyimpanan berkas digital (Storage URL)</td></tr>
      <tr><td class="center">5</td><td>ukuran_berkas</td><td>Integer</td><td>Ukuran berkas dalam satuan bytes</td></tr>
      <tr><td class="center">6</td><td>tipe_berkas</td><td>Varchar</td><td>Ekstensi format berkas (PDF/DOCX)</td></tr>
      <tr><td class="center">7</td><td>nama_pengunggah</td><td>Varchar</td><td>Identitas aparatur yang mengunggah berkas</td></tr>
      <tr><td class="center">8</td><td>kategori</td><td>Varchar</td><td>Klasifikasi berkas (UNDANGAN / MATERI)</td></tr>
      <tr><td class="center">9</td><td>dibuat_pada</td><td>Timestamp</td><td>Waktu berkas diunggah ke sistem</td></tr>
    </tbody>
  </table>

  <h2>5. Struktur Folder Sistem</h2>
  <p>Berikut merupakan struktur direktori dan berkas utama yang digunakan dalam pengembangan sistem Aplikasi Log Book Kegiatan KEK:</p>

  <table>
    <thead>
      <tr>
        <th style="width: 8%;" class="center">No</th>
        <th style="width: 32%;">Folder / File</th>
        <th style="width: 60%;">Keterangan</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="center">1</td>
        <td>app/</td>
        <td>Direktori utama Next.js App Router yang memuat halaman antarmuka, tata letak (layout), dan routing aplikasi.</td>
      </tr>
      <tr>
        <td class="center">2</td>
        <td>app/actions/</td>
        <td>Berisi Next.js Server Actions untuk menangani request mutasi data, proses bisnis, dan interaksi database.</td>
      </tr>
      <tr>
        <td class="center">3</td>
        <td>app/api/</td>
        <td>Berisi endpoint Route Handlers untuk layanan unggah dokumen, unduh berkas, dan integrasi autentikasi.</td>
      </tr>
      <tr>
        <td class="center">4</td>
        <td>app/catat-kegiatan/</td>
        <td>Halaman formulir pencatatan dan penjadwalan agenda kegiatan baru.</td>
      </tr>
      <tr>
        <td class="center">5</td>
        <td>app/arsip-kegiatan/</td>
        <td>Halaman daftar log book kegiatan beserta halaman rincian kegiatan, dokumen pendukung, dan catatan hasil.</td>
      </tr>
      <tr>
        <td class="center">6</td>
        <td>app/kalender/</td>
        <td>Halaman visualisasi kalender kegiatan terpadu lintas biro dan tim kerja.</td>
      </tr>
      <tr>
        <td class="center">7</td>
        <td>app/tindak-lanjut/</td>
        <td>Halaman matriks pemantauan status progres tindak lanjut (Action Items) dan penugasan PIC.</td>
      </tr>
      <tr>
        <td class="center">8</td>
        <td>app/dokumen/ &amp; app/laporan/</td>
        <td>Halaman repositori berkas dokumen log book serta fitur rekapitulasi dan ekspor laporan (PDF/Excel/Word).</td>
      </tr>
      <tr>
        <td class="center">9</td>
        <td>app/biro/ &amp; app/pengguna/</td>
        <td>Halaman pengelolaan data master biro, tim kerja teknis, serta manajemen akun pengguna berbasis role (RBAC).</td>
      </tr>
      <tr>
        <td class="center">10</td>
        <td>components/</td>
        <td>Berisi komponen antarmuka pengguna modular (dashboard, meeting, action-items, report, teams, users, layout, dan ui).</td>
      </tr>
      <tr>
        <td class="center">11</td>
        <td>lib/</td>
        <td>Berisi service dan pustaka utilitas logika bisnis seperti koneksi Prisma, otorisasi RBAC, generator nomor kegiatan, validasi Zod, serta pembangkit laporan PDF/Excel/Docx.</td>
      </tr>
      <tr>
        <td class="center">12</td>
        <td>prisma/schema.prisma</td>
        <td>Definisi skema model database relasional PostgreSQL beserta relasi antar-tabel.</td>
      </tr>
      <tr>
        <td class="center">13</td>
        <td>prisma/migrations/</td>
        <td>Berisi riwayat file migrasi untuk pembuatan dan pembaruan struktur tabel database.</td>
      </tr>
      <tr>
        <td class="center">14</td>
        <td>public/</td>
        <td>Berisi aset statis yang dapat diakses publik seperti logo resmi KEK, ikon, diagram, dan direktori unggahan berkas.</td>
      </tr>
      <tr>
        <td class="center">15</td>
        <td>auth.ts &amp; middleware.ts</td>
        <td>Konfigurasi autentikasi NextAuth.js dan middleware untuk proteksi rute halaman serta filtering akses pengguna.</td>
      </tr>
      <tr>
        <td class="center">16</td>
        <td>.env</td>
        <td>File konfigurasi variabel lingkungan (koneksi database PostgreSQL, secret key autentikasi, dan konfigurasi server).</td>
      </tr>
    </tbody>
  </table>

  <h2>6. Penutup</h2>
  <p>Dokumen teknis website Aplikasi Log Book Kegiatan KEK ini disusun sebagai pedoman dalam pelaksanaan pengelolaan, pengembangan, serta pemeliharaan sistem secara terstruktur dan berkelanjutan di lingkungan Sekretariat Jenderal Dewan Nasional Kawasan Ekonomi Khusus. Seluruh informasi yang tercantum di dalam dokumen ini diharapkan dapat membantu tim teknis, pengembang, maupun pemangku kepentingan terkait untuk memahami arsitektur, alur proses bisnis, serta komponen basis data yang digunakan dalam sistem.</p>

  <p>Dalam rangka menjaga relevansi dan akurasi informasi, dokumentasi ini perlu dilakukan pemutakhiran secara berkala seiring dengan perkembangan kebutuhan organisasi, kebijakan instansi, serta teknologi yang digunakan. Demikian dokumentasi teknis ini disusun untuk dapat digunakan sebagaimana mestinya serta mendukung efektivitas pengelolaan dan pengembangan website Aplikasi Log Book Kegiatan KEK ke depan.</p>

</body>
</html>`;

  console.log('2. Memperbarui isi file Google Docs secara langsung (in-place)...');

  const metadata = {
    name: 'Dokumen Teknis Website Aplikasi Log Book Kegiatan KEK',
    mimeType: 'application/vnd.google-apps.document'
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
    htmlContent +
    closeDelimiter;

  const updateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${TARGET_DOC_ID}?uploadType=multipart`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartBody
  });

  if (!updateRes.ok) {
    throw new Error('Failed to update Google Doc: ' + updateRes.status + ' ' + (await updateRes.text()));
  }

  const updatedFile = await updateRes.json();
  const docId = updatedFile.id || TARGET_DOC_ID;
  console.log('3. Naskah Google Docs berhasil diperbarui!');
  console.log('   Doc ID:', docId);
  console.log('   URL: https://docs.google.com/document/d/' + docId + '/edit');

  console.log('4. Menyisipkan seluruh 8 gambar diagram proporsional...');
  for (const item of IMAGE_PLACEHOLDERS) {
    await replacePlaceholderWithImage(docId, accessToken, item);
  }

  await applyCleanPagination(docId, accessToken);

  console.log('\n=== SELESAI! DOKUMEN TEKNIS TELAH DIPERBARUI & DIRAPIKAN ===');
  console.log('Link Google Docs:', `https://docs.google.com/document/d/${docId}/edit`);
}

main().catch(console.error);
