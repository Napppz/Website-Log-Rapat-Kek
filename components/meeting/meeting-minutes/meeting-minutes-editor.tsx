'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { TiptapEditor } from './tiptap-editor';
import { JSONContent } from '@tiptap/react';
import { upsertMeetingMinutesAction } from '@/app/actions/minute-actions';
import {
  Save,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  ListChecks,
  MessageSquare,
  CheckCircle,
  FileCheck,
  Sparkles,
  ClipboardList,
  PenTool,
  User,
  BadgeCheck,
  UserCheck,
  Upload,
  Trash2,
  Check,
  FileText,
  FileEdit,
  Loader2,
} from 'lucide-react';
import { SignatureDialog } from './signature-dialog';
import { updateMeetingNumberAction } from '@/app/actions/meeting-actions';
import { UploadMeetingDialog } from '@/components/meeting/upload-meeting-dialog';
import { toast } from '@/components/providers/toast-provider';

interface MeetingMinutesEditorProps {
  meetingId: string;
  meeting?: {
    id?: string;
    meetingNumber?: string;
    title?: string;
    date?: Date | string;
    startTime?: string;
    endTime?: string;
    location?: string;
    primaryBiro?: { name?: string; code?: string } | null;
    chairperson?: { name: string } | null;
    secretary?: { name: string } | null;
  } | null;
  initialMinutes?: {
    agenda?: JSONContent | null;
    discussion?: JSONContent | null;
    decisions?: JSONContent | null;
    conclusion?: JSONContent | null;
  } | null;
  defaultDocType?: 'NOTULA' | 'NOTA_DINAS';
  onSaved?: (savedData: any) => void;
  onPreviewClick?: () => void;
}

