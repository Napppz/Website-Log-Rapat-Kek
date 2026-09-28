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
} from 'lucide-react';

interface MeetingMinutesEditorProps {
  meetingId: string;
  meeting?: {
    id?: string;
    meetingNumber?: string;
    title?: string;
    date?: Date | string;
    startTime?: string;
    endTime?: string;
    chairperson?: { name: string } | null;
    secretary?: { name: string } | null;
  } | null;
  initialMinutes?: {
    agenda?: JSONContent | null;
    discussion?: JSONContent | null;
    decisions?: JSONContent | null;
    conclusion?: JSONContent | null;
  } | null;
  onSaved?: (savedData: any) => void;
  onPreviewClick?: () => void;
}

export function MeetingMinutesEditor({
  meetingId,
  meeting,
  initialMinutes,
  onSaved,
  onPreviewClick,
}: MeetingMinutesEditorProps) {
  const { data: session } = useSession();

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
    'Wakil Ketua II, Tim Pelaksana Dewan Nasional KEK, Budi Santoso';

  const [chairpersonName, setChairpersonName] = useState<string>(initialChairpersonName);

  // Inisialisasi Nama dan Jabatan Notulis Penandatangan
  const initialSignerName =
    (initialMinutes?.conclusion as any)?.signerName ||
    (initialMinutes?.decisions as any)?.signerName ||
    meeting?.secretary?.name ||
    session?.user?.name ||
    'Sri Aurelia Rosyana Hari Habyby';

  const initialSignerRole =
    (initialMinutes?.conclusion as any)?.signerRole ||
    (initialMinutes?.decisions as any)?.signerRole ||
    'Pranata Hubungan Masyarakat Terampil';

  const [signerName, setSignerName] = useState<string>(initialSignerName);
  const [signerRole, setSignerRole] = useState<string>(initialSignerRole);

  const [activeTab, setActiveTab] = useState<'all' | 'agenda' | 'discussion' | 'conclusion' | 'decisions'>('all');
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
        // Sematkan signerName, signerRole, dan chairpersonName ke dalam payload conclusion & decisions agar selalu tersimpan
        const conclusionPayload = {
          ...(conclusion || { type: 'doc', content: [] }),
          signerName: signerName.trim(),
          signerRole: signerRole.trim(),
          chairpersonName: chairpersonName.trim(),
        };

        const decisionsPayload = decisions
          ? {
              ...decisions,
              signerName: signerName.trim(),
              signerRole: signerRole.trim(),
              chairpersonName: chairpersonName.trim(),
            }
          : undefined;

        const payload = {
          meetingId,
          agenda: agenda ?? undefined,
          discussion: discussion ?? undefined,
          decisions: decisionsPayload,
          conclusion: conclusionPayload,
        };

        const res = await upsertMeetingMinutesAction(payload);

        if (res.success && res.data) {
          setSaveStatus('saved');
          setStatusMessage(isDraft ? 'Draft tersimpan' : 'Tersimpan');
          hasChangesRef.current = false;
          if (onSaved) onSaved(res.data);
        } else {
          setSaveStatus('error');
          setStatusMessage(res.error || 'Gagal menyimpan');
        }
      } catch (err: any) {
        console.error('Save error:', err);
        setSaveStatus('error');
        setStatusMessage('Gagal menyimpan');
      }
    },
    [meetingId, agenda, discussion, decisions, conclusion, signerName, signerRole, chairpersonName, onSaved]
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
  }, [agenda, discussion, decisions, conclusion, signerName, signerRole, executeSave]);

  const handleFieldChange = (setter: React.Dispatch<React.SetStateAction<JSONContent | null>>) => {
    return (json: JSONContent) => {
      setter(json);
      hasChangesRef.current = true;
    };
  };

  const handleManualSave = async (isDraft: boolean) => {
    setIsManualSaving(true);
    await executeSave(isDraft);
    setIsManualSaving(false);
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

  return (
    <div className="flex flex-col gap-6">
      {/* Top Helper Header: Form Info Sesuai Naskah Dinas */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600 text-white">
              FORMAT NOTULA RESMI
            </span>
            <span className="text-[12px] font-semibold text-slate-700">
              NOMOR: {meeting?.meetingNumber || (meeting as any)?.code || 'KEK/ND/2026'}
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
            onClick={handleLoadOfficialTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-[12px] transition-colors cursor-pointer shadow-xs"
            title="Muat struktur kalimat dan format baku naskah dinas"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Gunakan Template Dinas</span>
          </button>

          {onPreviewClick && (
            <button
              type="button"
              onClick={onPreviewClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[12px] transition-colors cursor-pointer shadow-xs"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Lihat Lembar Notula</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Bar & Section Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white rounded-xl border border-amber-200/80 shadow-xs">
        {/* Left: Section Tabs (Sesuai Urutan Tata Naskah Dinas) */}
        <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
          <span className="font-bold text-slate-700 mr-1 hidden sm:inline">Navigasi:</span>
          {[
            { id: 'all', label: 'Semua Bagian' },
            { id: 'agenda', label: '1. Agenda' },
            { id: 'discussion', label: '2. Substansi Pembahasan' },
            { id: 'conclusion', label: '3. Kesimpulan' },
            { id: 'decisions', label: '4. Tindak Lanjut' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50/70 hover:bg-amber-100 text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: Autosave Status & Manual Actions */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 text-[12px] font-medium">
            {saveStatus === 'saving' && (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                <span className="text-amber-700">{statusMessage}</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">{statusMessage}</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <span className="text-red-700 font-semibold">{statusMessage}</span>
              </>
            )}
          </div>

          {/* Simpan Draft */}
          <button
            type="button"
            disabled={isManualSaving}
            onClick={() => handleManualSave(true)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[12px] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            Simpan Draft
          </button>

          {/* Simpan Final */}
          <button
            type="button"
            disabled={isManualSaving}
            onClick={() => handleManualSave(false)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[12px] transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan</span>
          </button>
        </div>
      </div>

      {/* Editor Sections (Berurutan Persis Seperti Naskah Dinas) */}
      <div className="space-y-6">
        {/* BAGIAN 1: AGENDA RAPAT */}
        {(activeTab === 'all' || activeTab === 'agenda') && (
          <div className="bg-white rounded-xl border border-amber-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
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
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
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
          <div className="bg-white rounded-xl border border-amber-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
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
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
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
          <div className="bg-white rounded-xl border border-amber-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
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
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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
          <div className="bg-white rounded-xl border border-amber-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
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
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
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
        <div className="bg-white rounded-2xl border border-amber-200/90 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
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
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Dapat Diisi Sendiri</span>
            </span>
          </div>

          {/* Input Ketua / Pimpinan Rapat */}
          <div className="space-y-2 p-4 bg-amber-50/50 rounded-xl border border-amber-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <label className="text-[12.5px] font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-amber-600" />
                <span>Ketua / Pimpinan Rapat (Pejabat yang Memimpin Sidang)</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {meeting?.chairperson?.name && (
                  <button
                    type="button"
                    onClick={() => {
                      setChairpersonName(meeting.chairperson!.name);
                      hasChangesRef.current = true;
                    }}
                    className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                  >
                    + Pimpinan Rapat ({meeting.chairperson.name})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setChairpersonName('Wakil Ketua II, Tim Pelaksana Dewan Nasional KEK, Budi Santoso');
                    hasChangesRef.current = true;
                  }}
                  className="text-[11px] font-semibold text-slate-600 hover:text-slate-800 hover:underline cursor-pointer"
                >
                  Gunakan Standar KEK
                </button>
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
              className="w-full px-4 py-2.5 text-[13.5px] bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-slate-900 font-medium placeholder:text-slate-400"
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
                {session?.user?.name && (
                  <button
                    type="button"
                    onClick={() => {
                      setSignerName(session.user.name || '');
                      hasChangesRef.current = true;
                    }}
                    className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                  >
                    + Gunakan Nama Saya ({session.user.name})
                  </button>
                )}
              </div>
              <input
                type="text"
                value={signerName}
                onChange={(e) => {
                  setSignerName(e.target.value);
                  hasChangesRef.current = true;
                }}
                placeholder="Contoh: Sri Aurelia Rosyana Hari Habyby"
                className="w-full px-4 py-2.5 text-[13.5px] bg-slate-50/80 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-slate-900 font-medium placeholder:text-slate-400"
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
                className="w-full px-4 py-2.5 text-[13.5px] bg-slate-50/80 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-slate-900 font-medium placeholder:text-slate-400"
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
                  <span className="text-[10.5px] text-amber-700 font-normal">Halaman Depan</span>
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

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-[12.5px] text-slate-900 space-y-1">
                <p className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <span>Kolom Tanda Tangan:</span>
                  <span className="text-[10.5px] text-amber-700 font-normal">Halaman Penutup</span>
                </p>
                <p className="font-normal mt-1">Notulis,</p>
                <p className="font-normal text-slate-800 leading-tight">
                  {signerRole || 'Pranata Hubungan Masyarakat Terampil,'}
                </p>
                <div className="py-2.5 text-slate-400 font-mono text-[11px]">
                  ${'{ttd_pengirim}'}
                </div>
                <p className="font-semibold text-slate-950">
                  {signerName || 'Sri Aurelia Rosyana Hari Habyby'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-[12px] text-slate-600">
          💡 Setiap ketikan otomatis disimpan (Autosave aktif). Klik tombol <strong>Simpan Notulen</strong> untuk konfirmasi data final.
        </span>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            disabled={isManualSaving}
            onClick={() => handleManualSave(true)}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[13px] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            Simpan Draft
          </button>
          <button
            type="button"
            disabled={isManualSaving}
            onClick={() => handleManualSave(false)}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[13px] transition-all shadow-md shadow-amber-600/20 cursor-pointer disabled:opacity-50"
          >
            <FileCheck className="w-4 h-4" />
            <span>Simpan Notulen</span>
          </button>
        </div>
      </div>
    </div>
  );
}
