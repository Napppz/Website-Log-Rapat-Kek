'use client';

import React, { useState, useMemo } from 'react';
import {
  Filter,
  ArrowRight,
  MapPin,
  Eye,
  FileDown,
  TrendingUp,
  Ship,
  Scale,
  Cpu,
  FileText,
  SearchX,
  RotateCcw,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Meeting, BiroCode, MeetingStatus } from '@/lib/types';
import { MOCK_MEETINGS } from '@/lib/mock-data';
import { MeetingStatusBadge } from './meeting-status-badge';
import { ActionItemProgress } from '../action-items/action-item-progress';
import { MeetingDetailDialog } from './meeting-detail-dialog';
import { useSession } from 'next-auth/react';
import { deleteMeetingAction } from '@/app/actions/meeting-actions';
import { toast, confirmModal } from '@/components/providers/toast-provider';
import { parseMonthFilterIndex } from '@/lib/utils';

interface MeetingTableProps {
  onViewAllMeetings?: () => void;
  filterBiro?: BiroCode | null;
  filterStatus?: MeetingStatus | null;
  filterMonth?: string | null;
  isLoading?: boolean;
  initialMeetings?: Meeting[];
  pageSize?: number;
}

export function MeetingTable({
  onViewAllMeetings,
  filterBiro,
  filterStatus,
  filterMonth,
  isLoading = false,
  initialMeetings,
  pageSize = 8,
}: MeetingTableProps) {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings !== undefined ? initialMeetings : MOCK_MEETINGS);
  const [fetching, setFetching] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'VIEWER';
  const canDeleteMeeting = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  const handleDeleteSingleMeeting = async (m: Meeting) => {
    const confirmed = await confirmModal({
      title: `Hapus Rapat ${m.code}?`,
      message: `Apakah Anda yakin ingin menghapus permanen rapat "${m.title}" beserta seluruh notulen dan butir tindak lanjutnya dari database?`,
      confirmText: 'Ya, Hapus Rapat',
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    try {
      setDeletingRowId(m.id);
      const res = await deleteMeetingAction(m.id);
      if (res.success) {
        setMeetings((prev) => prev.filter((item) => item.id !== m.id));
        toast.success(`Rapat ${m.code} berhasil dihapus dari database.`);
      } else {
        toast.error(res.error || 'Gagal menghapus rapat.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus rapat.');
    } finally {
      setDeletingRowId(null);
    }
  };

  const handleDownloadPdf = async (mId: string, mCode: string) => {
    try {
      setDownloadingId(mId);
      const res = await fetch(`/api/meetings/${mId}/pdf`);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Gagal mengunduh PDF');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Risalah-Rapat-${mCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Risalah rapat ${mCode} berhasil diunduh (PDF).`);
    } catch (e: any) {
      toast.error(e?.message || 'Gagal mengunduh dokumen PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Sync with initialMeetings or fetch from Neon API
  React.useEffect(() => {
    if (initialMeetings !== undefined) {
      setMeetings(initialMeetings);
      return;
    }

    let isMounted = true;
    const loadFromDb = async () => {
      try {
        setFetching(true);
        const res = await fetch('/api/meetings', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data)) {
            setMeetings(data);
          }
        }
      } catch (e) {
        console.warn('Fallback to local mock if DB fetch fails:', e);
      } finally {
        if (isMounted) setFetching(false);
      }
    };

    loadFromDb();
    return () => {
      isMounted = false;
    };
  }, [initialMeetings]);

  // Biro icon mapping
  const getBiroIcon = (code: BiroCode) => {
    switch (code) {
      case 'IKK':
      case 'INV':
        return <TrendingUp className="w-3.5 h-3.5 text-[#7CC563]" />;
      case 'PKKEK':
      case 'DAL':
      case 'OPS':
        return <Ship className="w-3.5 h-3.5 text-[#31889C]" />;
      case 'UK':
      case 'BUK':
      case 'ADM':
        return <FileText className="w-3.5 h-3.5 text-[#31889C]" />;
      case 'BPPK':
      case 'PPK':
      case 'REN':
      case 'IT':
        return <Cpu className="w-3.5 h-3.5 text-[#31889C]" />;
      case 'HSDMO':
      case 'HUK':
      case 'LEG':
        return <Scale className="w-3.5 h-3.5 text-[#31889C]" />;
      default:
        return <TrendingUp className="w-3.5 h-3.5 text-[#31889C]" />;
    }
  };

  // Filter & sort meetings (Guarantee: Tanggal terbaru -> tanggal terlama)
  const filteredMeetings = useMemo(() => {
    // Clone and ensure newest date order
    const list = [...meetings];
    const monthIdx = parseMonthFilterIndex(filterMonth);

    return list.filter((m) => {
      if (filterBiro && m.biroCode !== filterBiro) {
        return false;
      }
      if (filterStatus && m.status !== filterStatus) {
        return false;
      }
      if (monthIdx !== null) {
        const mDate = new Date(m.date);
        if (mDate.getMonth() !== monthIdx) {
          return false;
        }
      }
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        m.code.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.biroName.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q)
      );
    });
  }, [searchFilter, filterBiro, filterStatus, filterMonth]);

  const handleResetFilter = () => {
    setSearchFilter('');
  };

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchFilter, filterBiro, filterStatus, filterMonth]);

  const itemsPerPage = pageSize;
  const totalPages = Math.max(1, Math.ceil(filteredMeetings.length / itemsPerPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredMeetings.length);
  const paginatedMeetings = filteredMeetings.slice(startIndex, endIndex);

  const getPageNumbers = (current: number, total: number) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (current <= 3) {
      pages.push(1, 2, 3, 4, '...', total);
    } else if (current >= total - 2) {
      pages.push(1, '...', total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }
    return pages;
  };

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Table Card Header */}
      <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-[#F8FAFC] border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#31889C]"></span>
            <h2 className="font-bold text-[18px] text-slate-900">
              {onViewAllMeetings ? 'Agenda & Risalah Rapat Terkini' : 'Semua Risalah Rapat KEK'}
            </h2>
          </div>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            {onViewAllMeetings
              ? 'Ringkasan rapat koordinasi terbaru. Untuk mencari data lama atau arsip penuh, klik Buka Semua Arsip.'
              : 'Daftar lengkap agenda dan risalah pertemuan, diurutkan dari yang paling baru.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Filter Input */}
          <div className="relative">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Cari nomor/agenda..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-[#31889C]/25 focus:border-[#31889C] shadow-2xs"
            />
            <Filter className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#31889C] pointer-events-none" />
          </div>

          {/* View All Meetings Link */}
          {onViewAllMeetings && (
            <button
              type="button"
              onClick={onViewAllMeetings}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#31889C] text-white hover:bg-[#266F80] transition-all text-[12.5px] font-semibold shadow-xs cursor-pointer shrink-0"
            >
              <span>Buka Semua Arsip Rapat</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-slate-800">
          <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Nomor &amp; Tanggal</th>
              <th className="py-3 px-4">Agenda Rapat</th>
              <th className="py-3 px-4">Biro Pelaksana</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Tindak Lanjut</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-[13px]">
            {isLoading ? (
              // Loading Skeleton State
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-4">
                    <div className="h-4 bg-slate-100 rounded w-20 mb-2"></div>
                    <div className="h-3 bg-slate-100 rounded w-16"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-6 bg-slate-100 rounded-md w-28"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 bg-slate-100 rounded-full w-20"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-3 bg-slate-100 rounded w-28 mb-1.5"></div>
                    <div className="h-2 bg-slate-100 rounded-full w-32"></div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-7 bg-slate-100 rounded-lg w-16 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : filteredMeetings.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={6} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#F0F9FA] border border-[#BCE3EB] flex items-center justify-center text-[#31889C]">
                      <SearchX className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[15px] text-slate-800">
                        Tidak Ada Risalah Rapat Ditemukan
                      </h4>
                      <p className="text-[13px] text-slate-500 mt-1">
                        Tidak ada agenda rapat yang cocok dengan kata kunci atau filter yang Anda terapkan.
                      </p>
                    </div>
                    {searchFilter && (
                      <button
                        type="button"
                        onClick={handleResetFilter}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F0F9FA] text-[#215865] hover:bg-[#E8F5F7] border border-[#BCE3EB] font-semibold text-[12px] transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Bersihkan Filter Pencarian</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              // Meeting Rows (Paginated)
              paginatedMeetings.map((meeting) => {
                return (
                  <tr
                    key={meeting.id}
                    className="hover:bg-[#F0F9FA] transition-colors group"
                  >
                    {/* Nomor & Tanggal */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-[13px] text-[#31889C]">
                          {meeting.code}
                        </span>
                        <span className="text-slate-500 text-[12px] font-medium">
                          {meeting.date}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {meeting.time}
                        </span>
                      </div>
                    </td>

                    {/* Agenda Rapat & Lokasi */}
                    <td className="py-3.5 px-4 align-top max-w-md">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedMeeting(meeting)}
                          className="text-left font-bold text-[14px] text-slate-900 hover:text-[#31889C] transition-colors line-clamp-2 cursor-pointer"
                        >
                          {meeting.title}
                        </button>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-[#31889C] shrink-0" />
                          <span className="text-[12px] line-clamp-1">{meeting.location}</span>
                        </div>
                      </div>
                    </td>

                    {/* Biro Pelaksana */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F0F9FA] border border-[#BCE3EB] text-[12px] font-bold text-[#215865]">
                        {getBiroIcon(meeting.biroCode)}
                        {meeting.biroName}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <MeetingStatusBadge
                        status={meeting.status}
                        isNew={meeting.isNew}
                      />
                    </td>

                    {/* Tindak Lanjut Progress */}
                    <td className="py-3.5 px-4 align-top">
                      <ActionItemProgress data={meeting.actionItems} />
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedMeeting(meeting)}
                          className="p-1.5 rounded-lg text-[#31889C] hover:bg-[#F0F9FA] transition-colors cursor-pointer"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={downloadingId === meeting.id}
                          onClick={() => handleDownloadPdf(meeting.id, meeting.code)}
                          className="p-1.5 rounded-lg text-[#31889C] hover:bg-[#F0F9FA] transition-colors cursor-pointer disabled:opacity-50"
                          title="Unduh Risalah Rapat (PDF)"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        {canDeleteMeeting && (
                          <button
                            type="button"
                            disabled={deletingRowId === meeting.id}
                            onClick={() => handleDeleteSingleMeeting(meeting)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                            title={`Hapus Rapat ${meeting.code}`}
                          >
                            {deletingRowId === meeting.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && filteredMeetings.length > 0 && (
        <div className="p-4 bg-[#F8FAFC] border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-slate-600 font-medium">
          <span>
            Menampilkan{' '}
            <strong className="text-slate-800">
              {filteredMeetings.length === 0 ? 0 : startIndex + 1}–{endIndex}
            </strong>{' '}
            dari total <strong className="text-slate-800">{filteredMeetings.length}</strong> risalah rapat terdaftar
          </span>

          <div className="flex items-center gap-1.5">
            {/* Tombol Sebelumnya */}
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium shadow-xs transition-all ${
                safePage <= 1
                  ? 'bg-white border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-[#F0F9FA] cursor-pointer'
              }`}
            >
              Sebelumnya
            </button>

            {/* Nomor Halaman Dinamis */}
            {getPageNumbers(safePage, totalPages).map((item, pIdx) => {
              if (item === '...') {
                return (
                  <span key={`dots-${pIdx}`} className="px-2 text-slate-400 select-none">
                    ...
                  </span>
                );
              }
              const pageNum = Number(item);
              const isActive = pageNum === safePage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold shadow-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#31889C] text-white border border-[#31889C]'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-[#F0F9FA]'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Tombol Berikutnya */}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium shadow-xs transition-all ${
                safePage >= totalPages
                  ? 'bg-white border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-[#F0F9FA] cursor-pointer'
              }`}
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      {/* Meeting Detail Modal */}
      <MeetingDetailDialog
        meeting={selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
        onMeetingUpdated={() => {
          fetch('/api/meetings', { cache: 'no-store' })
            .then((r) => r.json())
            .then((data) => {
              if (Array.isArray(data)) setMeetings(data);
            })
            .catch((e) => console.error(e));
        }}
      />
    </div>
  );
}
