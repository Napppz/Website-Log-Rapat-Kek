'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  Building2,
  Plus,
  Paperclip,
  UploadCloud,
  Loader2,
  FileCheck,
  Trash2,
  ExternalLink,
  MapPin,
  RefreshCw,
  FolderOpen,
  Users,
  Check,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/providers/toast-provider';
import {
  getActiveUsersAction,
  createMeetingAction,
  previewNextMeetingNumberAction,
} from '@/app/actions/meeting-actions';
import {
  uploadGenericMeetingFileAction,
  uploadInvitationFileAction,
} from '@/app/actions/meeting-upload-actions';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CreateMeetingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const JENIS_RAPAT_OPTIONS = [
  'Media Gathering',
  'Kunker',
  'Penandatanganan Mou',
  'Groundbreaking',
  'Rapat Kerja',
  'Seminar/Forum',
  'Rapat/Audiensi',
  'Pelantikan',
  'Seremoni',
  'Other',
];

const LOKASI_OPTIONS = [
  'Graha Satwika',
  'Loka Jagatsaksana',
  'Lokasandhi',
  'Antawacana',
  'Administrator',
  'Other',
];

const TIM_OPTIONS = [
  { id: 'TIM-001', code: 'INV', name: 'Tim Investasi' },
  { id: 'TIM-003', code: 'KS', name: 'Tim Kerja Sama' },
  { id: 'TIM-002', code: 'KOM', name: 'Tim Komunikasi' },
];

