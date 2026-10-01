'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Users,
  FileText,
  UserCheck,
  CheckCircle2,
  Trash2,
  ChevronRight,
  Shield,
  Layers,
  CheckSquare,
  FileDown,
  UserPlus,
  Check,
  Clock3,
  X,
  Mail,
  Loader2,
  AlertCircle,
  Sparkles,
  Info,
  Link2,
  Eye,
  ExternalLink,
  Edit3,
  MessageCircle,
  History,
} from 'lucide-react';

import { MeetingStatusBadge } from '@/components/meeting/meeting-status-badge';
import { MeetingMinutesSection } from '@/components/meeting/meeting-minutes/meeting-minutes-section';
import { ActionItemList } from '@/components/action-items/action-item-list';
import { PreviousMeetingModal } from '@/components/meeting/previous-meeting-modal';
import { LinkMeetingDialog } from '@/components/meeting/link-meeting-dialog';
import { AgendaSeriesModal } from '@/components/meeting/agenda-series-modal';
import { MeetingCommentsSection } from '@/components/meeting/meeting-comments/meeting-comments-section';
import { MinutesHistorySection } from '@/components/meeting/meeting-history/minutes-history-section';
import { MeetingStatus } from '@/lib/types';
import { AttendanceStatus } from '@prisma/client';
import {
  updateMeetingStatusAction,
  deleteMeetingAction,
  updateParticipantAttendanceAction,
  addParticipantToMeetingAction,
  removeParticipantFromMeetingAction,
  updateMeetingNumberAction,
} from '@/app/actions/meeting-actions';
import { useSession } from 'next-auth/react';
import { toast, confirmModal } from '@/components/providers/toast-provider';

interface MeetingDetailViewProps {
  meeting: any;
  availableBiros?: any[];
  availableUsers?: any[];
}

const ATTENDANCE_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
  badgeClass: string;
  desc: string;
}[] = [
  {
    value: 'PRESENT',
    label: 'Hadir',
    icon: Check,
    activeClass: 'bg-[#7CC563] text-white shadow-xs border-[#7CC563]',
    badgeClass: 'bg-[#ECF8E9] text-[#4D8F3D] border-[#D2EFCA]',
    desc: 'Peserta hadir mengikuti sidang rapat',
  },
  {
    value: 'EXCUSED',
    label: 'Izin',
    icon: Clock3,
    activeClass: 'bg-[#FFD300] text-slate-900 shadow-xs border-[#FFD300]',
    badgeClass: 'bg-[#FFF8CC] text-[#8A7200] border-[#FFEE99]',
    desc: 'Peserta berhalangan hadir dengan konfirmasi izin resmi',
  },
  {
    value: 'ABSENT',
    label: 'Tidak Hadir',
    icon: X,
    activeClass: 'bg-rose-600 text-white shadow-xs border-rose-600',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-300',
    desc: 'Peserta tidak hadir tanpa konfirmasi',
  },
  {
    value: 'INVITED',
    label: 'Diundang',
    icon: Mail,
    activeClass: 'bg-slate-700 text-white shadow-xs border-slate-700',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    desc: 'Undangan terkirim, menunggu konfirmasi kehadiran',
  },
];

