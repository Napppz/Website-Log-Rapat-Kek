import { PrismaClient, UserRole, MeetingStatus, AttendanceStatus } from '@prisma/client';

const prisma = new PrismaClient();

const OFFICIAL_BIROS = [
  {
    code: 'BPPK',
    name: 'Biro Perencanaan dan Pembentukan Kawasan Ekonomi Khusus',
    shortName: 'Biro Perencanaan & Pembentukan',
    description:
      'Perencanaan tata ruang, studi kelayakan penetapan kawasan, evaluasi usulan pembentukan, dan pengawasan pembangunan KEK.',
  },
  {
    code: 'PKKEK',
    name: 'Biro Pengendalian Kawasan Ekonomi Khusus',
    shortName: 'Biro Pengendalian',
    description:
      'Pemantauan berkala operasional, kesiapan infrastruktur logistik, pemenuhan standar tata kelola, dan pengendalian kawasan.',
  },
  {
    code: 'IKK',
    name: 'Biro Investasi, Kerja Sama, dan Komunikasi',
    shortName: 'Biro Investasi, Kerja Sama & Komunikasi',
    description:
      'Akselerasi realisasi investasi strategis, fasilitasi kemitraan kementerian/swasta, dan publikasi komunikasi publik.',
  },
  {
    code: 'HSDMO',
    name: 'Biro Hukum, Sumber Daya Manusia, dan Organisasi',
    shortName: 'Biro Hukum, SDM & Organisasi',
    description:
      'Harmonisasi regulasi fasilitas kepabeanan/pajak, advokasi hukum, penataan organisasi, dan SDM.',
  },
  {
    code: 'UK',
    name: 'Biro Umum dan Keuangan',
    shortName: 'Biro Umum & Keuangan',
    description:
      'Tata kelola administrasi persuratan, perbendaharaan APBN, pengadaan barang/jasa, dukungan persidangan, dan rumah tangga.',
  },
];

