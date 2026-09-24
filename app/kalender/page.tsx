'use client';

import React from 'react';
import { Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { MOCK_MEETINGS } from '@/lib/mock-data';

export default function KalenderPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="p-6 bg-white rounded-xl border border-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="font-semibold text-[12px] text-amber-700 uppercase tracking-wider">
            Jadwal &amp; Agenda
          </span>
          <h1 className="text-[24px] font-bold text-slate-900 mt-0.5">Kalender Rapat KEK RI</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Penjadwalan rapat lintas biro untuk sinkronisasi kebijakan kawasan ekonomi khusus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 rounded-lg border border-amber-200 bg-white hover:bg-amber-50 text-slate-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-[14px] text-slate-800 px-3 py-1 bg-amber-50 rounded-lg border border-amber-200">
            September 2026
          </span>
          <button
            type="button"
            className="p-2 rounded-lg border border-amber-200 bg-white hover:bg-amber-50 text-slate-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar List View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_MEETINGS.map((m) => (
          <div
            key={m.id}
            className="p-5 bg-white rounded-xl border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[12px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  {m.code}
                </span>
                <span className="text-[12px] font-bold text-slate-500">{m.date}</span>
              </div>
              <h3 className="font-bold text-[15px] text-slate-900 mb-2 line-clamp-2">
                {m.title}
              </h3>
              <div className="space-y-1.5 text-[12px] text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{m.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="line-clamp-1">{m.location}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between text-[12px]">
              <span className="font-semibold text-amber-900">{m.biroName}</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {m.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
