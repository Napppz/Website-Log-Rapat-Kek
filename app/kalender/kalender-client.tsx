'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Building2,
  PlusCircle,
  Search,
  Filter,
  Users,
  Eye,
  List,
  Grid3X3,
  CalendarCheck2,
} from 'lucide-react';
import { Meeting, Biro } from '@/lib/types';
import { cn } from '@/lib/utils';

interface KalenderClientProps {
  initialMeetings: Meeting[];
  biros: Biro[];
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  FINAL: { label: 'Final', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  APPROVED: { label: 'Disetujui', badge: 'bg-blue-100 text-blue-800 border-blue-300' },
  REVIEW: { label: 'Review', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
  DRAFT: { label: 'Draft', badge: 'bg-slate-100 text-slate-700 border-slate-300' },
};

export function KalenderClient({ initialMeetings, biros }: KalenderClientProps) {
  // Calendar current view month and year (defaults to current date or September 2026 if in mock year)
  const [currentDate, setCurrentDate] = useState(() => {
    // Check if meetings contain 2026 data
    const sample = initialMeetings[0]?.date;
    if (sample && sample.includes('2026')) {
      return new Date(2026, 8, 1); // September 2026
    }
    return new Date();
  });

  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [selectedBiro, setSelectedBiro] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Helper to normalize meeting date to YYYY-MM-DD
  const parseMeetingDate = (dateStr: string): { year: number; month: number; day: number; key: string } | null => {
    if (!dateStr) return null;

    // Check ISO format YYYY-MM-DD
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      return { year, month, day, key: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` };
    }

    // Check Indonesian format: "24 September 2026" or "Kamis, 24 September 2026"
    const idMonths = [
      'januari', 'februari', 'maret', 'april', 'mei', 'juni',
      'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
    ];
    for (let m = 0; m < idMonths.length; m++) {
      if (dateStr.toLowerCase().includes(idMonths[m])) {
        const parts = dateStr.match(/(\d{1,2})\s+[A-Za-z]+\s+(\d{4})/);
        if (parts) {
          const day = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          return {
            year,
            month: m,
            day,
            key: `${year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          };
        }
      }
    }

    // Fallback standard Date parsing
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return {
        year: d.getFullYear(),
        month: d.getMonth(),
        day: d.getDate(),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      };
    }

