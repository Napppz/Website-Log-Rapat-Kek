'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  Briefcase,
  Network,
  Radio,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  ExternalLink,
  PlusCircle,
  FileText,
  Search,
  Filter,
} from 'lucide-react';
import { TeamWorkloadMetric } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MeetingStatusBadge, MeetingProgressBadge } from '@/components/meeting/meeting-status-badge';

interface TeamDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamWorkloadMetric | null;
}

type ModalTab = 'jobs' | 'meetings' | 'members';

export function TeamDetailModal({ isOpen, onClose, team }: TeamDetailModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ModalTab>('jobs');
  const [jobFilter, setJobFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen || !team) return null;

  const getTeamIcon = (code: string) => {
    switch (code.toUpperCase()) {
      case 'INV':
        return <Briefcase className="w-5 h-5 text-[#31889C]" />;
      case 'KS':
        return <Network className="w-5 h-5 text-[#2E7D32]" />;
      case 'KOM':
        return <Radio className="w-5 h-5 text-[#D97706]" />;
      default:
        return <Layers className="w-5 h-5 text-[#31889C]" />;
    }
  };

  const getTeamColorTheme = (code: string) => {
    switch (code.toUpperCase()) {
      case 'INV':
        return {
          bgBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          accent: 'text-[#31889C]',
          ring: 'ring-teal-500/20',
        };
      case 'KS':
        return {
          bgBadge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          accent: 'text-[#2E7D32]',
          ring: 'ring-emerald-500/20',
        };
      case 'KOM':
        return {
          bgBadge: 'bg-amber-50 text-amber-800 border-amber-200',
          accent: 'text-[#D97706]',
          ring: 'ring-amber-500/20',
        };
      default:
        return {
          bgBadge: 'bg-slate-50 text-slate-800 border-slate-200',
          accent: 'text-[#31889C]',
          ring: 'ring-slate-500/20',
        };
    }
  };

  const theme = getTeamColorTheme(team.code);

  const filteredJobs = (team.actionItems || []).filter((job) => {
    if (jobFilter !== 'ALL' && job.status !== jobFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        job.title.toLowerCase().includes(q) ||
        (job.picName && job.picName.toLowerCase().includes(q)) ||
        (job.meetingNumber && job.meetingNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredMeetings = (team.meetings || []).filter((m) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.meetingNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Finish
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <Clock className="w-3 h-3 text-amber-600" />
            On Progres
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-300">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <AlertCircle className="w-3 h-3 text-sky-600" />
            Start
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
              {getTeamIcon(team.code)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wide border', theme.bgBadge)}>
                  {team.fullName} ({team.code})
                </span>
                <span className="text-[12px] text-slate-400">•</span>
                <span className="text-[12px] font-semibold text-slate-500">
                  Biro Investasi, Kerja Sama &amp; Komunikasi (IKK)
                </span>
              </div>
              <h2 className="text-[20px] font-extrabold text-slate-900 mt-1 leading-snug">
                Detail Monitoring Kinerja {team.fullName}
              </h2>
              {team.description && (
                <p className="text-[12.5px] text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
                  {team.description}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Tutup detail tim"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Executive KPI Bar (Jumlah Rapat & Status Pemantauan: Finish, On Progres, Start - NO PERCENTAGE) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-4 bg-slate-50/80 border-b border-slate-200 text-center">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Rapat</p>
            <p className="text-[20px] font-extrabold text-[#215865] mt-0.5">{team.meetingCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Agenda resmi tim</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pekerjaan</p>
            <p className="text-[20px] font-extrabold text-slate-800 mt-0.5">{team.totalJobs}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Tindak lanjut aktif</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/40 shadow-2xs">
            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Finish
            </p>
            <p className="text-[20px] font-extrabold text-emerald-800 mt-0.5">{team.completedJobs}</p>
            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">Selesai tuntas</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-amber-300 bg-amber-50/40 shadow-2xs">
            <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              On Progres
            </p>
            <p className="text-[20px] font-extrabold text-amber-800 mt-0.5">{team.inProgressJobs}</p>
            <p className="text-[10px] text-amber-700 font-semibold mt-0.5">Sedang berjalan</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-sky-300 bg-sky-50/40 shadow-2xs col-span-2 sm:col-span-1">
            <p className="text-[11px] font-bold text-sky-800 uppercase tracking-wider flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              Start
            </p>
            <p className="text-[20px] font-extrabold text-sky-800 mt-0.5">{team.pendingJobs}</p>
            <p className="text-[10px] text-sky-700 font-semibold mt-0.5">Persiapan awal</p>
          </div>
        </div>

        {/* Tab Navigation & Search */}
        <div className="px-5 pt-3 pb-2.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setActiveTab('jobs');
                setSearchQuery('');
              }}
              className={cn(
                'px-3 py-1.5 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0',
                activeTab === 'jobs'
                  ? 'bg-[#31889C] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Status Pekerjaan ({team.totalJobs})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('meetings');
                setSearchQuery('');
              }}
              className={cn(
                'px-3 py-1.5 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0',
                activeTab === 'meetings'
                  ? 'bg-[#31889C] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Daftar Rapat ({team.meetingCount})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('members');
                setSearchQuery('');
              }}
              className={cn(
                'px-3 py-1.5 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0',
                activeTab === 'members'
                  ? 'bg-[#31889C] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Anggota Tim ({team.memberCount})</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari dalam tim..."
              className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#31889C]/20 focus:border-[#31889C]"
            />
          </div>
        </div>

        {/* Modal Body / Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-50/40">
          {/* TAB 1: STATUS PEKERJAAN (TINDAK LANJUT) */}
          {activeTab === 'jobs' && (
            <div className="space-y-3">
              {/* Filter Pills for Status */}
              <div className="flex items-center gap-1.5 flex-wrap pb-1">
                <span className="text-[11.5px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-[#31889C]" />
                  Status:
                </span>
                <button
                  type="button"
                  onClick={() => setJobFilter('ALL')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer',
                    jobFilter === 'ALL'
                      ? 'bg-[#215865] text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  Semua ({team.totalJobs})
                </button>
                <button
                  type="button"
                  onClick={() => setJobFilter('PENDING')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer',
                    jobFilter === 'PENDING'
                      ? 'bg-sky-700 text-white shadow-2xs'
                      : 'bg-white border border-sky-200 text-sky-800 hover:bg-sky-50'
                  )}
                >
                  Start ({team.pendingJobs})
                </button>
                <button
                  type="button"
                  onClick={() => setJobFilter('IN_PROGRESS')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer',
                    jobFilter === 'IN_PROGRESS'
                      ? 'bg-amber-700 text-white shadow-2xs'
                      : 'bg-white border border-amber-200 text-amber-800 hover:bg-amber-50'
                  )}
                >
                  On Progres ({team.inProgressJobs})
                </button>
                <button
                  type="button"
                  onClick={() => setJobFilter('COMPLETED')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer',
                    jobFilter === 'COMPLETED'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50'
                  )}
                >
                  Finish ({team.completedJobs})
                </button>
              </div>

              {filteredJobs.length > 0 ? (
                <div className="space-y-2.5">
                  {filteredJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {job.meetingNumber && (
                            <span className="text-[11px] font-mono font-bold text-[#1E6B7B] bg-[#F0F9FA] px-2 py-0.5 rounded border border-[#BCE3EB]">
                              Rapat {job.meetingNumber}
                            </span>
                          )}
                          {job.priority && (
                            <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              Prioritas: {job.priority}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-[13.5px] text-slate-900 leading-snug">
                          {job.title}
                        </h4>
                        <div className="flex items-center gap-4 text-[11.5px] text-slate-500 mt-2 flex-wrap">
                          {job.picName && (
                            <span className="flex items-center gap-1 font-medium">
                              👤 PIC: <strong>{job.picName}</strong>
                            </span>
                          )}
                          {job.dueDate && (
                            <span className="flex items-center gap-1 font-medium">
                              📅 Tenggat: <strong>{job.dueDate}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Lifecycle Indicator (Start / On Progres / Finish) */}
                      <div className="sm:text-right shrink-0">
                        {getStatusBadge(job.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-[13px] font-bold text-slate-700">
                    Tidak ada pekerjaan pada kategori ini
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Silakan ubah filter status atau kata kunci pencarian.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DAFTAR RAPAT TIM */}
          {activeTab === 'meetings' && (
            <div className="space-y-2.5">
              {filteredMeetings.length > 0 ? (
                filteredMeetings.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-[#31889C] transition flex items-center justify-between gap-4 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[11.5px] font-mono font-extrabold text-[#215865] bg-[#F0F9FA] px-2 py-0.5 rounded border border-[#BCE3EB]">
                          {m.meetingNumber}
                        </span>
                        <MeetingProgressBadge progressStatus={(m as any).progressStatus} status={m.status} showSubtitle />
                        <span className="text-[11.5px] text-slate-400">📅 {m.date}</span>
                      </div>
                      <h4 className="font-bold text-[14px] text-slate-900 group-hover:text-[#31889C] transition-colors leading-snug">
                        {m.title}
                      </h4>
                    </div>

                    <Link
                      href={`/semua-rapat/${m.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#BCE3EB] bg-[#F0F9FA] hover:bg-[#E8F5F7] text-[#215865] text-xs font-bold transition shadow-2xs shrink-0 cursor-pointer"
                    >
                      <span>Buka Risalah</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-[13px] font-bold text-slate-700">Belum ada rapat terdaftar</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Seluruh rapat yang dibuat untuk {team.fullName} akan tampil di sini.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ANGGOTA & STAF TIM */}
          {activeTab === 'members' && (
            <div className="space-y-2.5">
              {team.members && team.members.length > 0 ? (
                team.members.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#E8F5F7] text-[#215865] font-bold text-xs flex items-center justify-center shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[13px] text-slate-900 truncate">
                          {member.name}
                        </p>
                        <p className="text-[11.5px] text-slate-500 truncate">{member.email}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 shrink-0">
                      {member.role === 'SUPER_ADMIN'
                        ? 'Super Admin'
                        : member.role === 'ADMIN'
                        ? 'Admin'
                        : 'Staf Pelaksana'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-[13px] font-bold text-slate-700">Belum ada anggota terdaftar</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Kelola penempatan personil melalui menu Manajemen Pengguna.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Link
              href={`/buat-rapat?tim=${team.code}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#31889C] hover:bg-[#266F80] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Jadwalkan Rapat {team.fullName}</span>
            </Link>
            <Link
              href={`/semua-rapat?tim=${team.code}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#31889C]" />
              <span>Lihat Semua Rapat Tim</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer ml-auto"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
