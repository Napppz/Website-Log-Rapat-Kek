'use client';

import React from 'react';
import { TiptapEditor } from './tiptap-editor';
import { ListChecks, MessageSquare, Award, CheckCircle, FileText } from 'lucide-react';
import { JSONContent } from '@tiptap/react';

interface MeetingMinutesPreviewProps {
  agenda?: JSONContent | null;
  discussion?: JSONContent | null;
  decisions?: JSONContent | null;
  conclusion?: JSONContent | null;
  updatedAt?: string | Date;
}

export function MeetingMinutesPreview({
  agenda,
  discussion,
  decisions,
  conclusion,
  updatedAt,
}: MeetingMinutesPreviewProps) {
  const isAllEmpty = !agenda && !discussion && !decisions && !conclusion;

  if (isAllEmpty) {
    return (
      <div className="p-8 text-center bg-amber-50/30 rounded-xl border border-dashed border-amber-200">
        <FileText className="w-10 h-10 text-amber-500 mx-auto mb-2 opacity-60" />
        <p className="text-[14px] font-semibold text-slate-700">Konten Notulen Masih Kosong</p>
        <p className="text-[12px] text-slate-500 mt-1">
          Belum ada ringkasan agenda, pembahasan, keputusan, atau kesimpulan yang dituliskan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Agenda */}
      <section className="bg-white rounded-xl border border-amber-200/80 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-100">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <ListChecks className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-[14px] text-slate-900 uppercase tracking-wide">
              A. Agenda &amp; Topik Pembahasan
            </h4>
            <p className="text-[11px] text-slate-500">Pokok materi yang diagendakan dalam persidangan rapat</p>
          </div>
        </div>

        {agenda ? (
          <TiptapEditor content={agenda} editable={false} minHeight="auto" />
        ) : (
          <p className="text-[13px] text-slate-400 italic py-2">Tidak ada catatan agenda.</p>
        )}
      </section>

      {/* 2. Pembahasan */}
      <section className="bg-white rounded-xl border border-amber-200/80 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-100">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-[14px] text-slate-900 uppercase tracking-wide">
              B. Pembahasan &amp; Dinamika Diskusi
            </h4>
            <p className="text-[11px] text-slate-500">Poin penting masukan biro, tanggapan pimpinan, dan elaborasi teknis</p>
          </div>
        </div>

        {discussion ? (
          <TiptapEditor content={discussion} editable={false} minHeight="auto" />
        ) : (
          <p className="text-[13px] text-slate-400 italic py-2">Tidak ada catatan pembahasan.</p>
        )}
      </section>

      {/* 3. Keputusan */}
      <section className="bg-white rounded-xl border border-amber-200/80 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-100">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-[14px] text-slate-900 uppercase tracking-wide">
              C. Keputusan &amp; Arahan Sidang
            </h4>
            <p className="text-[11px] text-slate-500">Ketetapan resmi hasil kesepakatan seluruh biro dan pengarah</p>
          </div>
        </div>

        {decisions ? (
          <TiptapEditor content={decisions} editable={false} minHeight="auto" />
        ) : (
          <p className="text-[13px] text-slate-400 italic py-2">Tidak ada keputusan yang tercatat.</p>
        )}
      </section>

      {/* 4. Kesimpulan */}
      <section className="bg-white rounded-xl border border-amber-200/80 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-100">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-[14px] text-slate-900 uppercase tracking-wide">
              D. Kesimpulan &amp; Langkah Lanjutan
            </h4>
            <p className="text-[11px] text-slate-500">Rangkuman akhir dan tenggat waktu pemenuhan komitmen biro</p>
          </div>
        </div>

        {conclusion ? (
          <TiptapEditor content={conclusion} editable={false} minHeight="auto" />
        ) : (
          <p className="text-[13px] text-slate-400 italic py-2">Tidak ada kesimpulan akhir.</p>
        )}
      </section>

      {updatedAt && (
        <div className="text-right text-[11px] text-slate-400 pt-1">
          Terakhir diperbarui: {new Date(updatedAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} WIB
        </div>
      )}
    </div>
  );
}