    return null;
  };

  // Group meetings by date key
  const { meetingsByDate, allFilteredMeetings } = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    const filtered: Meeting[] = [];

    initialMeetings.forEach((m) => {
      const matchBiro = selectedBiro === 'ALL' || m.biroCode === selectedBiro || m.involvedBiros?.includes(selectedBiro);
      const matchStatus = selectedStatus === 'ALL' || m.status === selectedStatus;
      const matchQuery =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.biroName.toLowerCase().includes(searchQuery.toLowerCase());

      if (matchBiro && matchStatus && matchQuery) {
        filtered.push(m);
        const parsed = parseMeetingDate(m.date);
        if (parsed) {
          const list = map.get(parsed.key) || [];
          list.push(m);
          map.set(parsed.key, list);
        }
      }
    });

    return { meetingsByDate: map, allFilteredMeetings: filtered };
  }, [initialMeetings, selectedBiro, selectedStatus, searchQuery]);

  // Calendar matrix calculation (Senin - Minggu)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Monday as 0, Sunday as 6
    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek < 0) startingDayOfWeek = 6;

    const totalDays = lastDayOfMonth.getDate();
    const days: Array<{
      dayNumber: number;
      isCurrentMonth: boolean;
      dateKey: string;
      meetings: Meeting[];
      isToday: boolean;
    }> = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(currentYear, currentMonth - 1, dayNum);
      const key = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dayNumber: dayNum,
        isCurrentMonth: false,
        dateKey: key,
        meetings: meetingsByDate.get(key) || [],
        isToday: false,
      });
    }

    // Current month days
    const today = new Date();
    for (let d = 1; d <= totalDays; d++) {
      const key = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday =
        today.getFullYear() === currentYear &&
        today.getMonth() === currentMonth &&
        today.getDate() === d;

      days.push({
        dayNumber: d,
        isCurrentMonth: true,
        dateKey: key,
        meetings: meetingsByDate.get(key) || [],
        isToday,
      });
    }

    // Next month padding to fill complete grid of 35 or 42 cells
    const remainingCells = 35 - days.length >= 0 ? 35 - days.length : 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(currentYear, currentMonth + 1, i);
      const key = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dayNumber: i,
        isCurrentMonth: false,
        dateKey: key,
        meetings: meetingsByDate.get(key) || [],
        isToday: false,
      });
    }

    return days;
  }, [currentYear, currentMonth, meetingsByDate]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedDateKey(key);
  };

  // Selected date meetings
  const selectedMeetings = selectedDateKey ? meetingsByDate.get(selectedDateKey) || [] : [];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Executive Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 via-white to-amber-100/60 p-6 md:p-8 border border-amber-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <span className="font-semibold text-[11px] text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarCheck2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Manajemen Waktu &amp; Sinergi Dewan KEK</span>
          </span>
          <h1 className="text-[24px] md:text-[28px] font-bold text-slate-900 tracking-tight">
            Kalender Agenda Sidang KEK RI
          </h1>
          <p className="text-[13px] text-slate-600 leading-relaxed">
            Sinkronisasi jadwal sidang pleno, rapat koordinasi teknis, dan evaluasi percepatan investasi 5 biro kerja Dewan Nasional KEK RI secara terpadu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/buat-rapat"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-semibold text-[13px] hover:bg-amber-700 shadow-sm shadow-amber-600/25 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Jadwalkan Rapat Baru</span>
          </Link>
        </div>
      </div>

      {/* 2. Controls Toolbar: Month Selector + View Mode + Filters */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-amber-50/80 rounded-xl p-1 border border-amber-200">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-amber-900 transition-colors cursor-pointer"
              title="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-[14.5px] text-amber-950 px-3 py-1 min-w-[160px] text-center">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-amber-900 transition-colors cursor-pointer"
              title="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-2 rounded-xl border border-amber-200 text-amber-900 font-semibold text-[12px] hover:bg-amber-50 transition-colors cursor-pointer"
          >
            Hari Ini
          </button>
        </div>

        {/* Middle: Search */}
        <div className="relative w-full lg:max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari agenda atau lokasi..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-amber-200 text-[12.5px] bg-amber-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-3.5 h-3.5 text-amber-600 absolute left-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Right: Filters & View Switch */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedBiro}
            onChange={(e) => setSelectedBiro(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-amber-200 text-[12px] font-semibold text-slate-700 bg-white cursor-pointer"
          >
            <option value="ALL">Semua Biro</option>
            {biros.map((b) => (
              <option key={b.code} value={b.code}>
                Biro {b.code}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-amber-200 text-[12px] font-semibold text-slate-700 bg-white cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="FINAL">Final</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REVIEW">Review</option>
            <option value="DRAFT">Draft</option>
          </select>

          {/* Toggle View Mode */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 ml-1">
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              className={cn(
                'p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer',
                viewMode === 'GRID'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
              title="Tampilan Kalender Grid"
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="hidden sm:inline">Kalender</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={cn(
                'p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer',
                viewMode === 'LIST'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
              title="Tampilan Daftar Agenda"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Daftar</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main View Area */}
      {viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendar Grid (8 cols on large screens) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-amber-200 shadow-sm p-4 md:p-6 overflow-hidden">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center">
              {DAY_NAMES.map((day, idx) => (
                <div
                  key={day}
                  className={cn(
                    'py-2 text-[12px] font-bold uppercase tracking-wider',
                    idx >= 5 ? 'text-amber-800' : 'text-slate-500'
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Day Cells */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((cell, idx) => {
                const isSelected = selectedDateKey === cell.dateKey;
                const hasMeetings = cell.meetings.length > 0;

                return (
                  <div
                    key={idx}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedDateKey(cell.dateKey)}
                    className={cn(
                      'min-h-[92px] p-2 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer group',
                      !cell.isCurrentMonth
                        ? 'bg-slate-50/50 border-slate-100 text-slate-300 opacity-60'
                        : isSelected
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 shadow-xs'
                        : cell.isToday
                        ? 'border-amber-300 bg-amber-50/30'
                        : 'border-slate-100 bg-white hover:border-amber-200 hover:bg-amber-50/20'
                    )}
                  >
                    {/* Day number header */}
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'text-[13px] font-bold rounded-lg w-6 h-6 flex items-center justify-center',
                          cell.isToday
                            ? 'bg-amber-600 text-white font-extrabold'
                            : isSelected
                            ? 'bg-amber-200 text-amber-900 font-extrabold'
                            : 'text-slate-700'
                        )}
                      >
                        {cell.dayNumber}
                      </span>

                      {hasMeetings && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          {cell.meetings.length}
                        </span>
                      )}
                    </div>

                    {/* Meeting pills in cell */}
                    <div className="mt-1 space-y-1">
                      {cell.meetings.slice(0, 2).map((m) => (
                        <div
                          key={m.id}
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold truncate bg-amber-100/80 text-amber-950 border border-amber-200/60 group-hover:border-amber-300"
                          title={`${m.code}: ${m.title} (${m.time})`}
                        >
                          <span className="font-bold">{m.code}</span> {m.title}
                        </div>
                      ))}
                      {cell.meetings.length > 2 && (
                        <div className="text-[9.5px] font-bold text-amber-700 pl-1">
                          +{cell.meetings.length - 2} rapat lainnya
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Inspector Panel (4 cols on large screens) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-amber-200 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-amber-100">
                <div>
                  <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                    Detail Jadwal Harian
                  </span>
                  <h3 className="font-bold text-[16px] text-slate-900 mt-0.5">
                    {selectedDateKey ? selectedDateKey : 'Pilih Tanggal'}
                  </h3>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                  {selectedMeetings.length} Rapat
                </span>
              </div>

              {/* Selected Meetings List */}
              <div className="mt-4 space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {selectedMeetings.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-[13px] font-medium text-slate-500">
                      Tidak ada rapat dijadwalkan pada tanggal ini.
                    </p>
                    <p className="text-[11.5px] text-slate-400 mt-1">
                      Klik tanggal lain di kalender atau buat rapat baru.
                    </p>
                  </div>
                ) : (
                  selectedMeetings.map((m) => {
                    const statusCfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.DRAFT;

                    return (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-xl border border-amber-200/90 bg-amber-50/20 hover:bg-amber-50/60 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-[11.5px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                            {m.code}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                              statusCfg.badge
                            )}
                          >
                            {statusCfg.label}
                          </span>
                        </div>

                        <h4 className="font-bold text-[13.5px] text-slate-900 line-clamp-2">
                          {m.title}
                        </h4>

                        <div className="space-y-1 text-[11.5px] text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{m.time}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">{m.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate font-semibold text-amber-900">
                              {m.biroName}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-amber-100/80 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">
                            {m.attendees?.length || 0} Undangan
                          </span>
                          <Link
                            href={`/semua-rapat/${m.id}`}
                            className="inline-flex items-center gap-1 text-[11.5px] font-bold text-amber-800 hover:text-amber-950 transition-colors"
                          >
                            <span>Buka Risalah</span>
                            <Eye className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-amber-100">
              <Link
                href="/buat-rapat"
                className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-semibold text-[12px] transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-amber-700" />
                <span>Tambah Agenda Sidang Baru</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Agenda List View */
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 flex items-center justify-between">
            <span className="font-bold text-[15px] text-slate-900">
              Semua Jadwal &amp; Agenda Sidang Terdaftar
            </span>
            <span className="text-[12px] text-slate-500">
              {allFilteredMeetings.length} Rapat Ditemukan
            </span>
          </div>

          <div className="divide-y divide-amber-100/80">
            {allFilteredMeetings.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-medium text-slate-600 text-[14px]">
                  Tidak ada agenda rapat yang sesuai kriteria filter.
                </p>
              </div>
            ) : (
              allFilteredMeetings.map((m) => {
                const statusCfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.DRAFT;

                return (
                  <div
                    key={m.id}
                    className="p-5 hover:bg-amber-50/30 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Date Badge */}
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200/80 border border-amber-300 text-amber-900 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Rapat
                        </span>
                        <span className="text-[16px] font-extrabold leading-none mt-0.5">
                          {m.code.split('-')[1] || m.code}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-[12px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                            {m.code}
                          </span>
                          <span
                            className={cn(
                              'text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border',
                              statusCfg.badge
                            )}
                          >
                            {statusCfg.label}
                          </span>
                          <span className="text-[12px] text-slate-500 font-medium">
                            {m.date}
                          </span>
                        </div>

                        <h3 className="font-bold text-[15px] text-slate-900 group-hover:text-amber-800 transition-colors">
                          {m.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-500">
                          <span className="flex items-center gap-1 font-semibold text-amber-900">
                            <Building2 className="w-3.5 h-3.5 text-amber-600" />
                            <span>{m.biroName}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>{m.time}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-600" />
                            <span>{m.location}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <Link
                        href={`/semua-rapat/${m.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[12.5px] transition-all shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Buka Risalah</span>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
