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
} from 'lucide-react';
import { Meeting, BiroCode, MeetingStatus } from '@/lib/types';
import { MOCK_MEETINGS } from '@/lib/mock-data';
import { MeetingStatusBadge } from './meeting-status-badge';
import { ActionItemProgress } from '../action-items/action-item-progress';
import { MeetingDetailDialog } from './meeting-detail-dialog';

interface MeetingTableProps {
  onViewAllMeetings?: () => void;
  filterBiro?: BiroCode | null;
  filterStatus?: MeetingStatus | null;
  isLoading?: boolean;
  initialMeetings?: Meeting[];
}

export function MeetingTable({
  onViewAllMeetings,
  filterBiro,
  filterStatus,
  isLoading = false,
  initialMeetings,
}: MeetingTableProps) {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings || MOCK_MEETINGS);
  const [fetching, setFetching] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Sync with initialMeetings or fetch from Neon API
  React.useEffect(() => {
    if (initialMeetings) {
      setMeetings(initialMeetings);
    }

    let isMounted = true;
    const loadFromDb = async () => {
      try {
        setFetching(true);
        const res = await fetch('/api/meetings', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
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
        return <TrendingUp className="w-3.5 h-3.5 text-amber-600" />;
      case 'PKKEK':
      case 'DAL':
      case 'OPS':
        return <Ship className="w-3.5 h-3.5 text-amber-600" />;
      case 'UK':
      case 'BUK':
      case 'ADM':
        return <FileText className="w-3.5 h-3.5 text-amber-600" />;
      case 'BPPK':
      case 'PPK':
      case 'REN':
      case 'IT':
        return <Cpu className="w-3.5 h-3.5 text-amber-600" />;
      case 'HSDMO':
      case 'HUK':
      case 'LEG':
        return <Scale className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <TrendingUp className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  // Filter & sort meetings (Guarantee: Tanggal terbaru -> tanggal terlama)
  const filteredMeetings = useMemo(() => {
    // Clone and ensure newest date order
    const list = [...meetings];

    return list.filter((m) => {
      if (filterBiro && m.biroCode !== filterBiro) {
        return false;
      }
      if (filterStatus && m.status !== filterStatus) {
        return false;
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
  }, [searchFilter, filterBiro, filterStatus]);

  const handleResetFilter = () => {
    setSearchFilter('');
  };

  return (
    <div className="rounded-xl bg-white shadow-sm border border-amber-200/70 overflow-hidden flex flex-col">
      {/* Table Card Header */}
      <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gradient-to-r from-amber-50/70 to-white border-b border-amber-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <h2 className="font-bold text-[18px] text-slate-900">Rapat Terbaru KEK</h2>
          </div>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Daftar agenda dan risalah pertemuan terkini, diurutkan dari yang paling baru
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Filter Input */}
          <div className="relative">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Saring rapat..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-white border border-amber-200 text-slate-800 text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
            />
            <Filter className="w-4 h-4 absolute left-2.5 top-2.5 text-amber-600 pointer-events-none" />
          </div>

          {/* View All Meetings Link */}
          {onViewAllMeetings && (
            <button
              type="button"
              onClick={onViewAllMeetings}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors text-[13px] font-semibold shadow-sm shadow-amber-600/20 cursor-pointer"
            >
              <span>Lihat Semua Rapat</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-slate-800">
          <thead className="bg-amber-50/50 border-b border-amber-200/70 text-[11px] font-bold text-amber-900 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Nomor &amp; Tanggal</th>
              <th className="py-3 px-4">Agenda Rapat</th>
              <th className="py-3 px-4">Biro Pelaksana</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Tindak Lanjut</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100/80 text-[13px]">
            {isLoading ? (
              // Loading Skeleton State
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-4">
                    <div className="h-4 bg-amber-100 rounded w-20 mb-2"></div>
                    <div className="h-3 bg-slate-100 rounded w-16"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 bg-amber-100 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-6 bg-amber-50 rounded-md w-28"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 bg-emerald-100 rounded-full w-20"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-3 bg-amber-100 rounded w-28 mb-1.5"></div>
                    <div className="h-2 bg-amber-100 rounded-full w-32"></div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-7 bg-amber-100 rounded-lg w-16 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : filteredMeetings.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={6} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
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
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 font-semibold text-[12px] transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Bersihkan Filter Pencarian</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              // Meeting Rows
              filteredMeetings.map((meeting, index) => {
                const isEven = index % 2 === 1;

                return (
                  <tr
                    key={meeting.id}
                    className={`hover:bg-amber-50/30 transition-colors group ${
                      isEven ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    {/* Nomor & Tanggal */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-[13px] text-amber-800">
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
                          className="text-left font-bold text-[14px] text-slate-900 hover:text-amber-700 transition-colors line-clamp-2 cursor-pointer"
                        >
                          {meeting.title}
                        </button>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="text-[12px] line-clamp-1">{meeting.location}</span>
                        </div>
                      </div>
                    </td>

                    {/* Biro Pelaksana */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-[12px] font-bold text-amber-800">
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
                          className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              `Mengunduh risalah notulen resmi ${meeting.code} (Format PDF Resmi KEK RI)...`
                            )
                          }
                          className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                          title="Unduh Notulen PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
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
        <div className="p-4 bg-amber-50/40 border-t border-amber-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-slate-600 font-medium">
          <span>
            Menampilkan {filteredMeetings.length} dari total 148 risalah rapat terdaftar
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-slate-400 text-[12px] font-medium shadow-xs opacity-50 cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold shadow-xs ${
                currentPage === 1
                  ? 'bg-amber-600 text-white'
                  : 'bg-white border border-amber-200 text-slate-700 hover:bg-amber-50'
              }`}
            >
              1
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(2)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium shadow-xs ${
                currentPage === 2
                  ? 'bg-amber-600 text-white'
                  : 'bg-white border border-amber-200 text-slate-700 hover:bg-amber-50'
              }`}
            >
              2
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(3)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium shadow-xs ${
                currentPage === 3
                  ? 'bg-amber-600 text-white'
                  : 'bg-white border border-amber-200 text-slate-700 hover:bg-amber-50'
              }`}
            >
              3
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(2)}
              className="px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-slate-700 text-[12px] font-medium shadow-xs hover:bg-amber-50 transition-colors cursor-pointer"
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
