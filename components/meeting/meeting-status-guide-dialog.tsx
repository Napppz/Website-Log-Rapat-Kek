'use client';

import React from 'react';
import {
  X,
  HelpCircle,
  FileEdit,
  Clock3,
  CheckCircle2,
  Award,
  ArrowRight,
  ShieldCheck,
  Info,
  Check,
} from 'lucide-react';
import { MEETING_STATUS_DETAILS, MEETING_STATUS_ORDER } from '@/lib/meeting-status';
import { cn } from '@/lib/utils';

interface MeetingStatusGuideDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_ICONS = {
  DRAFT: FileEdit,
  REVIEW: Clock3,
  APPROVED: CheckCircle2,
  FINAL: Award,
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
                Panduan Alur Status Risalah Rapat
              </h3>
              <p className="text-[12px] text-slate-500">
                Siklus 4 tahap perumusan notula resmi di lingkungan Sekretariat Dewan Nasional KEK
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
          {/* Highlight Card: Perbedaan Utama "Disetujui" vs "Final" */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/70 via-sky-50/40 to-emerald-50/60 border border-blue-200 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-[14px] text-slate-900">
                  💡 Apa Perbedaan Antara Status &ldquo;Disetujui&rdquo; dan &ldquo;Final&rdquo;?
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12.5px] pt-1">
                  <div className="p-3 rounded-lg bg-white/90 border border-blue-200 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#0369A1] mb-1">
                      <span className="w-5 h-5 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[11px]">3</span>
                      <span>Disetujui (Validasi Pimpinan)</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11.5px]">
                      <strong>Materi risalah sudah tuntas disepakati</strong> dan disetujui secara substansi oleh Pimpinan Sidang / Sekretaris KEK, namun naskah fisik/elektronik masih dalam proses penomoran dinas atau persiapan tanda tangan resmi.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white/90 border border-emerald-200 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#15803D] mb-1">
                      <span className="w-5 h-5 rounded-full bg-[#DCFCE7] flex items-center justify-center text-[11px]">4</span>
                      <span>Final (Disahkan &amp; Diterbitkan)</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11.5px]">
                      <strong>Naskah risalah telah sah dan berkekuatan hukum tetap</strong>. Sudah ditandatangani, resmi diterbitkan ke kementerian/lembaga mitra, dan butir-butir tindak lanjutnya wajib dieksekusi oleh Biro PIC.
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
              <span>Linimasa 4 Tahapan Siklus Hidup Risalah</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {MEETING_STATUS_ORDER.map((key) => {
                const item = MEETING_STATUS_DETAILS[key];
                const IconComponent = STATUS_ICONS[key];

                return (
                  <div
                    key={key}
                    className={cn(
                      'p-3.5 rounded-xl border flex flex-col justify-between transition-all relative overflow-hidden',
                      item.colorClass.bg,
                      item.colorClass.border
                    )}
                  >
                    <div>
                      {/* Step Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shadow-2xs',
                            item.colorClass.activeStep
                          )}
                        >
                          {item.step}
                        </span>
                        <div
                          className={cn(
                            'p-1 rounded-md text-slate-600',
                            item.colorClass.bg
                          )}
                        >
                          <IconComponent className="w-4 h-4 text-current" />
                        </div>
                      </div>

                      <h5 className="font-bold text-[14px] text-slate-900 leading-tight">
                        {item.label}
                      </h5>
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                        {item.sublabel}
                      </span>
                      <p className="text-[11.5px] text-slate-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[10.5px]">
                      <span className="font-bold text-slate-700 block">Kapan digunakan:</span>
                      <span className="text-slate-500 leading-normal">{item.whenToUse}</span>
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
                <strong>Hak Mengubah Status:</strong> Hanya <strong>Super Admin</strong>, <strong>Administrator</strong>, dan <strong>Notulis Sidang</strong> yang dapat memajukan tahapan risalah rapat.
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