async function main() {
  console.log('--- Memulai Seeding Master Data Stage 2 (Neon PostgreSQL) ---');

  // 1. Seed 5 Biro Resmi
  console.log('1. Menyemai 5 Biro Resmi...');
  const biroMap = new Map<string, string>(); // code -> biro.id

  for (const b of OFFICIAL_BIROS) {
    const biro = await prisma.biro.upsert({
      where: { code: b.code },
      update: {
        name: b.name,
        shortName: b.shortName,
        description: b.description,
        isActive: true,
      },
      create: {
        code: b.code,
        name: b.name,
        shortName: b.shortName,
        description: b.description,
        isActive: true,
      },
    });
    biroMap.set(b.code, biro.id);
    console.log(`   [BIRO] ${biro.code} - ${biro.shortName} (ID: ${biro.id})`);
  }

  // 2. Seed Users across all 5 Bureaus
  console.log('2. Menyemai Pengguna (Users)...');
  const dummyUsers = [
    // BPPK
    {
      name: 'Dr. Ir. Bambang Pranoto, M.T.',
      email: 'user.bppk1@kek.go.id',
      role: UserRole.ADMIN,
      biroCode: 'BPPK',
    },
    {
      name: 'Rian Setyawan, S.T.',
      email: 'user.bppk2@kek.go.id',
      role: UserRole.STAFF,
      biroCode: 'BPPK',
    },
    // PKKEK
    {
      name: 'Kolonel Laut (Purn) Hartono, M.M.',
      email: 'user.pkkek1@kek.go.id',
      role: UserRole.ADMIN,
      biroCode: 'PKKEK',
    },
    {
      name: 'Siti Nurhaliza, S.E.',
      email: 'user.pkkek2@kek.go.id',
      role: UserRole.NOTULIS,
      biroCode: 'PKKEK',
    },
    // IKK
    {
      name: 'Dr. Hendra Suprayitno, M.Si',
      email: 'user.ikk1@kek.go.id',
      role: UserRole.SUPER_ADMIN,
      biroCode: 'IKK',
    },
    {
      name: 'Maya Puspita, S.Sos',
      email: 'user.ikk2@kek.go.id',
      role: UserRole.NOTULIS,
      biroCode: 'IKK',
    },
    // HSDMO
    {
      name: 'Arya Wicaksono, S.H., LL.M.',
      email: 'user.hsdmo1@kek.go.id',
      role: UserRole.ADMIN,
      biroCode: 'HSDMO',
    },
    {
      name: 'Dewi Lestari, S.H.',
      email: 'user.hsdmo2@kek.go.id',
      role: UserRole.STAFF,
      biroCode: 'HSDMO',
    },
    // UK
    {
      name: 'Drs. Agus Budiman, M.Ak',
      email: 'user.uk1@kek.go.id',
      role: UserRole.ADMIN,
      biroCode: 'UK',
    },
    {
      name: 'Fitri Handayani, S.A.P.',
      email: 'user.uk2@kek.go.id',
      role: UserRole.VIEWER,
      biroCode: 'UK',
    },
  ];

  const userMap = new Map<string, string>(); // email -> user.id
  for (const u of dummyUsers) {
    const biroId = biroMap.get(u.biroCode)!;
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        biroId: biroId,
      },
      create: {
        name: u.name,
        email: u.email,
        role: u.role,
        biroId: biroId,
      },
    });
    userMap.set(u.email, user.id);
  }
  console.log(`   Berhasil menyemai ${userMap.size} user.`);

  // 3. Seed Meetings (12 meeting tersebar di 5 Biro)
  console.log('3. Menyemai Rapat Resmi (Meetings)...');
  const meetingsToSeed = [
    // BPPK
    {
      number: 'BPPK-001',
      title: 'Kajian Kelayakan dan Deliniasi Zonasi Usulan KEK Pariwisata Bahari',
      biroCode: 'BPPK',
      date: new Date('2026-09-18T09:00:00.000Z'),
      startTime: '09:00',
      endTime: '12:00',
      location: 'Ruang Rapat Kartini Lt. 3 Kemenko Perekonomian & Hybrid',
      status: MeetingStatus.FINAL,
      chairEmail: 'user.bppk1@kek.go.id',
      secretaryEmail: 'user.bppk2@kek.go.id',
      involvedBiros: ['PKKEK', 'IKK', 'HSDMO'],
    },
    {
      number: 'BPPK-002',
      title: 'Review Rencana Tata Ruang dan AMDAL Kawasan Industri KEK Baru',
      biroCode: 'BPPK',
      date: new Date('2026-09-21T13:30:00.000Z'),
      startTime: '13:30',
      endTime: '16:00',
      location: 'Ruang Rapat Biro Perencanaan & Zoom Cloud',
      status: MeetingStatus.APPROVED,
      chairEmail: 'user.bppk1@kek.go.id',
      secretaryEmail: 'user.bppk2@kek.go.id',
      involvedBiros: ['PKKEK', 'HSDMO'],
    },
    {
      number: 'BPPK-003',
      title: 'Evaluasi Dokumen Usulan Pembentukan KEK Digital Technology Park',
      biroCode: 'BPPK',
      date: new Date('2026-09-24T14:00:00.000Z'),
      startTime: '14:00',
      endTime: '17:00',
      location: 'Ruang Sidang Utama Sekretariat Jenderal KEK RI',
      status: MeetingStatus.DRAFT,
      chairEmail: 'user.bppk1@kek.go.id',
      secretaryEmail: 'user.bppk2@kek.go.id',
      involvedBiros: ['IKK', 'UK'],
    },

    // PKKEK
    {
      number: 'PKKEK-001',
      title: 'Audit Kesiapan Infrastruktur Pelabuhan & Jalur Logistik KEK Bitung',
      biroCode: 'PKKEK',
      date: new Date('2026-09-22T08:30:00.000Z'),
      startTime: '08:30',
      endTime: '11:45',
      location: 'Ruang Posko Monitoring Pelabuhan Bitung & Hybrid',
      status: MeetingStatus.APPROVED,
      chairEmail: 'user.pkkek1@kek.go.id',
      secretaryEmail: 'user.pkkek2@kek.go.id',
      involvedBiros: ['BPPK', 'IKK'],
    },
    {
      number: 'PKKEK-002',
      title: 'Monitoring Berkala Evaluasi Pengendalian Kinerja Operasional KEK Sei Mangkei',
      biroCode: 'PKKEK',
      date: new Date('2026-09-23T10:00:00.000Z'),
      startTime: '10:00',
      endTime: '12:30',
      location: 'Auditorium KEK Sei Mangkei & Live Zoom',
      status: MeetingStatus.REVIEW,
      chairEmail: 'user.pkkek1@kek.go.id',
      secretaryEmail: 'user.pkkek2@kek.go.id',
      involvedBiros: ['BPPK', 'UK'],
    },

    // IKK
    {
      number: 'IKK-001',
      title: 'Rapat Koordinasi Akselerasi Investasi Smelter Nikel Terintegrasi KEK Gresik',
      biroCode: 'IKK',
      date: new Date('2026-09-24T09:00:00.000Z'),
      startTime: '09:00',
      endTime: '12:00',
      location: 'Ruang Rapat Utama Gedung Posko KEK & Hybrid Zoom',
      status: MeetingStatus.APPROVED,
      chairEmail: 'user.ikk1@kek.go.id',
      secretaryEmail: 'user.ikk2@kek.go.id',
      involvedBiros: ['BPPK', 'PKKEK', 'HSDMO'],
    },
    {
      number: 'IKK-002',
      title: 'Finalisasi Perjanjian Kerja Sama Investor Asing Sektor Green Energy KEK Kendal',
      biroCode: 'IKK',
      date: new Date('2026-09-23T14:00:00.000Z'),
      startTime: '14:00',
      endTime: '16:30',
      location: 'Executive Lounge Lantai 2 Posko KEK',
      status: MeetingStatus.REVIEW,
      chairEmail: 'user.ikk1@kek.go.id',
      secretaryEmail: 'user.ikk2@kek.go.id',
      involvedBiros: ['HSDMO', 'UK'],
    },
    {
      number: 'IKK-003',
      title: 'Diseminasi Publik dan Strategi Komunikasi Internasional World Expo KEK',
      biroCode: 'IKK',
      date: new Date('2026-09-19T10:00:00.000Z'),
      startTime: '10:00',
      endTime: '12:00',
      location: 'Media Center Gedung Ali Wardhana',
      status: MeetingStatus.FINAL,
      chairEmail: 'user.ikk1@kek.go.id',
      secretaryEmail: 'user.ikk2@kek.go.id',
      involvedBiros: ['UK'],
    },

    // HSDMO
    {
      number: 'HSDMO-001',
      title: 'Harmonisasi Regulasi Insentif Pajak & Fasilitas Kepabeanan KEK Sanur',
      biroCode: 'HSDMO',
      date: new Date('2026-09-20T09:30:00.000Z'),
      startTime: '09:30',
      endTime: '12:30',
      location: 'Ruang Rapat Paripurna Dewan Nasional KEK',
      status: MeetingStatus.FINAL,
      chairEmail: 'user.hsdmo1@kek.go.id',
      secretaryEmail: 'user.hsdmo2@kek.go.id',
      involvedBiros: ['IKK', 'UK'],
    },
    {
      number: 'HSDMO-002',
      title: 'Penyusunan Rencana Strategis Penataan SDM dan Organisasi Administrator KEK Baru',
      biroCode: 'HSDMO',
      date: new Date('2026-09-24T10:00:00.000Z'),
      startTime: '10:00',
      endTime: '12:30',
      location: 'Ruang Rapat Harmonisasi Hukum & SDM',
      status: MeetingStatus.DRAFT,
      chairEmail: 'user.hsdmo1@kek.go.id',
      secretaryEmail: 'user.hsdmo2@kek.go.id',
      involvedBiros: ['UK', 'BPPK'],
    },

    // UK
    {
      number: 'UK-001',
      title: 'Penyusunan Rencana Anggaran Operasional & Pengadaan Sarpras Posko KEK TA 2027',
      biroCode: 'UK',
      date: new Date('2026-09-21T09:00:00.000Z'),
      startTime: '09:00',
      endTime: '11:30',
      location: 'Ruang Sidang Sekretariat Jenderal Lt. 5',
      status: MeetingStatus.APPROVED,
      chairEmail: 'user.uk1@kek.go.id',
      secretaryEmail: 'user.uk2@kek.go.id',
      involvedBiros: ['BPPK', 'PKKEK', 'IKK', 'HSDMO'],
    },
    {
      number: 'UK-002',
      title: 'Konsolidasi Laporan Keuangan Semester I dan Tertib Arsip Berita Acara',
      biroCode: 'UK',
      date: new Date('2026-09-22T13:30:00.000Z'),
      startTime: '13:30',
      endTime: '15:30',
      location: 'Ruang Komputerisasi Keuangan Sekretariat KEK',
      status: MeetingStatus.REVIEW,
      chairEmail: 'user.uk1@kek.go.id',
      secretaryEmail: 'user.uk2@kek.go.id',
      involvedBiros: ['HSDMO'],
    },
  ];

  // Map to count sequence per biro
  const sequenceCounters = new Map<string, number>();

  for (const m of meetingsToSeed) {
    const primaryBiroId = biroMap.get(m.biroCode)!;
    const chairId = userMap.get(m.chairEmail);
    const secretaryId = userMap.get(m.secretaryEmail);

    const meeting = await prisma.meeting.upsert({
      where: { meetingNumber: m.number },
      update: {
        title: m.title,
        primaryBiroId,
        date: m.date,
        startTime: m.startTime,
        endTime: m.endTime,
        location: m.location,
        chairpersonId: chairId,
        secretaryId: secretaryId,
        status: m.status,
      },
      create: {
        meetingNumber: m.number,
        title: m.title,
        primaryBiroId,
        date: m.date,
        startTime: m.startTime,
        endTime: m.endTime,
        location: m.location,
        chairpersonId: chairId,
        secretaryId: secretaryId,
        status: m.status,
      },
    });

    // Seed MeetingBiro (Involved Bureaus)
    for (const invCode of m.involvedBiros) {
      const invBiroId = biroMap.get(invCode);
      if (invBiroId) {
        await prisma.meetingBiro.upsert({
          where: {
            meetingId_biroId: {
              meetingId: meeting.id,
              biroId: invBiroId,
            },
          },
          update: {},
          create: {
            meetingId: meeting.id,
            biroId: invBiroId,
          },
        });
      }
    }

    // Seed MeetingParticipant
    const allUserIds = Array.from(userMap.values());
    // Attach chairperson & secretary as PRESENT
    if (chairId) {
      await prisma.meetingParticipant.upsert({
        where: {
          meetingId_userId: {
            meetingId: meeting.id,
            userId: chairId,
          },
        },
        update: { attendanceStatus: AttendanceStatus.PRESENT },
        create: {
          meetingId: meeting.id,
          userId: chairId,
          attendanceStatus: AttendanceStatus.PRESENT,
        },
      });
    }
    if (secretaryId) {
      await prisma.meetingParticipant.upsert({
        where: {
          meetingId_userId: {
            meetingId: meeting.id,
            userId: secretaryId,
          },
        },
        update: { attendanceStatus: AttendanceStatus.PRESENT },
        create: {
          meetingId: meeting.id,
          userId: secretaryId,
          attendanceStatus: AttendanceStatus.PRESENT,
        },
      });
    }

    // Update sequence counter for this biro
    const numPart = parseInt(m.number.split('-')[1], 10);
    const currMax = sequenceCounters.get(m.biroCode) || 0;
    if (numPart > currMax) {
      sequenceCounters.set(m.biroCode, numPart);
    }

    console.log(`   [MEETING] ${meeting.meetingNumber} - ${meeting.title.substring(0, 45)}...`);
  }

  // 4. Seed BiroMeetingSequence per Biro
  console.log('4. Menyinkronkan BiroMeetingSequence per Biro...');
  for (const [code, count] of sequenceCounters.entries()) {
    const biroId = biroMap.get(code)!;
    await prisma.biroMeetingSequence.upsert({
      where: { biroId: biroId },
      update: { currentNumber: count },
      create: { biroId: biroId, currentNumber: count },
    });
    console.log(`   [SEQUENCE] ${code} -> currentNumber: ${count}`);
  }

  console.log('--- SEEDING DATABASE FOUNDATION SELESAI DENGAN SUKSES ---');
}

main()
  .catch((e) => {
    console.error('Error saat seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