export function CreateMeetingDialog({ isOpen, onClose }: CreateMeetingDialogProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'STAFF';
  const canCreate = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  // 1. Judul Rapat
  const [title, setTitle] = useState('');

  // 2. Tanggal Rapat
  const [date, setDate] = useState(todayStr);

  // 3. Kategori Rapat (Undangan Internal, Daftar Naskah Masuk, Tunda Rapat)
  const [kategoriRapat, setKategoriRapat] = useState<string>('UNDANGAN_INTERNAL');
  const [sourceOrigin, setSourceOrigin] = useState<string>('');
  const [postponeReason, setPostponeReason] = useState<string>('');
  const [categoryDoc, setCategoryDoc] = useState<{ url: string; name: string; size: number } | null>(null);
  const [isUploadingCategory, setIsUploadingCategory] = useState(false);
  const catRef = useRef<HTMLInputElement>(null);

  // 4. Surat Undangan
  const [invitationDoc, setInvitationDoc] = useState<{ url: string; name: string; size: number } | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  // 5. Dokumen Terkait/Paparan Rapat
  const [materialDoc, setMaterialDoc] = useState<{ url: string; name: string; size: number } | null>(null);
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const matRef = useRef<HTMLInputElement>(null);

  // 6. Jenis Rapat
  const [jenisRapat, setJenisRapat] = useState<string>('Rapat Kerja');
  const [customJenisRapat, setCustomJenisRapat] = useState<string>('');

  // 7. PIC Rapat
  const [picUserId, setPicUserId] = useState<string>('');
  const [picName, setPicName] = useState<string>('');

  // 8. Undangan Rapat (Peserta)
  const [attendees, setAttendees] = useState<string>('');

  // 9. Lokasi Kegiatan
  const [lokasiOption, setLokasiOption] = useState<string>('Graha Satwika');
  const [customLocation, setCustomLocation] = useState<string>('');

  // 10. Kode Nomor Registrasi Per Tim
  const [selectedTeamId, setSelectedTeamId] = useState<string>('TIM-001');
  const [registrationNumber, setRegistrationNumber] = useState<string>('');
  const [isManualNumber, setIsManualNumber] = useState(false);

  // 11. Status: Otomatis 'On Progres' (Sedang Berlangsung)
  const [statusRapat, setStatusRapat] = useState<string>('On Progres');

  // Aux
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Load users when modal opens
  useEffect(() => {
    if (isOpen) {
      getActiveUsersAction().then((res) => {
        if (res.success && res.data) setAvailableUsers(res.data);
      });
    }
  }, [isOpen]);

  // Update preview number
  useEffect(() => {
    if (isOpen && !isManualNumber) {
      previewNextMeetingNumberAction('IKK', selectedTeamId).then((res) => {
        if (res.success && res.data) setRegistrationNumber(res.data);
      });
    }
  }, [isOpen, selectedTeamId, isManualNumber]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !canCreate) return null;

  const handleUploadFile = async (file: File, type: 'kategori' | 'undangan' | 'paparan') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    if (type === 'kategori') setIsUploadingCategory(true);
    if (type === 'undangan') setIsUploadingDoc(true);
    if (type === 'paparan') setIsUploadingMaterial(true);

    try {
      if (type === 'undangan') {
        const res = await uploadInvitationFileAction(formData);
        if (res.success && res.data) {
          setInvitationDoc({ url: res.data.url, name: res.data.name, size: res.data.size });
          toast.success(`Surat undangan terlampir.`);
        } else {
          toast.error(res.error || 'Gagal mengunggah berkas');
        }
      } else {
        const res = await uploadGenericMeetingFileAction(formData);
        if (res.success && res.data) {
          if (type === 'kategori') {
            setCategoryDoc({ url: res.data.url, name: res.data.name, size: res.data.size });
            toast.success('Berkas kategori terlampir.');
          } else {
            setMaterialDoc({ url: res.data.url, name: res.data.name, size: res.data.size });
            toast.success('Dokumen paparan terlampir.');
          }
        } else {
          toast.error(res.error || 'Gagal mengunggah berkas');
        }
      }
    } catch {
      toast.error('Gagal mengunggah berkas.');
    } finally {
      if (type === 'kategori') setIsUploadingCategory(false);
      if (type === 'undangan') setIsUploadingDoc(false);
      if (type === 'paparan') setIsUploadingMaterial(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (date && date < todayStr) {
        toast.error('Tanggal pelaksanaan rapat tidak boleh sebelum hari ini.');
        setSubmitting(false);
        return;
      }

      if (kategoriRapat === 'SURAT_DITUNDA' && !postponeReason.trim()) {
        toast.error('Mohon cantumkan alasan penundaan untuk kategori Tunda Rapat.');
        setSubmitting(false);
        return;
      }

      const finalJenis = jenisRapat === 'Other' ? (customJenisRapat.trim() || 'Lainnya') : jenisRapat;
      const finalLoc = lokasiOption === 'Other' ? (customLocation.trim() || 'Lokasi Eksternal') : lokasiOption;

      const res = await createMeetingAction({
        title: title.trim(),
        biroCode: 'IKK',
        primaryTeamId: selectedTeamId,
        date,
        startTime: '09:00',
        endTime: '12:00',
        location: finalLoc,
        meetingKind: finalJenis,
        picName: picName.trim() || undefined,
        chairpersonId: picUserId || undefined,
        progressStatus: statusRapat,
        meetingNumber: registrationNumber.trim() || undefined,
        documentCategory: kategoriRapat,
        sourceOrigin: sourceOrigin.trim() || undefined,
        postponeReason: postponeReason.trim() || undefined,
        invitationDocUrl: invitationDoc?.url || undefined,
        invitationDocName: invitationDoc?.name || undefined,
        invitationDocSize: invitationDoc?.size || undefined,
        categoryDocUrl: categoryDoc?.url || undefined,
        categoryDocName: categoryDoc?.name || undefined,
        categoryDocSize: categoryDoc?.size || undefined,
        materialDocUrl: materialDoc?.url || undefined,
        materialDocName: materialDoc?.name || undefined,
        materialDocSize: materialDoc?.size || undefined,
        attendees: attendees.trim() || undefined,
      });

      if (res.success && res.data) {
        toast.success(`Rapat "${title}" (${res.data.meetingNumber}) berhasil disimpan.`);
        onClose();
        router.refresh();
        router.push(`/semua-rapat/${res.data.id}`);
      } else {
        toast.error(res.error || 'Gagal membuat rapat');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan rapat');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F8FAFC] border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#31889C]"></span>
            <div>
              <h3 className="font-bold text-[16px] text-slate-900 leading-tight">
                Jadwalkan Rapat Baru KEK
              </h3>
              <p className="text-[11.5px] text-slate-500">
                Formulir 11 poin input masukan mentor
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/buat-rapat"
              onClick={onClose}
              className="text-xs text-[#1E6B7B] hover:underline font-semibold"
            >
              Buka Form Penuh →
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tutup Dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-[13px] overflow-y-auto flex-1">
          {/* 1. Kode Nomor Registrasi Per Tim */}
          <div className="p-4 rounded-xl bg-[#F0F8FA] border border-[#BCE3EB] space-y-3">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800 text-xs">
                1. Kode Nomor Registrasi Per Tim <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsManualNumber(false);
                  previewNextMeetingNumberAction('IKK', selectedTeamId).then((res) => {
                    if (res.success && res.data) setRegistrationNumber(res.data);
                  });
                }}
                className="text-[11px] text-[#1E6B7B] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Otomatis
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
              <div className="sm:col-span-7 space-y-1">
                <span className="text-[11px] text-slate-500 block font-semibold">Pilih Tim Kerja:</span>
                <div className="bg-white p-1 rounded-lg border border-slate-200 space-y-1">
                  {TIM_OPTIONS.map((tim) => {
                    const isSelected = selectedTeamId === tim.id;
                    return (
                      <button
                        key={tim.id}
                        type="button"
                        onClick={() => {
                          setSelectedTeamId(tim.id);
                          setIsManualNumber(false);
                        }}
                        className={cn(
                          'w-full px-3 py-1.5 rounded-md text-xs font-semibold transition-all text-left flex items-center justify-between cursor-pointer',
                          isSelected
                            ? 'bg-[#E8F5F7] text-[#1E6B7B] font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        <span>{tim.name}</span>
                        <span
                          className={cn(
                            'text-[10px] font-mono px-1.5 py-0.2 rounded font-bold',
                            isSelected ? 'bg-[#1E6B7B] text-white' : 'bg-slate-100 text-slate-500'
                          )}
                        >
                          {tim.code}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="sm:col-span-5 space-y-1">
                <span className="text-[11px] text-slate-500 block font-semibold">Nomor Registrasi:</span>
                <input
                  type="text"
                  required
                  value={registrationNumber}
                  onChange={(e) => {
                    setRegistrationNumber(e.target.value);
                    setIsManualNumber(true);
                  }}
                  placeholder="Contoh: INV-001"
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white font-mono font-bold text-xs"
                />
                <span className="text-[10.5px] text-slate-400 block">
                  Format per tim: {TIM_OPTIONS.find((t) => t.id === selectedTeamId)?.code}-001
                </span>
              </div>
            </div>
          </div>

          {/* 2. Judul Rapat */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              2. Judul Rapat <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Rapat Koordinasi Fasilitasi Investasi Kawasan Ekonomi Khusus..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C]"
            />
          </div>

          {/* 3. Tanggal Rapat */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#31889C]" />
              <span>3. Tanggal Rapat</span> <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              min={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25"
            />
          </div>

          {/* 4. Kategori Rapat */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <label className="block font-bold text-slate-800">
              4. Kategori Rapat <span className="text-red-500">*</span>
            </label>
            <select
              value={kategoriRapat}
              onChange={(e) => setKategoriRapat(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800"
            >
              <option value="UNDANGAN_INTERNAL">Undangan Internal</option>
              <option value="NASKAH_MASUK">Daftar Naskah Masuk</option>
              <option value="SURAT_DITUNDA">Tunda Rapat</option>
            </select>

            {kategoriRapat === 'NASKAH_MASUK' && (
              <input
                type="text"
                value={sourceOrigin}
                onChange={(e) => setSourceOrigin(e.target.value)}
                placeholder="Asal naskah / kementerian pengirim..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
              />
            )}
            {kategoriRapat === 'SURAT_DITUNDA' && (
              <input
                type="text"
                required
                value={postponeReason}
                onChange={(e) => setPostponeReason(e.target.value)}
                placeholder="Alasan penundaan rapat..."
                className="w-full px-3 py-1.5 rounded-lg border border-rose-300 bg-white text-xs"
              />
            )}

          </div>

          {/* 5 & 6. Surat Undangan & Dokumen Terkait */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 5. Surat Undangan */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <label className="block font-bold text-slate-800 text-xs">
                5. Surat Undangan (Bisa Upload File)
              </label>
              <input
                ref={docInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadFile(f, 'undangan');
                }}
              />
              {invitationDoc ? (
                <div className="flex items-center justify-between bg-white p-2 rounded border border-teal-200">
                  <span className="truncate max-w-[180px] text-xs font-bold text-slate-800">
                    {invitationDoc.name}
                  </span>
                  <button type="button" onClick={() => setInvitationDoc(null)} className="text-rose-500 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-xs text-slate-600 hover:border-[#1E6B7B] bg-white cursor-pointer"
                >
                  {isUploadingDoc ? 'Mengunggah...' : '+ Unggah Surat Undangan'}
                </button>
              )}
            </div>

            {/* 6. Dokumen Terkait / Paparan Rapat */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <label className="block font-bold text-slate-800 text-xs">
                6. Dokumen Terkait / Paparan (Bisa Upload File)
              </label>
              <input
                ref={matRef}
                type="file"
                className="hidden"
                accept=".pdf,.pptx,.ppt,.docx,.xlsx"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadFile(f, 'paparan');
                }}
              />
              {materialDoc ? (
                <div className="flex items-center justify-between bg-white p-2 rounded border border-teal-200">
                  <span className="truncate max-w-[180px] text-xs font-bold text-slate-800">
                    {materialDoc.name}
                  </span>
                  <button type="button" onClick={() => setMaterialDoc(null)} className="text-rose-500 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => matRef.current?.click()}
                  className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-xs text-slate-600 hover:border-[#1E6B7B] bg-white cursor-pointer"
                >
                  {isUploadingMaterial ? 'Mengunggah...' : '+ Unggah Paparan / Materi'}
                </button>
              )}
            </div>
          </div>

          {/* 7. Jenis Rapat */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              7. Jenis Rapat <span className="text-red-500">*</span>
            </label>
            <select
              value={jenisRapat}
              onChange={(e) => setJenisRapat(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 cursor-pointer"
            >
              {JENIS_RAPAT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'Other' ? 'Other (Kategori Lainnya...)' : opt}
                </option>
              ))}
            </select>
            {jenisRapat === 'Other' && (
              <input
                type="text"
                required
                value={customJenisRapat}
                onChange={(e) => setCustomJenisRapat(e.target.value)}
                placeholder="Ketik jenis rapat..."
                className="mt-2 w-full px-3 py-1.5 rounded-lg border border-[#31889C] text-xs"
              />
            )}
          </div>

          {/* 8. PIC Rapat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                8. PIC Rapat (Pilih Staf) <span className="text-red-500">*</span>
              </label>
              <select
                value={picUserId}
                onChange={(e) => {
                  setPicUserId(e.target.value);
                  const found = availableUsers.find((u) => u.id === e.target.value);
                  if (found) setPicName(found.name);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs cursor-pointer"
              >
                <option value="">-- Pilih Staf Penanggung Jawab --</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.team?.name ? `[Tim ${u.team.name}]` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Nama / Keterangan PIC:
              </label>
              <input
                type="text"
                required
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                placeholder="Nama PIC Rapat..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
              />
            </div>
          </div>

          {/* 9. Undangan Rapat (Peserta yang diundang) */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              9. Undangan Rapat (Peserta Rapat yang Diundang)
            </label>
            <textarea
              rows={2}
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="Daftar peserta eksternal, kementerian, atau perwakilan..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
            />
          </div>

          {/* 10. Lokasi Kegiatan */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#31889C]" />
              <span>10. Lokasi Kegiatan</span> <span className="text-red-500">*</span>
            </label>
            <select
              value={lokasiOption}
              onChange={(e) => setLokasiOption(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 cursor-pointer"
            >
              {LOKASI_OPTIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === 'Other'
                    ? 'Other (Tempat Lain)'
                    : loc === 'Administrator'
                    ? 'Administrator'
                    : `Ruang ${loc}`}
                </option>
              ))}
            </select>
            {lokasiOption === 'Other' && (
              <input
                type="text"
                required
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="Ketik lokasi kegiatan..."
                className="mt-2 w-full px-3 py-1.5 rounded-lg border border-[#31889C] text-xs"
              />
            )}
          </div>

          {/* Status Rapat Otomatis */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-emerald-950">
                  Status Otomatis: Sedang Berlangsung
                </p>
                <p className="text-[11px] text-emerald-700">
                  Progres lanjutan (Start, On Progress, Finish) dikelola di menu Tindak Lanjut
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              On Progres
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <Link
              href="/buat-rapat"
              onClick={onClose}
              className="text-xs text-[#1E6B7B] font-semibold hover:underline"
            >
              Buka Form Versi Halaman Penuh
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1E6B7B] text-white font-bold text-xs hover:bg-[#175360] shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Jadwalkan &amp; Simpan Rapat</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
