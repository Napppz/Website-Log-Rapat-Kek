'use client';

import React from 'react';
import {
  X,
  HelpCircle,
  PlayCircle,
  Hourglass,
  CheckCircle,
  ShieldCheck,
  Info,
  Check,
  ArrowRight,
} from 'lucide-react';
import {
  PROGRESS_STATUS_DETAILS,
  PROGRESS_STATUS_ORDER,
  MeetingProgressStatus,
} from '@/lib/meeting-status';
import { cn } from '@/lib/utils';

interface MeetingStatusGuideDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROGRESS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Belum Dimulai': PlayCircle,
  'Dalam Proses': Hourglass,
  Selesai: CheckCircle,
};

export function MeetingStatusGuideDialog({ isOpen, onClose }: MeetingStatusGuideDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#F0F9FA] via-white to-[#F0F9FA] border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#31889C] text-white flex items-center justify-center shadow-xs">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[16px] text-slate-900">
                Panduan Alur Status Kegiatan
              </h3>
              <p className="text-[12px] text-slate-500">
                Siklus 3 tahapan progres pengelolaan kegiatan di lingkungan Sekretariat Dewan Nasional KEK
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Tutup Panduan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-[13px]">
          {/* Highlight Card: Alur 3 Tahap */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50/70 via-sky-50/50 to-emerald-50/60 border border-teal-200 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-[#31889C]/10 text-[#31889C] shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-[14px] text-slate-900">
                  💡 Alur 3 Tahapan Progres Kegiatan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12.5px] pt-1">
                  <div className="p-3 rounded-lg bg-white/95 border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
                      <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-extrabold text-slate-800">1</span>
                      <span>Belum Dimulai</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11.5px]">
                      Kegiatan telah dijadwalkan dalam kalender agenda, surat undangan dan bahan paparan dalam tahap persiapan awal.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white/95 border border-sky-200 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#0369A1] mb-1">
                      <span className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center text-[11px] font-extrabold text-[#0369A1]">2</span>
                      <span>Dalam Proses</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11.5px]">
                      Kegiatan sedang diselenggarakan atau materi risalah sedang disusun bersama notulis dan tim perumus.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white/95 border border-emerald-200 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#15803D] mb-1">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[11px] font-extrabold text-[#15803D]">3</span>
                      <span>Selesai</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11.5px]">
                      Kegiatan telah selesai, naskah risalah resmi disahkan oleh Pimpinan, dan komitmen tindak lanjut siap dieksekusi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stepper Diagram Visual */}
          <div>
            <h4 className="font-bold text-[13px] text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#31889C]" />
              <span>Linimasa 3 Tahapan Status Kegiatan</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {PROGRESS_STATUS_ORDER.map((key) => {
                const item = PROGRESS_STATUS_DETAILS[key];
                const IconComponent = PROGRESS_ICONS[key] || PlayCircle;

                return (
                  <div
                    key={key}
                    className={cn(
                      'p-4 rounded-xl border flex flex-col justify-between transition-all relative overflow-hidden bg-white shadow-2xs hover:shadow-xs',
                      key === 'Belum Dimulai' && 'border-slate-300 hover:border-slate-400',
                      key === 'Dalam Proses' && 'border-sky-300 bg-sky-50/20 hover:border-sky-400',
                      key === 'Selesai' && 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-400'
                    )}
                  >
                    <div>
                      {/* Step Badge */}
                      <div className="flex items-center justify-between mb-2.5">
                        <span
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shadow-2xs text-white',
                            key === 'Belum Dimulai' && 'bg-slate-600',
                            key === 'Dalam Proses' && 'bg-sky-600',
                            key === 'Selesai' && 'bg-emerald-600'
                          )}
                        >
                          {item.step}
                        </span>
                        <div
                          className={cn(
                            'p-1.5 rounded-lg',
                            key === 'Belum Dimulai' && 'bg-slate-100 text-slate-600',
                            key === 'Dalam Proses' && 'bg-sky-100 text-sky-700',
                            key === 'Selesai' && 'bg-emerald-100 text-emerald-700'
                          )}
                        >
                          <IconComponent className="w-4 h-4 text-current" />
                        </div>
                      </div>

                      <h5 className="font-bold text-[14.5px] text-slate-900 leading-tight">
                        {item.label}
                      </h5>
                      <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                        {item.subtitle}
                      </span>
                      <p className="text-[11.5px] text-slate-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-slate-100 text-[11px]">
                      <span className="font-bold text-slate-700 block mb-0.5">Fokus Tahap:</span>
                      <span className="text-slate-500 leading-normal">{item.tagline}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Role Access Information */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[12px] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#31889C]" />
              <span className="text-slate-600">
                <strong>Hak Mengubah Status:</strong> Hanya <strong>Super Admin</strong>, <strong>Administrator</strong>, <strong>Pimpinan</strong>, dan <strong>Notulis Kegiatan</strong> yang dapat memajukan tahapan status kegiatan.
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#31889C] text-white hover:bg-[#266F80] font-semibold text-[12px] transition-colors cursor-pointer shadow-xs ml-auto"
            >
              Mengerti &amp; Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
