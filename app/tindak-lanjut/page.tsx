'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertTriangle, Clock, CheckCircle2, Filter, Search, RotateCcw } from 'lucide-react';
import { MOCK_FOLLOW_UP_STATUS } from '@/lib/mock-data';

interface FollowUpItem {
  id: string;
  meetingCode: string;
  taskTitle: string;
  picBiro: string;
  targetDate: string;
  status: 'selesai' | 'sedang-berjalan' | 'belum-dimulai' | 'terlambat';
  priority: 'Tinggi' | 'Sedang' | 'Rendah';
}

const MOCK_TASKS: FollowUpItem[] = [
  {
    id: 'tl-1',
    meetingCode: 'INV-001',
    taskTitle: 'Penerbitan SK Insentif Tax Holiday Kawasan Industri Kendal & Sei Mangkei',
    picBiro: 'Biro Investasi (INV)',
    targetDate: '30 Sep 2026',
    status: 'sedang-berjalan',
    priority: 'Tinggi',
  },
  {
    id: 'tl-2',
    meetingCode: 'INV-001',
    taskTitle: 'Finalisasi Perjanjian Kerja Sama Pasokan Gas Industri dengan PGN',
    picBiro: 'Biro Investasi (INV)',
    targetDate: '05 Okt 2026',
    status: 'sedang-berjalan',
    priority: 'Tinggi',
  },
  {
    id: 'tl-3',
    meetingCode: 'OPS-001',
    taskTitle: 'Penyelesaian Pembebasan Lahan Akses Bypass Hub Pelabuhan Bitung',
    picBiro: 'Biro Operasional (OPS)',
    targetDate: '15 Sep 2026',
    status: 'terlambat',
    priority: 'Tinggi',
  },
  {
    id: 'tl-4',
    meetingCode: 'OPS-001',
    taskTitle: 'Audit Fasilitas Shore Power Terminal Kontainer KEK Bitung',
    picBiro: 'Biro Operasional (OPS)',
    targetDate: '18 Sep 2026',
    status: 'terlambat',
    priority: 'Tinggi',
  },
  {
    id: 'tl-5',
    meetingCode: 'INV-002',
    taskTitle: 'Penerbitan Rekomendasi Teknis Ruang Laut Galang Batang ke KKP',
    picBiro: 'Biro Investasi (INV)',
    targetDate: '21 Sep 2026',
    status: 'selesai',
    priority: 'Sedang',
  },
  {
    id: 'tl-6',
    meetingCode: 'INV-002',
    taskTitle: 'Verifikasi Laporan Realisasi Investasi Kuartal 3 PT BAI',
    picBiro: 'Biro Investasi (INV)',
    targetDate: '22 Sep 2026',
    status: 'selesai',
    priority: 'Sedang',
  },
  {
    id: 'tl-7',
    meetingCode: 'ADM-001',
    taskTitle: 'Penyusunan Usulan Tambahan Anggaran Pengawasan KEK TA 2027',
    picBiro: 'Biro Administrasi (ADM)',
    targetDate: '10 Okt 2026',
    status: 'sedang-berjalan',
    priority: 'Sedang',
  },
  {
    id: 'tl-8',
    meetingCode: 'LEG-001',
    taskTitle: 'Harmonisasi Draft RPP Fasilitas Kepabeanan dan Cukai Bersama Kemenkeu',
    picBiro: 'Biro Legal (LEG)',
    targetDate: '12 Okt 2026',
    status: 'belum-dimulai',
    priority: 'Tinggi',
  },
  {
    id: 'tl-9',
    meetingCode: 'IT-001',
    taskTitle: 'Integrasi Single Sign On (SSO) Portal KEK dengan OSS RBA BKPM',
    picBiro: 'Biro TI (IT)',
    targetDate: '15 Okt 2026',
    status: 'belum-dimulai',
    priority: 'Sedang',
  },
];

function TindakLanjutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusParam = searchParams.get('status');

  const [search, setSearch] = useState('');

  const filterTabs = [
    { label: 'Semua Status (142)', value: 'ALL' },
    { label: 'Selesai (64)', value: 'selesai' },
    { label: 'Sedang Berjalan (50)', value: 'sedang-berjalan' },
    { label: 'Belum Dimulai (21)', value: 'belum-dimulai' },
    { label: 'Terlambat (7)', value: 'terlambat' },
  ];

  const handleSelectStatus = (val: string) => {
    if (val === 'ALL') {
      router.push('/tindak-lanjut');
    } else {
      router.push(`/tindak-lanjut?status=${val}`);
    }
  };

  const filteredTasks = useMemo(() => {
    return MOCK_TASKS.filter((task) => {
      if (statusParam && task.status !== statusParam) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        task.taskTitle.toLowerCase().includes(q) ||
        task.meetingCode.toLowerCase().includes(q) ||
        task.picBiro.toLowerCase().includes(q)
      );
    });
  }, [statusParam, search]);

  const getStatusBadge = (status: FollowUpItem['status']) => {
    switch (status) {
      case 'selesai':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Selesai
          </span>
        );
      case 'sedang-berjalan':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Sedang Berjalan
          </span>
        );
      case 'belum-dimulai':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-300">
            Belum Dimulai
          </span>
        );
      case 'terlambat':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-bold border border-red-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            Terlambat
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="p-6 bg-white rounded-xl border border-amber-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="font-semibold text-[12px] text-amber-700 uppercase tracking-wider">
            Matriks Disposisi
          </span>
          <h1 className="text-[24px] font-bold text-slate-900 mt-0.5">
            Monitoring &amp; Evaluasi Tindak Lanjut
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Pantau realisasi komitmen keputusan rapat dewan KEK lintas kementerian dan biro kerja.
          </p>
        </div>

        {/* Quick summary chips */}
        <div className="flex items-center gap-2">
          {MOCK_FOLLOW_UP_STATUS.map((item) => (
            <div
              key={item.label}
              className="px-3 py-1.5 rounded-lg border bg-amber-50/50 border-amber-200 text-center"
            >
              <div className="text-[10px] text-slate-500 font-semibold uppercase">{item.label}</div>
              <div className="text-[14px] font-bold text-amber-900">{item.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            Filter:
          </span>
          {filterTabs.map((tab) => {
            const isActive = tab.value === 'ALL' ? !statusParam : statusParam === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleSelectStatus(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white border border-amber-200 text-slate-700 hover:bg-amber-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari butir tugas, biro..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-amber-200 text-slate-800 text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
          />
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-amber-600 pointer-events-none" />
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-800 text-[13px]">
            <thead className="bg-amber-50/50 border-b border-amber-200/70 text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Ref. Rapat</th>
                <th className="py-3 px-4">Butir Tindak Lanjut</th>
                <th className="py-3 px-4">Biro Penanggung Jawab</th>
                <th className="py-3 px-4">Tenggat Waktu</th>
                <th className="py-3 px-4">Prioritas</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100/80">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="font-semibold text-slate-700">Tidak ada butir tindak lanjut ditemukan.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearch('');
                          router.push('/tindak-lanjut');
                        }}
                        className="inline-flex items-center gap-1 text-[12px] text-amber-800 font-semibold hover:underline"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Filter</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-amber-800">{task.meetingCode}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 max-w-md">{task.taskTitle}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[12px]">
                        {task.picBiro}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{task.targetDate}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          task.priority === 'Tinggi'
                            ? 'text-red-700 bg-red-50'
                            : 'text-amber-800 bg-amber-50'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(task.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function TindakLanjutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat matriks tindak lanjut...</div>}>
      <TindakLanjutContent />
    </Suspense>
  );
}
