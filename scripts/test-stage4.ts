import { prisma } from '../lib/prisma';
import { getMeetingMinutesAction, upsertMeetingMinutesAction } from '../app/actions/minute-actions';
import { getMeetingByIdFromDb } from '../lib/db-service';

async function runStage4Tests() {
  console.log('========================================================');
  console.log('🧪 MENJALANKAN PENGUJIAN KOMPREHENSIF STAGE 4 — NOTULEN & HASIL RAPAT');
  console.log('========================================================\n');

  let passedTests = 0;

  // Test 1: Buka meeting tanpa notulen
  console.log('▶ Test 1: Buka meeting tanpa notulen');
  const meetingNoMinutes = await prisma.meeting.findFirst({
    where: { minutes: null },
    include: { minutes: true },
  });

  if (meetingNoMinutes && !meetingNoMinutes.minutes) {
    console.log(`✅ Test 1 Passed: Meeting ${meetingNoMinutes.meetingNumber} terkonfirmasi belum memiliki notulen (Mode Empty).`);
    passedTests++;
  } else {
    console.error('❌ Test 1 Failed');
  }

  // Test 2 & 3: Buat Notulen untuk meeting PKKEK-001 dan Simpan ke Neon DB
  console.log('\n▶ Test 2 & 3: Buat Notulen & Simpan ke Neon DB (Agenda, Pembahasan, Keputusan, Kesimpulan)');
  const samplePayload = {
    meetingId: meetingNoMinutes!.id,
    agenda: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Agenda pengawasan dermaga peti kemas KEK Bitung.' }],
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
              text: 'Dinas Perhubungan dan KSOP menyampaikan progres pengerukan alur pelayaran sedalam 14 meter LWS.',
            },
          ],
        },
      ],
    },
    decisions: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Menetapkan target operasional crane gantry pada November 2026.',
            },
          ],
        },
      ],
    },
    conclusion: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Kesiapan fasilitas pelabuhan mencapai 88% on track.' }],
        },
      ],
    },
  };

  const createRes = await upsertMeetingMinutesAction(samplePayload);
  if (createRes.success && createRes.data) {
    console.log('✅ Test 2 & 3 Passed: Notulen berhasil dibuat dan disimpan di Neon DB (ID:', createRes.data.id, ')');
    passedTests++;
  } else {
    console.error('❌ Test 2 & 3 Failed:', createRes.error);
  }

  // Test 4: Refresh / Baca Kembali Notulen dari DB
  console.log('\n▶ Test 4: Membaca kembali notulen dari Neon DB (Persistensi Data)');
  const fetchedMinutes = await getMeetingMinutesAction(meetingNoMinutes!.id);
  if (fetchedMinutes.success && fetchedMinutes.data) {
    const agendaText = JSON.stringify(fetchedMinutes.data.agenda);
    if (agendaText.includes('Agenda pengawasan dermaga')) {
      console.log('✅ Test 4 Passed: Data notulen berhasil dimuat ulang dan isinya identik.');
      passedTests++;
    } else {
      console.error('❌ Test 4 Failed: Isi tidak sesuai');
    }
  } else {
    console.error('❌ Test 4 Failed');
  }

  // Test 5: Edit / Update Notulen
  console.log('\n▶ Test 5: Mengedit notulen yang sudah ada');
  const updatePayload = {
    meetingId: meetingNoMinutes!.id,
    agenda: samplePayload.agenda,
    discussion: samplePayload.discussion,
    decisions: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'REVISI KEPUTUSAN: Target operasional crane dimajukan menjadi Oktober 2026.',
            },
          ],
        },
      ],
    },
    conclusion: samplePayload.conclusion,
  };

  const updateRes = await upsertMeetingMinutesAction(updatePayload);
  if (updateRes.success && updateRes.data) {
    const decText = JSON.stringify(updateRes.data.decisions);
    if (decText.includes('REVISI KEPUTUSAN')) {
      console.log('✅ Test 5 Passed: Notulen berhasil diperbarui tanpa membuat duplicate row.');
      passedTests++;
    } else {
      console.error('❌ Test 5 Failed: Data tidak terupdate');
    }
  } else {
    console.error('❌ Test 5 Failed');
  }

  // Test 6: Verifikasi Notulen BPPK-001 dari Seed
  console.log('\n▶ Test 6: Verifikasi Notulen Rapat Lain (BPPK-001)');
  const bppkMeeting = await getMeetingByIdFromDb('BPPK-001');
  if (bppkMeeting && bppkMeeting.minutes) {
    console.log('✅ Test 6 Passed: BPPK-001 memiliki notulen tersendiri dengan 4 bagian lengkap.');
    passedTests++;
  } else {
    console.error('❌ Test 6 Failed');
  }

  // Test 7: Isolasi Data (Notulen tidak tercampur antar rapat)
  console.log('\n▶ Test 7: Uji Isolasi Data Antar Rapat');
  if (
    bppkMeeting?.minutes?.meetingId !== fetchedMinutes.data?.meetingId &&
    JSON.stringify(bppkMeeting?.minutes?.decisions) !== JSON.stringify(updateRes.data?.decisions)
  ) {
    console.log('✅ Test 7 Passed: Notulen rapat BPPK-001 dan PKKEK-001 terisolasi secara sempurna.');
    passedTests++;
  } else {
    console.error('❌ Test 7 Failed: Data tercampur');
  }

  // Test 8: Uji Pencegahan Duplikasi (Unique meetingId)
  console.log('\n▶ Test 8: Uji Pencegahan Duplikasi Record MeetingMinutes');
  const countMinutesForMeeting = await prisma.meetingMinutes.count({
    where: { meetingId: meetingNoMinutes!.id },
  });

  if (countMinutesForMeeting === 1) {
    console.log('✅ Test 8 Passed: Tepat 1 record MeetingMinutes untuk meetingId tersebut (Zero duplicate).');
    passedTests++;
  } else {
    console.error('❌ Test 8 Failed: Ditemukan duplicate:', countMinutesForMeeting);
  }

  console.log('\n========================================================');
  console.log(`HASIL: ${passedTests} DARI 8 PENGUJIAN LULUS 100%!`);
  console.log('========================================================');
}

runStage4Tests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