export function MeetingMinutesEditor({
  meetingId,
  meeting,
  initialMinutes,
  defaultDocType,
  onSaved,
  onPreviewClick,
}: MeetingMinutesEditorProps) {
  const { data: session } = useSession();

  const initialDocType =
    (initialMinutes?.conclusion as any)?.docType ||
    defaultDocType ||
    'NOTULA';
  const [docType, setDocType] = useState<'NOTULA' | 'NOTA_DINAS'>(initialDocType);

  const [agenda, setAgenda] = useState<JSONContent | null>(initialMinutes?.agenda || null);
  const [discussion, setDiscussion] = useState<JSONContent | null>(initialMinutes?.discussion || null);
  const [decisions, setDecisions] = useState<JSONContent | null>(initialMinutes?.decisions || null);
  const [conclusion, setConclusion] = useState<JSONContent | null>(initialMinutes?.conclusion || null);

  // Inisialisasi Nama Ketua / Pimpinan Rapat (Dapat Diisi Sendiri)
  const initialChairpersonName =
    (initialMinutes?.conclusion as any)?.chairpersonName ||
    (initialMinutes?.decisions as any)?.chairpersonName ||
    (initialMinutes?.discussion as any)?.chairpersonName ||
    (initialMinutes?.agenda as any)?.chairpersonName ||
    meeting?.chairperson?.name ||
    '';

  const [chairpersonName, setChairpersonName] = useState<string>(initialChairpersonName);

  // Inisialisasi Nama dan Jabatan Notulis Penandatangan
  const initialSignerName =
    (initialMinutes?.conclusion as any)?.signerName ||
    (initialMinutes?.decisions as any)?.signerName ||
    meeting?.secretary?.name ||
    session?.user?.name ||
    '';

  const initialSignerRole =
    (initialMinutes?.conclusion as any)?.signerRole ||
    (initialMinutes?.decisions as any)?.signerRole ||
    'Notulis';

  const initialSignatureImage =
    (initialMinutes?.conclusion as any)?.signatureImage ||
    (initialMinutes?.decisions as any)?.signatureImage ||
    (initialMinutes?.discussion as any)?.signatureImage ||
    (initialMinutes?.agenda as any)?.signatureImage ||
    null;

  const initialDocumentNumber =
    (initialMinutes?.conclusion as any)?.documentNumber !== undefined
      ? (initialMinutes?.conclusion as any)?.documentNumber
      : (initialMinutes?.decisions as any)?.documentNumber !== undefined
        ? (initialMinutes?.decisions as any)?.documentNumber
        : (meeting?.meetingNumber || '');

  const initialInvitationNumber =
    (initialMinutes?.conclusion as any)?.invitationNumber ||
    (initialMinutes?.decisions as any)?.invitationNumber ||
    (initialMinutes?.conclusion as any)?.nomorSuratUndangan ||
    (initialMinutes?.decisions as any)?.nomorSuratUndangan ||
    (meeting?.meetingNumber && (meeting.meetingNumber.toUpperCase().startsWith('UND') || meeting.meetingNumber.includes('/'))
      ? meeting.meetingNumber
      : '');

  const [signerName, setSignerName] = useState<string>(initialSignerName);
  const [signerRole, setSignerRole] = useState<string>(initialSignerRole);
  const [signatureImage, setSignatureImage] = useState<string | null>(initialSignatureImage);
  const [documentNumber, setDocumentNumber] = useState<string>(initialDocumentNumber);
  const [invitationNumber, setInvitationNumber] = useState<string>(initialInvitationNumber);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);

  // Inisialisasi Data Naskah Dinas: Nota Dinas
  const initialNota = (initialMinutes?.conclusion as any)?.notaDinas || {};
  const initialNdDocNumber =
    initialNota.documentNumber !== undefined
      ? initialNota.documentNumber
      : (initialMinutes?.conclusion as any)?.docType === 'NOTA_DINAS'
        ? ((initialMinutes?.conclusion as any)?.documentNumber || '')
        : '';
  const [ndDocumentNumber, setNdDocumentNumber] = useState<string>(initialNdDocNumber);

  const defaultBiro = meeting?.primaryBiro?.name
    ? meeting.primaryBiro.name.toUpperCase()
    : 'BIRO INVESTASI, KERJA SAMA, DAN KOMUNIKASI';
  const [ndBiroName, setNdBiroName] = useState<string>(initialNota.biroName || defaultBiro);

  const [ndRecipient, setNdRecipient] = useState<string>(
    initialNota.recipient || `Plt. Kepala ${meeting?.primaryBiro?.name || 'Biro Investasi, Kerja Sama, dan Komunikasi'}`
  );
  const [ndSender, setNdSender] = useState<string>(
    initialNota.sender || 'Kepala Bagian Program dan Tata Kelola'
  );
  const [ndSubject, setNdSubject] = useState<string>(
    initialNota.subject || (meeting?.title ? `Laporan Kegiatan ${meeting.title}` : 'Laporan Kegiatan Rapat')
  );

  const rawDate = meeting?.date ? new Date(meeting.date) : null;
  let defaultDateText = '27 Agustus 2026';
  if (rawDate && !isNaN(rawDate.getTime())) {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    defaultDateText = `${rawDate.getDate()} ${months[rawDate.getMonth()]} ${rawDate.getFullYear()}`;
  }
  const [ndDateText, setNdDateText] = useState<string>(initialNota.dateText || defaultDateText);
  const [ndAttachments, setNdAttachments] = useState<string>(initialNota.attachments || '1 (satu) berkas');

  const defaultIntro = `Menindaklanjuti pelaksanaan rapat ${meeting?.title || ''} yang dilaksanakan pada ${ndDateText}${meeting?.location ? ` bertempat di ${meeting.location}` : ''}, bersama ini kami sampaikan laporan pokok-pokok pembahasan sebagai berikut:`;
  const [ndIntroText, setNdIntroText] = useState<string>(initialNota.introText || defaultIntro);

  const [ndSignerRole, setNdSignerRole] = useState<string>(
    initialNota.signerRole || ndSender || 'Kepala Bagian Program dan Tata Kelola'
  );
  const [ndSignerName, setNdSignerName] = useState<string>(
    initialNota.signerName || meeting?.chairperson?.name || ''
  );

  const handleApplyExtractedDocToEditor = (extractedData: any) => {
    if (extractedData.agendaJson) {
      setAgenda(extractedData.agendaJson);
    }
    if (extractedData.discussionJson) {
      setDiscussion(extractedData.discussionJson);
    }
    if (extractedData.decisionsJson) {
      setDecisions(extractedData.decisionsJson);
    }
    if (extractedData.conclusionJson) {
      setConclusion(extractedData.conclusionJson);
    }
    if (extractedData.chairpersonName) {
      setChairpersonName(extractedData.chairpersonName);
    }
    if (extractedData.secretaryName) {
      setSignerName(extractedData.secretaryName);
    }
    if (extractedData.meetingNumber) {
      setInvitationNumber(extractedData.meetingNumber);
      setDocumentNumber(extractedData.meetingNumber);
      setNdDocumentNumber(extractedData.meetingNumber);
    }
    hasChangesRef.current = true;
  };

  const [activeTab, setActiveTab] = useState<'all' | 'agenda' | 'discussion' | 'conclusion' | 'decisions' | 'closer'>('all');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isManualSaving, setIsManualSaving] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasChangesRef = useRef(false);

  // Core save function
  const executeSave = useCallback(
    async (isDraft = false) => {
      setSaveStatus('saving');
      setStatusMessage('Menyimpan...');

      try {
        // Sematkan signerName, signerRole, chairpersonName, signatureImage, documentNumber, dan invitationNumber
        const finalNotulaDocNum = documentNumber.trim();
        const finalNdDocNum = ndDocumentNumber.trim();
        const finalInvitationNum = invitationNumber.trim() || undefined;

        // Jika nomor surat notula diubah dan berbeda dari nomor rapat asli di DB, sinkronkan ke tabel Meeting (hanya jika diisi resmi)
        if (docType === 'NOTULA' && finalNotulaDocNum && finalNotulaDocNum !== '-' && meeting?.meetingNumber && finalNotulaDocNum !== meeting.meetingNumber) {
          try {
            await updateMeetingNumberAction(meetingId, finalNotulaDocNum);
          } catch (numErr) {
            console.warn('Could not sync meeting number to meeting table:', numErr);
          }
        }

        const notaDinasPayload = {
          recipient: ndRecipient.trim(),
          sender: ndSender.trim(),
          subject: ndSubject.trim(),
          dateText: ndDateText.trim(),
          attachments: ndAttachments.trim(),
          introText: ndIntroText.trim(),
          biroName: ndBiroName.trim(),
          signerRole: ndSignerRole.trim(),
          signerName: ndSignerName.trim(),
          signatureImage: signatureImage || null,
          documentNumber: finalNdDocNum, // Opsional / bisa kosong
        };

        const conclusionPayload = {
          ...(conclusion || { type: 'doc', content: [] }),
          docType,
          notaDinas: notaDinasPayload,
          signerName: docType === 'NOTA_DINAS' ? ndSignerName.trim() : signerName.trim(),
          signerRole: docType === 'NOTA_DINAS' ? ndSignerRole.trim() : signerRole.trim(),
          chairpersonName: chairpersonName.trim(),
          signatureImage: signatureImage || null,
          documentNumber: docType === 'NOTA_DINAS' ? finalNdDocNum : finalNotulaDocNum,
          invitationNumber: finalInvitationNum,
        };

        const decisionsPayload = decisions
          ? {
            ...decisions,
            docType,
            notaDinas: notaDinasPayload,
            signerName: docType === 'NOTA_DINAS' ? ndSignerName.trim() : signerName.trim(),
            signerRole: docType === 'NOTA_DINAS' ? ndSignerRole.trim() : signerRole.trim(),
            chairpersonName: chairpersonName.trim(),
            signatureImage: signatureImage || null,
            documentNumber: docType === 'NOTA_DINAS' ? finalNdDocNum : finalNotulaDocNum,
            invitationNumber: finalInvitationNum,
          }
          : undefined;

        const payload = {
          meetingId,
          agenda: agenda ?? undefined,
          discussion: discussion ?? undefined,
          decisions: decisionsPayload,
          conclusion: conclusionPayload,
          docType,
          notaDinas: notaDinasPayload,
          isAutosave: isDraft,
        };

        const res = await upsertMeetingMinutesAction(payload);

        if (res.success && res.data) {
          setSaveStatus('saved');
          setStatusMessage(isDraft ? 'Draft tersimpan' : 'Tersimpan');
          hasChangesRef.current = false;
          if (onSaved) onSaved(res.data);
          return true;
        } else {
          setSaveStatus('error');
          setStatusMessage(res.error || 'Gagal menyimpan');
          return false;
        }
      } catch (err: any) {
        console.error('Save error:', err);
        setSaveStatus('error');
        setStatusMessage('Gagal menyimpan');
        return false;
      }
    },
    [
      meetingId,
      agenda,
      discussion,
      decisions,
      conclusion,
      docType,
      ndBiroName,
      ndRecipient,
      ndSender,
      ndSubject,
      ndDateText,
      ndAttachments,
      ndIntroText,
      ndSignerRole,
      ndSignerName,
      ndDocumentNumber,
      signerName,
      signerRole,
      chairpersonName,
      signatureImage,
      documentNumber,
      invitationNumber,
      meeting?.meetingNumber,
      onSaved,
    ]
  );

  // Autosave trigger with 2.5s debounce
  useEffect(() => {
    if (!hasChangesRef.current) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setSaveStatus('saving');
    setStatusMessage('Menyimpan perubahan...');

    debounceTimerRef.current = setTimeout(() => {
      executeSave(true);
    }, 2500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    agenda,
    discussion,
    decisions,
    conclusion,
    docType,
    ndBiroName,
    ndRecipient,
    ndSender,
    ndSubject,
    ndDateText,
    ndAttachments,
    ndIntroText,
    ndSignerRole,
    ndSignerName,
    ndDocumentNumber,
    signerName,
    signerRole,
    signatureImage,
    documentNumber,
    invitationNumber,
    executeSave,
  ]);

  const handleFieldChange = (setter: React.Dispatch<React.SetStateAction<JSONContent | null>>) => {
    return (json: JSONContent) => {
      setter(json);
      hasChangesRef.current = true;
    };
  };

  const handleManualSave = async (isDraft: boolean) => {
    setIsManualSaving(true);
    const isSuccess = await executeSave(isDraft);
    setIsManualSaving(false);
    if (isSuccess && !isDraft) {
      toast.success(
        docType === 'NOTA_DINAS'
          ? 'Nota Dinas berhasil disimpan.'
          : 'Notulen berhasil disimpan.'
      );
      if (onPreviewClick) {
        onPreviewClick();
      }
    } else if (!isSuccess && !isDraft) {
      toast.error('Gagal menyimpan naskah rapat. Silakan periksa kembali isian Anda.');
    }
  };

  // Muat draf template resmi naskah dinas notula
  const handleLoadOfficialTemplate = () => {
    const isConfirmed = window.confirm(
      'Gunakan format baku Notula Dinas KEK? Template pengantar dan nomor butir pembahasan akan diisikan ke editor.'
    );
    if (!isConfirmed) return;

    const topicTitle = meeting?.title || 'Kajian Dampak KEK terhadap Perekonomian';

    const defaultAgenda: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: `1. Pembahasan ${topicTitle}`,
            },
          ],
        },
      ],
    };

    const defaultDiscussion: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: `Rapat membahas terkait ${topicTitle.toLowerCase()}, adapun hasil rapat sebagaimana berikut:`,
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
                      text: 'Setjen Dewan Nasional KEK menyampaikan arahan pembuka dan rencana koordinasi pelaksanaan agenda bersama pihak terkait.',
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
                      text: 'Pemaparan substansi teknis dan identifikasi kebutuhan penyiapan data dukung pelaksanaan kegiatan.',
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
                      text: 'Tanggapan dan masukan dari seluruh perwakilan biro serta mitra pelaksana terkait penajaman sasaran.',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const defaultConclusion: JSONContent = {
      type: 'doc',
      content: [
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
                      text: 'Berdasarkan hasil pembahasan, seluruh pihak menyepakati kesiapan teknis pelaksanaan kegiatan dan koordinasi intensif antar unit kerja.',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const defaultDecisions: JSONContent = {
      type: 'doc',
      content: [
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
                      text: 'Tim kerja akan segera memproses penyiapan administrasi serta dokumen teknis pendukung.',
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
                      text: 'Melakukan koordinasi berkala dan pelaporan progres pelaksanaan secara berkelanjutan.',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    setAgenda(defaultAgenda);
    setDiscussion(defaultDiscussion);
    setConclusion(defaultConclusion);
    setDecisions(defaultDecisions);
    hasChangesRef.current = true;
  };

  // Muat draf template resmi naskah dinas Nota Dinas (Contoh Resmi Gov-CSIRT Setjen KEK)
  const handleLoadOfficialNotaDinasTemplate = () => {
    const isConfirmed = window.confirm(
      'Gunakan format baku Nota Dinas KEK (sesuai contoh resmi Gov-CSIRT)? Data kepala naskah, pokok pembahasan, kesimpulan, dan tindak lanjut akan diisikan ke editor.'
    );
    if (!isConfirmed) return;

    setNdBiroName('BIRO INVESTASI, KERJA SAMA, DAN KOMUNIKASI');
    setNdDocumentNumber('${nomor_naskah}');
    setNdRecipient('Plt. Kepala Biro Investasi, Kerja Sama, dan Komunikasi');
    setNdSender('Kepala Bagian Program dan Tata Kelola');
    setNdSubject(`Laporan Kegiatan ${meeting?.title || 'Forum Analisis dan Berbagi Informasi Gov-CSIRT T.A. 2026'}`);
    setNdAttachments('1 (satu) berkas');
    setNdIntroText(
      `Menindaklanjuti Surat Undangan terkait kegiatan ${meeting?.title || 'Forum Analisis dan Berbagi Informasi Gov-CSIRT T.A. 2026'}, bersama ini kami sampaikan laporan pokok-pokok pembahasan sebagai berikut:`
    );
    setNdSignerRole('Kepala Bagian Program dan Tata Kelola');
    setNdSignerName('Noviar Iskandar');

    const sampleDiscussion: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '1. Forum Analisis dan Berbagi Informasi Gov-CSIRT dihadiri oleh perwakilan tim CSIRT dari berbagai daerah dan tim Gov-CSIRT dari Direktorat Keamanan Siber dan Sandi Pemerintah Pusat.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '2. Forum ini dihadiri oleh pembicara dan narasumber ahli di bidang penanganan insiden siber.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '3. Dalam pemaparan narasumber terdapat beberapa pokok penting yang disampaikan mengenai ketahanan layanan melalui pendekatan reaktif dan proaktif.',
            },
          ],
        },
      ],
    };

    const sampleConclusion: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: `Berdasarkan hasil pembahasan pada kegiatan ini, kami menarik kesimpulan bahwa pengamanan siber dan tata kelola sistem harus dibangun secara berkelanjutan melalui monitoring berkala terhadap seluruh aktivitas sistem serta penataan data yang terkoordinasi.`,
            },
          ],
        },
      ],
    };

    const sampleDecisions: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Sebagai tindak lanjut, dapat disampaikan rekomendasi langkah prioritas sebagai berikut:',
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
                      text: 'Penguatan tata kelola dan akses infrastruktur pemantauan secara real-time.',
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
                      text: 'Penerapan prosedur validasi berkas dan peningkatan keamanan aplikasi instansi.',
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
                      text: 'Menetapkan batasan penggunaan dan verifikasi manual terhadap pengolahan AI.',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    setDiscussion(sampleDiscussion);
    setConclusion(sampleConclusion);
    setDecisions(sampleDecisions);
    hasChangesRef.current = true;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 0. Pilihan Jenis Dokumen Rapat (Notula vs Nota Dinas) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <label className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
            <span>Pilihan Jenis Dokumen Rapat</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F5F7] text-[#215865] border border-[#BCE3EB]">
              Tersedia 2 Format Resmi
            </span>
          </label>
          <p className="text-[12px] text-slate-500 mt-1">
            Pilih format dokumen naskah dinas yang ingin dibuat untuk rapat ini:
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setDocType('NOTULA');
              hasChangesRef.current = true;
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12.5px] font-semibold transition-all cursor-pointer ${docType === 'NOTULA'
                ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <FileText className="w-4 h-4 text-[#31889C]" />
            <span>Notula / Risalah</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setDocType('NOTA_DINAS');
              hasChangesRef.current = true;
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12.5px] font-semibold transition-all cursor-pointer ${docType === 'NOTA_DINAS'
                ? 'bg-[#31889C] text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <FileEdit className="w-4 h-4" />
            <span>Nota Dinas Resmi</span>
          </button>
        </div>
      </div>

      {docType === 'NOTA_DINAS' ? (
        /* ================= FORM NOTA DINAS RESMI ================= */
        <div className="space-y-6">
          {/* Header Card Nota Dinas */}
          <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#31889C] text-white">
                  NOTA DINAS RESMI KEK
                </span>
                <span className="text-[12px] font-semibold text-slate-700">
                  NOMOR: {ndDocumentNumber || '${nomor_naskah}'}
                </span>
              </div>
              <h3 className="font-bold text-[16px] text-slate-900 mt-1">
                {ndSubject || meeting?.title || 'Laporan Kegiatan Rapat'}
              </h3>
              <p className="text-[12px] text-slate-600 mt-0.5">
                Pengirim: <span className="font-semibold text-slate-800">{ndSender}</span> ({ndSignerName}) &bull; Kepada: <span className="font-semibold text-slate-800">{ndRecipient}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleLoadOfficialNotaDinasTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#BCE3EB] bg-[#F0F9FA] hover:bg-[#E8F5F7] text-[#215865] font-semibold text-[12px] transition-colors cursor-pointer shadow-xs"
                title="Muat struktur baku Nota Dinas (contoh Gov-CSIRT)"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#31889C]" />
                <span>Gunakan Contoh Nota Dinas</span>
              </button>

              <button
                type="button"
                disabled={isManualSaving}
                onClick={() => handleManualSave(false)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[12px] transition-all shadow-xs cursor-pointer disabled:opacity-50"
                title="Simpan perubahan dan langsung buka pratinjau Nota Dinas"
              >
                {isManualSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileCheck className="w-3.5 h-3.5" />
                )}
                <span>{isManualSaving ? 'Menyimpan...' : 'Simpan Nota Dinas'}</span>
              </button>

              {onPreviewClick && (
                <button
                  type="button"
                  onClick={onPreviewClick}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-[12px] transition-colors cursor-pointer shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5 text-[#31889C]" />
                  <span>Lihat Pratinjau Nota Dinas</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 1: Kop & Nomor Naskah */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h4 className="font-bold text-[14px] text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              1. Kop Surat &amp; Nomor Nota Dinas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12.5px] font-bold text-slate-800">
                  Nama Biro pada Kop Surat (Baris Ke-3)
                </label>
                <input
                  type="text"
                  value={ndBiroName}
                  onChange={(e) => {
                    setNdBiroName(e.target.value);
                    hasChangesRef.current = true;
                  }}
                  placeholder="Contoh: BIRO INVESTASI, KERJA SAMA, DAN KOMUNIKASI"
                  className="w-full px-3.5 py-2 text-[13px] bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C] font-medium"
                />
                <p className="text-[11px] text-slate-500">
                  Dicetak di bawah tulisan DEWAN NASIONAL KAWASAN EKONOMI KHUSUS / SEKRETARIAT JENDERAL.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12.5px] font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Nomor Nota Dinas (NOMOR: ...)</span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      Opsional
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    {ndDocumentNumber && ndDocumentNumber.trim() !== '' && (
                      <button
                        type="button"
                        onClick={() => {
                          setNdDocumentNumber('');
                          hasChangesRef.current = true;
                        }}
                        className="text-[11px] font-semibold text-slate-500 hover:text-red-600 hover:underline cursor-pointer"
                      >
                        Kosongkan / Format &apos;${'{nomor_naskah}'}&apos;
                      </button>
                    )}
                    {meeting?.meetingNumber && ndDocumentNumber !== meeting.meetingNumber && (
                      <button
                        type="button"
                        onClick={() => {
                          setNdDocumentNumber(meeting.meetingNumber || '');
                          hasChangesRef.current = true;
                        }}
                        className="text-[11px] font-semibold text-[#31889C] hover:underline cursor-pointer"
                      >
                        Salin dari Kode Rapat ({meeting.meetingNumber})
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={ndDocumentNumber}
                  onChange={(e) => {
                    setNdDocumentNumber(e.target.value);
                    hasChangesRef.current = true;
                  }}
                  placeholder="Opsional (contoh: ND-01/D.KEK/2026 atau biarkan kosong untuk ${nomor_naskah})"
                  className="w-full px-3.5 py-2 text-[13px] bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C] font-mono font-medium text-slate-900"
                />
                <p className="text-[11px] text-slate-500">
                  Nomor register naskah dinas resmi (opsional). Jika dikosongkan, naskah dinas &amp; PDF otomatis mencetak placeholder standar dinas <strong>NOMOR: ${'{nomor_naskah}'}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Informasi Tabel Naskah (Yth, Dari, Hal, Tanggal, Lampiran) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h4 className="font-bold text-[14px] text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              2. Kepala Naskah Nota Dinas (Tabel Informasi)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12.5px] font-bold text-slate-800">
                  Yth. (Penerima)
                </label>
                <input
                  type="text"
                  value={ndRecipient}
                  onChange={(e) => {
                    setNdRecipient(e.target.value);
                    hasChangesRef.current = true;
                  }}
                  placeholder="Contoh: Plt. Kepala Biro Investasi, Kerja Sama, dan Komunikasi"
                  className="w-full px-3.5 py-2 text-[13px] bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C] font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12.5px] font-bold text-slate-800">
                  Dari (Pengirim)
                </label>
                <input
                  type="text"
                  value={ndSender}
                  onChange={(e) => {
                    setNdSender(e.target.value);
                    if (!ndSignerRole || ndSignerRole === 'Kepala Bagian Program dan Tata Kelola') {
                      setNdSignerRole(e.target.value);
                    }
                    hasChangesRef.current = true;
                  }}
                  placeholder="Contoh: Kepala Bagian Program dan Tata Kelola"
                  className="w-full px-3.5 py-2 text-[13px] bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C] font-medium"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[12.5px] font-bold text-slate-800">
                  Hal (Perihal Laporan)
                </label>
                <input
                  type="text"
                  value={ndSubject}
                  onChange={(e) => {
                    setNdSubject(e.target.value);
                    hasChangesRef.current = true;
                  }}
                  placeholder="Contoh: Laporan Kegiatan Forum Analisis dan Berbagi Informasi Gov-CSIRT T.A. 2026"
                  className="w-full px-3.5 py-2 text-[13px] bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C] font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12.5px] font-bold text-slate-800">
                  Tanggal
                </label>
                <input
                  type="text"
                  value={ndDateText}
                  onChange={(e) => {
                    setNdDateText(e.target.value);
                    hasChangesRef.current = true;
                  }}
                  placeholder="Contoh: 27 Agustus 2026"
                  className="w-full px-3.5 py-2 text-[13px] bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C] font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12.5px] font-bold text-slate-800">
                  Lampiran
                </label>
                <input
                  type="text"
                  value={ndAttachments}
                  onChange={(e) => {
                    setNdAttachments(e.target.value);
                    hasChangesRef.current = true;
                  }}
                  placeholder="Contoh: 1 (satu) berkas atau -"
                  className="w-full px-3.5 py-2 text-[13px] bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C] font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Kalimat Pengantar / Pembuka */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-[14px] text-slate-900 uppercase tracking-wide">
                3. Kalimat Pengantar / Pembuka
              </h4>
              <button
                type="button"
                onClick={() => {
                  setNdIntroText(
                    `Menindaklanjuti pelaksanaan kegiatan ${meeting?.title || 'rapat'} yang dilaksanakan pada ${ndDateText}${meeting?.location ? ` bertempat di ${meeting.location}` : ''}, bersama ini kami sampaikan laporan pokok-pokok pembahasan sebagai berikut:`
                  );
                  hasChangesRef.current = true;
                }}
                className="text-[11px] font-semibold text-[#31889C] hover:text-[#266F80] hover:underline cursor-pointer"
              >
                + Buat Kalimat Otomatis
              </button>
            </div>
            <textarea
              rows={3}
              value={ndIntroText}
              onChange={(e) => {
                setNdIntroText(e.target.value);
                hasChangesRef.current = true;
              }}
              placeholder="Contoh: Menindaklanjuti Surat Undangan dari Kepala Badan Siber dan Sandi Pemerintah Pusat... bersama ini kami sampaikan laporan pokok-pokok pembahasan sebagai berikut:"
              className="w-full p-3.5 text-[13px] bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C] leading-relaxed text-slate-900"
            />
            <p className="text-[11px] text-slate-500">
              Paragraf pembuka sebelum butir pokok pembahasan. Ditampilkan dengan perataan kiri-kanan (justified) dan indentasi baris pertama.
            </p>
          </div>

          {/* Section 4: Pokok-pokok Pembahasan */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h4 className="font-bold text-[14px] text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              4. Pokok-pokok Pembahasan
            </h4>
            <p className="text-[11.5px] text-slate-500">
              Isi poin 1, 2, 3, dan seterusnya beserta sub-poin (a, b, c). Gunakan toolbar penomoran di editor.
            </p>
            <TiptapEditor
              content={discussion}
              onChange={handleFieldChange(setDiscussion)}
              placeholder="Ketikkan butir-butir pokok pembahasan rapat di sini..."
            />
          </div>

          {/* Section 5: Kesimpulan (Seksi 4) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h4 className="font-bold text-[14px] text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              5. Kesimpulan (Dicetak sebagai Seksi 4)
            </h4>
            <TiptapEditor
              content={conclusion}
              onChange={handleFieldChange(setConclusion)}
              placeholder="Ketikkan kesimpulan pembahasan rapat di sini..."
            />
          </div>

          {/* Section 6: Tindak Lanjut (Seksi 5) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h4 className="font-bold text-[14px] text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              6. Tindak Lanjut (Dicetak sebagai Seksi 5)
            </h4>
            <TiptapEditor
              content={decisions}
              onChange={handleFieldChange(setDecisions)}
              placeholder="Ketikkan butir tindak lanjut / rekomendasi aksi di sini..."
            />
          </div>

          {/* Section 7: Identitas Penandatangan & Pratinjau Tanda Tangan Nota Dinas */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F0F9FA] text-[#31889C] flex items-center justify-center">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[15px] text-slate-900 uppercase tracking-wide">
                    7. Identitas Penandatangan &amp; Pratinjau Tanda Tangan Nota Dinas
                  </h4>
                  <p className="text-[11.5px] text-slate-500">
                    Atur nama &amp; jabatan pejabat pengirim serta tanda tangan yang dicetak di sisi kanan bawah naskah dan berkas PDF
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#215865] bg-[#E8F5F7] px-2.5 py-1 rounded-md border border-[#BCE3EB] flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5 text-[#31889C]" />
                <span>Dapat Diisi Sendiri</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Input Jabatan Pengirim */}
              <div className="space-y-1.5">
                <label className="text-[12.5px] font-bold text-slate-800">
                  Jabatan Kedinasan Pengirim (Atas Tanda Tangan)
                </label>
                <input
                  type="text"
                  value={ndSignerRole}
                  onChange={(e) => {
                    setNdSignerRole(e.target.value);
                    hasChangesRef.current = true;
                  }}
                  placeholder="Contoh: Kepala Bagian Program dan Tata Kelola"
                  className="w-full px-4 py-2.5 text-[13.5px] bg-slate-50/80 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C] transition-all text-slate-900 font-medium placeholder:text-slate-400"
                />
                <p className="text-[11px] text-slate-500">
                  Dicetak pada baris atas sebelum tanda tangan (contoh: <em>Kepala Bagian Program dan Tata Kelola,</em>).
                </p>
              </div>

              {/* Input Nama Lengkap Pengirim */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12.5px] font-bold text-slate-800">
                    Nama Lengkap Pengirim (Bawah Tanda Tangan)
                  </label>
                  {session?.user?.name && (
                    <button
                      type="button"
                      onClick={() => {
                        setNdSignerName(session.user.name || '');
                        hasChangesRef.current = true;
                      }}
                      className="text-[11px] font-semibold text-[#31889C] hover:text-[#266F80] hover:underline cursor-pointer"
                    >
                      + Gunakan Nama Saya ({session.user.name})
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={ndSignerName}
                  onChange={(e) => {
                    setNdSignerName(e.target.value);
                    hasChangesRef.current = true;
                  }}
                  placeholder="Contoh: Noviar Iskandar"
                  className="w-full px-4 py-2.5 text-[13.5px] bg-slate-50/80 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C] transition-all text-slate-900 font-medium placeholder:text-slate-400"
                />
                <p className="text-[11px] text-slate-500">
                  Nama pejabat penandatangan yang dicetak di bawah tanda tangan.
                </p>
              </div>
            </div>

            {/* Pratinjau Tampilan Format Lembar Nota Dinas & Kolom Tanda Tangan */}
            <div className="pt-2">
              <p className="text-[11.5px] font-bold text-slate-700 mb-2">
                Pratinjau Format Lembar Nota Dinas &amp; Kolom Tanda Tangan:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Box 1: Ringkasan Pengirim & Naskah */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-[12px] text-slate-900 space-y-2">
                  <p className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                    <span>Identitas Naskah Dinas:</span>
                    <span className="text-[10.5px] text-[#31889C] font-normal">Halaman Depan</span>
                  </p>
                  <div className="space-y-1.5 text-[12px]">
                    <div className="grid grid-cols-[85px_10px_1fr] items-start text-[11.5px] leading-relaxed">
                      <span className="text-slate-600">Yth.</span>
                      <span>:</span>
                      <span className="text-slate-950 font-medium">{ndRecipient || 'Plt. Kepala Biro Investasi, Kerja Sama, dan Komunikasi'}</span>
                    </div>
                    <div className="grid grid-cols-[85px_10px_1fr] items-start text-[11.5px] leading-relaxed">
                      <span className="text-slate-600">Dari</span>
                      <span>:</span>
                      <span className="text-slate-950 font-medium">{ndSender || 'Kepala Bagian Program dan Tata Kelola'}</span>
                    </div>
                    <div className="grid grid-cols-[85px_10px_1fr] items-start text-[11.5px] leading-relaxed">
                      <span className="text-slate-600">Hal</span>
                      <span>:</span>
                      <span className="text-slate-950 font-medium">{ndSubject || meeting?.title || 'Laporan Kegiatan Forum Analisis'}</span>
                    </div>
                    <div className="grid grid-cols-[85px_10px_1fr] items-start text-[11.5px] leading-relaxed">
                      <span className="text-slate-600">Tanggal</span>
                      <span>:</span>
                      <span className="text-slate-950 font-medium">{ndDateText || '27 Agustus 2026'}</span>
                    </div>
                    <div className="grid grid-cols-[85px_10px_1fr] items-start text-[11.5px] leading-relaxed">
                      <span className="text-slate-600">Lampiran</span>
                      <span>:</span>
                      <span className="text-slate-950 font-medium">{ndAttachments || '1 (satu) berkas'}</span>
                    </div>
                  </div>
                </div>

                {/* Box 2: Kolom Tanda Tangan Sisi Kanan Bawah */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-[12.5px] text-slate-900 space-y-2">
                  <p className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                    <span>Kolom Tanda Tangan:</span>
                    <span className="text-[10.5px] text-[#31889C] font-normal">Halaman Penutup (Kanan Bawah)</span>
                  </p>
                  <p className="font-normal text-slate-800 leading-tight mt-1 whitespace-pre-line">
                    {ndSignerRole ? (ndSignerRole.endsWith(',') ? ndSignerRole : `${ndSignerRole},`) : 'Kepala Bagian Program dan Tata Kelola,'}
                  </p>

                  {/* Signature preview / upload area */}
                  {signatureImage ? (
                    <div className="my-2 p-3 bg-white rounded-xl border border-[#BCE3EB] flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="p-1 rounded-lg border border-slate-200 bg-[#F8FAFC]">
                          <img
                            src={signatureImage}
                            alt="Tanda Tangan Pengirim"
                            className="max-h-14 max-w-[130px] object-contain drop-shadow-2xs"
                          />
                        </div>
                        <div className="text-[11px] text-slate-600">
                          <p className="font-semibold text-[#4D8F3D] flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Tanda tangan terpasang</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Tampil di naskah dan berkas PDF
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsSignatureModalOpen(true)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                          title="Ubah tanda tangan"
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSignatureImage(null);
                            hasChangesRef.current = true;
                          }}
                          className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Hapus tanda tangan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="my-2 p-3.5 rounded-xl border border-dashed border-[#BCE3EB] bg-[#F0F9FA]/40 hover:bg-[#F0F9FA] transition-all flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-left space-y-0.5">
                        <p className="font-semibold text-[11.5px] text-slate-700 flex items-center gap-1.5">
                          <PenTool className="w-3.5 h-3.5 text-[#31889C]" />
                          <span>Tanda Tangan Pengirim (Opsional)</span>
                        </p>
                        <p className="text-[10.5px] text-slate-500">
                          Unggah berkas (PNG/JPG) atau gores langsung di layar sentuh / mouse. Jika kosong, dicetak placeholder {'${ttd_pengirim}'}.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsSignatureModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[11.5px] shadow-xs shadow-[#31889C]/20 transition-all cursor-pointer shrink-0"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>+ Atur Tanda Tangan</span>
                      </button>
                    </div>
                  )}

                  <p className="font-semibold text-slate-950 pt-1">
                    {ndSignerName || 'Noviar Iskandar'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= FORM NOTULA / RISALAH RAPAT ================= */
        <div className="space-y-6">
          {/* Top Helper Header: Form Info Sesuai Naskah Dinas */}
          <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#31889C] text-white">
                  FORMAT NOTULA RESMI
                </span>
                <span className="text-[12px] font-semibold text-slate-700">
                  NOMOR: {documentNumber || '-'}
                </span>
              </div>
              <h3 className="font-bold text-[16px] text-slate-900 mt-1">
                {meeting?.title || 'Pengisian Notula Rapat'}
              </h3>
              <p className="text-[12px] text-slate-600 mt-0.5">
                Pimpinan: <span className="font-semibold text-slate-800">{chairpersonName || 'Belum Ditugaskan'}</span> • Notulis: <span className="font-semibold text-slate-800">{signerName || 'Pranata Hubungan Masyarakat Terampil'}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsUploadDocOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#31889C] bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[12px] transition-all cursor-pointer shadow-xs"
                title="Unggah berkas Word (.docx), PDF (.pdf), atau Teks (.txt) untuk otomatis mengisi risalah notula"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>✨ Ekstrak dari Berkas</span>
              </button>

              <button
                type="button"
                onClick={handleLoadOfficialTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#BCE3EB] bg-[#F0F9FA] hover:bg-[#E8F5F7] text-[#215865] font-semibold text-[12px] transition-colors cursor-pointer shadow-xs"
                title="Muat struktur kalimat dan format baku naskah dinas"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#31889C]" />
                <span>Gunakan Template Dinas</span>
              </button>

              <button
                type="button"
                disabled={isManualSaving}
                onClick={() => handleManualSave(false)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[12px] transition-all shadow-xs cursor-pointer disabled:opacity-50"
                title="Simpan perubahan dan langsung buka pratinjau Notulen"
              >
                {isManualSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileCheck className="w-3.5 h-3.5" />
                )}
                <span>{isManualSaving ? 'Menyimpan...' : 'Simpan Notulen'}</span>
              </button>

              {onPreviewClick && (
                <button
                  type="button"
                  onClick={onPreviewClick}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-[12px] transition-colors cursor-pointer shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5 text-[#31889C]" />
                  <span>Lihat Pratinjau Naskah</span>
                </button>
              )}
            </div>
          </div>

          {/* Action Bar & Section Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
            {/* Left: Section Tabs (Sesuai Urutan Tata Naskah Dinas) */}
            <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
              <span className="font-bold text-slate-700 mr-1 hidden sm:inline">Navigasi:</span>
              {[
                { id: 'all', label: 'Semua Bagian' },
                { id: 'agenda', label: '1. Agenda' },
                { id: 'discussion', label: '2. Pembahasan' },
                { id: 'conclusion', label: '3. Kesimpulan' },
                { id: 'decisions', label: '4. Tindak Lanjut' },
                { id: 'closer', label: '5. Penutup & TTD' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${activeTab === tab.id
                      ? 'bg-[#31889C] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-[#F0F9FA] hover:text-[#31889C] text-slate-700'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right: Autosave Status Indicator */}
            <div className="flex items-center gap-2 text-[12px] font-medium self-end sm:self-center pr-1">
              {saveStatus === 'saving' && (
                <>
                  <Clock className="w-3.5 h-3.5 text-[#31889C] animate-spin" />
                  <span className="text-[#31889C]">{statusMessage}</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4D8F3D]" />
                  <span className="text-[#4D8F3D] font-semibold">{statusMessage}</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  <span className="text-red-700 font-semibold">{statusMessage}</span>
                </>
              )}
              {saveStatus === 'idle' && (
                <span className="text-slate-400 text-[11.5px]">Autosave aktif</span>
              )}
            </div>
          </div>

          {/* Editor Sections (Berurutan Persis Seperti Naskah Dinas) */}
          <div className="space-y-6">
            {/* BAGIAN 1: AGENDA RAPAT */}
            {(activeTab === 'all' || activeTab === 'agenda') && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#F0F9FA] text-[#31889C] flex items-center justify-center">
                      <ListChecks className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[14px] text-slate-900 uppercase tracking-wide">
                        1. Agenda Rapat
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Pokok materi yang dicantumkan pada bagian atas identitas notula
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#31889C] bg-[#E8F5F7] px-2 py-0.5 rounded border border-[#BCE3EB]">
                    Identitas Notula
                  </span>
                </div>

                <TiptapEditor
                  content={agenda}
                  onChange={handleFieldChange(setAgenda)}
                  placeholder="Contoh: 1. Pembahasan Kajian Dampak KEK terhadap Perekonomian"
                  minHeight="110px"
                />
              </div>
            )}

            {/* BAGIAN 2: SUBSTANSI INTI PEMBAHASAN RAPAT */}
            {(activeTab === 'all' || activeTab === 'discussion') && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#F0F9FA] text-[#31889C] flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[14px] text-slate-900 uppercase tracking-wide">
                        2. Substansi Inti Pembahasan Rapat
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Paragraf pengantar hasil rapat dan butir-butir pembahasan bernomor (1., 2., 3., dst.)
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#31889C] bg-[#E8F5F7] px-2 py-0.5 rounded border border-[#BCE3EB]">
                    Isi Pokok Notula
                  </span>
                </div>

                <TiptapEditor
                  content={discussion}
                  onChange={handleFieldChange(setDiscussion)}
                  placeholder={`Rapat membahas terkait [topik rapat], adapun hasil rapat sebagaimana berikut:\n\n1. [Poin pembahasan pertama]...\n2. [Poin pembahasan kedua]...`}
                  minHeight="220px"
                />
              </div>
            )}

            {/* BAGIAN 3: KESIMPULAN */}
            {(activeTab === 'all' || activeTab === 'conclusion') && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#ECF8E9] text-[#4D8F3D] flex items-center justify-center">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[14px] text-slate-900 uppercase tracking-wide">
                        3. Kesimpulan
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Poin-poin kesimpulan dan arahan akhir hasil musyawarah rapat
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#4D8F3D] bg-[#ECF8E9] px-2 py-0.5 rounded border border-[#D2EFCA]">
                    Poin Kesimpulan
                  </span>
                </div>

                <TiptapEditor
                  content={conclusion}
                  onChange={handleFieldChange(setConclusion)}
                  placeholder="Contoh: 1. Berdasarkan hasil pembahasan, kajian dampak KEK perlu diarahkan untuk mengukur manfaat nyata..."
                  minHeight="140px"
                />
              </div>
            )}

            {/* BAGIAN 4: TINDAK LANJUT */}
            {(activeTab === 'all' || activeTab === 'decisions') && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#F0F9FA] text-[#31889C] flex items-center justify-center">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[14px] text-slate-900 uppercase tracking-wide">
                        4. Tindak Lanjut
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Poin penugasan, pembagian tanggung jawab, dan target waktu penyelesaian
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#31889C] bg-[#E8F5F7] px-2 py-0.5 rounded border border-[#BCE3EB]">
                    Poin Tindak Lanjut
                  </span>
                </div>

                <TiptapEditor
                  content={decisions}
                  onChange={handleFieldChange(setDecisions)}
                  placeholder="Contoh: 1. Tim kerja akan segera melakukan pembahasan lebih lanjut untuk menajamkan desain kajian...\n2. Mekanisme dan bentuk kerja sama akan segera dibahas..."
                  minHeight="140px"
                />
              </div>
            )}

            {/* BAGIAN 5: PELAKSANA RAPAT & PENANDATANGAN (KETUA & NOTULIS) */}
            {(activeTab === 'all' || activeTab === 'closer') && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#F0F9FA] text-[#31889C] flex items-center justify-center">
                      <PenTool className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[15px] text-slate-900 uppercase tracking-wide">
                        Identitas Pelaksana Rapat &amp; Penandatangan
                      </h4>
                      <p className="text-[11.5px] text-slate-500">
                        Ubah nama &amp; jabatan Ketua/Pimpinan Rapat serta Notulis yang akan tercantum pada lembar naskah notula dinas &amp; berkas PDF
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#215865] bg-[#E8F5F7] px-2.5 py-1 rounded-md border border-[#BCE3EB] flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5 text-[#31889C]" />
                    <span>Dapat Diisi Sendiri</span>
                  </span>
                </div>

                {/* Input 1: Nomor Surat Undangan Rapat (Opsional) */}
                <div className="space-y-2 p-4 bg-[#F8FAFC] rounded-xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <label className="text-[12.5px] font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#31889C]" />
                      <span>Nomor Surat Undangan Rapat (Opsional)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {invitationNumber && invitationNumber.trim() !== '' && (
                        <button
                          type="button"
                          onClick={() => {
                            setInvitationNumber('');
                            hasChangesRef.current = true;
                          }}
                          className="text-[11px] font-semibold text-slate-500 hover:text-red-600 hover:underline cursor-pointer"
                        >
                          Kosongkan / Tanda &apos;-&apos;
                        </button>
                      )}
                      {meeting?.meetingNumber && invitationNumber !== meeting.meetingNumber && (
                        <button
                          type="button"
                          onClick={() => {
                            setInvitationNumber(meeting.meetingNumber || '');
                            hasChangesRef.current = true;
                          }}
                          className="text-[11px] font-semibold text-[#31889C] hover:underline cursor-pointer"
                        >
                          Salin dari {meeting.meetingNumber}
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={invitationNumber}
                    onChange={(e) => {
                      setInvitationNumber(e.target.value);
                      hasChangesRef.current = true;
                    }}
                    placeholder="Contoh: UND-014/SET.KEK/IX/2026 atau biarkan kosong (otomatis bertanda '-')"
                    className="w-full px-4 py-2.5 text-[13.5px] bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C] transition-all text-slate-900 font-medium placeholder:text-slate-400"
                  />
                  <p className="text-[11px] text-slate-500">
                    Dicantumkan pada baris <strong>Nomor Surat Undangan : ...</strong> di tabel identitas notula &amp; PDF. Jika dikosongkan, otomatis menampilkan tanda <strong>&apos;-&apos;</strong> sesuai kaidah tata naskah dinas untuk rapat yang tidak memakai surat undangan tersendiri.
                  </p>
                </div>

                {/* Input 2: Nomor Naskah Notula Dinas (NOMOR: ...) */}
                <div className="space-y-2 p-4 bg-[#F8FAFC] rounded-xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <label className="text-[12.5px] font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#31889C]" />
                      <span>Nomor Registrasi Notula (NOMOR: ...)</span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        Opsional
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      {documentNumber && documentNumber.trim() !== '' && (
                        <button
                          type="button"
                          onClick={() => {
                            setDocumentNumber('');
                            hasChangesRef.current = true;
                          }}
                          className="text-[11px] font-semibold text-slate-500 hover:text-red-600 hover:underline cursor-pointer"
                        >
                          Kosongkan / Tanda &apos;-&apos;
                        </button>
                      )}
                      {meeting?.meetingNumber && documentNumber !== meeting.meetingNumber && (
                        <button
                          type="button"
                          onClick={() => {
                            setDocumentNumber(meeting.meetingNumber || '');
                            hasChangesRef.current = true;
                          }}
                          className="text-[11px] font-semibold text-[#31889C] hover:underline cursor-pointer"
                        >
                          Gunakan Kode Rapat ({meeting.meetingNumber})
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => {
                      setDocumentNumber(e.target.value);
                      hasChangesRef.current = true;
                    }}
                    placeholder={`Opsional (contoh: ${meeting?.meetingNumber || 'IKK-015'} atau biarkan kosong untuk tanda '-')`}
                    className="w-full px-4 py-2.5 text-[13.5px] bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C] transition-all text-slate-900 font-medium placeholder:text-slate-400"
                  />
                  <p className="text-[11px] text-slate-500">
                    Dicetak tebal pada judul naskah notula dinas (<strong>NOMOR: {documentNumber || '-'}</strong>). Bersifat opsional — jika dikosongkan, naskah dinas &amp; PDF otomatis mencetak tanda <strong>&apos;-&apos;</strong>.
                  </p>
                </div>

                {/* Input Ketua / Pimpinan Rapat */}
                <div className="space-y-2 p-4 bg-[#F0F9FA] rounded-xl border border-[#BCE3EB]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <label className="text-[12.5px] font-bold text-slate-800 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-[#31889C]" />
                      <span>Ketua / Pimpinan Rapat (Pejabat yang Memimpin Sidang)</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {chairpersonName && chairpersonName.trim() !== '' && (
                        <button
                          type="button"
                          onClick={() => {
                            setChairpersonName('');
                            hasChangesRef.current = true;
                          }}
                          className="text-[11px] font-semibold text-slate-500 hover:text-red-600 hover:underline cursor-pointer"
                        >
                          Kosongkan (Tanda &apos;-&apos;)
                        </button>
                      )}
                      {meeting?.chairperson?.name && (
                        <button
                          type="button"
                          onClick={() => {
                            setChairpersonName(meeting.chairperson!.name);
                            hasChangesRef.current = true;
                          }}
                          className="text-[11px] font-semibold text-[#31889C] hover:text-[#266F80] hover:underline cursor-pointer"
                        >
                          + Pimpinan Rapat ({meeting.chairperson.name})
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={chairpersonName}
                    onChange={(e) => {
                      setChairpersonName(e.target.value);
                      hasChangesRef.current = true;
                    }}
                    placeholder="Contoh: Wakil Ketua II, Tim Pelaksana Dewan Nasional KEK, Budi Santoso"
                    className="w-full px-4 py-2.5 text-[13.5px] bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C] transition-all text-slate-900 font-medium placeholder:text-slate-400"
                  />
                  <p className="text-[11px] text-slate-500">
                    Ketikkan jabatan kedinasan dan nama lengkap pejabat pimpinan rapat. Baris ini dicetak pada bagian <strong>Pelaksana Rapat &rarr; Ketua/Pimpinan Rapat</strong> di naskah dinas &amp; dokumen PDF.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Input Nama Notulis */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[12.5px] font-bold text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>Nama Lengkap Notulis (Pencatat)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {signerName && signerName.trim() !== '' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSignerName('');
                              hasChangesRef.current = true;
                            }}
                            className="text-[11px] font-semibold text-slate-500 hover:text-red-600 hover:underline cursor-pointer"
                          >
                            Kosongkan (Tanda &apos;-&apos;)
                          </button>
                        )}
                        {session?.user?.name && (
                          <button
                            type="button"
                            onClick={() => {
                              setSignerName(session.user.name || '');
                              hasChangesRef.current = true;
                            }}
                            className="text-[11px] font-semibold text-[#31889C] hover:text-[#266F80] hover:underline cursor-pointer"
                          >
                            + Gunakan Nama Saya ({session.user.name})
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => {
                        setSignerName(e.target.value);
                        hasChangesRef.current = true;
                      }}
                      placeholder="Contoh: Sri Aurelia Rosyana Hari Habyby"
                      className="w-full px-4 py-2.5 text-[13.5px] bg-slate-50/80 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C] transition-all text-slate-900 font-medium placeholder:text-slate-400"
                    />
                    <p className="text-[11px] text-slate-500">
                      Nama ini akan dicetak pada baris pencatat dan bagian bawah tanda tangan.
                    </p>
                  </div>

                  {/* Input Jabatan Notulis */}
                  <div className="space-y-2">
                    <label className="text-[12.5px] font-bold text-slate-800">
                      Jabatan Kedinasan Notulis
                    </label>
                    <input
                      type="text"
                      value={signerRole}
                      onChange={(e) => {
                        setSignerRole(e.target.value);
                        hasChangesRef.current = true;
                      }}
                      placeholder="Contoh: Pranata Hubungan Masyarakat Terampil"
                      className="w-full px-4 py-2.5 text-[13.5px] bg-slate-50/80 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C] transition-all text-slate-900 font-medium placeholder:text-slate-400"
                    />
                    <p className="text-[11px] text-slate-500">
                      Contoh: <em>Pranata Hubungan Masyarakat Terampil</em> atau <em>Analis Kebijakan Ahli Muda</em>.
                    </p>
                  </div>
                </div>

                {/* Pratinjau Tampilan Format Lembar Notula & Tanda Tangan */}
                <div className="pt-2">
                  <p className="text-[11.5px] font-bold text-slate-700 mb-2">Pratinjau Pelaksana Rapat &amp; Kolom Tanda Tangan:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-[12px] text-slate-900 space-y-2">
                      <p className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                        <span>Baris Pelaksana Rapat:</span>
                        <span className="text-[10.5px] text-[#31889C] font-normal">Halaman Depan</span>
                      </p>
                      <div className="space-y-1.5 text-[12px]">
                        <p className="font-semibold text-slate-800">Pelaksana Rapat:</p>
                        <div className="grid grid-cols-[120px_10px_1fr] items-start text-[11.5px] leading-relaxed">
                          <span className="text-slate-600">Ketua/Pimpinan Rapat</span>
                          <span>:</span>
                          <span className="text-slate-950 font-medium">{chairpersonName || 'Wakil Ketua II, Tim Pelaksana Dewan Nasional KEK, Budi Santoso'}</span>
                        </div>
                        <div className="grid grid-cols-[120px_10px_1fr] items-start text-[11.5px] leading-relaxed">
                          <span className="text-slate-600">Pencatat</span>
                          <span>:</span>
                          <span className="text-slate-950 font-medium">{signerRole || 'Pranata Hubungan Masyarakat Terampil'}, {signerName || 'Sri Aurelia Rosyana Hari Habyby'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-[12.5px] text-slate-900 space-y-2">
                      <p className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                        <span>Kolom Tanda Tangan:</span>
                        <span className="text-[10.5px] text-[#31889C] font-normal">Halaman Penutup</span>
                      </p>
                      <p className="font-normal mt-1">Notulis,</p>
                      <p className="font-normal text-slate-800 leading-tight">
                        {signerRole || 'Pranata Hubungan Masyarakat Terampil,'}
                      </p>

                      {/* Signature preview / upload area */}
                      {signatureImage ? (
                        <div className="my-2 p-3 bg-white rounded-xl border border-[#BCE3EB] flex items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-3">
                            <div className="p-1 rounded-lg border border-slate-200 bg-[#F8FAFC]">
                              <img
                                src={signatureImage}
                                alt="Tanda Tangan Notulis"
                                className="max-h-14 max-w-[130px] object-contain drop-shadow-2xs"
                              />
                            </div>
                            <div className="text-[11px] text-slate-600">
                              <p className="font-semibold text-[#4D8F3D] flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Tanda tangan terpasang</span>
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Tampil di PDF dan pratinjau
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setIsSignatureModalOpen(true)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                              title="Ubah tanda tangan"
                            >
                              Ubah
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSignatureImage(null);
                                hasChangesRef.current = true;
                              }}
                              className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Hapus tanda tangan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="my-2 p-3.5 rounded-xl border border-dashed border-[#BCE3EB] bg-[#F0F9FA]/40 hover:bg-[#F0F9FA] transition-all flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="text-left space-y-0.5">
                            <p className="font-semibold text-[11.5px] text-slate-700 flex items-center gap-1.5">
                              <PenTool className="w-3.5 h-3.5 text-[#31889C]" />
                              <span>Tanda Tangan Notulis (Opsional)</span>
                            </p>
                            <p className="text-[10.5px] text-slate-500">
                              Unggah berkas (PNG/JPG) atau gores langsung di layar sentuh / mouse.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsSignatureModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[11.5px] shadow-xs shadow-[#31889C]/20 transition-all cursor-pointer shrink-0"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>+ Atur Tanda Tangan</span>
                          </button>
                        </div>
                      )}

                      <p className="font-semibold text-slate-950 pt-1">
                        {signerName || 'Sri Aurelia Rosyana Hari Habyby'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Signature Modal */}
      <SignatureDialog
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={(dataUrl) => {
          setSignatureImage(dataUrl);
          hasChangesRef.current = true;
        }}
        currentSignature={signatureImage}
      />

      {/* Upload Meeting Document Dialog */}
      <UploadMeetingDialog
        isOpen={isUploadDocOpen}
        onClose={() => setIsUploadDocOpen(false)}
        onApplyToForm={handleApplyExtractedDocToEditor}
      />

      {/* Bottom Save Bar */}
      <div className="p-4 bg-[#F8FAFC] rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-[12px] text-slate-600">
          💡 Setiap ketikan otomatis disimpan (Autosave aktif). Klik tombol <strong>Simpan {docType === 'NOTA_DINAS' ? 'Nota Dinas' : 'Notulen'}</strong> untuk menyimpan dan langsung membuka pratinjau naskah resmi.
        </span>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            disabled={isManualSaving}
            onClick={() => handleManualSave(false)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[13px] transition-all shadow-md shadow-[#31889C]/20 cursor-pointer disabled:opacity-50"
            title={`Simpan ${docType === 'NOTA_DINAS' ? 'Nota Dinas' : 'Notulen'} dan langsung buka pratinjau`}
          >
            {isManualSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileCheck className="w-4 h-4" />
            )}
            <span>
              {isManualSaving
                ? 'Menyimpan...'
                : docType === 'NOTA_DINAS'
                  ? 'Simpan Nota Dinas'
                  : 'Simpan Notulen'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
