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

async function main() {
  const docId = '1hHZ7iRT0eZCBlff_KHBPtp69n0C5TTlWxDx06RX8kM0';
  const accessToken = await getValidAccessToken();

  console.log('Fetching live document...');
  let res = await fetch('https://docs.googleapis.com/v1/documents/' + docId, {
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });
  if (!res.ok) throw new Error('Failed to fetch doc: ' + res.statusText);
  let doc = await res.json();
  console.log('Fetched document revision:', doc.revisionId);

  const content = doc.body.content;

  const updates = {
    // Table at element [26] (Minggu ke-4 Bulan ke-1 - September)
    26: {
      4: '\nPengarahan dan koordinasi perancangan Aplikasi Log Book Kegiatan bersama mentor',
      5: '\nObservasi dan identifikasi alur kerja penjadwalan serta pengarsipan berkas kegiatan kedinasan'
    },
    // Table at element [33] (Minggu ke-1 Bulan ke-2 - Oktober)
    33: {
      1: '\nAnalisis kebutuhan fungsional Aplikasi Log Book Kegiatan KEK',
      2: '\nMenyusun spesifikasi kebutuhan sistem serta pembagian hak akses pengguna multi-role',
      3: '\nWFH',
      4: '\nMerancang Use Case Diagram sistem log book kegiatan kedinasan',
      5: '\nMerancang Activity Diagram alur penjadwalan dan pengarsipan dokumen kegiatan'
    },
    // Table at element [40] (Minggu ke-2 Bulan ke-2 - Oktober)
    40: {
      1: '\nMerancang Entity Relationship Diagram (ERD) notasi Chen basis data kegiatan',
      2: '\nMelakukan normalisasi basis data dan perancangan Logical Record Structure (LRS)',
      3: '\nWFH',
      4: '\nSetup basis data serverless PostgreSQL dan konfigurasi Prisma ORM',
      5: '\nMembuat skema tabel basis data kegiatan serta eksekusi migrasi database'
    },
    // Table at element [47] (Minggu ke-3 Bulan ke-2 - November)
    47: {
      1: '\nMengembangkan antarmuka dan modul autentikasi login akun pengguna',
      2: '\nMenerapkan proteksi routing dan otorisasi hak akses halaman berbasis peran pengguna',
      3: '\nWFH',
      4: '\nMembuat modul manajemen data master biro dan unit kerja kedinasan',
      5: '\nMembuat modul manajemen data pengguna sistem dan penugasan tim kerja biro'
    },
    // Table at element [54] (Minggu ke-4 Bulan ke-2 - November)
    54: {
      1: '\nMembuat formulir registrasi dan penginputan jadwal kegiatan kedinasan',
      2: '\nMengembangkan generator kode registrasi dan penomoran agenda kegiatan otomatis',
      3: '\nWFH',
      4: '\nMembuat tampilan kalender agenda serta daftar riwayat kegiatan kedinasan',
      5: '\nPengujian fungsional modul penjadwalan dan penyimpanan data kegiatan'
    },
    // Table at element [61] (Minggu ke-1 Bulan ke-3 - November)
    61: {
      1: '\nMembuat modul pengelolaan daftar pihak dan aparatur terkait kegiatan kedinasan',
      2: '\nMengembangkan modul pengarsipan berkas dan dokumen digital kegiatan',
      3: '\nWFH',
      4: '\nPenerapan validasi unggah dokumen arsip dan tautan berkas pendukung kegiatan',
      5: '\nMembuat rekapitulasi data arsip berkas kegiatan dan statistik kegiatan biro'
    },
    // Table at element [68] (Minggu ke-2 Bulan ke-3 - November)
    68: {
      1: '\nMembuat antarmuka editor pencatatan ringkasan dan hasil pelaksanaan kegiatan',
      2: '\nMengembangkan fungsi penyimpanan draf catatan dan audit trail arsip kegiatan',
      3: '\nWFH',
      4: '\nMembuat alur verifikasi dan telaah berkas hasil kegiatan oleh pimpinan',
      5: '\nMengembangkan fitur catatan telaah pimpinan dan pengesahan status kegiatan'
    },
    // Table at element [75] (Minggu ke-3 Bulan ke-3 - Desember)
    75: {
      1: '\nMembuat matriks monitoring tindak lanjut arahan kegiatan kedinasan',
      2: '\nMembuat formulir penetapan penanggung jawab (PIC) dan tenggat waktu tugas',
      3: '\nWFH',
      4: '\nMembuat fitur pembaruan status progres tindak lanjut penugasan kegiatan',
      5: '\nMembuat sistem notifikasi dan indikator progres penyelesaian tindak lanjut'
    },
    // Table at element [82] (Minggu ke-4 Bulan ke-3 - Desember)
    82: {
      1: '\nMembuat fitur ekspor dokumen PDF ringkasan arsip laporan kegiatan kedinasan',
      2: '\nPenyematan fitur QR Code verifikasi keabsahan dokumen arsip kegiatan',
      3: '\nWFH',
      4: '\nMelakukan pengujian fungsional sistem menggunakan metode Black Box Testing',
      5: '\nPerbaikan antarmuka pengguna (UI/UX) dan optimalisasi kueri data kegiatan'
    },
    // Table at element [89] (Minggu ke-1 Bulan ke-4 - Desember)
    89: {
      1: '\nDeployment Aplikasi Log Book Kegiatan ke lingkungan cloud',
      2: '\nDemonstrasi alur kerja aplikasi dan uji coba pengguna (UAT) bersama mentor',
      3: '\nWFH',
      4: '\nBimbingan dan penyusunan naskah akhir Laporan PKL bersama mentor instansi',
      5: '\nSerah terima Aplikasi Log Book Kegiatan serta dokumentasi teknis'
    },
    // Table at element [96] (Minggu ke-2 Bulan ke-4 - Desember)
    96: {
      1: '\nEvaluasi akhir kegiatan PKL, penyerahan plakat kenang-kenangan, dan penutupan'
    }
  };

  const ops = [];

  for (const [tblIdxStr, rows] of Object.entries(updates)) {
    const tblIdx = parseInt(tblIdxStr, 10);
    const tableEl = content[tblIdx];
    if (!tableEl || !tableEl.table) continue;
    const t = tableEl.table;

    for (const [rowIdxStr, newText] of Object.entries(rows)) {
      const rowIdx = parseInt(rowIdxStr, 10);
      const row = t.tableRows[rowIdx];
      if (!row) continue;
      const cell = row.tableCells[3];
      const start = cell.content[0].startIndex;
      const end = cell.content[cell.content.length - 1].endIndex - 1;

      ops.push({
        startIndex: start,
        endIndex: end,
        text: newText,
        desc: `Table [${tblIdx}] Row ${rowIdx}`
      });
    }
  }

  ops.sort((a, b) => b.startIndex - a.startIndex);

  const requests = [];
  ops.forEach(op => {
    if (op.endIndex > op.startIndex) {
      requests.push({
        deleteContentRange: {
          range: {
            startIndex: op.startIndex,
            endIndex: op.endIndex
          }
        }
      });
    }
    if (op.text && op.text.length > 0) {
      requests.push({
        insertText: {
          location: { index: op.startIndex },
          text: op.text
        }
      });
    }
  });

  console.log(`Sending ${requests.length} batchUpdate requests for content replacement...`);
  let updateRes = await fetch('https://docs.googleapis.com/v1/documents/' + docId + ':batchUpdate', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requests })
  });

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error('Content batchUpdate failed: ' + updateRes.status + ' ' + errText);
  }

  console.log('Content updated successfully.');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
