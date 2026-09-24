'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  FileX,
  Filter,
  Hourglass,
  Layers,
  ListTodo,
  Loader2,
  Percent,
  RotateCcw,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { TrendChart } from '@/components/report/trend-chart';
import { StatusDonutChart } from '@/components/report/status-donut-chart';
import { ReportSummaryResult } from '@/lib/report/report-service';
import { ReportPeriod, ReportBiro } from '@/lib/validations/report';

export function LaporanClient() {
  const [period, setPeriod] = useState<ReportPeriod>('MONTH');
  const [biro, setBiro] = useState<ReportBiro>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<ReportSummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [excelLoading, setExcelLoading] = useState<boolean>(false);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('period', period);
      params.set('biro', biro);
      if (period === 'CUSTOM') {
        if (!startDate || !endDate) {
          setLoading(false);
          return;
        }
        params.set('startDate', startDate);
        params.set('endDate', endDate);
      }

      const res = await fetch(`/api/reports/summary?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }

      const data: ReportSummaryResult = await res.json();
      setSummary(data);
    } catch (err: any) {
      console.error('Error loading report:', err);
      setError(err?.message || 'Gagal memuat ringkasan laporan');
    } finally {
      setLoading(false);
    }
  }, [period, biro, startDate, endDate]);

  useEffect(() => {
    // If CUSTOM and dates not filled yet, default to last 30 days
    if (period === 'CUSTOM' && (!startDate || !endDate)) {
      const now = new Date();
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sIso = past30.toISOString().slice(0, 10);
      const eIso = now.toISOString().slice(0, 10);
      setStartDate(sIso);
      setEndDate(eIso);
      return;
    }
    fetchReport();
  }, [fetchReport, period]);

  // Handle PDF export
  const handleExportPdf = async () => {
    try {
      setPdfLoading(true);
      const params = new URLSearchParams();
      params.set('period', period);
      params.set('biro', biro);
      if (period === 'CUSTOM' && startDate && endDate) {
        params.set('startDate', startDate);
        params.set('endDate', endDate);
      }

      const url = `/api/reports/summary/pdf?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal mengunduh dokumen PDF');
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `Laporan-Berkala-${period}.pdf`;

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(`Gagal export PDF: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setPdfLoading(false);
    }
  };

  // Handle Excel export
  const handleExportExcel = async () => {
    try {
      setExcelLoading(true);
      const params = new URLSearchParams();
      params.set('period', period);
      params.set('biro', biro);
      if (period === 'CUSTOM' && startDate && endDate) {
        params.set('startDate', startDate);
        params.set('endDate', endDate);
      }

      const url = `/api/reports/summary/excel?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal mengunduh dokumen Excel');
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `Laporan-Berkala-${period}.xlsx`;

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(`Gagal export Excel: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setExcelLoading(false);
    }
  };

  const handleResetFilter = () => {
    setPeriod('MONTH');
    setBiro('ALL');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── HEADER BANNER ─────────────────────────────────────────────────── */}
      <div className="p-6 bg-white rounded-xl border border-amber-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Laporan Berkala
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              SIM-RAPAT KEK RI
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Laporan Kinerja Rapat &amp; Tindak Lanjut
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitoring periodic aktivitas rapat, ketersediaan notulen, dan performa resolusi seluruh Biro.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={pdfLoading || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-600 text-white font-semibold text-xs hover:bg-red-700 shadow-sm disabled:opacity-50 transition-colors"
          >
            {pdfLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>Export PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={excelLoading || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm disabled:opacity-50 transition-colors"
          >
            {excelLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* ── FILTER TOOLBAR ────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Period Tabs & Biro Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setPeriod('WEEK')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                period === 'WEEK'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Minggu Ini
            </button>
            <button
              type="button"
              onClick={() => setPeriod('MONTH')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                period === 'MONTH'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => setPeriod('QUARTER')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                period === 'QUARTER'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kuartal Ini
            </button>
            <button
              type="button"
              onClick={() => setPeriod('CUSTOM')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                period === 'CUSTOM'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kustom
            </button>
          </div>

          {/* Biro Select */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={biro}
              onChange={(e) => setBiro(e.target.value as ReportBiro)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Semua Biro</option>
              <option value="BPPK">BPPK — Perencanaan &amp; Pembentukan</option>
              <option value="PKKEK">PKKEK — Pengendalian</option>
              <option value="IKK">IKK — Investasi, Kerja Sama &amp; Komunikasi</option>
              <option value="HSDMO">HSDMO — Hukum, SDM &amp; Organisasi</option>
              <option value="UK">UK — Umum &amp; Keuangan</option>
            </select>
          </div>
        </div>

        {/* Right: Custom Date Range (if active) & Reset */}
        <div className="flex flex-wrap items-center gap-2.5">
          {period === 'CUSTOM' && (
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-700"
              />
              <span className="text-xs text-slate-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-700"
              />
              <button
                type="button"
                onClick={fetchReport}
                className="px-2.5 py-1 text-xs font-semibold bg-amber-600 text-white rounded hover:bg-amber-700"
              >
                Terapkan
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleResetFilter}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ── ACTIVE FILTER SUMMARY LABEL ───────────────────────────────────── */}
      {summary && (
        <div className="flex items-center justify-between px-4 py-2 bg-amber-50/70 border border-amber-200/60 rounded-lg text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="font-bold">Periode Aktif:</span>
            <span>{summary.period.label}</span>
            <span className="text-amber-400">•</span>
            <span className="font-bold">Filter Biro:</span>
            <span>
              {summary.biro === 'ALL'
                ? 'Semua Biro (5 Biro Resmi)'
                : summary.biro}
            </span>
          </div>
          {summary.kpi.totalMeetings === 0 && (
            <span className="text-amber-700 font-semibold italic">
              Tidak ada data rapat pada periode yang dipilih.
            </span>
          )}
        </div>
      )}

      {/* ── ERROR ALERT ───────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── SKELETON LOADING ──────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="p-5 bg-white rounded-xl border border-slate-200 animate-pulse h-28"
            />
          ))}
        </div>
      )}

      {/* ── 9 KPI CARDS ───────────────────────────────────────────────────── */}
      {!loading && summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* KPI 1: Total Rapat */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Rapat
                </span>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {summary.kpi.totalMeetings}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Aktivitas rapat dalam periode
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 2: Total Action Items */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Tindak Lanjut
                </span>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {summary.kpi.totalActionItems}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Terkait rapat periode terpilih
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <ListTodo className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 7: Completion Rate */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tingkat Penyelesaian
                </span>
                <div className="text-2xl font-bold text-emerald-600 mt-1">
                  {summary.kpi.completionRate}%
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Persentase tindak lanjut selesai
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Percent className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 3: Tindak Lanjut Selesai */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tindak Lanjut Selesai
                </span>
                <div className="text-2xl font-bold text-emerald-600 mt-1">
                  {summary.kpi.completedActionItems}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Status COMPLETED
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 4: Tindak Lanjut Berjalan */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tindak Lanjut Berjalan
                </span>
                <div className="text-2xl font-bold text-amber-600 mt-1">
                  {summary.kpi.inProgressActionItems}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Status IN_PROGRESS
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 5: Tindak Lanjut Menunggu */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tindak Lanjut Menunggu
                </span>
                <div className="text-2xl font-bold text-slate-700 mt-1">
                  {summary.kpi.pendingActionItems}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Status PENDING
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
                <Hourglass className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 6: Tindak Lanjut Terlambat */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tindak Lanjut Terlambat
                </span>
                <div className="text-2xl font-bold text-red-600 mt-1">
                  {summary.kpi.overdueActionItems}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Status OVERDUE (lewat deadline)
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 8: Rapat dengan Notulen */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Rapat Ada Notulen
                </span>
                <div className="text-2xl font-bold text-sky-700 mt-1">
                  {summary.kpi.meetingsWithMinutes}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {summary.kpi.minutesCompletionRate}% dari total rapat
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 9: Rapat tanpa Notulen */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Rapat Tanpa Notulen
                </span>
                <div className="text-2xl font-bold text-purple-700 mt-1">
                  {summary.kpi.meetingsWithoutMinutes}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Belum disusun notulis
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                <FileX className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* ── CHARTS SECTION ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Trend Chart (7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-bold text-slate-900 text-base">
                    Tren Aktivitas Rapat &amp; Tindak Lanjut
                  </h2>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {summary.period.period}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Visualisasi rapat, tindak lanjut selesai, dan keterlambatan per bagian periode.
                </p>
              </div>
              <TrendChart data={summary.trend} />
            </div>

            {/* Donut Chart (5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-bold text-slate-900 text-base">
                    Distribusi Status Tindak Lanjut
                  </h2>
                  <span className="text-xs text-slate-400">
                    {summary.kpi.totalActionItems} Butir
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Proporsi penyelesaian dari seluruh tindak lanjut pada periode ini.
                </p>
              </div>
              <StatusDonutChart kpi={summary.kpi} />
            </div>
          </div>

          {/* ── REKAPITULASI PER BIRO (5 BIRO RESMI) ─────────────────────────── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="font-bold text-slate-900 text-base">
                  Rekapitulasi Kinerja per Biro
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Statistik 5 Biro resmi Sekretariat Dewan Nasional KEK RI.
                </p>
              </div>
              <span className="text-xs font-medium text-slate-400">
                5 Biro Resmi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Biro</th>
                    <th className="py-3 px-3 text-center">Rapat</th>
                    <th className="py-3 px-3 text-center">Tindak Lanjut</th>
                    <th className="py-3 px-3 text-center">Selesai</th>
                    <th className="py-3 px-3 text-center">Berjalan</th>
                    <th className="py-3 px-3 text-center">Menunggu</th>
                    <th className="py-3 px-3 text-center">Terlambat</th>
                    <th className="py-3 px-4 text-center">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {summary.biroSummary.map((b) => (
                    <tr
                      key={b.code}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex flex-col">
                          <span>{b.code}</span>
                          <span className="text-[11px] font-normal text-slate-500">
                            {b.shortName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-medium">
                        {b.totalMeetings}
                      </td>
                      <td className="py-3 px-3 text-center font-medium">
                        {b.totalActionItems}
                      </td>
                      <td className="py-3 px-3 text-center text-emerald-600 font-semibold">
                        {b.completed}
                      </td>
                      <td className="py-3 px-3 text-center text-amber-600 font-semibold">
                        {b.inProgress}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500">
                        {b.pending}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {b.overdue > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 font-bold border border-red-200">
                            {b.overdue}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${b.completionRate}%` }}
                            />
                          </div>
                          <span>{b.completionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-amber-50/80 border-t-2 border-amber-200 text-amber-900 font-bold">
                  <tr>
                    <td className="py-3 px-4">TOTAL</td>
                    <td className="py-3 px-3 text-center">
                      {summary.biroTotalRow.totalMeetings}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {summary.biroTotalRow.totalActionItems}
                    </td>
                    <td className="py-3 px-3 text-center text-emerald-700">
                      {summary.biroTotalRow.completed}
                    </td>
                    <td className="py-3 px-3 text-center text-amber-700">
                      {summary.biroTotalRow.inProgress}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {summary.biroTotalRow.pending}
                    </td>
                    <td className="py-3 px-3 text-center text-red-700">
                      {summary.biroTotalRow.overdue}
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-800">
                      {summary.biroTotalRow.completionRate}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ── DAFTAR RAPAT & STATUS NOTULEN ─────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="font-bold text-slate-900 text-base">
                  Daftar Rapat &amp; Ketersediaan Notulen
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rincian notulen dan progres resolusi untuk setiap rapat dalam periode.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {summary.meetings.length} Rapat
              </span>
            </div>

            {summary.meetings.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada data rapat pada periode yang dipilih.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4">Nomor Rapat</th>
                      <th className="py-3 px-4">Judul Rapat</th>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-3 text-center">Biro</th>
                      <th className="py-3 px-3 text-center">Status Notulen</th>
                      <th className="py-3 px-4 text-center">Tindak Lanjut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {summary.meetings.map((m, idx) => (
                      <tr
                        key={m.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-3 px-4 text-center text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {m.meetingNumber}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">
                          {m.title}
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {m.formattedDate}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-amber-700">
                          {m.biroCode}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {m.hasMinutes ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Tersedia
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                              <FileX className="w-3 h-3" />
                              Belum tersedia
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600">
                          {m.totalActionItems > 0 ? (
                            <span className="font-medium">
                              {m.completedActionItems} / {m.totalActionItems} Selesai
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">0 item</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