export function MeetingDetailView({
  meeting,
  availableBiros = [],
  availableUsers = [],
}: MeetingDetailViewProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'VIEWER';
  const canEditMeeting = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const canDeleteMeeting = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const canManageParticipants =
    userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'NOTULIS';

  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'minutes' | 'actionItems' | 'comments' | 'history'>('overview');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<MeetingStatus>(meeting.status);

  // Custom Meeting Number state
  const [currentMeetingNumber, setCurrentMeetingNumber] = useState<string>(meeting.meetingNumber);
  const [isEditingMeetingNumber, setIsEditingMeetingNumber] = useState(false);
  const [editNumberValue, setEditNumberValue] = useState<string>(meeting.meetingNumber);
  const [isSavingNumber, setIsSavingNumber] = useState(false);

  // Rapat Lanjutan / Rujukan states
  const [previousMeeting, setPreviousMeeting] = useState<any>(meeting.previousMeeting || null);
  const [showPreviousMeetingModal, setShowPreviousMeetingModal] = useState<boolean>(false);
  const [showLinkMeetingModal, setShowLinkMeetingModal] = useState<boolean>(false);
  const [showSeriesModal, setShowSeriesModal] = useState<boolean>(false);

  // Participant attendance states
  const [participants, setParticipants] = useState<any[]>(meeting.participants || []);
  const [updatingParticipantId, setUpdatingParticipantId] = useState<string | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [participantMode, setParticipantMode] = useState<'registered' | 'unregistered'>('registered');
  const [selectedAddUserId, setSelectedAddUserId] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [customBiroId, setCustomBiroId] = useState<string>(meeting.primaryBiroId || '');
  const [newParticipantStatus, setNewParticipantStatus] = useState<AttendanceStatus>('PRESENT');
  const [isAddingParticipant, setIsAddingParticipant] = useState<boolean>(false);

  const showToast = (message: string) => {
    toast.success(message);
  };

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      const res = await fetch(`/api/meetings/${meeting.id}/pdf`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || 'Gagal mengunduh dokumen PDF.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Risalah-Rapat-${meeting.meetingNumber || 'KEK'}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success(`Risalah rapat ${meeting.meetingNumber} berhasil diunduh (PDF).`);
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat mengekspor PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const formattedDate = new Date(meeting.date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleSaveMeetingNumber = async () => {
    const trimmed = editNumberValue.trim();
    if (!trimmed) {
      toast.warning('Nomor surat / undangan tidak boleh kosong.');
      return;
    }
    setIsSavingNumber(true);
    try {
      const res = await updateMeetingNumberAction(meeting.id, trimmed);
      if (res.success) {
        setCurrentMeetingNumber(trimmed);
        setIsEditingMeetingNumber(false);
        toast.success(`Nomor surat rapat berhasil diubah menjadi "${trimmed}".`);
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal mengubah nomor surat');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSavingNumber(false);
    }
  };

  const handleStatusChange = async (newStatus: MeetingStatus) => {
    try {
      setIsUpdatingStatus(true);
      const res = await updateMeetingStatusAction(meeting.id, newStatus);
      if (res.success) {
        setStatus(newStatus);
        toast.success(`Status rapat ${meeting.meetingNumber} berhasil diperbarui ke ${newStatus}.`);
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal mengubah status');
      }
    } catch (err: any) {
      toast.error(`Terjadi kesalahan: ${err?.message || 'Gagal'}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmModal({
      title: `Hapus Rapat ${meeting.meetingNumber}?`,
      message: `Apakah Anda yakin ingin menghapus permanen rapat "${meeting.title}" beserta seluruh notulen dan butir tindak lanjutnya dari database?`,
      confirmText: 'Ya, Hapus Rapat',
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      const res = await deleteMeetingAction(meeting.id);
      if (res.success) {
        toast.success(`Rapat ${meeting.meetingNumber} berhasil dihapus dari database.`);
        router.push('/semua-rapat');
      } else {
        toast.error(res.error || 'Gagal menghapus rapat');
      }
    } catch (err: any) {
      toast.error(`Terjadi kesalahan: ${err?.message || 'Gagal menghapus rapat'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Participant handlers
  const handleUpdateAttendance = async (
    participantId: string,
    newStatus: AttendanceStatus,
    userName: string
  ) => {
    const prevParticipants = [...participants];
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, attendanceStatus: newStatus } : p))
    );
    setUpdatingParticipantId(participantId);

    try {
      const res = await updateParticipantAttendanceAction(participantId, newStatus);
      if (res.success) {
        const label = ATTENDANCE_OPTIONS.find((o) => o.value === newStatus)?.label || newStatus;
        toast.success(`Presensi "${userName}" diubah menjadi "${label}".`);
        router.refresh();
      } else {
        setParticipants(prevParticipants);
        toast.error(res.error || 'Gagal mengubah status kehadiran.');
      }
    } catch (err: any) {
      setParticipants(prevParticipants);
      toast.error(err?.message || 'Terjadi kesalahan sistem saat memperbarui presensi.');
    } finally {
      setUpdatingParticipantId(null);
    }
  };

  const handleMarkAllPresent = async () => {
    const notPresent = participants.filter((p) => p.attendanceStatus !== 'PRESENT');
    if (notPresent.length === 0) {
      toast.info('Semua peserta sidang sudah berstatus "Hadir".');
      return;
    }

    const confirmed = await confirmModal({
      title: 'Tandai Semua Hadir?',
      message: `Tandai ${notPresent.length} peserta yang belum hadir sebagai "Hadir"?`,
      confirmText: 'Ya, Tandai Hadir',
      variant: 'primary',
    });

    if (!confirmed) {
      return;
    }

    setIsBulkUpdating(true);
    try {
      for (const p of notPresent) {
        await updateParticipantAttendanceAction(p.id, 'PRESENT');
      }
      setParticipants((prev) =>
        prev.map((p) => ({ ...p, attendanceStatus: 'PRESENT' as AttendanceStatus }))
      );
      toast.success(`Berhasil menandai ${notPresent.length} peserta sebagai "Hadir".`);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat memperbarui presensi massal.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string, userName: string) => {
    const confirmed = await confirmModal({
      title: 'Hapus Peserta Sidang?',
      message: `Hapus "${userName}" dari daftar peserta sidang ini?`,
      confirmText: 'Hapus Peserta',
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    const prev = [...participants];
    setParticipants((p) => p.filter((x) => x.id !== participantId));
    setUpdatingParticipantId(participantId);

    try {
      const res = await removeParticipantFromMeetingAction(participantId);
      if (res.success) {
        toast.success(`Peserta "${userName}" berhasil dihapus dari daftar sidang.`);
        router.refresh();
      } else {
        setParticipants(prev);
        toast.error(res.error || 'Gagal menghapus peserta.');
      }
    } catch (err: any) {
      setParticipants(prev);
      toast.error(err?.message || 'Terjadi kesalahan saat menghapus peserta.');
    } finally {
      setUpdatingParticipantId(null);
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (participantMode === 'registered' && !selectedAddUserId) {
      toast.warning('Silakan pilih peserta yang ingin ditambahkan.');
      return;
    }
    if (participantMode === 'unregistered' && !customName.trim()) {
      toast.warning('Silakan masukkan nama lengkap pejabat / peserta.');
      return;
    }

    setIsAddingParticipant(true);
    try {
      const payload =
        participantMode === 'registered'
          ? {
              userId: selectedAddUserId,
              attendanceStatus: newParticipantStatus,
            }
          : {
              customName: customName.trim(),
              customEmail: customEmail.trim() || undefined,
              biroId: customBiroId || meeting.primaryBiroId,
              attendanceStatus: newParticipantStatus,
            };

      const res = await addParticipantToMeetingAction(meeting.id, payload);
      if (res.success && res.data) {
        setParticipants((prev) => {
          const exists = prev.some((p) => p.userId === res.data.userId);
          if (exists) {
            return prev.map((p) => (p.userId === res.data.userId ? res.data : p));
          }
          return [...prev, res.data];
        });
        toast.success(`Peserta "${res.data.user?.name}" berhasil ditambahkan ke rapat.`);
        setShowAddModal(false);
        setSelectedAddUserId('');
        setCustomName('');
        setCustomEmail('');
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal menambahkan peserta.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat menambahkan peserta.');
    } finally {
      setIsAddingParticipant(false);
    }
  };

  // Participant counts
  const totalCount = participants.length;
  const presentCount = participants.filter((p) => p.attendanceStatus === 'PRESENT').length;
  const excusedCount = participants.filter((p) => p.attendanceStatus === 'EXCUSED').length;
  const absentCount = participants.filter((p) => p.attendanceStatus === 'ABSENT').length;
  const invitedCount = participants.filter((p) => p.attendanceStatus === 'INVITED').length;

  // Unadded users for modal
  const unaddedUsers = availableUsers.filter(
    (u: any) => !participants.some((p: any) => p.userId === u.id)
  );

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/semua-rapat"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#31889C] text-[13px] font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Semua Rapat</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Export PDF Button (All roles) */}
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white text-[12px] font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Unduh Risalah Rapat Resmi Format PDF"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Membuat PDF...' : 'Export PDF'}</span>
          </button>

          {/* Delete button (SUPER_ADMIN, ADMIN) */}
          {canDeleteMeeting && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
              title="Hapus Rapat dari Database"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Menghapus...' : 'Hapus Rapat'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isEditingMeetingNumber ? (
              <div className="flex items-center gap-1.5 bg-[#F0F9FA] p-1 rounded-xl border border-[#BCE3EB]">
                <input
                  type="text"
                  value={editNumberValue}
                  onChange={(e) => setEditNumberValue(e.target.value)}
                  placeholder="Nomor Surat Undangan"
                  className="px-2.5 py-1 text-[13px] font-bold text-[#215865] bg-white border border-[#31889C] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#31889C]"
                />
                <button
                  type="button"
                  disabled={isSavingNumber}
                  onClick={handleSaveMeetingNumber}
                  className="p-1.5 rounded-lg bg-[#31889C] text-white hover:bg-[#266F80] transition-colors cursor-pointer disabled:opacity-50"
                  title="Simpan nomor surat"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={isSavingNumber}
                  onClick={() => {
                    setIsEditingMeetingNumber(false);
                    setEditNumberValue(currentMeetingNumber);
                  }}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Batal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-bold text-[18px] text-[#215865] bg-[#F0F9FA] px-3 py-1 rounded-lg border border-[#BCE3EB]">
                  {currentMeetingNumber}
                </span>
                {canEditMeeting && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditNumberValue(currentMeetingNumber);
                      setIsEditingMeetingNumber(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#31889C] hover:bg-[#F0F9FA] transition-colors cursor-pointer"
                    title="Ubah Nomor Surat / Undangan Resmi"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
            <MeetingStatusBadge status={status} />
          </div>

          {/* Quick Status Update (SUPER_ADMIN, ADMIN) */}
          {canEditMeeting && (
            <div className="flex items-center gap-1.5 bg-[#F8FAFC] p-1.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 px-1.5 hidden sm:inline">Ubah Status:</span>
              {(['DRAFT', 'REVIEW', 'APPROVED', 'FINAL'] as MeetingStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  disabled={status === st || isUpdatingStatus}
                  onClick={() => handleStatusChange(st)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    status === st
                      ? 'bg-[#31889C] text-white shadow-xs'
                      : 'bg-white hover:bg-[#F0F9FA] text-slate-700 border border-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="text-[12px] font-bold text-[#31889C] uppercase tracking-wider block">
            Agenda Pembahasan Sidang
          </span>
          <h1 className="text-[24px] font-bold text-slate-900 mt-1 leading-snug">
            {meeting.title}
          </h1>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-[13px]">
          {/* Biro Utama & Terlibat */}
          <div className="flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-[#31889C] shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Biro Utama &amp; Terlibat</p>
              <p className="font-bold text-slate-800">
                {meeting.primaryBiro.code} — {meeting.primaryBiro.shortName}
              </p>
              {meeting.meetingBiros && meeting.meetingBiros.length > 0 && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Biro Terlibat: {meeting.meetingBiros.map((mb: any) => mb.biro.code).join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Tanggal & Waktu */}
          <div className="flex items-start gap-2.5">
            <Calendar className="w-4 h-4 text-[#31889C] shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Jadwal &amp; Waktu</p>
              <p className="font-bold text-slate-800">{formattedDate}</p>
              <p className="text-[12px] text-slate-600">
                {meeting.startTime} - {meeting.endTime} WIB
              </p>
            </div>
          </div>

          {/* Lokasi */}
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-[#31889C] shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Lokasi / Media</p>
              <p className="font-bold text-slate-800 line-clamp-2">{meeting.location}</p>
            </div>
          </div>

          {/* Ketua Sidang */}
          <div className="flex items-start gap-2.5">
            <UserCheck className="w-4 h-4 text-[#31889C] shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Ketua Sidang</p>
              <p className="font-bold text-slate-800">
                {(meeting.minutes?.conclusion as any)?.chairpersonName ||
                  (meeting.minutes?.decisions as any)?.chairpersonName ||
                  (meeting.minutes?.discussion as any)?.chairpersonName ||
                  (meeting.minutes?.agenda as any)?.chairpersonName ||
                  (meeting.chairperson ? meeting.chairperson.name : 'Belum Ditugaskan')}
              </p>
              {meeting.chairperson?.biro && (
                <p className="text-[11px] text-slate-500">{meeting.chairperson.biro.shortName}</p>
              )}
            </div>
          </div>

          {/* Notulis Sidang */}
          <div className="flex items-start gap-2.5">
            <FileText className="w-4 h-4 text-[#31889C] shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Notulis Sidang</p>
              <p className="font-bold text-slate-800">
                {(meeting.minutes?.conclusion as any)?.signerName ||
                  (meeting.minutes?.decisions as any)?.signerName ||
                  (meeting.minutes?.discussion as any)?.signerName ||
                  (meeting.minutes?.agenda as any)?.signerName ||
                  (meeting.secretary ? meeting.secretary.name : 'Tim Notulensi Dewan KEK')}
              </p>
              {meeting.secretary?.biro && (
                <p className="text-[11px] text-slate-500">{meeting.secretary.biro.shortName}</p>
              )}
            </div>
          </div>

          {/* Peserta Total */}
          <div className="flex items-start gap-2.5">
            <Users className="w-4 h-4 text-[#31889C] shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Total Peserta Terdaftar</p>
              <p className="font-bold text-slate-800">
                {totalCount} Pejabat / Perwakilan
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rapat Lanjutan / Rujukan Section */}
      {previousMeeting ? (
        <div className="bg-[#F0F9FA] rounded-2xl border border-[#BCE3EB] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#31889C] text-white shadow-xs shrink-0 mt-0.5">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#215865] bg-[#E8F5F7] px-2 py-0.5 rounded-md border border-[#BCE3EB]">
                  Rapat Lanjutan
                </span>
                <span className="text-[12px] font-bold text-slate-700">
                  Merujuk ke Rapat Sebelumnya:
                </span>
                <span className="font-bold text-[12px] text-[#215865] bg-white px-2 py-0.5 rounded-md border border-[#BCE3EB] shadow-2xs">
                  {previousMeeting.meetingNumber}
                </span>
              </div>
              <h4 className="font-bold text-[15px] text-slate-900 mt-1">
                {previousMeeting.title}
              </h4>
              <div className="flex items-center gap-4 text-[12px] text-slate-600 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#31889C]" />
                  {new Date(previousMeeting.date).toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#31889C]" />
                  {previousMeeting.primaryBiro?.code || 'Biro KEK'}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-[#31889C]" />
                  {previousMeeting.minutes ? 'Notula Tersedia' : 'Belum Ada Notula'}
                </span>
                {previousMeeting.actionItems && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#7CC563]" />
                    {previousMeeting.actionItems.filter((a: any) => a.status === 'COMPLETED').length}/
                    {previousMeeting.actionItems.length} Tindak Lanjut Selesai
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-center flex-wrap">
            <button
              type="button"
              onClick={() => setShowSeriesModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#BCE3EB] hover:bg-[#E8F5F7] text-[#215865] font-semibold text-[12px] transition-colors cursor-pointer shadow-2xs"
              title="Lihat seluruh sesi rapat terkait dalam agenda ini"
            >
              <Layers className="w-4 h-4 text-[#31889C]" />
              <span>Rangkaian Rapat Terkait</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPreviousMeetingModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[12px] transition-all shadow-xs cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Lihat Hasil Rapat {previousMeeting.meetingNumber}</span>
            </button>

            {canEditMeeting && (
              <button
                type="button"
                onClick={() => setShowLinkMeetingModal(true)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-[#BCE3EB] hover:bg-[#E8F5F7] text-[#215865] font-semibold text-[12px] transition-colors cursor-pointer"
                title="Ubah Rujukan Rapat Sebelumnya"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Ubah</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#F0F9FA] rounded-xl border border-dashed border-[#BCE3EB] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px]">
          <div className="flex items-center gap-2.5 text-slate-700">
            <Link2 className="w-4 h-4 text-[#31889C] shrink-0" />
            <span>
              Pantau seluruh rangkaian sesi atau hubungkan sebagai tindak lanjut rapat terdahulu.
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowSeriesModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#BCE3EB] hover:bg-[#E8F5F7] text-[#215865] font-semibold text-[12px] transition-all shadow-2xs cursor-pointer"
              title="Periksa apakah ada rapat lain dengan topik agenda serupa"
            >
              <Layers className="w-3.5 h-3.5 text-[#31889C]" />
              <span>Cek Rangkaian Rapat Terkait</span>
            </button>
            {canEditMeeting && (
              <button
                type="button"
                onClick={() => setShowLinkMeetingModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[12px] transition-all shadow-2xs cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>+ Tautkan Rapat Sebelumnya</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-0">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-[13px] border-b-2 transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'border-[#31889C] text-[#31889C] bg-[#F0F9FA] rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-[#31889C] hover:bg-[#F0F9FA]/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Informasi Rapat</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('participants')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-[13px] border-b-2 transition-all cursor-pointer ${
            activeTab === 'participants'
              ? 'border-[#31889C] text-[#31889C] bg-[#F0F9FA] rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-[#31889C] hover:bg-[#F0F9FA]/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Peserta &amp; Presensi ({totalCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('minutes')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-[13px] border-b-2 transition-all cursor-pointer ${
            activeTab === 'minutes'
              ? 'border-[#31889C] text-[#31889C] bg-[#F0F9FA] rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-[#31889C] hover:bg-[#F0F9FA]/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Notulen / Nota Dinas</span>
          {meeting.minutes && (
            <span className="w-2 h-2 rounded-full bg-[#7CC563]" title="Naskah rapat telah terisi" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('actionItems')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-[13px] border-b-2 transition-all cursor-pointer ${
            activeTab === 'actionItems'
              ? 'border-[#31889C] text-[#31889C] bg-[#F0F9FA] rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-[#31889C] hover:bg-[#F0F9FA]/50'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Tindak Lanjut ({meeting.actionItems ? meeting.actionItems.length : 0})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('comments')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-[13px] border-b-2 transition-all cursor-pointer ${
            activeTab === 'comments'
              ? 'border-[#31889C] text-[#31889C] bg-[#F0F9FA] rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-[#31889C] hover:bg-[#F0F9FA]/50'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Komentar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-[13px] border-b-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'border-[#31889C] text-[#31889C] bg-[#F0F9FA] rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-[#31889C] hover:bg-[#F0F9FA]/50'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat</span>
        </button>
      </div>

      {/* Tab 1: Informasi Rapat / Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 text-[13px]">
            <h3 className="text-[16px] font-bold text-slate-900">Deskripsi &amp; Cakupan Sidang</h3>
            <p className="text-slate-600 leading-relaxed">
              Pertemuan koordinasi resmi diprakarsai oleh <strong>{meeting.primaryBiro.name}</strong>.
              Rapat ini membahas agenda strategis akselerasi kawasan, penataan regulasi, serta pengendalian
              operasional Kawasan Ekonomi Khusus RI.
            </p>

            <div className="p-4 bg-[#F0F9FA] rounded-xl border border-[#BCE3EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-900">Arsip Risalah &amp; Notulen Digital</h4>
                <p className="text-[12px] text-slate-500">
                  {meeting.minutes
                    ? 'Notulen rapat telah tercatat di Neon DB. Klik tab Notulen untuk membaca atau memperbarui.'
                    : 'Belum ada notulen resmi yang diinputkan untuk rapat ini.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('minutes')}
                className="px-4 py-2 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[12px] transition-all shrink-0 cursor-pointer shadow-xs"
              >
                {meeting.minutes ? 'Buka Notulen Rapat' : '+ Buat Notulen Sekarang'}
              </button>
            </div>

            {/* Matriks Tindak Lanjut Quick Card */}
            <div className="p-4 bg-[#F0F9FA] rounded-xl border border-[#BCE3EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-900">Matriks &amp; Komitmen Tindak Lanjut</h4>
                <p className="text-[12px] text-slate-500">
                  {meeting.actionItems && meeting.actionItems.length > 0
                    ? `Terdapat ${meeting.actionItems.length} butir tindak lanjut terdaftar (${
                        meeting.actionItems.filter((a: any) => a.status === 'COMPLETED').length
                      } selesai).`
                    : 'Belum ada butir tindak lanjut yang dibuat untuk rapat ini.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('actionItems')}
                className="px-4 py-2 rounded-lg bg-white border border-[#BCE3EB] hover:bg-[#E8F5F7] text-[#215865] font-semibold text-[12px] transition-all shrink-0 cursor-pointer shadow-xs"
              >
                {meeting.actionItems && meeting.actionItems.length > 0
                  ? 'Buka Matriks Tindak Lanjut'
                  : '+ Tambah Tindak Lanjut'}
              </button>
            </div>

            {/* Rujukan Rapat Sebelumnya di Overview */}
            {previousMeeting && (
              <div className="p-4 bg-[#F0F9FA] rounded-xl border border-[#BCE3EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#215865] bg-[#E8F5F7] px-2 py-0.5 rounded border border-[#BCE3EB]">
                      Rapat Rujukan / Sidang Ke-1
                    </span>
                    <span className="font-bold text-[12px] text-[#215865]">
                      {previousMeeting.meetingNumber}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-[13px]">{previousMeeting.title}</h4>
                  <p className="text-[12px] text-slate-600">
                    Sidang ini diselenggarakan sebagai tindak lanjut resmi dari agenda sebelumnya. Anda dapat meninjau seluruh notula dan progres butir tindak lanjut rapat ke-1.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreviousMeetingModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[12px] transition-all shrink-0 cursor-pointer shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Buka Hasil Rapat 1</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Peserta & Presensi Kehadiran */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          {/* Card Header & Controls */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-[18px] font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#31889C]" />
                  <span>Daftar Presensi Peserta Sidang</span>
                </h3>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {canManageParticipants
                    ? 'Kelola presensi peserta rapat secara langsung. Perubahan status kehadiran langsung disimpan dan otomatis tercantum pada PDF Risalah Rapat.'
                    : 'Daftar absensi kehadiran peserta resmi untuk agenda sidang ini.'}
                </p>
              </div>

              {canManageParticipants && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={isBulkUpdating || totalCount === 0}
                    onClick={handleMarkAllPresent}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D2EFCA] bg-[#ECF8E9] text-[#4D8F3D] hover:bg-[#daf2d1] text-[12px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                    title="Tandai semua peserta sebagai Hadir"
                  >
                    {isBulkUpdating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#7CC563]" />
                    )}
                    <span>Tandai Semua Hadir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white text-[12px] font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Tambah Peserta</span>
                  </button>
                </div>
              )}
            </div>

            {/* Summary Statistics Counter Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Total Peserta
                </span>
                <span className="text-[20px] font-extrabold text-slate-800 mt-0.5 block">
                  {totalCount}
                </span>
              </div>

              <div className="p-3 bg-[#ECF8E9] border border-[#D2EFCA] rounded-xl text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4D8F3D] block">
                  Hadir
                </span>
                <span className="text-[20px] font-extrabold text-[#2E6B20] mt-0.5 block">
                  {presentCount}
                </span>
              </div>

              <div className="p-3 bg-[#FFF8CC] border border-[#FFEE99] rounded-xl text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A7200] block">
                  Izin
                </span>
                <span className="text-[20px] font-extrabold text-[#6B5800] mt-0.5 block">
                  {excusedCount}
                </span>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
                  Tidak Hadir
                </span>
                <span className="text-[20px] font-extrabold text-rose-800 mt-0.5 block">
                  {absentCount}
                </span>
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-center col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 block">
                  Diundang
                </span>
                <span className="text-[20px] font-extrabold text-sky-800 mt-0.5 block">
                  {invitedCount}
                </span>
              </div>
            </div>

            {/* Quick Helper Banner for Admin/Notulis */}
            {canManageParticipants && (
              <div className="p-3 bg-[#F0F9FA] rounded-xl border border-[#BCE3EB] text-[12px] text-[#215865] flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#31889C] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Cara Mengubah Status Presensi:</p>
                  <p className="text-slate-600 text-[11.5px] leading-relaxed">
                    Klik tombol pilihan (<strong>Hadir</strong>, <strong>Izin</strong>, <strong>Tidak Hadir</strong>, atau <strong>Diundang</strong>) di sebelah kanan nama peserta. Sistem akan langsung menyimpan status ke database dan memperbarui dokumen PDF Risalah Rapat.
                  </p>
                </div>
              </div>
            )}

            {/* Participant List */}
            {participants.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-[13px] shadow-xs">
                {participants.map((p: any, idx: number) => {
                  const isUpdating = updatingParticipantId === p.id;
                  const currentOpt = ATTENDANCE_OPTIONS.find((o) => o.value === p.attendanceStatus) || ATTENDANCE_OPTIONS[3];

                  return (
                    <div
                      key={p.id}
                      className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white hover:bg-[#F0F9FA] transition-colors"
                    >
                      {/* Left: User Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[11px] font-bold text-slate-400 w-5 text-right shrink-0">
                          {idx + 1}.
                        </span>
                        <div className="w-9 h-9 rounded-full bg-[#F0F9FA] text-[#31889C] font-bold flex items-center justify-center text-[11px] border border-[#BCE3EB] shrink-0">
                          {p.user?.name
                            ? p.user.name
                                .split(' ')
                                .map((n: string) => n[0])
                                .slice(0, 2)
                                .join('')
                            : 'P'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {p.user?.name || 'Peserta Rapat'}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                            <span className="truncate">{p.user?.email}</span>
                            <span>•</span>
                            <span className="font-medium text-[#215865] bg-[#F0F9FA] px-1.5 py-0.2 rounded border border-[#BCE3EB]">
                              {p.user?.biro?.code || p.user?.biro?.shortName || 'Biro KEK'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Interactive Attendance Selector or Read-Only Badge */}
                      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                        {canManageParticipants ? (
                          <div className="flex items-center gap-1.5">
                            {/* Segmented Control Buttons */}
                            <div className="flex items-center bg-slate-100/80 p-1 rounded-lg border border-slate-200 gap-0.5">
                              {ATTENDANCE_OPTIONS.map((opt) => {
                                const isActive = p.attendanceStatus === opt.value;
                                const Icon = opt.icon;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() =>
                                      handleUpdateAttendance(p.id, opt.value, p.user?.name || 'Peserta')
                                    }
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                      isActive
                                        ? opt.activeClass
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                                    } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                                    title={opt.desc}
                                  >
                                    <Icon className="w-3 h-3" />
                                    <span>{opt.label}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Delete Participant Button */}
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleRemoveParticipant(p.id, p.user?.name || 'Peserta')}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                              title="Hapus peserta dari rapat ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          /* Viewer / Staff read-only badge */
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${currentOpt.badgeClass}`}
                          >
                            <currentOpt.icon className="w-3 h-3" />
                            <span>{currentOpt.label}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Users className="w-8 h-8 text-[#31889C] mx-auto mb-2 opacity-60" />
                <p className="text-[13px] font-semibold text-slate-700">
                  Belum ada peserta yang terdaftar pada rapat ini.
                </p>
                <p className="text-[12px] text-slate-500 mt-1">
                  Klik tombol <strong>+ Tambah Peserta</strong> di atas untuk mendaftarkan peserta sidang.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Notulen & Hasil Rapat */}
      {activeTab === 'minutes' && (
        <div className="space-y-4">
          <MeetingMinutesSection
            meetingId={meeting.id}
            meeting={meeting}
            initialMinutes={meeting.minutes}
            defaultMode="preview"
          />
        </div>
      )}

      {/* Tab 4: Tindak Lanjut */}
      {activeTab === 'actionItems' && (
        <div className="space-y-4">
          <ActionItemList
            meetingId={meeting.id}
            initialItems={meeting.actionItems || []}
            availableBiros={availableBiros}
            availableUsers={availableUsers}
          />
        </div>
      )}

      {/* Tab 5: Komentar Notulen */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          <MeetingCommentsSection meetingId={meeting.id} />
        </div>
      )}

      {/* Tab 6: Riwayat Perubahan (Audit Trail) */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <MinutesHistorySection meetingId={meeting.id} />
        </div>
      )}

      {/* Modal: Tambah Peserta Sidang */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#31889C]" />
                  <span>Tambah Peserta Sidang</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {meeting.meetingNumber} — {meeting.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-[12px] font-bold">
              <button
                type="button"
                onClick={() => setParticipantMode('registered')}
                className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  participantMode === 'registered'
                    ? 'bg-white text-[#31889C] shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pegawai Terdaftar
              </button>
              <button
                type="button"
                onClick={() => setParticipantMode('unregistered')}
                className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  participantMode === 'unregistered'
                    ? 'bg-white text-[#31889C] shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pejabat Baru / Eksternal
              </button>
            </div>

            <form onSubmit={handleAddParticipant} className="p-6 space-y-4 text-[13px]">
              {participantMode === 'registered' ? (
                /* Mode 1: Select Registered User */
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 block text-[12px]">
                    Pilih Pegawai dari Database <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedAddUserId}
                    onChange={(e) => setSelectedAddUserId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#31889C] focus:ring-1 focus:ring-[#31889C] bg-white text-slate-800 text-[13px] outline-none"
                  >
                    <option value="">-- Pilih Pegawai dari Daftar Database --</option>
                    {unaddedUsers.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.biro?.code || 'KEK'}) — {u.email}
                      </option>
                    ))}
                  </select>
                  {unaddedUsers.length === 0 && (
                    <p className="text-[11px] text-[#31889C] italic">
                      Semua pengguna terdaftar sudah masuk dalam daftar peserta.
                    </p>
                  )}
                </div>
              ) : (
                /* Mode 2: Unregistered Official / External Guest */
                <div className="space-y-3">
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11.5px] text-blue-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      Gunakan opsi ini untuk pejabat kementerian/lembaga lain, kepala daerah, narasumber, atau tamu eksternal yang belum memiliki akun login di SIM-RAPAT KEK.
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 block text-[12px]">
                      Nama Lengkap, Gelar &amp; Jabatan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Dr. Ir. Budi Santoso, M.Sc. (Deputi Kemenko)"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#31889C] focus:ring-1 focus:ring-[#31889C] bg-white text-slate-800 text-[13px] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-800 block text-[12px]">
                        Biro Pengampu / Afiliasi
                      </label>
                      <select
                        value={customBiroId}
                        onChange={(e) => setCustomBiroId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#31889C] focus:ring-1 focus:ring-[#31889C] bg-white text-slate-800 text-[12px] outline-none"
                      >
                        {availableBiros.map((b: any) => (
                          <option key={b.id} value={b.id}>
                            {b.code} — {b.shortName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-800 block text-[12px]">
                        Email Resmi <span className="text-slate-400 font-normal">(Opsional)</span>
                      </label>
                      <input
                        type="email"
                        placeholder="pejabat@instansi.go.id"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#31889C] focus:ring-1 focus:ring-[#31889C] bg-white text-slate-800 text-[12px] outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-[10.5px] text-slate-400">
                    * Jika email dikosongkan, sistem otomatis membuatkan identitas peserta resmi untuk arsip risalah sidang.
                  </p>
                </div>
              )}

              {/* Status Kehadiran Awal */}
              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-slate-800 block text-[12px]">
                  Status Presensi Awal
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ATTENDANCE_OPTIONS.map((opt) => {
                    const isSelected = newParticipantStatus === opt.value;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNewParticipantStatus(opt.value)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#F0F9FA] border-[#31889C] text-[#31889C] font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 text-[#31889C] shrink-0" />
                        <div>
                          <p className="text-[12px]">{opt.label}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-[12px] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    isAddingParticipant ||
                    (participantMode === 'registered' && !selectedAddUserId) ||
                    (participantMode === 'unregistered' && !customName.trim())
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[12px] transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isAddingParticipant ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  <span>{isAddingParticipant ? 'Menambahkan...' : 'Tambahkan Peserta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tinjau Rapat Sebelumnya (Risalah & Butir Tindak Lanjut Rapat 1) */}
      {previousMeeting && (
        <PreviousMeetingModal
          isOpen={showPreviousMeetingModal}
          onClose={() => setShowPreviousMeetingModal(false)}
          previousMeeting={previousMeeting}
          onOpenLinkDialog={() => {
            setShowPreviousMeetingModal(false);
            setShowLinkMeetingModal(true);
          }}
        />
      )}

      {/* Modal: Tautkan / Ubah Rujukan Rapat Sebelumnya */}
      <LinkMeetingDialog
        isOpen={showLinkMeetingModal}
        onClose={() => setShowLinkMeetingModal(false)}
        currentMeetingId={meeting.id}
        currentMeetingNumber={meeting.meetingNumber}
        currentLinkedMeetingId={previousMeeting?.id || null}
        onLinkedSuccess={(updated) => {
          setPreviousMeeting(updated.previousMeeting || null);
          setShowLinkMeetingModal(false);
          router.refresh();
        }}
      />

      {/* Modal: Linimasa Rangkaian Rapat Terkait */}
      <AgendaSeriesModal
        isOpen={showSeriesModal}
        onClose={() => setShowSeriesModal(false)}
        meetingId={meeting.id}
        onSelectMeeting={(selectedId) => {
          setShowSeriesModal(false);
          if (selectedId !== meeting.id) {
            router.push(`/semua-rapat/${selectedId}`);
          }
        }}
      />
    </div>
  );
}
