'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Building2,
  Plus,
  Loader2,
  Users,
  Check,
  RefreshCw,
  FolderOpen,
  ChevronDown,
  Info,
  Sparkles,
  Paperclip,
  FileText,
  UploadCloud,
  Trash2,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/providers/toast-provider';
import {
  getActiveUsersAction,
  createMeetingAction,
  previewNextMeetingNumberAction,
} from '@/app/actions/meeting-actions';
import { getTeamsAction } from '@/app/actions/team-actions';
import { uploadInvitationFileAction } from '@/app/actions/meeting-upload-actions';
import { cn } from '@/lib/utils';
import { MultiPicSelector, PicOptionUser } from './pic-selector';
import { TIM_OPTIONS } from '@/app/buat-rapat/page';

interface CreateMeetingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateMeetingDialog({ isOpen, onClose, onSuccess }: CreateMeetingDialogProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'STAFF';
  const canCreate = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'STAFF';
  const isStaff = userRole === 'STAFF';

  // Dynamic active teams from database
  const [teamsList, setTeamsList] = useState<any[]>(TIM_OPTIONS);

  // Deteksi seluruh tim kerja staf jika login sebagai STAFF (bisa >1 tim)
  const staffTeams = useMemo(() => {
    if (session?.user?.role !== 'STAFF') return [];
    const sessionTeams =
      (session?.user as any)?.assignedTeams ||
      (session?.user as any)?.teams;
    if (Array.isArray(sessionTeams) && sessionTeams.length > 0) {
      const mapped = sessionTeams
        .map((st: any) => {
          const found = teamsList.find((t) => t.id === st.id || t.code === st.code);
          return found || st;
        })
        .filter(Boolean);
      if (mapped.length > 0) return mapped;
    }
    const staffCode = session?.user?.teamCode?.toUpperCase();
    const staffId = session?.user?.teamId;
    const match = teamsList.find(
      (t) =>
        (staffId && t.id === staffId) ||
        (staffCode && t.code.toUpperCase() === staffCode)
    );
    if (match) return [match];
    if (staffId || staffCode) {
      return [
        {
          id: staffId || 'TIM-STAFF',
          code: staffCode || 'TIM',
          name: session?.user?.teamName || staffCode || 'Tim Staf',
        },
      ];
    }
    return [];
  }, [session, teamsList]);

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  // 1. Tim & Nomor Registrasi
  const [selectedTeamId, setSelectedTeamId] = useState<string>('TIM-001');
  const [registrationNumber, setRegistrationNumber] = useState<string>('');
  const [isManualNumber, setIsManualNumber] = useState(false);

  // 2. Judul Kegiatan
  const [title, setTitle] = useState('');

  // 3. Tanggal Kegiatan
  const [date, setDate] = useState(todayStr);

  // 4. Kategori Kegiatan
  const [kategoriRapat, setKategoriRapat] = useState<string>('PEKERJAAN_RUTIN');
  const [kategoriKomentar, setKategoriKomentar] = useState<string>('');

  // 6. PIC Kegiatan (Multi-PIC)
  const [selectedPicIds, setSelectedPicIds] = useState<string[]>([]);
  const [picName, setPicName] = useState<string>('');

  // 7. Dokumen Lampiran
  const [uploadedDoc, setUploadedDoc] = useState<{
    url: string;
    name: string;
    size: number;
  } | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingDoc(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadInvitationFileAction(fd);
      if (res.success && res.data) {
        setUploadedDoc(res.data);
        toast.success(`Dokumen "${res.data.name}" berhasil diunggah.`);
      } else {
        toast.error(res.error || 'Gagal mengunggah dokumen');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan sistem saat unggah');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Aux
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Load teams & users when modal opens
  useEffect(() => {
    if (isOpen) {
      getTeamsAction(false).then((res) => {
        if (res.success && res.data && res.data.length > 0) setTeamsList(res.data);
      });
      getActiveUsersAction().then((res) => {
        if (res.success && res.data) setAvailableUsers(res.data);
      });
    }
  }, [isOpen]);

  // Sync staff team
  useEffect(() => {
    if (isStaff && staffTeams.length > 0) {
      const isCurrentInStaffTeams = staffTeams.some((t: any) => t.id === selectedTeamId);
      if (!isCurrentInStaffTeams) {
        setSelectedTeamId(staffTeams[0].id);
        setIsManualNumber(false);
      }
    }
  }, [isStaff, staffTeams, selectedTeamId]);

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

  const currentTeam = teamsList.find((t: any) => t.id === selectedTeamId) || teamsList[0] || TIM_OPTIONS[0];

  const handleTogglePic = (user: PicOptionUser) => {
    setSelectedPicIds((prev) => {
      const exists = prev.includes(user.id);
      const next = exists ? prev.filter((id) => id !== user.id) : [...prev, user.id];
      const names = availableUsers
        .filter((u) => next.includes(u.id))
        .map((u) => u.name);
      setPicName(names.join(', '));
      return next;
    });
  };

  const handleClearAllPics = () => {
    setSelectedPicIds([]);
    setPicName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Judul kegiatan wajib diisi');
      return;
    }
    if (date && date < todayStr) {
      toast.error('Tanggal pelaksanaan kegiatan tidak boleh sebelum hari ini');
      return;
    }
    if (!picName.trim() && selectedPicIds.length === 0) {
      toast.error('PIC kegiatan wajib dipilih minimal 1 orang');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createMeetingAction({
        title: title.trim(),
        biroCode: 'IKK',
        primaryTeamId: selectedTeamId,
        date,
        startTime: '09:00',
        endTime: '12:00',
        location: 'Biro 3 / Luar Kantor',
        meetingKind: undefined,
        picName: picName.trim() || undefined,
        participantUserIds: selectedPicIds.length > 0 ? selectedPicIds : undefined,
        chairpersonId: selectedPicIds[0] || undefined,
        progressStatus: date <= todayStr ? 'Dalam Proses' : 'Belum Dimulai',
        meetingNumber: registrationNumber.trim() || undefined,
        documentCategory: kategoriRapat,
        sourceOrigin: kategoriKomentar.trim() || undefined,
        invitationDocUrl: uploadedDoc?.url || undefined,
        invitationDocName: uploadedDoc?.name || undefined,
        invitationDocSize: uploadedDoc?.size || undefined,
        categoryDocUrl: uploadedDoc?.url || undefined,
        categoryDocName: uploadedDoc?.name || undefined,
        categoryDocSize: uploadedDoc?.size || undefined,
      });

      if (res.success && res.data) {
        toast.success(`Kegiatan "${title}" (${res.data.meetingNumber}) berhasil dicatat!`);
        onClose();
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
          router.push(`/semua-rapat/${res.data.id}`);
        }
      } else {
        toast.error(res.error || 'Gagal menyimpan pencatatan kegiatan');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan sistem saat menyimpan kegiatan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#175360] via-[#1E6B7B] to-[#266F80] px-6 py-4.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-teal-200">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Catat Kegiatan Baru — Biro 3</h2>
              <p className="text-xs text-white/70">Pencatatan Logbook Kegiatan Resmi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 1. Tim Kerja & Registrasi */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">1. Tim Kerja &amp; Nomor Registrasi:</span>
              <button
                type="button"
                onClick={() => {
                  setIsManualNumber(false);
                  previewNextMeetingNumberAction('IKK', selectedTeamId).then((res) => {
                    if (res.success && res.data) setRegistrationNumber(res.data);
                  });
                }}
                className="text-[11px] text-[#1E6B7B] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Otomatis</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Pilih Tim Biro 3:
                </label>
                {isStaff ? (
                  staffTeams.length === 1 ? (
                    <div className="px-3 h-[38px] rounded-lg bg-[#E8F5F7] border border-[#BCE3EB] text-[#1E6B7B] text-xs font-bold flex items-center justify-between">
                      <span>{staffTeams[0].name}</span>
                      <span className="font-mono">{staffTeams[0].code}</span>
                    </div>
                  ) : (
                    <select
                      value={selectedTeamId}
                      onChange={(e) => {
                        setSelectedTeamId(e.target.value);
                        setIsManualNumber(false);
                      }}
                      className="w-full px-3 h-[38px] rounded-lg border border-[#31889C] bg-[#E8F5F7] text-[#1E6B7B] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#31889C]/20"
                    >
                      {(staffTeams.length > 0 ? staffTeams : teamsList).map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.code})
                        </option>
                      ))}
                    </select>
                  )
                ) : (
                  <select
                    value={selectedTeamId}
                    onChange={(e) => {
                      setSelectedTeamId(e.target.value);
                      setIsManualNumber(false);
                    }}
                    className="w-full px-3 h-[38px] rounded-lg border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20"
                  >
                    {teamsList.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nomor Registrasi Kegiatan:
                </label>
                <input
                  type="text"
                  required
                  value={registrationNumber}
                  onChange={(e) => {
                    setRegistrationNumber(e.target.value);
                    setIsManualNumber(true);
                  }}
                  placeholder={`Contoh: ${currentTeam.code}-001`}
                  className="w-full px-3 h-[38px] rounded-lg border border-slate-300 bg-white text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20"
                />
              </div>
            </div>
          </div>

          {/* 2. Judul Kegiatan */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              2. Judul Kegiatan <span className="text-red-500">*</span>:
            </label>
            <textarea
              required
              rows={2}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Rapat Koordinasi Fasilitasi Investasi KEK & Penyiapan Infrastruktur..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B]"
            />
          </div>

          {/* 3. Tanggal Kegiatan */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              3. Tanggal Pelaksanaan <span className="text-red-500">*</span>:
            </label>
            <input
              type="date"
              required
              min={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full sm:w-1/2 px-3.5 h-[40px] rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B]"
            />
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
              <span className="text-[#31889C] font-bold">💡</span>
              <span>Kegiatan otomatis mulai (Dalam Proses) sesuai tanggal yang ditentukan tanpa perlu aktivasi manual.</span>
            </p>
          </div>

          {/* 4. Kategori Kegiatan */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              4. Kategori Kegiatan:
            </label>
            <div className="relative">
              <select
                value={kategoriRapat}
                onChange={(e) => setKategoriRapat(e.target.value)}
                className="w-full px-3 pr-8 h-[38px] rounded-lg border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 appearance-none cursor-pointer"
              >
                <option value="PEKERJAAN_RUTIN">Pekerjaan Rutin</option>
                <option value="DISPOSISI">Disposisi</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <textarea
              rows={2}
              value={kategoriKomentar}
              onChange={(e) => setKategoriKomentar(e.target.value)}
              placeholder={
                kategoriRapat === 'DISPOSISI'
                  ? 'Detail disposisi, nomor agenda, asal disposisi...'
                  : 'Keterangan tambahan kegiatan rutin...'
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1E6B7B]/20 focus:border-[#1E6B7B] resize-none"
            />
          </div>

          {/* 6. PIC Kegiatan (Multi-PIC) */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-800">
              6. PIC Pelaksana Kegiatan <span className="text-red-500">*</span>{' '}
              <span className="text-slate-400 font-normal">(Bisa lebih dari 1 orang)</span>:
            </label>
            <MultiPicSelector
              availableUsers={availableUsers}
              selectedUserIds={selectedPicIds}
              picName={picName}
              onToggleUser={handleTogglePic}
              onPicNameChange={setPicName}
              onClearAll={handleClearAllPics}
              required
            />
          </div>

          {/* 7. Dokumen Acuan Kegiatan (Surat Undangan / Bahan Paparan / Berkas Acuan) */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                7. Dokumen Acuan Kegiatan <span className="text-slate-400 font-normal">(Opsional)</span>:
              </label>
              <span className="text-[11px] text-slate-400">PDF, Word, Excel, Gambar</span>
            </div>

            {uploadedDoc ? (
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#1E6B7B] text-white flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{uploadedDoc.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {(uploadedDoc.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedDoc(null)}
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Hapus berkas"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-200 hover:border-[#1E6B7B] bg-slate-50/50 hover:bg-teal-50/30 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.png,.jpg,.jpeg,.txt"
                  onChange={handleDocUpload}
                  disabled={isUploadingDoc}
                  className="hidden"
                />
                {isUploadingDoc ? (
                  <div className="flex items-center gap-2 text-xs text-[#1E6B7B] font-semibold py-1">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengunggah berkas...</span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">
                      Klik untuk unggah Surat Undangan / Bahan Paparan / Berkas Acuan
                    </span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Info Output Pasca-Kegiatan */}
          <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-start gap-2.5 text-slate-600 text-[11.5px]">
            <Info className="w-4 h-4 text-[#1E6B7B] shrink-0 mt-0.5" />
            <p>
              Link Google Drive, catatan capaian, Nd Konsum, dan rilis berita akan dilengkapi setelah kegiatan selesai melalui halaman detail kegiatan.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E6B7B] hover:bg-[#164E59] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-60 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Simpan Pencatatan Kegiatan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
