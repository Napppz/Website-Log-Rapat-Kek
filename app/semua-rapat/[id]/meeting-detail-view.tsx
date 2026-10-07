'use client';

import React, { useState, useRef } from 'react';
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
  HelpCircle,
  Paperclip,
  UploadCloud,
  Video,
} from 'lucide-react';

import { MeetingStatusBadge } from '@/components/meeting/meeting-status-badge';
import { MeetingStatusGuideDialog } from '@/components/meeting/meeting-status-guide-dialog';
import { getMeetingStatusDetail, MEETING_STATUS_DETAILS } from '@/lib/meeting-status';
import { MeetingMinutesSection } from '@/components/meeting/meeting-minutes/meeting-minutes-section';
import { ActionItemList } from '@/components/action-items/action-item-list';
import { PreviousMeetingModal } from '@/components/meeting/previous-meeting-modal';
import { LinkMeetingDialog } from '@/components/meeting/link-meeting-dialog';
import { AgendaSeriesModal } from '@/components/meeting/agenda-series-modal';
import { MeetingCommentsSection } from '@/components/meeting/meeting-comments/meeting-comments-section';
import { MinutesHistorySection } from '@/components/meeting/meeting-history/minutes-history-section';
import { GoogleCalendarModal } from '@/components/meeting/google-calendar-modal';
import { extractVirtualMeetingDetails } from '@/lib/calendar';
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
import {
  uploadInvitationFileAction,
  updateMeetingInvitationDocAction,
} from '@/app/actions/meeting-upload-actions';
import { useSession } from 'next-auth/react';
import { toast, confirmModal } from '@/components/providers/toast-provider';

interface MeetingDetailViewProps {
  meeting: any;
  availableBiros?: any[];
  availableUsers?: any[];
  initialTab?: string;
}

type TabType = 'overview' | 'participants' | 'minutes' | 'actionItems';
type MinutesSubTab = 'document' | 'comments' | 'history';
const VALID_TABS: TabType[] = ['overview', 'participants', 'minutes', 'actionItems'];

