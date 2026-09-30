'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Users,
  ListOrdered,
  CheckSquare,
  ArrowRight,
  X,
  FileCheck,
  FileCode,
} from 'lucide-react';
import {
  parseMeetingDocumentAction,
  directSaveUploadedMeetingAction,
} from '@/app/actions/meeting-upload-actions';
import { ExtractedMeetingData } from '@/lib/meeting-extractor';
import { toast } from '@/components/providers/toast-provider';

interface UploadMeetingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToForm?: (extractedData: ExtractedMeetingData, matchedUserIds: string[]) => void;
}

export function UploadMeetingDialog({
  isOpen,
  onClose,
  onApplyToForm,
}: UploadMeetingDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseStep, setParseStep] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [extractedResult, setExtractedResult] = useState<{
    data: ExtractedMeetingData;
    matchedUserIds: string[];
  } | null>(null);
  const [isSavingDirectly, setIsSavingDirectly] = useState(false);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (file: File) => {
    const validExtensions = ['pdf', 'docx', 'txt', 'md'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !validExtensions.includes(ext)) {
      setParseError(
        'Format berkas tidak didukung. Mohon unggah berkas berekstensi .pdf, .docx, atau .txt'
      );
      return;
    }

    setSelectedFile(file);
    setParseError(null);
    setIsParsing(true);
    setParseStep('Membaca berkas dokumen...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      setTimeout(() => {
        setParseStep('Mengekstrak agenda, keputusan & butir tindak lanjut...');
      }, 700);

      const res = await parseMeetingDocumentAction(formData);

      if (res.success && res.data) {
        setExtractedResult({
          data: res.data,
          matchedUserIds: res.data.matchedUserIds || [],
        });
        toast.success('Berkas berhasil dianalisis & notula otomatis tersusun!');
      } else {
        setParseError(res.error || 'Gagal memproses berkas dokumen.');
        toast.error(res.error || 'Gagal memproses berkas');
      }
    } catch (err: any) {
      setParseError(err?.message || 'Terjadi kesalahan sistem saat memproses berkas.');
      toast.error('Gagal membaca berkas rapat.');
    } finally {
      setIsParsing(false);
      setParseStep('');
    }
  };

  // Option 1: Apply to Form
  const handleApplyToForm = () => {
    if (!extractedResult) return;
    if (onApplyToForm) {
      onApplyToForm(extractedResult.data, extractedResult.matchedUserIds);
    }
    toast.success('Rincian rapat dan naskah berhasil dimasukkan ke formulir!');
    onClose();
  };

  // Option 2: Direct Save (One-Click)
  const handleDirectSave = async () => {
    if (!extractedResult) return;
    setIsSavingDirectly(true);

    try {
      const res = await directSaveUploadedMeetingAction({
        extracted: extractedResult.data,
        participantUserIds: extractedResult.matchedUserIds,
      });

      if (res.success && res.data) {
        toast.success(
          `Rapat "${res.data.title}" dan naskah notula resmi berhasil disimpan langsung ke sistem!`
        );
        onClose();
        router.push(`/semua-rapat/${res.data.id}`);
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal menyimpan rapat otomatis.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat menyimpan rapat.');
    } finally {
      setIsSavingDirectly(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setExtractedResult(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#1B5260] via-[#266F80] to-[#31889C] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Unggah &amp; Ekstrak Notula Rapat Otomatis</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-semibold">
                  AI &amp; Smart Parser
                </span>
              </h2>
              <p className="text-[11px] text-white/80">
                Unggah berkas dokumen (PDF, Word, atau Teks) hasil rapat offline/eksternal. Sistem otomatis mengisi dan menuliskan notula resmi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Error Message */}
          {parseError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Pemeriksaan Berkas</p>
                <p className="mt-0.5">{parseError}</p>
              </div>
              <button
                type="button"
                onClick={() => setParseError(null)}
                className="text-red-500 hover:text-red-700 text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Upload Dropzone (When not extracted yet) */}
          {!extractedResult && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
                id="meeting-file-upload-input"
              />

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                  dragActive
                    ? 'border-[#31889C] bg-[#F0F9FA] scale-[1.01]'
                    : isParsing
                    ? 'border-slate-300 bg-slate-50 cursor-wait'
                    : 'border-slate-300 hover:border-[#31889C] hover:bg-[#F9FCFC] bg-slate-50/50'
                }`}
              >
                {isParsing ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-[#E8F5F7] flex items-center justify-center text-[#31889C]">
                        <Loader2 className="w-8 h-8 animate-spin" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 animate-ping" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{parseStep}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Memproses dokumen rapat dan mengenali tata naskah dinas...
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-[#E8F5F7] text-[#31889C] flex items-center justify-center shadow-xs">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Klik atau seret berkas dokumen rapat ke sini
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Mendukung format <span className="font-semibold text-slate-700">PDF (.pdf)</span>,{' '}
                        <span className="font-semibold text-slate-700">Word (.docx)</span>, atau{' '}
                        <span className="font-semibold text-slate-700">Teks / Catatan (.txt)</span>
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-medium text-slate-600 shadow-2xs">
                      <FileCheck className="w-3.5 h-3.5 text-[#31889C]" />
                      Maksimal ukuran berkas 15 MB
                    </span>
                  </>
                )}
              </div>

              {/* Information Card */}
              <div className="p-4 bg-[#F0F9FA] rounded-xl border border-[#BCE3EB] space-y-2">
                <h4 className="text-xs font-bold text-[#215865] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#31889C]" />
                  Apa saja yang otomatis diekstrak oleh sistem?
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#31889C]" />
                    <span>Judul &amp; Topik Bahasan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#31889C]" />
                    <span>Biro Penyelenggara &amp; Sifat</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#31889C]" />
                    <span>Tanggal, Jam &amp; Lokasi Rapat</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#31889C]" />
                    <span>Daftar Peserta &amp; Pejabat Terdaftar</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#31889C]" />
                    <span>Naskah Notula (Agenda &amp; Pembahasan)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#31889C]" />
                    <span>Poin Keputusan &amp; Action Items</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Extracted Preview (When extracted successfully) */}
          {extractedResult && (
            <div className="space-y-4">
              {/* File Info & Change File Button */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold">Berkas:</span>
                  <span className="truncate max-w-[280px] font-medium text-slate-700">
                    {selectedFile?.name || 'Dokumen Rapat'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] font-bold text-slate-600 hover:text-red-600 underline transition-colors"
                >
                  Ganti Berkas
                </button>
              </div>

              {/* Extracted Meeting Summary */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 text-xs shadow-2xs">
                {/* Meta Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#E8F5F7] text-[#215865] font-bold text-[11px]">
                    Biro: {extractedResult.data.biroCode}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#31889C]" />
                    {extractedResult.data.date}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#31889C]" />
                    {extractedResult.data.startTime} - {extractedResult.data.endTime} WIB
                  </span>
                  {extractedResult.data.meetingNumber && (
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                      No: {extractedResult.data.meetingNumber}
                    </span>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Agenda / Judul Rapat
                  </label>
                  <p className="font-bold text-slate-800 text-sm mt-0.5 leading-snug">
                    {extractedResult.data.title}
                  </p>
                </div>

                {/* Location */}
                <div className="flex items-start gap-1.5 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-[#31889C] flex-shrink-0 mt-0.5" />
                  <span>{extractedResult.data.location}</span>
                </div>

                {/* Attendees */}
                <div className="flex items-start gap-1.5 text-slate-600">
                  <Users className="w-3.5 h-3.5 text-[#31889C] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700">Peserta Terdeteksi: </span>
                    <span>{extractedResult.data.attendees}</span>
                    {extractedResult.matchedUserIds.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded bg-teal-100 text-[#1B5260] font-bold text-[10px]">
                        {extractedResult.matchedUserIds.length} staf terdaftar cocok
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Items Extracted */}
                {extractedResult.data.actionItems.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <CheckSquare className="w-3.5 h-3.5 text-[#31889C]" />
                        Butir Tindak Lanjut ({extractedResult.data.actionItems.length}):
                      </span>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {extractedResult.data.actionItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px] gap-2"
                        >
                          <span className="truncate text-slate-700 font-medium">
                            {idx + 1}. {item.title}
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 text-[10px] font-bold">
                              {item.picBiroCode}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {item.dueDate}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
          >
            Batal
          </button>

          {extractedResult && (
            <div className="flex items-center gap-2">
              {onApplyToForm && (
                <button
                  type="button"
                  onClick={handleApplyToForm}
                  className="px-4 py-2 rounded-lg border border-[#31889C] text-[#31889C] hover:bg-[#31889C]/10 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Isi ke Formulir Rapat</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDirectSave}
                disabled={isSavingDirectly}
                className="px-5 py-2 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white text-xs font-bold transition-all shadow-xs shadow-[#31889C]/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSavingDirectly ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Rapat &amp; Notula...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Simpan Rapat &amp; Notula Langsung</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
