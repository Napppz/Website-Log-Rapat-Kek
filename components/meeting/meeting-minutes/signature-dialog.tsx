'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  PenTool,
  X,
  RotateCcw,
  Check,
  FileImage,
  Trash2,
  AlertCircle,
} from 'lucide-react';

interface SignatureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
  currentSignature?: string | null;
}

export function SignatureDialog({
  isOpen,
  onClose,
  onSave,
  currentSignature,
}: SignatureDialogProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'draw'>('upload');

  // Upload tab state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Draw tab state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize or reset state when opened
  useEffect(() => {
    if (isOpen) {
      if (currentSignature) {
        setUploadedImage(currentSignature);
      } else {
        setUploadedImage(null);
      }
      setUploadError(null);
      setHasDrawn(false);
      // Default to upload tab or keep previous tab
    }
  }, [isOpen, currentSignature]);

  // Setup canvas resolution and styling when canvas or tab changes
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0F172A'; // Dark slate ink
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'draw') {
      // Allow DOM to paint canvas container then init
      const t = setTimeout(() => {
        initCanvas();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [isOpen, activeTab, initCanvas]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // TAB 1: FILE UPLOAD HANDLERS
  // -------------------------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Berkas yang dipilih harus berupa gambar (PNG, JPG, atau WEBP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setUploadError('Ukuran berkas melebihi batas maksimal 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setUploadError(null);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Berkas yang diunggah harus berupa gambar.');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setUploadError('Ukuran berkas melebihi batas maksimal 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedImage(result);
    };
    reader.readAsDataURL(file);
  };

  // -------------------------------------------------------------
  // TAB 2: CANVAS DRAWING HANDLERS
  // -------------------------------------------------------------
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
    }
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    initCanvas();
  };

  // -------------------------------------------------------------
  // SUBMIT HANDLER
  // -------------------------------------------------------------
  const handleApplySignature = () => {
    if (activeTab === 'upload') {
      if (uploadedImage) {
        onSave(uploadedImage);
        onClose();
      }
    } else {
      const canvas = canvasRef.current;
      if (canvas && hasDrawn) {
        const dataUrl = canvas.toDataURL('image/png');
        onSave(dataUrl);
        onClose();
      }
    }
  };

  const canSave =
    (activeTab === 'upload' && Boolean(uploadedImage)) ||
    (activeTab === 'draw' && hasDrawn);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-[#F8FAFC]">
          <div>
            <h3 className="font-bold text-[16px] text-slate-900">
              Tanda Tangan Notulis Sidang
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Tanda tangan akan dibubuhkan pada dokumen PDF resmi dan pratinjau risalah.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[12.5px] font-semibold transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-[#31889C] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>1. Unggah Berkas TTD</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[12.5px] font-semibold transition-all cursor-pointer ${
              activeTab === 'draw'
                ? 'bg-white text-[#31889C] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>2. Gores TTD di Layar</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {activeTab === 'upload' ? (
            <div className="space-y-4">
              {uploadError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[12px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadedImage ? (
                <div className="space-y-3">
                  <div className="p-6 rounded-xl border border-slate-200 bg-[#F8FAFC] flex flex-col items-center justify-center min-h-[170px]">
                    <img
                      src={uploadedImage}
                      alt="Pratinjau Tanda Tangan"
                      className="max-h-24 max-w-[240px] object-contain drop-shadow-xs"
                    />
                    <span className="text-[11px] text-slate-400 font-medium mt-3">
                      Pratinjau Berkas Tanda Tangan
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setUploadedImage(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[12px] font-semibold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Gambar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-semibold transition-colors cursor-pointer"
                    >
                      <FileImage className="w-3.5 h-3.5 text-[#31889C]" />
                      <span>Pilih Gambar Lain</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#BCE3EB] hover:border-[#31889C] bg-[#F0F9FA]/40 hover:bg-[#F0F9FA] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-2.5 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-[#BCE3EB] text-[#31889C] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-bold text-slate-800">
                      Klik atau seret file tanda tangan ke sini
                    </p>
                    <p className="text-[11.5px] text-slate-500 mt-0.5">
                      Format: PNG (disarankan latar transparan) atau JPG. Maks 3MB.
                    </p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11.5px] text-slate-600 leading-relaxed">
                💡 <strong>Tips Dokumen Resmi:</strong> Gunakan gambar tanda tangan dengan format <strong>PNG berlatar belakang transparan</strong> agar menyatu rapi dengan teks notulen dan naskah dinas.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-semibold text-slate-700">
                  Goreskan tanda tangan di dalam kotak berikut:
                </span>
                <button
                  type="button"
                  onClick={handleClearCanvas}
                  className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Bersihkan</span>
                </button>
              </div>

              {/* Drawing Area */}
              <div className="relative border-2 border-slate-300 rounded-xl overflow-hidden bg-white shadow-inner">
                <canvas
                  ref={canvasRef}
                  style={{ touchAction: 'none' }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  className="w-full h-[180px] cursor-crosshair block"
                />

                {/* Subtle signature guideline */}
                <div className="absolute left-6 right-6 bottom-8 border-b border-dashed border-slate-200 pointer-events-none" />

                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-[12px] font-medium italic">
                    Gunakan mouse, trackpad, atau sentuhan stylus untuk menandatangani
                  </div>
                )}
              </div>

              <p className="text-[11.5px] text-slate-500">
                Goresan garis otomatis dikonversi menjadi gambar beresolusi tinggi dengan tinta gelap formal.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-[#F8FAFC] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[12.5px] transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={!canSave}
            onClick={handleApplySignature}
            className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[12.5px] transition-all shadow-xs shadow-[#31889C]/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Gunakan Tanda Tangan Ini</span>
          </button>
        </div>
      </div>
    </div>
  );
}