const MEETING_WORKFLOW: {
  key: MeetingStatus;
  step: number;
  label: string;
  sublabel: string;
  description: string;
}[] = [
  {
    key: 'DRAFT',
    step: 1,
    label: 'Draf',
    sublabel: 'Penyusunan',
    description: 'Penyusunan naskah risalah awal oleh notulis rapat',
  },
  {
    key: 'REVIEW',
    step: 2,
    label: 'Reviu',
    sublabel: 'Penelaahan',
    description: 'Pemeriksaan substansi oleh biro terkait / tim perumus',
  },
  {
    key: 'APPROVED',
    step: 3,
    label: 'Disetujui',
    sublabel: 'Validasi',
    description: 'Substansi risalah telah divalidasi pimpinan sidang',
  },
  {
    key: 'FINAL',
    step: 4,
    label: 'Final',
    sublabel: 'Diterbitkan',
    description: 'Naskah resmi berkekuatan tetap, siap didistribusikan & ditindaklanjuti',
  },
];

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
  initialTab,
}: MeetingDetailViewProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'STAFF';
  const canEditMeeting = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const canDeleteMeeting = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const canManageParticipants =
    userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const canEditMinutes = canManageParticipants;
  const canCreateActionItem =
    userRole === 'SUPER_ADMIN' ||
    userRole === 'ADMIN' ||
    userRole === 'STAFF';

  // Biro ownership check for status updates & staff permissions
  const isPrivileged = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const isMeetingBiro =
    isPrivileged ||
    (session?.user?.biroId && session.user.biroId === meeting.primaryBiroId) ||
    (session?.user?.biroCode &&
      meeting.primaryBiro?.code &&
      session.user.biroCode.toUpperCase() === meeting.primaryBiro.code.toUpperCase());

  const canChangeStatus = isPrivileged || (userRole === 'STAFF' && isMeetingBiro);

  const initialResolvedTab: TabType = (initialTab === 'comments' || initialTab === 'history')
    ? 'minutes'
    : (initialTab && VALID_TABS.includes(initialTab as TabType))
      ? (initialTab as TabType)
      : (meeting.minutes ? 'minutes' : 'overview');

  const initialMinutesSubTab: MinutesSubTab =
    initialTab === 'comments' ? 'comments' : initialTab === 'history' ? 'history' : 'document';

  const [activeTab, setActiveTab] = useState<TabType>(initialResolvedTab);
  const [minutesSubTab, setMinutesSubTab] = useState<MinutesSubTab>(initialMinutesSubTab);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.toString());
    }
  };

  const handleMinutesSubTabChange = (sub: MinutesSubTab) => {
    setMinutesSubTab(sub);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (sub === 'document') {
        url.searchParams.set('tab', 'minutes');
      } else {
        url.searchParams.set('tab', sub);
      }
      window.history.replaceState(null, '', url.toString());
    }
  };
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isStatusGuideOpen, setIsStatusGuideOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
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
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);

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

  // Invitation Document states
  const [invitationDoc, setInvitationDoc] = useState<{
    url: string;
    name: string;
    size?: number | null;
  } | null>(
    meeting.invitationDocUrl
      ? {
          url: meeting.invitationDocUrl,
          name: meeting.invitationDocName || 'Dokumen Undangan Resmi',
          size: meeting.invitationDocSize || null,
        }
      : null
  );
  const [isUploadingInvitation, setIsUploadingInvitation] = useState(false);
  const invitationFileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleUploadInvitation = async (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Ukuran berkas melebihi batas 25MB.');
      return;
    }
    setIsUploadingInvitation(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await uploadInvitationFileAction(formData);
      if (!uploadRes.success || !uploadRes.data) {
        throw new Error(uploadRes.error || 'Gagal mengunggah berkas undangan.');
      }
      const updateRes = await updateMeetingInvitationDocAction(meeting.id, {
        url: uploadRes.data.url,
        name: uploadRes.data.name,
        size: uploadRes.data.size,
      });
      if (!updateRes.success) {
        throw new Error(updateRes.error || 'Gagal menyimpan tautan berkas ke rapat.');
      }
      setInvitationDoc({
        url: uploadRes.data.url,
        name: uploadRes.data.name,
        size: uploadRes.data.size,
      });
      toast.success('Dokumen undangan resmi berhasil diperbarui!');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat mengunggah dokumen.');
    } finally {
      setIsUploadingInvitation(false);
    }
  };

  const handleRemoveInvitation = async () => {
    const confirmed = await confirmModal({
      title: 'Hapus Dokumen Undangan?',
      message: 'Apakah Anda yakin ingin melepas lampiran surat undangan resmi dari rapat ini?',
      confirmText: 'Ya, Lepas Lampiran',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const res = await updateMeetingInvitationDocAction(meeting.id, null);
      if (res.success) {
        setInvitationDoc(null);
        toast.success('Dokumen undangan berhasil dilepas.');
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal melepas dokumen.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal melepas dokumen.');
    }
  };

  const showToast = (message: string) => {
    toast.success(message);
  };

  // Check if calendar modal should auto-open (e.g. from /buat-rapat?calendar=true)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('calendar') === 'true') {
        setShowCalendarModal(true);
        urlParams.delete('calendar');
        const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '');
        window.history.replaceState(null, '', newUrl);
      }
    }
  }, []);

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

  const handleExportDocx = async (type?: 'notula' | 'nota-dinas') => {
    try {
      setIsExportingDocx(true);
      const isNota =
        type === 'nota-dinas' ||
        (!type && (meeting.minutes?.conclusion as any)?.docType === 'NOTA_DINAS');
      const targetType = isNota ? 'nota-dinas' : 'notula';
      const res = await fetch(`/api/meetings/${meeting.id}/docx?type=${targetType}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || 'Gagal mengunduh dokumen Word (.docx).');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanNum = (meeting.meetingNumber || 'KEK').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = isNota
        ? `Nota-Dinas-${cleanNum}.docx`
        : `Risalah-Rapat-${cleanNum}.docx`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success(
        isNota
          ? `Nota Dinas rapat ${meeting.meetingNumber} berhasil diunduh (Word .docx).`
          : `Risalah rapat ${meeting.meetingNumber} berhasil diunduh (Word .docx).`
      );
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat mengekspor Word.');
    } finally {
      setIsExportingDocx(false);
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
    if (status === newStatus || isUpdatingStatus) return;

    const targetDetail = getMeetingStatusDetail(newStatus);

    if (newStatus === 'FINAL') {
      const confirmed = await confirmModal({
        title: `Finalisasi & Sahkan Risalah ${currentMeetingNumber}?`,
        message:
          'Mengubah status menjadi "Final (Tahap 4)" menandakan naskah risalah resmi telah disahkan, berkekuatan hukum tetap, dan seluruh butir tindak lanjut wajib dieksekusi oleh biro terkait. Lanjutkan pengesahan final?',
        confirmText: 'Ya, Finalkan & Sahkan Risalah',
        variant: 'primary',
      });
      if (!confirmed) return;
    } else if (newStatus === 'APPROVED') {
      const confirmed = await confirmModal({
        title: `Validasi & Setujui Risalah ${currentMeetingNumber}?`,
        message:
          'Mengubah status menjadi "Disetujui (Tahap 3)" menandakan bahwa materi dan substansi risalah telah divalidasi oleh Pimpinan Sidang. Anda masih dapat memajukannya ke "Final" saat naskah siap diedarkan secara resmi. Lanjutkan persetujuan?',
        confirmText: 'Ya, Setujui Risalah',
        variant: 'primary',
      });
      if (!confirmed) return;
    } else if (newStatus === 'REVIEW') {
      const confirmed = await confirmModal({
        title: `Kirim Risalah ke Tahap Reviu?`,
        message:
          'Mengubah status menjadi "Reviu (Tahap 2)" menandakan draf risalah siap diedarkan ke tim perumus atau peserta rapat untuk penelaahan dan koreksi materi. Lanjutkan?',
        confirmText: 'Ya, Kirim ke Reviu',
        variant: 'primary',
      });
      if (!confirmed) return;
    }

    try {
      setIsUpdatingStatus(true);
      const res = await updateMeetingStatusAction(meeting.id, newStatus);
      if (res.success) {
        setStatus(newStatus);
        toast.success(`Status rapat berhasil diperbarui ke tahap ${targetDetail.fullTitle}.`);
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
        toast.flash('success', `Rapat ${meeting.meetingNumber} berhasil dihapus dari database.`, 'Berhasil Dihapus');
        window.location.href = '/semua-rapat';
      } else {
        toast.error(res.error || 'Gagal menghapus rapat');
        setIsDeleting(false);
      }
    } catch (err: any) {
      toast.error(`Terjadi kesalahan: ${err?.message || 'Gagal menghapus rapat'}`);
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

        <div className="flex items-center gap-2 flex-wrap">
          {/* Google Calendar Button */}
          <button
            type="button"
            onClick={() => setShowCalendarModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold transition-all shadow-xs cursor-pointer group"
            title="Tambah ke Google Calendar & Undang Seluruh Peserta"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
            <span>Google Kalender</span>
          </button>

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

          {/* Export Word (.docx) Button (All roles) */}
          <button
            type="button"
            disabled={isExportingDocx}
            onClick={() => handleExportDocx()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2B579A] hover:bg-[#1E3E6D] text-white text-[12px] font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Unduh Risalah Rapat Resmi Format Word (.docx)"
          >
            {isExportingDocx ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>{isExportingDocx ? 'Membuat Word...' : 'Export Word'}</span>
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
            {invitationDoc && (
              <a
                href={invitationDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 border border-teal-200 text-[#175360] hover:bg-teal-100 text-[12px] font-bold transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
                title={`Buka Dokumen Undangan Resmi: ${invitationDoc.name}`}
              >
                <Paperclip className="w-3.5 h-3.5 text-[#1E6B7B] group-hover:rotate-45 transition-transform" />
                <span className="truncate max-w-[150px] sm:max-w-[220px]">
                  {invitationDoc.name}
                </span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#1E6B7B]" />
              </a>
            )}
          </div>
        </div>

        {/* Alur Siklus Risalah Stepper */}
        <div className="bg-[#F8FAFC] rounded-xl p-4 border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Alur Siklus Risalah Rapat:
              </span>
              <MeetingStatusBadge status={status} showStep />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsStatusGuideOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#BCE3EB] bg-white hover:bg-[#F0F9FA] text-[#215865] text-[11.5px] font-bold shadow-2xs transition-all cursor-pointer"
                title="Buka penjelasan detail perbedaan status (Draft vs Review vs Disetujui vs Final)"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#31889C]" />
                <span>Panduan Status Risalah</span>
              </button>
              {canChangeStatus && (
                <span className="text-[11px] text-slate-400 italic hidden md:inline">
                  {isUpdatingStatus ? 'Memperbarui...' : '(Klik tahapan untuk mengubah)'}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MEETING_WORKFLOW.map((wf, idx) => {
              const currentIdx = MEETING_WORKFLOW.findIndex((w) => w.key === status);
              const isCurrent = wf.key === status;
              const isPassed = idx < currentIdx;

              const content = (
                <>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 ${
                      isCurrent
                        ? 'bg-white text-[#31889C]'
                        : isPassed
                        ? 'bg-[#7CC563] text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : wf.step}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[12.5px] font-bold truncate ${isCurrent ? 'text-white' : 'text-slate-800'}`}>
                      {wf.label}
                    </p>
                    <p className={`text-[10px] truncate ${isCurrent ? 'text-[#E8F5F7]' : isPassed ? 'text-[#4D8F3D]' : 'text-slate-400'}`}>
                      {wf.sublabel}
                    </p>
                  </div>
                </>
              );

              if (!canChangeStatus) {
                return (
                  <div
                    key={wf.key}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left select-none ${
                      isCurrent
                        ? 'bg-[#31889C] text-white border-[#215865] shadow-xs'
                        : isPassed
                        ? 'bg-[#ECF8E9] text-[#215865] border-[#D2EFCA]'
                        : 'bg-white text-slate-600 border-slate-200 opacity-80'
                    }`}
                    title={`${wf.label} (${wf.sublabel}): ${wf.description}`}
                  >
                    {content}
                  </div>
                );
              }

              return (
                <button
                  key={wf.key}
                  type="button"
                  disabled={isCurrent || isUpdatingStatus}
                  onClick={() => handleStatusChange(wf.key)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? 'bg-[#31889C] text-white border-[#215865] shadow-xs ring-2 ring-[#31889C]/30 cursor-default'
                      : isPassed
                      ? 'bg-[#ECF8E9] text-[#215865] border-[#D2EFCA] hover:bg-[#D2EFCA]/50 cursor-pointer hover:border-[#31889C]'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 cursor-pointer hover:border-[#31889C]'
                  }`}
                  title={`${wf.label} (${wf.sublabel}): ${wf.description} — Klik untuk ubah ke tahap ini`}
                >
                  {content}
                </button>
              );
            })}
          </div>

          {/* Kartu Penjelasan Status Aktif & Panduan Langkah Selanjutnya */}
          <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-[12px]">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#31889C] mt-1.5 shrink-0" />
              <div>
                <p className="font-bold text-slate-900 leading-snug">
                  Status Saat Ini: {getMeetingStatusDetail(status).fullTitle}
                </p>
                <p className="text-slate-600 text-[11.5px] mt-0.5 leading-relaxed">
                  {getMeetingStatusDetail(status).description}
                </p>
                <p className="text-[#215865] font-semibold text-[11.5px] mt-1">
                  👉 <strong>Langkah Selanjutnya:</strong> {getMeetingStatusDetail(status).nextStepNote}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsStatusGuideOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#31889C] hover:text-[#215865] bg-white border border-[#BCE3EB] px-2.5 py-1 rounded-lg shrink-0 hover:bg-[#F0F9FA] transition-all cursor-pointer shadow-2xs self-start"
            >
              <span>Beda &ldquo;Disetujui&rdquo; vs &ldquo;Final&rdquo;?</span>
            </button>
          </div>
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
          {(() => {
            const virtual = extractVirtualMeetingDetails(meeting.location);
            return (
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#31889C] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">Lokasi / Media</p>
                  <p className="font-bold text-slate-800 leading-snug">
                    {virtual.cleanPhysicalLocation || meeting.location}
                  </p>
                  {virtual.zoomUrl && (
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <a
                        href={virtual.zoomUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#0B5CFF] hover:bg-blue-100 text-[11px] font-bold border border-blue-200 transition-colors shadow-2xs"
                        title="Buka Ruang Rapat Zoom di tab baru"
                      >
                        <Video className="w-3 h-3 text-[#0B5CFF]" />
                        <span>Buka Zoom</span>
                        <ExternalLink className="w-2.5 h-2.5 text-blue-400" />
                      </a>
                      {virtual.meetingId && (
                        <span className="text-[10.5px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          ID: {virtual.meetingId}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

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

      {/* Tabs Navigation (4 Tab Utama Terstruktur) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-0 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange('overview')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-[13px] border-b-2 transition-all cursor-pointer whitespace-nowrap ${
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
          onClick={() => handleTabChange('participants')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-[13px] border-b-2 transition-all cursor-pointer whitespace-nowrap ${
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
          onClick={() => handleTabChange('minutes')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-[13px] border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'minutes'
              ? 'border-[#31889C] text-[#31889C] bg-[#F0F9FA] rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-[#31889C] hover:bg-[#F0F9FA]/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Notulen &amp; Risalah</span>
          {meeting.minutes ? (
            <span className="w-2 h-2 rounded-full bg-[#7CC563]" title="Naskah rapat telah terisi" />
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded font-semibold">Kosong</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('actionItems')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-[13px] border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'actionItems'
              ? 'border-[#31889C] text-[#31889C] bg-[#F0F9FA] rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-[#31889C] hover:bg-[#F0F9FA]/50'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Tindak Lanjut ({meeting.actionItems ? meeting.actionItems.length : 0})</span>
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

            {/* Dokumen Surat Undangan Resmi */}
            <div className="p-5 bg-gradient-to-br from-[#F0F8FA]/90 via-white to-slate-50 rounded-2xl border border-[#BCE3EB] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#1E6B7B]/10 text-[#1E6B7B] flex items-center justify-center">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Dokumen Surat Undangan Resmi Sidang
                    </h4>
                    <p className="text-[12px] text-slate-500">
                      Surat edaran atau lampiran fisik undangan resmi pelaksanaan rapat koordinasi ini
                    </p>
                  </div>
                </div>

                <input
                  ref={invitationFileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.txt"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadInvitation(f);
                  }}
                />

                {canEditMeeting && !isUploadingInvitation && (
                  <button
                    type="button"
                    onClick={() => invitationFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#BCE3EB] bg-white hover:bg-[#E8F5F7] text-[#215865] text-xs font-semibold shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-[#31889C]" />
                    <span>{invitationDoc ? 'Ganti Berkas Undangan' : '+ Unggah Surat Undangan'}</span>
                  </button>
                )}
              </div>

              {isUploadingInvitation ? (
                <div className="py-6 flex flex-col items-center justify-center gap-2 text-center bg-white rounded-xl border border-slate-200">
                  <Loader2 className="w-6 h-6 animate-spin text-[#1E6B7B]" />
                  <p className="text-xs font-bold text-slate-800">Mengunggah berkas surat undangan...</p>
                  <p className="text-[11px] text-slate-400">Menyimpan berkas ke repositori digital KEK</p>
                </div>
              ) : invitationDoc ? (
                <div className="p-4 bg-white rounded-xl border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-[#1E6B7B] flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900 text-sm truncate max-w-[280px] sm:max-w-md">
                          {invitationDoc.name}
                        </p>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          ✓ Berkas Resmi Terlampir
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-500 mt-0.5">
                        {invitationDoc.size ? `Ukuran: ${formatFileSize(invitationDoc.size)} • ` : ''}
                        Tersimpan di repositori internal sistem
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <a
                      href={invitationDoc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1E6B7B] hover:bg-[#175360] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Buka / Pratinjau</span>
                    </a>
                    <a
                      href={invitationDoc.url}
                      download={invitationDoc.name}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    >
                      <FileDown className="w-3.5 h-3.5 text-[#1E6B7B]" />
                      <span>Unduh</span>
                    </a>
                    {canEditMeeting && (
                      <button
                        type="button"
                        onClick={handleRemoveInvitation}
                        className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                        title="Lepas berkas undangan dari rapat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50/70 rounded-xl border border-dashed border-slate-300 text-center flex flex-col items-center justify-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-200">
                    <Paperclip className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Belum Ada Berkas Surat Undangan Resmi</p>
                    <p className="text-[11.5px] text-slate-500 mt-0.5">
                      Rapat ini belum memiliki lampiran berkas dokumen surat undangan fisik/digital.
                    </p>
                  </div>
                  {canEditMeeting && (
                    <button
                      type="button"
                      onClick={() => invitationFileInputRef.current?.click()}
                      className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1E6B7B] hover:bg-[#175360] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>+ Unggah Berkas Undangan Sekarang</span>
                    </button>
                  )}
                </div>
              )}
            </div>

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
                onClick={() => handleTabChange('minutes')}
                className="px-4 py-2 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[12px] transition-all shrink-0 cursor-pointer shadow-xs"
              >
                {meeting.minutes
                  ? 'Buka Notulen Rapat'
                  : canEditMinutes
                  ? '+ Buat Notulen Sekarang'
                  : 'Lihat Lembar Naskah'}
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
                onClick={() => handleTabChange('actionItems')}
                className="px-4 py-2 rounded-lg bg-white border border-[#BCE3EB] hover:bg-[#E8F5F7] text-[#215865] font-semibold text-[12px] transition-all shrink-0 cursor-pointer shadow-xs"
              >
                {meeting.actionItems && meeting.actionItems.length > 0
                  ? 'Buka Matriks Tindak Lanjut'
                  : canCreateActionItem
                  ? '+ Tambah Tindak Lanjut'
                  : 'Lihat Matriks Tindak Lanjut'}
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

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowCalendarModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-[12px] font-bold transition-all cursor-pointer shadow-2xs"
                  title="Buka atau bagikan undangan Google Kalender ke seluruh peserta"
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Undangan Kalender</span>
                </button>

                {canManageParticipants && (
                  <>
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
                  </>
                )}
              </div>
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
                  {canManageParticipants ? (
                    <>Klik tombol <strong>+ Tambah Peserta</strong> di atas untuk mendaftarkan peserta sidang.</>
                  ) : (
                    'Daftar absensi peserta belum dimasukkan oleh Notulis atau Administrator.'
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Notulen & Hasil Rapat */}
      {activeTab === 'minutes' && (
        <div className="space-y-4">
          {/* Sub Navigation Bar: Naskah, Catatan & Komentar, Riwayat Perubahan */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-lg text-[13px] font-semibold">
              <button
                type="button"
                onClick={() => handleMinutesSubTabChange('document')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                  minutesSubTab === 'document'
                    ? 'bg-white text-[#31889C] font-bold shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Naskah Risalah &amp; Notulen</span>
              </button>

              <button
                type="button"
                onClick={() => handleMinutesSubTabChange('comments')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                  minutesSubTab === 'comments'
                    ? 'bg-white text-[#31889C] font-bold shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Catatan &amp; Komentar</span>
              </button>

              <button
                type="button"
                onClick={() => handleMinutesSubTabChange('history')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                  minutesSubTab === 'history'
                    ? 'bg-white text-[#31889C] font-bold shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Riwayat Perubahan</span>
              </button>
            </div>

            <div className="text-[12px] text-slate-500 px-2 hidden md:block">
              {minutesSubTab === 'document' && 'Format resmi Notula & Nota Dinas Sekretariat KEK'}
              {minutesSubTab === 'comments' && 'Kolaborasi masukan dan catatan perumusan risalah'}
              {minutesSubTab === 'history' && 'Audit trail riwayat revisi dan versi naskah risalah'}
            </div>
          </div>

          {/* Sub Tab Views */}
          {minutesSubTab === 'document' && (
            <MeetingMinutesSection
              meetingId={meeting.id}
              meeting={meeting}
              initialMinutes={meeting.minutes}
              defaultMode="preview"
              onViewHistoryClick={() => handleMinutesSubTabChange('history')}
            />
          )}

          {minutesSubTab === 'comments' && (
            <MeetingCommentsSection meetingId={meeting.id} />
          )}

          {minutesSubTab === 'history' && (
            <MinutesHistorySection meetingId={meeting.id} />
          )}
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

      <MeetingStatusGuideDialog
        isOpen={isStatusGuideOpen}
        onClose={() => setIsStatusGuideOpen(false)}
      />

      <GoogleCalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        event={{
          id: meeting.id,
          meetingNumber: currentMeetingNumber,
          title: meeting.title,
          date: meeting.date,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          location: meeting.location,
          biroName: meeting.primaryBiro?.name,
          chairpersonName: meeting.chairperson?.name,
          secretaryName: meeting.secretary?.name,
          attendees: participants.map((p: any) => ({
            name: p.user?.name || 'Peserta',
            email: p.user?.email || '',
          })),
        }}
      />
    </div>
  );
}
