'use client';

import React from 'react';
import { CheckCircle, AlertTriangle, Clock, Info } from 'lucide-react';
import { toast } from '@/components/providers/toast-provider';

export default function NotifikasiPage() {
  const notifs = [
    {
      id: 1,
      title: 'Risalah Rapat Koordinasi INV-001 Telah Disetujui',
      time: '10 menit yang lalu',
      desc: 'Risalah rapat koordinasi investasi KEK Sei Mangkei telah diverifikasi oleh Sekretariat Jenderal.',
      type: 'success',
    },
    {
      id: 2,
      title: 'Peringatan: 2 Tindak Lanjut KEK Bitung Terlambat',
      time: '1 jam yang lalu',
      desc: 'Butuh eskalasi dewan nasional untuk percepatan akses pelabuhan internasional KEK Bitung.',
      type: 'danger',
    },
    {
      id: 3,
      title: 'Agenda Rapat Baru Ditambahkan: INV-002',
      time: 'Kemarin, 14:00 WIB',
      desc: 'Evaluasi perkembangan investor Galang Batang telah dijadwalkan oleh Biro Investasi.',
      type: 'info',
    },
    {
      id: 4,
      title: 'Tindak Lanjut Mendekati Batas Waktu',
      time: '2 hari lalu',
      desc: 'Penyusunan usulan pagu indikatif program dewan KEK TA 2027 jatuh tempo dalam 5 hari.',
      type: 'warning',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="p-6 bg-white rounded-xl border border-amber-200 shadow-sm flex items-center justify-between">
        <div>
          <span className="font-semibold text-[12px] text-amber-700 uppercase tracking-wider">
            Pusat Pemberitahuan
          </span>
          <h1 className="text-[24px] font-bold text-slate-900 mt-0.5">Notifikasi Sistem</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Riwayat pembaruan status rapat, approval risalah, dan eskalasi tindak lanjut.
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.success('Semua notifikasi telah ditandai dibaca.')}
          className="px-3.5 py-1.5 rounded-lg border border-amber-200 bg-white hover:bg-amber-50 text-slate-700 text-[12px] font-semibold transition-colors cursor-pointer"
        >
          Tandai Semua Dibaca
        </button>
      </div>

      <div className="bg-white rounded-xl border border-amber-200 shadow-sm divide-y divide-amber-100 overflow-hidden">
        {notifs.map((n) => (
          <div key={n.id} className="p-5 hover:bg-amber-50/30 transition-colors flex items-start gap-4">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                n.type === 'danger'
                  ? 'bg-red-100 text-red-600'
                  : n.type === 'success'
                  ? 'bg-emerald-100 text-emerald-600'
                  : n.type === 'warning'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-blue-100 text-blue-600'
              }`}
            >
              {n.type === 'danger' && <AlertTriangle className="w-5 h-5" />}
              {n.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {n.type === 'warning' && <Clock className="w-5 h-5" />}
              {n.type === 'info' && <Info className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-[14px] text-slate-900">{n.title}</h4>
                <span className="text-[11px] text-slate-400 font-medium shrink-0">{n.time}</span>
              </div>
              <p className="text-[13px] text-slate-600 mt-1">{n.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
