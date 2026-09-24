'use client';

import React, { useState } from 'react';
import { User, Bell, Save } from 'lucide-react';
import { BIRO_LIST } from '@/lib/mock-data';

export default function PengaturanPage() {
  const [userName, setUserName] = useState('Dr. Hendra Suprayitno, M.Si');
  const [email, setEmail] = useState('hendra.suprayitno@kek.go.id');
  const role = 'SUPER ADMIN';
  const [biroCode, setBiroCode] = useState('INV');
  const [emailNotif, setEmailNotif] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => {
      alert('Pengaturan profil dan sistem berhasil disimpan (Simulasi Mock).');
      setSaved(false);
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="p-6 bg-white rounded-xl border border-amber-200 shadow-sm">
        <span className="font-semibold text-[12px] text-amber-700 uppercase tracking-wider">
          Konfigurasi
        </span>
        <h1 className="text-[24px] font-bold text-slate-900 mt-0.5">Pengaturan Akun &amp; Sistem</h1>
        <p className="text-[13px] text-slate-500 mt-1">
          Kelola profil pengguna, preferensi pemberitahuan, dan unit kerja biro.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-amber-200 shadow-sm p-6 space-y-6 text-[13px]">
        {/* User Information */}
        <div>
          <h3 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-amber-600" />
            Informasi Profil Pejabat
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap &amp; Gelar</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alamat Email Dinas</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Peran / Hak Akses</label>
              <input
                type="text"
                disabled
                value={role}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Penugasan Biro</label>
              <select
                value={biroCode}
                onChange={(e) => setBiroCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                {BIRO_LIST.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.code} — {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notifications Preference */}
        <div className="pt-4 border-t border-amber-100">
          <h3 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600" />
            Preferensi Notifikasi
          </h3>
          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50/50 border border-amber-200">
            <div>
              <div className="font-semibold text-slate-800">Pemberitahuan Email Otomatis</div>
              <div className="text-[12px] text-slate-500">Kirim email saat ada notulen rapat baru atau eskalasi terlambat</div>
            </div>
            <input
              type="checkbox"
              checked={emailNotif}
              onChange={(e) => setEmailNotif(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-amber-100 flex justify-end">
          <button
            type="submit"
            disabled={saved}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-all shadow-md shadow-amber-600/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saved ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
