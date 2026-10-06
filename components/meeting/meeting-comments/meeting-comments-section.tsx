'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  MessageCircle,
  Reply,
  CheckCircle2,
  Circle,
  Trash2,
  Loader2,
  Send,
  ChevronDown,
  ChevronUp,
  Tag,
  User2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { toast } from '@/components/providers/toast-provider';
import {
  getCommentsAction,
  addCommentAction,
  toggleResolveCommentAction,
  deleteCommentAction,
} from '@/app/actions/comment-actions';

interface MeetingCommentsProps {
  meetingId: string;
}

const SECTION_LABELS: Record<string, string> = {
  agenda: 'Agenda',
  discussion: 'Hasil Pembahasan',
  decisions: 'Keputusan',
  conclusion: 'Kesimpulan',
  general: 'Umum',
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  STAFF: 'Staf',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-rose-100 text-rose-700',
  ADMIN: 'bg-violet-100 text-violet-700',
  STAFF: 'bg-blue-100 text-blue-700',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function formatRelativeTime(date: string) {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface CommentItemProps {
  comment: any;
  meetingId: string;
  currentUserId?: string;
  currentUserRole?: string;
  onRefresh: () => void;
  depth?: number;
}

function CommentItem({ comment, meetingId, currentUserId, currentUserRole, onRefresh, depth = 0 }: CommentItemProps) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  const isOwner = currentUserId === comment.user?.id;
  const isAdmin = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN';
  const canDelete = isOwner || isAdmin;
  const canResolve = isAdmin;

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setIsSubmittingReply(true);
    try {
      const res = await addCommentAction(meetingId, replyContent.trim(), comment.section || 'general', comment.id);
      if (res.success) {
        setReplyContent('');
        setShowReplyBox(false);
        onRefresh();
      } else {
        toast.error(res.error || 'Gagal mengirim balasan.');
      }
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      const res = await toggleResolveCommentAction(comment.id, meetingId);
      if (res.success) {
        onRefresh();
      } else {
        toast.error(res.error || 'Gagal mengubah status.');
      }
    } finally {
      setIsResolving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteCommentAction(comment.id, meetingId);
      if (res.success) {
        toast.success('Komentar dihapus.');
        onRefresh();
      } else {
        toast.error(res.error || 'Gagal menghapus.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const userName = comment.user?.name || 'Pengguna';
  const userRole = comment.user?.role || 'STAFF';

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-slate-200 pl-4' : ''}`}>
      <div className={`rounded-xl border p-4 transition-all ${
        comment.isResolved
          ? 'bg-slate-50 border-slate-200 opacity-75'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#31889C] to-[#226A7A] flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0">
              {getInitials(userName)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[13px] text-slate-900">{userName}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[userRole] || 'bg-slate-100 text-slate-600'}`}>
                  {ROLE_LABELS[userRole] || userRole}
                </span>
                {comment.section && comment.section !== 'general' && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                    <Tag className="w-2.5 h-2.5" />
                    {SECTION_LABELS[comment.section] || comment.section}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                <Clock className="w-3 h-3" />
                <span>{formatRelativeTime(comment.createdAt)}</span>
              </div>
            </div>
          </div>
          {/* Status badge */}
          {comment.isResolved && (
            <span className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium flex-shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              Selesai
            </span>
          )}
        </div>

        {/* Content */}
        <p className={`mt-3 text-[13px] leading-relaxed ${comment.isResolved ? 'line-through text-slate-400' : 'text-slate-700'}`}>
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {depth === 0 && (
            <button
              onClick={() => setShowReplyBox(!showReplyBox)}
              className="flex items-center gap-1 text-[12px] text-slate-500 hover:text-[#31889C] transition-colors py-1 px-2 rounded-lg hover:bg-[#F0F9FA]"
            >
              <Reply className="w-3.5 h-3.5" />
              Balas
            </button>
          )}
          {canResolve && (
            <button
              onClick={handleResolve}
              disabled={isResolving}
              className="flex items-center gap-1 text-[12px] text-slate-500 hover:text-green-600 transition-colors py-1 px-2 rounded-lg hover:bg-green-50 disabled:opacity-50"
            >
              {isResolving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : comment.isResolved ? (
                <Circle className="w-3.5 h-3.5" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              {comment.isResolved ? 'Buka Kembali' : 'Tandai Selesai'}
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1 text-[12px] text-slate-500 hover:text-rose-600 transition-colors py-1 px-2 rounded-lg hover:bg-rose-50 disabled:opacity-50 ml-auto"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Hapus
            </button>
          )}
        </div>

        {/* Reply box */}
        {showReplyBox && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex gap-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Tulis balasan Anda..."
                rows={2}
                className="flex-1 text-[13px] border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] placeholder-slate-400"
              />
              <div className="flex flex-col gap-1">
                <button
                  onClick={handleReply}
                  disabled={isSubmittingReply || !replyContent.trim()}
                  className="px-3 py-2 bg-[#31889C] text-white rounded-lg text-[12px] font-medium flex items-center gap-1 hover:bg-[#226A7A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => { setShowReplyBox(false); setReplyContent(''); }}
                  className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-[12px] hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-1 text-[12px] text-slate-500 hover:text-[#31889C] ml-2 py-1"
          >
            {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {comment.replies.length} Balasan
          </button>
          {showReplies && (
            <div className="space-y-2">
              {comment.replies.map((reply: any) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  meetingId={meetingId}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  onRefresh={onRefresh}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MeetingCommentsSection({ meetingId }: MeetingCommentsProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const currentUserRole = session?.user?.role || 'STAFF';

  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [newSection, setNewSection] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getCommentsAction(meetingId);
      if (res.success && res.comments) {
        setComments(res.comments);
      }
    } finally {
      setIsLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async () => {
    if (!newContent.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await addCommentAction(meetingId, newContent.trim(), newSection);
      if (res.success) {
        setNewContent('');
        setNewSection('general');
        toast.success('Komentar berhasil ditambahkan.');
        loadComments();
      } else {
        toast.error(res.error || 'Gagal menambahkan komentar.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-[15px]">Komentar & Anotasi Notulen</h3>
            <p className="text-[12px] text-slate-500">{comments.length} komentar</p>
          </div>
        </div>
      </div>

      {/* New comment box */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#31889C] to-[#226A7A] flex items-center justify-center text-white text-[11px] font-bold">
            {getInitials(session?.user?.name || 'U')}
          </div>
          <span className="text-[13px] font-semibold text-slate-700">{session?.user?.name || 'Anda'}</span>
        </div>
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Tulis komentar atau pertanyaan terkait notulen rapat ini..."
          rows={3}
          className="w-full text-[13px] border border-slate-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] placeholder-slate-400 transition-all"
        />
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
              className="text-[12px] border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#31889C]/30 focus:border-[#31889C] bg-white"
            >
              {Object.entries(SECTION_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !newContent.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-[#31889C] text-white rounded-xl text-[13px] font-semibold hover:bg-[#226A7A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Kirim Komentar
          </button>
        </div>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#31889C]" />
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <MessageCircle className="w-7 h-7 text-slate-400" />
          </div>
          <h4 className="font-semibold text-slate-700 text-[14px]">
            Belum ada komentar
          </h4>
          <p className="text-slate-400 text-[13px] mt-1">
            Jadilah yang pertama memberi komentar pada notulen ini.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              meetingId={meetingId}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onRefresh={loadComments}
            />
          ))}
        </div>
      )}
    </div>
  );
}
