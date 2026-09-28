import fs from 'fs';
import path from 'path';
import { generateMeetingPdf, MeetingPdfData } from '../lib/pdf/meeting-pdf-generator';

async function testPdf() {
  console.log('Testing Notula PDF generation with exact user sample...');

  const sampleMeeting: MeetingPdfData = {
    id: 'test-kajian-kek',
    meetingNumber: '${nomor_naskah}',
    title:
      'Rapat Koordinasi Pembahasan Dampak Kajian Kawasan Ekonomi Khusus (KEK) dengan Fakultas Ekonomi dan Bisnis, Institut Teknologi Bandung',
    date: '2026-09-05',
    startTime: '08:00',
    endTime: 'selesai',
    location: 'Gedung MNC Tower Lantai 3',
    status: 'FINAL',
    primaryBiro: {
      code: 'SETJEN',
      name: 'Sekretariat Jenderal',
      shortName: 'Setjen',
    },
    chairperson: {
      name: 'Wakil Ketua II, Tim Pelaksana Dewan Nasional KEK, Budi Santoso',
      biro: { code: 'SETJEN', shortName: 'Setjen' },
    },
    secretary: {
      name: 'Sri Aurelia Rosyana Hari Habyby',
      biro: { code: 'SETJEN', shortName: 'Setjen' },
    },
    participants: [
      { id: '1', attendanceStatus: 'PRESENT', user: { name: 'Kepala Biro Umum dan Keuangan' } },
      { id: '2', attendanceStatus: 'PRESENT', user: { name: 'Kepala Biro Pengendalian KEK' } },
      { id: '3', attendanceStatus: 'PRESENT', user: { name: 'Plt. Kepala Biro Investasi, Kerja Sama, dan Komunikasi' } },
      { id: '4', attendanceStatus: 'PRESENT', user: { name: 'Dekan Fakultas Ekonomi dan Bisnis, Institut Teknologi Bandung' } },
      { id: '5', attendanceStatus: 'PRESENT', user: { name: 'Tim Peneliti PT LAPI ITB' } },
      { id: '6', attendanceStatus: 'PRESENT', user: { name: 'Staf Sekretariat Jenderal Dewan Nasional KEK' } },
    ],
    minutes: {
      agenda: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '1. Pembahasan Kajian Dampak KEK terhadap Perekonomian',
              },
            ],
          },
        ],
      },
      discussion: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Rapat membahas terkait kajian dampak KEK terhadap perekonomian, adapun hasil rapat sebagaimana berikut:',
              },
            ],
          },
          {
            type: 'orderedList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Setjen Dewan Nasional KEK menyampaikan rencana untuk melakukan kerja sama dengan Institut Teknologi Bandung (ITB), melalui Lembaga Afiliasi Penelitian dan Industri (LAPI) ITB, dalam rangka penyusunan kajian dampak pengembangan Kawasan Ekonomi Khusus (KEK). Kajian tersebut diharapkan dapat memberikan gambaran yang lebih komprehensif mengenai manfaat dan dampak keberadaan KEK terhadap perekonomian, pengembangan wilayah, serta aktivitas ekonomi di dalam dan di sekitar kawasan.',
                      },
                    ],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Kajian diarahkan untuk mengidentifikasi dan mengukur sejauh mana keberadaan KEK memberikan manfaat nyata bagi perekonomian dan pengembangan wilayah. Selain mengukur capaian dan kontribusi KEK, kajian diharapkan dapat memberikan pemahaman mengenai faktor-faktor yang mendorong keberhasilan KEK serta mengidentifikasi praktik pengembangan di dalam kawasan yang berpotensi menjadi pembelajaran atau percontohan bagi pengembangan kegiatan ekonomi di luar KEK.',
                      },
                    ],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Peneliti ITB menyampaikan bahwa mengingat karakteristik KEK yang beragam, baik dari sisi sektor usaha, tingkat perkembangan, maupun model pengembangannya, diperlukan penajaman tema dan objek kajian. Kajian dapat difokuskan terlebih dahulu pada KEK yang telah berjalan dan memiliki perkembangan usaha yang relatif matang, khususnya KEK dengan basis manufaktur dan struktur industri yang beragam, sehingga ketersediaan data dan informasi memungkinkan pengukuran dampak dilakukan secara lebih efektif.',
                      },
                    ],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Selanjutnya, disampaikan bahwa dalam penentuan objek kajian, perlu dilakukan pemetaan terhadap KEK yang memiliki kinerja relatif baik dan dapat merepresentasikan karakteristik KEK secara lebih luas. Dari keseluruhan KEK, akan dilakukan identifikasi awal terhadap KEK yang telah beroperasi, memiliki perkembangan investasi dan pelaku usaha, serta memiliki aktivitas ekonomi yang memungkinkan untuk dianalisis dampaknya. Dalam hal ini, posisi dan karakteristik KEK seperti di wilayah Batam perlu diperhatikan secara khusus mengingat status Batam sebagai Kawasan Perdagangan Bebas dan Pelabuhan Bebas (KPBPB).',
                      },
                    ],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Ruang lingkup kajian dapat mencakup berbagai aspek yang berkaitan dengan pembentukan dampak ekonomi KEK, antara lain perkembangan infrastruktur, pemanfaatan insentif fiskal, struktur dan keterkaitan industri dalam kawasan, pasar dan logistik, rantai pasok, inovasi, serta pengembangan green business. Dari sisi wilayah, kajian juga perlu melihat keterkaitan kegiatan usaha di dalam KEK dengan perekonomian daerah di sekitarnya, termasuk potensi keterkaitan rantai pasok dan penggunaan bahan baku dari wilayah sekitar.',
                      },
                    ],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Dari sisi ketenagakerjaan, kajian tidak hanya diarahkan pada pengukuran jumlah tenaga kerja yang terserap, tetapi juga dapat melihat peningkatan kualitas dan kompetensi tenaga kerja melalui upskilling. Sementara itu, untuk sektor industri dan investasi, aspek transfer teknologi perlu menjadi salah satu perhatian, khususnya dalam melihat apakah investasi yang masuk telah menghasilkan peningkatan produktivitas dan memberikan manfaat teknologi bagi kawasan dan daerah sekitarnya.',
                      },
                    ],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Setjen Dewan Nasional KEK menyampaikan harapan agar LAPI ITB dapat menjadi integrator atas berbagai kajian terdahulu dan data yang telah tersedia untuk menghasilkan pengukuran dampak KEK terhadap perekonomian secara lebih komprehensif. Kajian diharapkan dapat menjawab sejauh mana manfaat keberadaan KEK dan kontribusinya terhadap pertumbuhan ekonomi nasional maupun daerah, serta mengidentifikasi KEK yang berkinerja baik dan representatif sebagai objek kajian, sekaligus merumuskan upaya optimalisasi manfaat KEK agar praktik yang berhasil di dalam kawasan dapat menjadi percontohan bagi pengembangan kegiatan ekonomi di luar KEK.',
                      },
                    ],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Terkait mekanisme kerja sama, perlu dilakukan penyesuaian dengan ketentuan dan SOP yang berlaku di lingkungan Setjen Denas KEK. Mengingat LAPI ITB merupakan entitas yang menjalankan kegiatan secara komersial, perlu ditentukan bentuk penugasan dan kontrak yang paling sesuai, termasuk kemungkinan kerja sama secara langsung dengan PT LAPI ITB. Aspek administrasi kerja sama dan substansi kajian diharapkan dapat diproses secara paralel agar pelaksanaan kajian dapat berjalan efektif.',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      conclusion: {
        type: 'doc',
        signerName: 'Dian Pratama, S.STP',
        signerRole: 'Analis Kebijakan Ahli Muda',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Berdasarkan hasil pembahasan, kajian dampak KEK perlu diarahkan untuk mengukur manfaat nyata keberadaan KEK terhadap perekonomian dan pengembangan wilayah, sekaligus mengidentifikasi faktor keberhasilan serta praktik yang dapat direplikasi di luar kawasan. Kajian akan dilakukan dengan mempertimbangkan karakteristik dan tingkat kematangan masing-masing KEK, serta mengoptimalkan data dan kajian terdahulu yang telah tersedia.',
              },
            ],
          },
        ],
      },
    },
    actionItems: [
      {
        id: 'ai-1',
        title:
          'Setjen Dewan Nasional KEK dan LAPI ITB akan segera melakukan pembahasan lebih lanjut untuk menajamkan desain kajian, meliputi tujuan, ruang lingkup, tema, metodologi, penentuan objek KEK, serta kebutuhan data. Setjen Dewan Nasional KEK akan menyediakan data dan dokumen yang diperlukan untuk mendukung pelaksanaan kajian.',
        dueDate: '2026-09-30',
        status: 'PENDING',
        priority: 'HIGH',
      },
      {
        id: 'ai-2',
        title:
          'Mekanisme dan bentuk kerja sama akan segera dibahas dan disepakati, termasuk opsi penugasan langsung dari Setjen Dewan Nasional KEK kepada PT LAPI ITB untuk mempercepat proses, dengan tetap memperhatikan ketentuan dan mekanisme yang berlaku di ITB. Apabila kerja sama langsung dengan PT LAPI ITB tidak memungkinkan, alternatif penugasan melalui Fakultas SAPPK ITB akan dipertimbangkan. Pembahasan juga mencakup aspek administrasi dan penyusunan Kerangka Acuan Kerja (KAK) sebagai dasar pelaksanaan kajian.',
        dueDate: '2026-09-30',
        status: 'PENDING',
        priority: 'HIGH',
      },
      {
        id: 'ai-3',
        title:
          'Pelaksanaan kajian ditargetkan dapat diselesaikan pada September 2026, dengan pembahasan substansi dapat dilakukan secara paralel dengan proses administrasi setelah mekanisme kerja sama disepakati, serta didukung penyediaan data dan dokumen secara optimal oleh Setjen Dewan Nasional KEK.',
        dueDate: '2026-09-30',
        status: 'PENDING',
        priority: 'HIGH',
      },
    ],
  };

  const buffer = await generateMeetingPdf(sampleMeeting);
  const outPath = path.join(process.cwd(), 'public', 'test-notula-output.pdf');
  fs.writeFileSync(outPath, buffer);
  console.log('PDF generated successfully at:', outPath, 'Bytes:', buffer.length);
}

testPdf().catch((err) => {
  console.error('Error generating test PDF:', err);
  process.exit(1);
});
