'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  FileSpreadsheet,
  File,
  Download,
  Trash2,
  Plus,
  UploadCloud,
  Eye,
  ExternalLink,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RefreshCw,
  Loader2,
  CheckCircle2,
  X,
  Sparkles,
  Presentation,
  FolderOpen,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast, confirmModal } from '@/components/providers/toast-provider';
import {
  MeetingAttachmentItem,
  getMeetingAttachmentsAction,
  uploadMeetingAttachmentAction,
  deleteMeetingAttachmentAction,
} from '@/app/actions/meeting-attachment-actions';

interface MeetingFilePreviewPanelProps {
  meetingId: string;
  meetingTitle?: string;
  initialAttachments?: MeetingAttachmentItem[];
  onAttachmentsChange?: (attachments: MeetingAttachmentItem[]) => void;
  className?: string;
  isCompact?: boolean;
}

export function MeetingFilePreviewPanel({
  meetingId,
  meetingTitle,
  initialAttachments = [],
  onAttachmentsChange,
  className = '',
  isCompact = false,
}: MeetingFilePreviewPanelProps) {
  const { data: session } = useSession();

  // Both ADMIN and STAFF are fully authorized to upload and delete meeting materials
  const canManageFiles = true;

  const [attachments, setAttachments] = useState<MeetingAttachmentItem[]>(initialAttachments);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(
    initialAttachments.length > 0 ? initialAttachments[0].id : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Image Zoom State
  const [imageZoom, setImageZoom] = useState(1);

  // Upload Form State
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>('BAHAN_RAPAT');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load latest attachments on mount or when meetingId changes
  const loadAttachments = async () => {
    try {
      setIsLoading(true);
      const res = await getMeetingAttachmentsAction(meetingId);
      if (res.success && res.data) {
        setAttachments(res.data);
        if (onAttachmentsChange) {
          onAttachmentsChange(res.data);
        }
        if (res.data.length > 0 && !selectedFileId) {
          setSelectedFileId(res.data[0].id);
        } else if (res.data.length === 0) {
          setSelectedFileId(null);
        }
      }
    } catch (err) {
      console.error('Failed to load meeting attachments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttachments();
  }, [meetingId]);

  // Selected file object
  const activeFile = attachments.find((a) => a.id === selectedFileId) || attachments[0] || null;

  // Handle Fullscreen ESC listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Determine file kind
  const getFileKind = (file: MeetingAttachmentItem) => {
    const ext = file.fileName.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) return 'image';
    if (['pptx', 'ppt'].includes(ext)) return 'presentation';
    if (['docx', 'doc'].includes(ext)) return 'document';
    if (['xlsx', 'xls', 'csv'].includes(ext)) return 'spreadsheet';
    return 'other';
  };

  // Render file icon
  const renderFileIcon = (file: MeetingAttachmentItem, size = 'w-4 h-4') => {
    const kind = getFileKind(file);
    if (file.isInvitation) {
      return <FileText className={`${size} text-blue-600`} />;
    }
    switch (kind) {
      case 'pdf':
        return <FileText className={`${size} text-red-600`} />;
      case 'image':
        return <Eye className={`${size} text-emerald-600`} />;
      case 'presentation':
        return <Presentation className={`${size} text-amber-600`} />;
      case 'spreadsheet':
        return <FileSpreadsheet className={`${size} text-emerald-700`} />;
      case 'document':
        return <FileText className={`${size} text-blue-600`} />;
      default:
        return <File className={`${size} text-slate-500`} />;
    }
  };

  // Category labels
  const getCategoryLabel = (category: string, isInvitation?: boolean) => {
    if (isInvitation) return 'Undangan Resmi';
    switch (category) {
      case 'BAHAN_RAPAT':
        return 'Bahan Paparan';
      case 'NOTULEN_LAMPIRAN':
        return 'Lampiran Notula';
      case 'DOKUMENTASI':
        return 'Dokumentasi';
      default:
        return 'Dokumen Rapat';
    }
  };

  // Handle file upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) {
      toast.error('Pilih berkas yang akan diunggah.');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('meetingId', meetingId);
      formData.append('category', uploadCategory);

      const res = await uploadMeetingAttachmentAction(formData);
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Gagal mengunggah berkas.');
      }

      toast.success(`Berkas "${fileToUpload.name}" berhasil diunggah.`);
      setShowUploadModal(false);
      setFileToUpload(null);

      // Refresh attachments list & select new file
      await loadAttachments();
      setSelectedFileId(res.data.id);
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat mengunggah berkas.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file delete
  const handleDeleteAttachment = async (file: MeetingAttachmentItem) => {
    const isConfirmed = await confirmModal({
      title: 'Hapus Berkas Rapat',
      message: `Apakah Anda yakin ingin menghapus berkas "${file.fileName}"? Berkas ini akan dihapus secara permanen dari sistem.`,
      confirmText: 'Ya, Hapus Berkas',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!isConfirmed) return;

    try {
      setIsDeleting(file.id);
      const res = await deleteMeetingAttachmentAction(file.id, meetingId);
      if (!res.success) {
        throw new Error(res.error || 'Gagal menghapus berkas.');
      }

      toast.success(`Berkas "${file.fileName}" berhasil dihapus.`);

      // Update state
      const nextList = attachments.filter((a) => a.id !== file.id);
      setAttachments(nextList);
      if (onAttachmentsChange) {
        onAttachmentsChange(nextList);
      }

      if (selectedFileId === file.id) {
        setSelectedFileId(nextList.length > 0 ? nextList[0].id : null);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat menghapus berkas.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFileToUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      ref={panelRef}
      className={`bg-white rounded-2xl border border-slate-300 p-4 shadow-sm space-y-3 transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none border-0 shadow-2xl h-screen w-screen p-6 overflow-y-auto'
          : ''
      } ${className}`}
    >
      {/* 1. TOP HEADER & TOOLBAR (Styled matching Aliran Berkas Dokumen PDF Asli) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span className="text-[13px] font-bold text-slate-900">
            {activeFile ? `Aliran Berkas: ${activeFile.fileName}` : 'Aliran Berkas Dokumen & Paparan Rapat'}
          </span>
          {activeFile && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#ECF8E9] text-[#2E7D32] border border-[#C8E6C9]">
              <CheckCircle2 className="w-3 h-3" />
              {getCategoryLabel(activeFile.category, activeFile.isInvitation)}
            </span>
          )}
          {activeFile && (
            <span className="text-[11px] text-slate-500 hidden md:inline">
              ({formatFileSize(activeFile.fileSize)}) • Diunggah oleh: <strong className="text-slate-700">{activeFile.uploadedBy}</strong>
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {activeFile && (
            <button
              type="button"
              onClick={() => setIframeKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
              title="Muat ulang dokumen PDF/berkas"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Muat Ulang</span>
            </button>
          )}

          {activeFile && (
            <a
              href={activeFile.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
              title="Buka berkas di tab peramban baru"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Tab Baru</span>
            </a>
          )}

          {activeFile && (
            <a
              href={activeFile.fileUrl}
              download={activeFile.fileName}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
              title="Unduh berkas ke komputer"
            >
              <Download className="w-3.5 h-3.5 text-[#31889C]" />
              <span className="hidden sm:inline">Unduh</span>
            </a>
          )}

          {canManageFiles && (
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[11.5px] transition-all cursor-pointer shadow-xs active:scale-95"
              title="Unggah bahan rapat baru (PDF, PPT, Word, Gambar)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Unggah Berkas</span>
            </button>
          )}

          {canManageFiles && activeFile && (
            <button
              type="button"
              onClick={() => handleDeleteAttachment(activeFile)}
              disabled={isDeleting === activeFile.id}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
              title="Hapus berkas ini"
            >
              {isDeleting === activeFile.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Hapus</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
            title={isFullscreen ? 'Keluar Layar Penuh (ESC)' : 'Mode Layar Penuh (Presentasi)'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. FILE TABS SELECTOR (Clean pill strip) */}
      {attachments.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Pilih Berkas ({attachments.length}):
          </span>
          {attachments.map((file) => {
            const isSelected = selectedFileId === file.id;
            return (
              <button
                key={file.id}
                type="button"
                onClick={() => setSelectedFileId(file.id)}
                className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-[#F0F9FA] text-[#215865] font-bold border-[#BCE3EB] shadow-2xs ring-1 ring-[#31889C]/20'
                    : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300'
                }`}
                title={`Lihat ${file.fileName}`}
              >
                {renderFileIcon(file, 'w-3.5 h-3.5')}
                <span className="truncate max-w-[150px] sm:max-w-[200px]">{file.fileName}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({formatFileSize(file.fileSize)})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. VIEWER CONTAINER: relative w-full h-[800px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 */}
      {activeFile ? (
        <div
          className={`relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 ${
            isFullscreen ? 'h-[calc(100vh-140px)]' : 'h-[800px]'
          }`}
        >
          {/* KIND 1: PDF VIEWER (Identical to Live Engine PDFKit stream) */}
          {getFileKind(activeFile) === 'pdf' && (
            <iframe
              key={iframeKey}
              src={`${activeFile.fileUrl}#toolbar=1&navpanes=0`}
              className="w-full h-full border-0"
              title={activeFile.fileName}
            />
          )}

          {/* KIND 2: IMAGE VIEWER */}
          {getFileKind(activeFile) === 'image' && (
            <div className="w-full h-full overflow-auto flex flex-col items-center justify-center p-4 bg-slate-900/5 relative">
              {/* Zoom Controls floating */}
              <div className="absolute top-4 right-4 z-10 flex items-center bg-white/90 backdrop-blur-xs rounded-lg p-1 border border-slate-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => setImageZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-1 text-slate-600 hover:text-slate-900 rounded cursor-pointer"
                  title="Perkecil"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono px-2 text-slate-700 font-semibold">
                  {Math.round(imageZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setImageZoom((z) => Math.min(3, z + 0.25))}
                  className="p-1 text-slate-600 hover:text-slate-900 rounded cursor-pointer"
                  title="Perbesar"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setImageZoom(1)}
                  className="p-1 text-slate-600 hover:text-slate-900 rounded cursor-pointer ml-1 border-l border-slate-200 pl-1.5"
                  title="Reset Ukuran"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <img
                src={activeFile.fileUrl}
                alt={activeFile.fileName}
                style={{
                  transform: `scale(${imageZoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm border border-slate-200"
              />
            </div>
          )}

          {/* KIND 3: PRESENTATION (PPTX/PPT), WORD (DOCX), EXCEL (XLSX) */}
          {(getFileKind(activeFile) === 'presentation' ||
            getFileKind(activeFile) === 'document' ||
            getFileKind(activeFile) === 'spreadsheet' ||
            getFileKind(activeFile) === 'other') && (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white">
              <div className="w-20 h-20 rounded-2xl bg-[#F0F9FA] border border-[#BCE3EB] flex items-center justify-center mb-4 shadow-sm text-[#31889C]">
                {renderFileIcon(activeFile, 'w-10 h-10')}
              </div>
              <h4 className="text-[16px] font-bold text-slate-900 max-w-md">
                {activeFile.fileName}
              </h4>
              <div className="flex items-center gap-2 mt-2 mb-6">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {activeFile.fileName.split('.').pop()?.toUpperCase() || 'FILE'}
                </span>
                <span className="text-[12px] text-slate-500">
                  Ukuran: {formatFileSize(activeFile.fileSize)}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[12px] text-slate-500">
                  Kategori: {getCategoryLabel(activeFile.category, activeFile.isInvitation)}
                </span>
              </div>

              <p className="text-[12.5px] text-slate-600 max-w-md mb-6 leading-relaxed">
                Berkas paparan/dokumen ini siap dibuka dan diunduh untuk tindak lanjut hasil pembahasan rapat.
              </p>

              <div className="flex items-center gap-3">
                <a
                  href={activeFile.fileUrl}
                  download={activeFile.fileName}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#31889C] hover:bg-[#266F80] text-white font-bold text-[13px] shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Berkas untuk Ditindaklanjuti</span>
                </a>
                <a
                  href={activeFile.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[13px] transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                  <span>Buka di Tab Baru</span>
                </a>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* EMPTY STATE */
        <div className="p-12 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-4 shadow-xs">
            <FolderOpen className="w-8 h-8 text-[#31889C]" />
          </div>
          <h4 className="text-[15px] font-bold text-slate-800">
            Belum Ada Berkas Paparan / Hasil Rapat
          </h4>
          <p className="text-[12.5px] text-slate-500 max-w-md mt-1 mb-5">
            Admin dan Staff dapat mengunggah bahan paparan presentasi (PPT/PDF), lembar naskah,
            maupun bukti hasil rapat di sini untuk langsung ditinjau dan ditindaklanjuti bersama.
          </p>
          {canManageFiles && (
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#31889C] hover:bg-[#266F80] text-white font-semibold text-[13px] shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Unggah Berkas Rapat Pertama</span>
            </button>
          )}
        </div>
      )}

      {/* 4. MODAL UPLOAD BERKAS RAPAT */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#31889C] flex items-center justify-center text-white shrink-0">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[15px] text-white">Unggah Berkas Rapat</h4>
                  <p className="text-[11px] text-slate-400">
                    Bahan paparan, dokumen lampiran, atau bukti hasil rapat
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setFileToUpload(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
              {/* Kategori Berkas */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kategori Berkas
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#31889C] focus:border-transparent bg-white"
                >
                  <option value="BAHAN_RAPAT">Bahan Paparan / Slide Presentasi (PPT/PDF)</option>
                  <option value="NOTULEN_LAMPIRAN">Lampiran & Catatan Notula</option>
                  <option value="DOKUMENTASI">Foto / Dokumentasi Rapat</option>
                  <option value="LAINNYA">Dokumen Pendukung Lainnya</option>
                </select>
              </div>

              {/* Drag and drop upload box */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pilih Berkas
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#31889C] bg-[#F0F9FA]'
                      : fileToUpload
                      ? 'border-emerald-400 bg-emerald-50/50'
                      : 'border-slate-300 hover:border-[#31889C] hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFileToUpload(e.target.files[0]);
                      }
                    }}
                  />

                  {fileToUpload ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <p className="text-[13px] font-bold text-slate-800 truncate max-w-xs">
                        {fileToUpload.name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatFileSize(fileToUpload.size)} • Siap diunggah
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileToUpload(null);
                        }}
                        className="mt-2 text-[11px] font-semibold text-red-600 hover:underline cursor-pointer"
                      >
                        Ganti Berkas
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#31889C] flex items-center justify-center mb-2">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-[13px] font-bold text-slate-800">
                        Klik untuk memilih berkas atau seret ke sini
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Format: PDF, PPTX/PPT, DOCX, XLSX, PNG, JPG (Maks. 35MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informational callout */}
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200/80 flex items-start gap-2.5 text-[11.5px] text-blue-900 leading-relaxed">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Berkas yang diunggah dapat dilihat langsung oleh <strong>Staff</strong> dan{' '}
                  <strong>Admin</strong> untuk mempermudah penelaahan dan tindak lanjut butir keputusan.
                </span>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setFileToUpload(null);
                  }}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-[12.5px] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!fileToUpload || isUploading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#31889C] hover:bg-[#266F80] disabled:bg-slate-300 text-white font-bold text-[12.5px] shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Unggah Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
