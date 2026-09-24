'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Building2, Plus, ArrowLeft, Shield, Users, CheckCircle } from 'lucide-react';
import { BIRO_LIST } from '@/lib/mock-data';
import { BiroCode } from '@/lib/types';
import Link from 'next/link';

export default function BuatRapatPage() {
  const router = useRouter();
  const [selectedBiro, setSelectedBiro] = useState<BiroCode>('IKK');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-09-25');
  const [time, setTime] = useState('09:00 - 12:00 WIB');
  const [location, setLocation] = useState('Ruang Rapat Utama Gedung Posko KEK & Hybrid Zoom');
  const [classification, setClassification] = useState('STRATEGIS');
  const [attendees, setAttendees] = useState('Biro Terkait, Tim Sekretariat Jenderal, Perwakilan Kawasan');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    try {
      const { createMeetingAction } = await import('@/app/actions/meeting-actions');
      const parts = time.split('-').map((s) => s.trim().replace('WIB', '').trim());
      const startTime = parts[0] || '09:00';
      const endTime = parts[1] || '12:00';

      const res = await createMeetingAction({
        title,
        biroCode: selectedBiro,
        date,
        startTime,
        endTime,
        location,
      });

      if (res.success && res.data) {
        alert(`Rapat "${title}" berhasil dijadwalkan dengan nomor resmi: ${res.data.meetingNumber}`);
        router.refresh();
        window.location.href = '/semua-rapat';
      } else {
        alert(res.error || 'Gagal membuat rapat');
        setIsSubmitted(false);
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err?.message || 'Gagal menyimpan rapat'}`);
      setIsSubmitted(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header & Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/semua-rapat"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-amber-800 text-[13px] font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Semua Rapat</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="p-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-700/60 text-amber-100 text-[11px] font-bold uppercase tracking-wider mb-1">
            Formulir Penjadwalan
          </span>
          <h1 className="text-[22px] font-bold">Jadwalkan Rapat Baru KEK RI</h1>
          <p className="text-amber-100 text-[13px] mt-1">
            Inputkan rincian agenda, biro pelaksana, dan daftar undangan rapat koordinasi resmi.
          </p>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-[13px]">
          {/* Biro Penyelenggara */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-600" />
                Biro Penyelenggara <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedBiro}
                onChange={(e) => setSelectedBiro(e.target.value as BiroCode)}
                className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {BIRO_LIST.map((biro) => (
                  <option key={biro.code} value={biro.code}>
                    {biro.code} — {biro.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-600" />
                Sifat Pertemuan
              </label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="STRATEGIS">Prioritas Strategis Nasional</option>
                <option value="REGULER">Koordinasi Berkala (Reguler)</option>
                <option value="DARURAT">Eskalasi Mendesak</option>
              </select>
            </div>
          </div>

          {/* Agenda / Judul */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Agenda &amp; Topik Pembahasan <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Rapat Koordinasi Fasilitasi Investasi Lintas Sektor Kawasan Industri KEK Sei Mangkei..."
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Tanggal & Waktu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                Tanggal Pelaksanaan <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                Waktu Pelaksanaan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="Contoh: 09:00 - 12:00 WIB"
                className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Lokasi */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-600" />
              Lokasi / Media Pertemuan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ruang Rapat Utama Gedung Posko KEK & Zoom..."
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Peserta */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-600" />
              Peserta &amp; Pemangku Kepentingan
            </label>
            <input
              type="text"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="Pisahkan dengan tanda koma..."
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-amber-100 flex items-center justify-end gap-3">
            <Link
              href="/semua-rapat"
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition-colors"
            >
              Batal
            </Link>

            <button
              type="submit"
              disabled={isSubmitted}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-all shadow-md shadow-amber-600/20 cursor-pointer disabled:opacity-50"
            >
              {isSubmitted ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Menyimpan Rapat...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Simpan &amp; Jadwalkan Rapat</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
