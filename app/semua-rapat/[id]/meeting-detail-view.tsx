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
} from 'lucide-react';
import { MeetingStatusBadge } from '@/components/meeting/meeting-status-badge';
import { MeetingMinutesSection } from '@/components/meeting/meeting-minutes/meeting-minutes-section';
import { ActionItemList } from '@/components/action-items/action-item-list';
import { MeetingStatus } from '@/lib/types';
import { updateMeetingStatusAction, deleteMeetingAction } from '@/app/actions/meeting-actions';

interface MeetingDetailViewProps {
  meeting: any;
  availableBiros?: any[];
  availableUsers?: any[];
}

export function MeetingDetailView({
  meeting,
  availableBiros = [],
  availableUsers = [],
}: MeetingDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'minutes' | 'actionItems'>('overview');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [status, setStatus] = useState<MeetingStatus>(meeting.status);

  const formattedDate = new Date(meeting.date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleStatusChange = async (newStatus: MeetingStatus) => {
    try {
      setIsUpdatingStatus(true);
      const res = await updateMeetingStatusAction(meeting.id, newStatus);
      if (res.success) {
        setStatus(newStatus);
        alert(`Status rapat ${meeting.meetingNumber} berhasil diperbarui ke ${newStatus}.`);
        router.refresh();
      } else {
        alert(res.error || 'Gagal mengubah status');
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err?.message || 'Gagal'}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus permanen rapat "${meeting.meetingNumber} - ${meeting.title}" beserta seluruh notulennya?`
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      const res = await deleteMeetingAction(meeting.id);
      if (res.success) {
        alert(`Rapat ${meeting.meetingNumber} berhasil dihapus dari Neon DB.`);
        router.push('/semua-rapat');
      } else {
        alert(res.error || 'Gagal menghapus rapat');
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err?.message || 'Gagal'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/semua-rapat"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-amber-800 text-[13px] font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Semua Rapat</span>
        </Link>

        {/* Delete button */}
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
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[18px] text-amber-900 bg-amber-100/80 px-3 py-1 rounded-lg border border-amber-300">
              {meeting.meetingNumber}
            </span>
            <MeetingStatusBadge status={status} />
          </div>

          {/* Quick Status Update */}
          <div className="flex items-center gap-1.5 bg-amber-50/70 p-1.5 rounded-xl border border-amber-200">
            <span className="text-[11px] font-bold text-slate-600 px-1.5 hidden sm:inline">Ubah Status:</span>
            {(['DRAFT', 'REVIEW', 'APPROVED', 'FINAL'] as MeetingStatus[]).map((st) => (
              <button
                key={st}
                type="button"
                disabled={status === st || isUpdatingStatus}
                onClick={() => handleStatusChange(st)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  status === st
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white hover:bg-amber-100 text-slate-700 border border-amber-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[12px] font-bold text-amber-700 uppercase tracking-wider block">
            Agenda Pembahasan Sidang
          </span>
          <h1 className="text-[24px] font-bold text-slate-900 mt-1 leading-snug">
            {meeting.title}
          </h1>
        </div>

        {/* Metadata Grid (Section 20 requirement) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-3 border-t border-amber-100 text-[13px]">
          {/* Biro Utama & Terlibat */}
          <div className="flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
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
            <Calendar className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
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
            <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Lokasi / Media</p>
              <p className="font-bold text-slate-800 line-clamp-2">{meeting.location}</p>
            </div>
          </div>

          {/* Ketua Sidang */}
          <div className="flex items-start gap-2.5">
            <UserCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Ketua Sidang</p>
              <p className="font-bold text-slate-800">
                {meeting.chairperson ? meeting.chairperson.name : 'Belum Ditugaskan'}
              </p>
              {meeting.chairperson?.biro && (
                <p className="text-[11px] text-slate-500">{meeting.chairperson.biro.shortName}</p>
              )}
            </div>
          </div>

          {/* Notulis Sidang */}
          <div className="flex items-start gap-2.5">
            <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Notulis Sidang</p>
              <p className="font-bold text-slate-800">
                {meeting.secretary ? meeting.secretary.name : 'Tim Notulensi Dewan KEK'}
              </p>
              {meeting.secretary?.biro && (
                <p className="text-[11px] text-slate-500">{meeting.secretary.biro.shortName}</p>
              )}
            </div>
          </div>

          {/* Peserta Total */}
          <div className="flex items-start gap-2.5">
            <Users className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Total Peserta Terdaftar</p>
              <p className="font-bold text-slate-800">
                {meeting.participants ? meeting.participants.length : 0} Pejabat / Perwakilan
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Section 6 requirement: [Informasi Rapat], [Peserta], [Notulen]) */}
      <div className="flex items-center gap-2 border-b border-amber-200/80 pb-0">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-[13px] border-b-2 transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-amber-800 hover:bg-amber-50/20'
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
              ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-amber-800 hover:bg-amber-50/20'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Peserta ({meeting.participants ? meeting.participants.length : 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('minutes')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-[13px] border-b-2 transition-all cursor-pointer ${
            activeTab === 'minutes'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-amber-800 hover:bg-amber-50/20'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Notulen &amp; Hasil Rapat</span>
          {meeting.minutes && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Notulen telah terisi" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('actionItems')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-[13px] border-b-2 transition-all cursor-pointer ${
            activeTab === 'actionItems'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-amber-800 hover:bg-amber-50/20'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Tindak Lanjut ({meeting.actionItems ? meeting.actionItems.length : 0})</span>
        </button>
      </div>

      {/* Tab 1: Informasi Rapat / Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-amber-200/80 p-6 shadow-xs space-y-4 text-[13px]">
            <h3 className="text-[16px] font-bold text-slate-900">Deskripsi &amp; Cakupan Sidang</h3>
            <p className="text-slate-600 leading-relaxed">
              Pertemuan koordinasi resmi diprakarsai oleh <strong>{meeting.primaryBiro.name}</strong>.
              Rapat ini membahas agenda strategis akselerasi kawasan, penataan regulasi, serta pengendalian
              operasional Kawasan Ekonomi Khusus RI.
            </p>

            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[12px] transition-all shrink-0 cursor-pointer shadow-xs"
              >
                {meeting.minutes ? 'Buka Notulen Rapat' : '+ Buat Notulen Sekarang'}
              </button>
            </div>

            {/* Matriks Tindak Lanjut Quick Card */}
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                className="px-4 py-2 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-semibold text-[12px] transition-all shrink-0 cursor-pointer shadow-xs"
              >
                {meeting.actionItems && meeting.actionItems.length > 0
                  ? 'Buka Matriks Tindak Lanjut'
                  : '+ Tambah Tindak Lanjut'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Peserta */}
      {activeTab === 'participants' && (
        <div className="bg-white rounded-xl border border-amber-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-[16px] font-bold text-slate-900">Daftar Kehadiran Peserta Sidang</h3>
          {meeting.participants && meeting.participants.length > 0 ? (
            <div className="divide-y divide-amber-100 border border-amber-100 rounded-xl overflow-hidden text-[13px]">
              {meeting.participants.map((p: any) => (
                <div key={p.id} className="p-3.5 flex items-center justify-between bg-white hover:bg-amber-50/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[11px]">
                      {p.user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{p.user.name}</p>
                      <p className="text-[11px] text-slate-500">{p.user.email} • {p.user.biro?.code || 'Biro KEK'}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {p.attendanceStatus}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-slate-500 italic">Belum ada daftar peserta yang ditambahkan.</p>
          )}
        </div>
      )}

      {/* Tab 3: Notulen & Hasil Rapat */}
      {activeTab === 'minutes' && (
        <div className="space-y-4">
          <MeetingMinutesSection
            meetingId={meeting.id}
            initialMinutes={meeting.minutes}
            defaultMode={meeting.minutes ? 'preview' : 'edit'}
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
    </div>
  );
}
