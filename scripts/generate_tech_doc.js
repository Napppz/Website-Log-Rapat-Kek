const fs = require('fs');

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

const IMAGE_PLACEHOLDERS = [
  {
    token: '[[IMAGE_LOGO_KEK]]',
    uri: 'https://drive.google.com/uc?id=1AKT1iBrvuP-BNA7K_4hYfptOuGY0OGns&export=download',
    width: 90,
    height: 90
  },
  {
    token: '[[IMAGE_USE_CASE]]',
    uri: 'https://drive.google.com/uc?id=1UhBx0itPWdDI6qze2R3BeFmXWeq1nvUt&export=download',
    width: 420,
    height: 405
  },
  {
    token: '[[IMAGE_ACTIVITY_1]]',
    uri: 'https://drive.google.com/uc?id=1TXIowJidE0XQ4Cp3v_DAzHWQzgQ_4OtA&export=download',
    width: 400,
    height: 451
  },
  {
    token: '[[IMAGE_ACTIVITY_2]]',
    uri: 'https://drive.google.com/uc?id=1bDeIE8O58v-S5gXEMy3GtOkVZLaE1NqV&export=download',
    width: 425,
    height: 386
  },
  {
    token: '[[IMAGE_ACTIVITY_3]]',
    uri: 'https://drive.google.com/uc?id=1q_S5PGMZNXiTqfLIchFxpPKrvQZOoGEB&export=download',
    width: 435,
    height: 331
  },
  {
    token: '[[IMAGE_ERD]]',
    uri: 'https://drive.google.com/uc?id=1z9adGxKYry7qTjenm4-5SFWYpYAuHu-z&export=download',
    width: 440,
    height: 295
  },
  {
    token: '[[IMAGE_LRS]]',
    uri: 'https://drive.google.com/uc?id=1ozG8cPsuXSXRSo-g506oGG558TV6WhK1&export=download',
    width: 430,
    height: 391
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
  let pEnd = null;

  for (const el of doc.body.content) {
    if (el.paragraph) {
      const fullText = el.paragraph.elements?.map(e => e.textRun?.content || '').join('') || '';
      const idx = fullText.indexOf(placeholder.token);
      if (idx !== -1) {
        pStart = el.startIndex;
        pEnd = el.endIndex;
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
        paragraphStyle: { alignment: 'CENTER' },
        fields: 'alignment'
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
      line-height: 1.4;
      color: #1a1a1a;
    }
    h1 {
      font-family: Calibri, Arial, sans-serif;
      font-size: 16pt;
      font-weight: bold;
      text-align: center;
      margin-top: 12pt;
      margin-bottom: 18pt;
      color: #1f3864;
      text-transform: uppercase;
    }
    h2 {
      font-family: Calibri, Arial, sans-serif;
      font-size: 14pt;
      font-weight: bold;
      margin-top: 18pt;
      margin-bottom: 6pt;
      color: #2f5496;
    }
    h3 {
      font-family: Calibri, Arial, sans-serif;
      font-size: 12.5pt;
      font-weight: bold;
      margin-top: 12pt;
      margin-bottom: 4pt;
      color: #2f5496;
    }
    h4 {
      font-family: Calibri, Arial, sans-serif;
      font-size: 11.5pt;
      font-weight: bold;
      margin-top: 10pt;
      margin-bottom: 4pt;
      color: #1f3864;
    }
    p {
      margin-top: 0;
      margin-bottom: 8pt;
      text-align: justify;
    }
    .center-p {
      text-align: center;
      margin-top: 8pt;
      margin-bottom: 8pt;
    }
    .caption {
      text-align: center;
      font-weight: bold;
      font-size: 10pt;
      color: #333333;
      margin-top: 2pt;
      margin-bottom: 12pt;
    }
    ul, ol {
      margin-top: 2pt;
      margin-bottom: 8pt;
      padding-left: 22pt;
    }
    li {
      margin-bottom: 3pt;
      text-align: justify;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6pt;
      margin-bottom: 14pt;
      font-size: 10pt;
    }
    table, th, td {
      border: 1px solid #9ca3af;
    }
    th {
      background-color: #d9e1f2;
      color: #1f3864;
      font-weight: bold;
      text-align: left;
      padding: 6pt 8pt;
    }
    td {
      padding: 5pt 8pt;
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
    <li>Mendokumentasikan struktur sistem, desain database (ERD, LRS, dan spesifikasi kamus data), serta alur proses bisnis utama.</li>
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
        <li>Mengelola matriks tindak lanjut (<em>action items</em>) beserta penunjukan staf PIC dan batas waktu penyelesaian.</li>
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
  <p>Website Aplikasi Log Book Kegiatan KEK dibangun menggunakan pendekatan arsitektur <em>fullstack</em> terintegrasi berbasis <em>framework</em> <strong>Next.js (App Router)</strong> dengan bahasa pemrograman <strong>TypeScript</strong>. Seluruh proses, mulai dari penyajian antarmuka pengguna (<em>frontend</em>) hingga pengolahan logika bisnis dan akses basis data (<em>backend</em>), dijalankan dalam satu kesatuan aplikasi terpadu.</p>

  <p>Interaksi pengguna dilakukan melalui peramban web menggunakan protokol aman HTTPS, yang kemudian diproses oleh sistem melalui mekanisme Next.js <em>Server Components</em>, <em>Server Actions</em>, dan <em>Route Handlers</em>. Sistem memverifikasi sesi otorisasi pengguna menggunakan <strong>NextAuth.js (Auth.js v5)</strong>, memvalidasi masukan data dengan <strong>Zod</strong>, mengakses basis data melalui <strong>Prisma ORM</strong>, dan mengembalikan hasilnya dalam bentuk tampilan antarmuka yang responsif.</p>

  <p>Basis data yang digunakan adalah <strong>PostgreSQL (Neon Serverless Database)</strong>, yang berfungsi sebagai media penyimpanan utama seluruh entitas data sistem, termasuk data biro, tim kerja, pengguna, agenda kegiatan, peserta terkait, lampiran dokumen, tindak lanjut, riwayat progres, dan notifikasi.</p>

  <h3>3.2. Pola Arsitektur Sistem</h3>
  <p>Sistem ini menerapkan pemisahan tanggung jawab berlapis yang setara dengan konsep <em>Model-View-Controller</em> (MVC) pada arsitektur modern Next.js, yang terdiri dari tiga komponen utama:</p>

  <ol>
    <li><strong>Data &amp; Model Layer (Prisma ORM &amp; PostgreSQL)</strong>
      <p>Komponen ini berfungsi sebagai representasi skema struktur data dan pengelola interaksi langsung dengan basis data PostgreSQL melalui <code>prisma/schema.prisma</code>. Dalam sistem ini, lapisan model digunakan untuk:</p>
      <ul>
        <li>Mengelola struktur tabel master organisasi (<code>biro</code>, <code>tim_biro</code>, <code>pengguna</code>).</li>
        <li>Mengelola transaksi jadwal dan dokumen log book kegiatan (<code>kegiatan</code>, <code>peserta_kegiatan</code>, <code>lampiran_kegiatan</code>).</li>
        <li>Mengelola matriks penugasan dan jejak audit progres (<code>tindak_lanjut</code>, <code>riwayat_tindak_lanjut</code>, <code>notifikasi</code>).</li>
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
        <td>Next.js 15 (App Router) &amp; React 19</td>
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
        <td>Prisma ORM</td>
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
        <td>jsPDF, SheetJS (XLSX), dan Docx</td>
      </tr>
      <tr>
        <td class="center">9</td>
        <td>Runtime Environment</td>
        <td>Node.js</td>
      </tr>
      <tr>
        <td class="center">10</td>
        <td>Version Control</td>
        <td>Git &amp; GitHub</td>
      </tr>
    </tbody>
  </table>

  <h3>3.5. Keamanan Sistem (Arsitektur)</h3>
  <p>Dalam arsitektur ini, aspek keamanan diterapkan secara berlapis melalui mekanisme berikut:</p>
  <ol>
    <li>Proteksi CSRF (<em>Cross-Site Request Forgery</em>) bawaan pada setiap transaksi formulir dan <em>Server Actions</em>.</li>
    <li>Validasi input berlapis di sisi klien dan server menggunakan skema Zod untuk mencegah masuknya data tidak valid atau berbahaya.</li>
    <li>Penerapan <em>authentication</em> (NextAuth.js) dan <em>authorization</em> berbasis <em>role</em> (RBAC: Staf Pelaksana, Admin Biro/Tim, Super Admin/Pimpinan) yang diverifikasi langsung di sisi server.</li>
    <li>Pencegahan serangan <em>SQL Injection</em> melalui penggunaan <em>parameterized queries</em> otomatis pada Prisma ORM.</li>
    <li>Enkripsi data kredensial sensitif (kata sandi pengguna di-<em>hash</em> menggunakan algoritma <em>bcrypt</em>).</li>
    <li>Penggunaan protokol HTTPS untuk mengamankan komunikasi data antara <em>browser</em> dan server.</li>
  </ol>

  <h3>3.6. Kelebihan Pendekatan Arsitektur</h3>
  <p>Pendekatan arsitektur <em>fullstack</em> terintegrasi berbasis Next.js App Router yang digunakan dalam pengembangan website Aplikasi Log Book Kegiatan KEK memberikan sejumlah keunggulan nyata bagi tata kelola aplikasi internal instansi. Dengan menyatukan komponen antarmuka (<em>frontend</em>) dan logika pemrosesan server (<em>backend</em>) dalam satu repositori terpadu, proses pengembangan menjadi lebih terstruktur, konsisten, dan mudah dikelola oleh tim pengembang.</p>

  <p>Selain itu, dukungan pengetikan statis (<em>type-safety</em>) secara menyeluruh dari skema basis data Prisma hingga ke komponen React mampu meminimalisasi kesalahan pemrograman (<em>runtime error</em>) serta menjamin keakuratan data log book kegiatan. Proses <em>deployment</em> dan pemeliharaan sistem juga menjadi jauh lebih efisien karena tidak memerlukan pengelolaan infrastruktur layanan terpisah yang kompleks.</p>

  <p>Dengan demikian, pemilihan arsitektur ini sangat sesuai untuk mendukung operasional Sekretariat Jenderal Dewan Nasional KEK yang mengutamakan kecepatan akses, stabilitas sistem, kemudahan pemeliharaan, serta keamanan data kedinasan.</p>

  <h2>4. Desain Database</h2>

  <h3>4.1. Entity Relationship Diagram (ERD)</h3>
  <p>Entity Relationship Diagram (ERD) memodelkan hubungan logis antar-entitas data dalam sistem menggunakan notasi Peter Chen. Berikut merupakan diagram ERD pada Aplikasi Log Book Kegiatan KEK:</p>

  <p class="center-p">[[IMAGE_ERD]]</p>
  <p class="caption">Gambar 4.1. Entity Relationship Diagram (ERD) Aplikasi Log Book Kegiatan KEK</p>

  <p>Dalam proses bisnis pencatatan kegiatan kedinasan, struktur organisasi Sekretariat Jenderal Dewan Nasional KEK dipetakan melalui entitas <strong>biro</strong> yang menaungi entitas <strong>tim_biro</strong> dengan relasi satu-ke-banyak (1:N). Setiap aparatur pengguna sistem dicatat dalam entitas <strong>pengguna</strong> yang berelasi dengan tim kerja dan biro terkait, serta menerima pesan pemberitahuan sistem melalui entitas <strong>notifikasi</strong>.</p>

  <p>Ketika suatu agenda kegiatan dijadwalkan, data transaksi utama disimpan pada entitas sentral <strong>kegiatan</strong> yang diselenggarakan oleh biro pemrakarsa dan dipimpin oleh pengguna terkait. Untuk mendukung tertib pengarsipan log book, entitas <strong>kegiatan</strong> berelasi 1:N dengan entitas <strong>lampiran_kegiatan</strong> guna menyimpan berkas dokumen digital (undangan, nota konsumsi, materi paparan, tautan rilis), serta berelasi 1:N dengan entitas <strong>peserta_kegiatan</strong> untuk mendokumentasikan daftar pihak dan aparatur yang diundang dalam kegiatan.</p>

  <p>Selanjutnya, setiap butir komitmen atau arahan hasil pembahasan kegiatan dicatat ke dalam entitas <strong>tindak_lanjut</strong> yang terhubung langsung dengan entitas <strong>kegiatan</strong> dan staf penanggung jawab (PIC) pada entitas <strong>pengguna</strong>. Seluruh riwayat pembaruan status progres tindak lanjut (<em>Belum Dimulai</em>, <em>Dalam Proses</em>, <em>Selesai</em>) direkam secara historis pada entitas <strong>riwayat_tindak_lanjut</strong> guna menjamin akuntabilitas dan kemudahan pengawasan pimpinan.</p>

  <h3>4.2. Logical Record Structure (LRS)</h3>
  <p>Logical Record Structure (LRS) menggambarkan transformasi skema ERD ke dalam bentuk tabel-tabel relasional beserta pertautan <em>Primary Key</em> (PK) dan <em>Foreign Key</em> (FK) dengan derajat kardinalitas 1 ke N (<em>One-to-Many</em>):</p>

  <p class="center-p">[[IMAGE_LRS]]</p>
  <p class="caption">Gambar 4.2. Logical Record Structure (LRS) Aplikasi Log Book Kegiatan KEK</p>

  <h3>4.3. Spesifikasi Tabel Database (Data Dictionary)</h3>
  <p>Berikut merupakan daftar tabel basis data aktif beserta spesifikasi struktur kolom yang digunakan dalam sistem Aplikasi Log Book Kegiatan KEK:</p>

  <h4>1. Tabel: pengguna (Spesifikasi Tabel Pengguna)</h4>
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
      <tr><td class="center">1</td><td>id_pengguna</td><td>Varchar (UUID)</td><td>Primary Key (Kode pengenal unik akun aparatur)</td></tr>
      <tr><td class="center">2</td><td>nama_lengkap</td><td>Varchar</td><td>Nama lengkap aparatur pegawai</td></tr>
      <tr><td class="center">3</td><td>email</td><td>Varchar</td><td>Alamat email resmi (Unique)</td></tr>
      <tr><td class="center">4</td><td>nama_pengguna</td><td>Varchar</td><td>Username unik untuk autentikasi login</td></tr>
      <tr><td class="center">5</td><td>kata_sandi</td><td>Varchar</td><td>Password akun terenkripsi (Bcrypt hash)</td></tr>
      <tr><td class="center">6</td><td>peran</td><td>Enum</td><td>Hak akses peran: SUPER_ADMIN, ADMIN, PIMPINAN, STAFF</td></tr>
      <tr><td class="center">7</td><td>id_biro</td><td>Varchar (UUID)</td><td>Foreign Key &rarr; biro.id_biro</td></tr>
      <tr><td class="center">8</td><td>id_tim</td><td>Varchar (UUID)</td><td>Foreign Key &rarr; tim_biro.id_tim (opsional)</td></tr>
      <tr><td class="center">9</td><td>status_aktif</td><td>Boolean</td><td>Status keaktifan akun pengguna (Default: true)</td></tr>
      <tr><td class="center">10</td><td>dibuat_pada</td><td>Timestamp</td><td>Waktu akun pertama kali didaftarkan</td></tr>
      <tr><td class="center">11</td><td>diperbarui_pada</td><td>Timestamp</td><td>Waktu terakhir pembaruan data profil akun</td></tr>
    </tbody>
  </table>

  <h4>2. Tabel: biro (Spesifikasi Tabel Biro)</h4>
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
      <tr><td class="center">1</td><td>id_biro</td><td>Varchar (UUID)</td><td>Primary Key (Kode pengenal unik unit kerja Biro)</td></tr>
      <tr><td class="center">2</td><td>kode_biro</td><td>Varchar</td><td>Kode singkatan unik biro (Unique)</td></tr>
      <tr><td class="center">3</td><td>nama_biro</td><td>Varchar</td><td>Nama lengkap unit kerja biro pemrakarsa</td></tr>
      <tr><td class="center">4</td><td>nama_singkat</td><td>Varchar</td><td>Nomenklatur singkatan biro kerja</td></tr>
      <tr><td class="center">5</td><td>deskripsi</td><td>Text</td><td>Uraian tugas dan fungsi pokok biro</td></tr>
      <tr><td class="center">6</td><td>status_aktif</td><td>Boolean</td><td>Status aktif operasional biro (Default: true)</td></tr>
      <tr><td class="center">7</td><td>dibuat_pada</td><td>Timestamp</td><td>Waktu data biro dibuat</td></tr>
      <tr><td class="center">8</td><td>diperbarui_pada</td><td>Timestamp</td><td>Waktu terakhir pembaruan data biro</td></tr>
    </tbody>
  </table>

  <h4>3. Tabel: tim_biro (Spesifikasi Tabel Tim Kerja Biro)</h4>
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
      <tr><td class="center">1</td><td>id_tim</td><td>Varchar (UUID)</td><td>Primary Key (Kode pengenal unik kelompok kerja tim)</td></tr>
      <tr><td class="center">2</td><td>id_biro</td><td>Varchar (UUID)</td><td>Foreign Key &rarr; biro.id_biro (Biro Induk)</td></tr>
      <tr><td class="center">3</td><td>kode_tim</td><td>Varchar</td><td>Kode unik pengenal tim kerja</td></tr>
      <tr><td class="center">4</td><td>nama_tim</td><td>Varchar</td><td>Nama kelompok kerja teknis di bawah biro</td></tr>
      <tr><td class="center">5</td><td>deskripsi_tim</td><td>Text</td><td>Uraian bidang penugasan kerja tim</td></tr>
      <tr><td class="center">6</td><td>status_aktif</td><td>Boolean</td><td>Status keaktifan kelompok kerja (Default: true)</td></tr>
      <tr><td class="center">7</td><td>dibuat_pada</td><td>Timestamp</td><td>Waktu tim kerja dibentuk</td></tr>
      <tr><td class="center">8</td><td>diperbarui_pada</td><td>Timestamp</td><td>Waktu pembaruan data tim kerja</td></tr>
    </tbody>
  </table>

  <h4>4. Tabel: kegiatan (Spesifikasi Tabel Kegiatan)</h4>
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
      <tr><td class="center">4</td><td>id_biro</td><td>Varchar (UUID)</td><td>Foreign Key &rarr; biro.id_biro (Biro Pemrakarsa)</td></tr>
      <tr><td class="center">5</td><td>id_tim</td><td>Varchar (UUID)</td><td>Foreign Key &rarr; tim_biro.id_tim (opsional)</td></tr>
      <tr><td class="center">6</td><td>tanggal_kegiatan</td><td>Timestamp</td><td>Tanggal pelaksanaan agenda kegiatan</td></tr>
      <tr><td class="center">7</td><td>waktu_mulai</td><td>Varchar</td><td>Waktu mulai pelaksanaan kegiatan (Format HH:mm)</td></tr>
      <tr><td class="center">8</td><td>waktu_selesai</td><td>Varchar</td><td>Waktu penutupan pelaksanaan kegiatan (Format HH:mm)</td></tr>
      <tr><td class="center">9</td><td>lokasi_kegiatan</td><td>Varchar</td><td>Lokasi pelaksanaan kegiatan (ruang fisik atau tautan daring)</td></tr>
      <tr><td class="center">10</td><td>id_pengguna</td><td>Varchar (UUID)</td><td>Foreign Key &rarr; pengguna.id_pengguna (Pimpinan Kegiatan)</td></tr>
      <tr><td class="center">11</td><td>status_kegiatan</td><td>Enum</td><td>Status tahapan kegiatan: Belum Dimulai, Dalam Proses, Selesai</td></tr>
      <tr><td class="center">12</td><td>kategori_naskah</td><td>Varchar</td><td>Kategori naskah acuan (Naskah Masuk, Disposisi Sekjen/Karo, Internal, Rutin)</td></tr>
      <tr><td class="center">13</td><td>pic_kegiatan</td><td>Varchar</td><td>Nama pejabat/staf penanggung jawab teknis kegiatan</td></tr>
      <tr><td class="center">14</td><td>catatan_hasil</td><td>Text</td><td>Ringkasan pokok catatan dan kesimpulan pelaksanaan kegiatan</td></tr>
      <tr><td class="center">15</td><td>rencana_aksi</td><td>Text</td><td>Rencana tindak lanjut pelaksanaan arahan kegiatan</td></tr>
      <tr><td class="center">16</td><td>nomor_nd_konsum</td><td>Varchar</td><td>Nomor nota dinas pengajuan konsumsi kegiatan</td></tr>
      <tr><td class="center">17</td><td>tautan_rilis</td><td>Varchar</td><td>Tautan publikasi media/berita terkait kegiatan</td></tr>
      <tr><td class="center">18</td><td>dibuat_pada</td><td>Timestamp</td><td>Waktu data agenda kegiatan didaftarkan ke sistem</td></tr>
      <tr><td class="center">19</td><td>diperbarui_pada</td><td>Timestamp</td><td>Waktu terakhir pembaruan data kegiatan</td></tr>
    </tbody>
  </table>

  <h4>5. Tabel: peserta_kegiatan (Spesifikasi Tabel Peserta Kegiatan)</h4>
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
      <tr><td class="center">1</td><td>id_peserta</td><td>Varchar (UUID)</td><td>Primary Key (Kode unik data pihak terkait kegiatan)</td></tr>
      <tr><td class="center">2</td><td>id_kegiatan</td><td>Varchar (UUID)</td><td>Foreign Key &rarr; kegiatan.id_kegiatan</td></tr>
      <tr><td class="center">3</td><td>id_pengguna</td><td>Varchar (UUID)</td><td>Foreign Key &rarr; pengguna.id_pengguna (Aparatur Terkait)</td></tr>
      <tr><td class="center">4</td><td>status_kehadiran</td><td>Enum</td><td>Status peran aparatur/undangan terkait kegiatan</td></tr>
      <tr><td class="center">5</td><td>dibuat_pada</td><td>Timestamp</td><td>Waktu data pihak terkait ditambahkan ke agenda</td></tr>
    </tbody>
  </table>

  <h4>6. Tabel: lampiran_kegiatan (Spesifikasi Tabel Berkas Lampiran Kegiatan)</h4>
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
      <tr><td class="center">1</td><td>id_lampiran</td><td>Varchar (UUID)</td><td>Primary Key (Kode unik berkas lampiran dokumen kegiatan)</td></tr>
      <tr><td class="center">2</td><td>id_kegiatan</td><td>Varchar (UUID)</td><td>Foreign Key &rarr; kegiatan.id_kegiatan</td></tr>
      <tr><td class="center">3</td><td>nama_berkas</td><td>Varchar</td><td>Nama berkas dokumen kegiatan (misal: Undangan_KEK.pdf)</td></tr>
      <tr><td class="center">4</td><td>url_berkas</td><td>Text</td><td>Tautan lokasi penyimpanan berkas digital (Storage URL)</td></tr>
      <tr><td class="center">5</td><td>ukuran_berkas</td><td>Integer</td><td>Ukuran kapasitas berkas dokumen dalam satuan bytes</td></tr>
      <tr><td class="center">6</td><td>tipe_berkas</td><td>Varchar</td><td>Ekstensi format berkas naskah digital (PDF, DOCX, XLSX)</td></tr>
      <tr><td class="center">7</td><td>nama_pengunggah</td><td>Varchar</td><td>Identitas staf aparatur yang mengunggah dokumen</td></tr>
      <tr><td class="center">8</td><td>kategori</td><td>Varchar</td><td>Klasifikasi dokumen (UNDANGAN / MATERI / NOTA_KONSUMSI / RILIS)</td></tr>
      <tr><td class="center">9</td><td>dibuat_pada</td><td>Timestamp</td><td>Waktu berkas diunggah ke sistem repositori</td></tr>
    </tbody>
  </table>

  <h4>7. Tabel: tindak_lanjut (Spesifikasi Tabel Tindak Lanjut Arahan)</h4>
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
      <tr><td class="center">1</td><td>id_tindak_lanjut</td><td>Varchar (UUID)</td><td>Primary Key (Kode unik butir komitmen tindak lanjut)</td></tr>
      <tr><td class="center">2</td><td>id_kegiatan</td><td>Varchar (UUID)</td><td>Foreign Key &rarr; kegiatan.id_kegiatan</td></tr>
      <tr><td class="center">3</td><td>judul_tindakan</td><td>Varchar</td><td>Judul arahan / butir tugas tindak lanjut kegiatan</td></tr>
      <tr><td class="center">4</td><td>deskripsi_tindakan</td><td>Text</td><td>Uraian teknis rincian instruksi pelaksanaan penugasan</td></tr>
      <tr><td class="center">5</td><td>id_biro</td><td>Varchar (UUID)</td><td>Foreign Key &rarr; biro.id_biro (Biro Penanggung Jawab)</td></tr>
      <tr><td class="center">6</td><td>id_tim</td><td>Varchar (UUID)</td><td>Foreign Key &rarr; tim_biro.id_tim (opsional)</td></tr>
      <tr><td class="center">7</td><td>id_pengguna</td><td>Varchar (UUID)</td><td>Foreign Key &rarr; pengguna.id_pengguna (Staf Aparatur PIC)</td></tr>
      <tr><td class="center">8</td><td>tenggat_waktu</td><td>Timestamp</td><td>Batas akhir waktu penyelesaian tugas (Due Date)</td></tr>
      <tr><td class="center">9</td><td>status_tindak_lanjut</td><td>Enum</td><td>Status tahapan: Belum Dimulai, Dalam Proses, Selesai</td></tr>
      <tr><td class="center">10</td><td>diselesaikan_pada</td><td>Timestamp</td><td>Waktu resmi penuntasan butir tugas (opsional)</td></tr>
      <tr><td class="center">11</td><td>dibuat_pada</td><td>Timestamp</td><td>Waktu butir instruksi diterbitkan</td></tr>
      <tr><td class="center">12</td><td>diperbarui_pada</td><td>Timestamp</td><td>Waktu pembaruan status tindak lanjut</td></tr>
    </tbody>
  </table>

  <h4>8. Tabel: riwayat_tindak_lanjut (Spesifikasi Tabel Riwayat Tindak Lanjut)</h4>
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
      <tr><td class="center">1</td><td>id_riwayat</td><td>Varchar (UUID)</td><td>Primary Key (Kode pengenal unik riwayat progres)</td></tr>
      <tr><td class="center">2</td><td>id_tindak_lanjut</td><td>Varchar (UUID)</td><td>Foreign Key &rarr; tindak_lanjut.id_tindak_lanjut</td></tr>
      <tr><td class="center">3</td><td>id_pengguna</td><td>Varchar (UUID)</td><td>Foreign Key &rarr; pengguna.id_pengguna (Aparatur PIC)</td></tr>
      <tr><td class="center">4</td><td>status_sebelumnya</td><td>Enum</td><td>Status tahapan penugasan sebelum diperbarui</td></tr>
      <tr><td class="center">5</td><td>status_terbaru</td><td>Enum</td><td>Status tahapan terkini: Belum Dimulai, Dalam Proses, Selesai</td></tr>
      <tr><td class="center">6</td><td>catatan_progres</td><td>Text</td><td>Uraian catatan capaian realisasi progres tindak lanjut</td></tr>
      <tr><td class="center">7</td><td>dibuat_pada</td><td>Timestamp</td><td>Waktu pencatatan log riwayat progres tugas</td></tr>
    </tbody>
  </table>

  <h4>9. Tabel: notifikasi (Spesifikasi Tabel Notifikasi Sistem)</h4>
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
      <tr><td class="center">1</td><td>id_notifikasi</td><td>Varchar (UUID)</td><td>Primary Key (Kode pengenal unik notifikasi pesan)</td></tr>
      <tr><td class="center">2</td><td>id_pengguna</td><td>Varchar (UUID)</td><td>Foreign Key &rarr; pengguna.id_pengguna (Penerima Notifikasi)</td></tr>
      <tr><td class="center">3</td><td>id_tim</td><td>Varchar (UUID)</td><td>Foreign Key &rarr; tim_biro.id_tim (opsional)</td></tr>
      <tr><td class="center">4</td><td>judul</td><td>Varchar</td><td>Judul pemberitahuan informasi sistem</td></tr>
      <tr><td class="center">5</td><td>pesan</td><td>Text</td><td>Uraian teks detail notifikasi jadwal / penugasan</td></tr>
      <tr><td class="center">6</td><td>tipe</td><td>Varchar</td><td>Tipe kategori pesan notifikasi (info, warning, success)</td></tr>
      <tr><td class="center">7</td><td>tautan</td><td>Varchar</td><td>Tautan navigasi cepat menuju detail kegiatan / tindak lanjut</td></tr>
      <tr><td class="center">8</td><td>sudah_dibaca</td><td>Boolean</td><td>Indikator status apakah pesan telah dibaca (Default: false)</td></tr>
      <tr><td class="center">9</td><td>dibuat_pada</td><td>Timestamp</td><td>Waktu notifikasi diterbitkan oleh sistem</td></tr>
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

  console.log('2. Membuat file Google Docs baru di Google Drive...');

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

  const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartBody
  });

  if (!createRes.ok) {
    throw new Error('Failed to create Google Doc: ' + createRes.status + ' ' + (await createRes.text()));
  }

  const createdFile = await createRes.json();
  const newDocId = createdFile.id;
  console.log('3. File Google Docs baru berhasil dibuat!');
  console.log('   New Doc ID:', newDocId);
  console.log('   URL: https://docs.google.com/document/d/' + newDocId + '/edit');

  console.log('4. Menyisipkan seluruh gambar diagram asli dari folder proyek...');
  // Process from bottom to top or sequentially with re-fetch
  for (const item of IMAGE_PLACEHOLDERS) {
    await replacePlaceholderWithImage(newDocId, accessToken, item);
  }

  // Set sharing permission so anyone with link can view/edit easily
  await fetch(`https://www.googleapis.com/drive/v3/files/${newDocId}/permissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      role: 'writer',
      type: 'anyone'
    })
  });

  console.log('\n=== SELESAI! DOKUMEN TEKNIS BARU DENGAN SELURUH GAMBAR DIAGRAM ASLI TELAH TERBIT ===');
  console.log('Link Google Docs:', `https://docs.google.com/document/d/${newDocId}/edit`);
}

main().catch(console.error);
