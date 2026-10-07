import React from 'react';
import { MeetingStatus, MeetingProgressStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import {
  MEETING_STATUS_DETAILS,
  PROGRESS_STATUS_DETAILS,
  normalizeProgressStatus,
  mapStatusToProgress,
} from '@/lib/meeting-status';
import { FileEdit, Clock3, CheckCircle2, Award, Sparkles, PlayCircle, Hourglass, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MeetingStatusBadgeProps {
  status: MeetingStatus | string;
  progressStatus?: string | null;
  isNew?: boolean;
  showStep?: boolean;
  showSublabel?: boolean;
  className?: string;
}

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  DRAFT: FileEdit,
  REVIEW: Clock3,
  APPROVED: CheckCircle2,
  FINAL: Award,
};

export function MeetingStatusBadge({
  status,
  progressStatus,
  isNew = false,
  showStep = false,
  showSublabel = false,
  className,
}: MeetingStatusBadgeProps) {
  // If progressStatus is supplied or status is one of the progress statuses, render progress badge style
  const isDirectProgress =
    status === 'Start' || status === 'On Progres' || status === 'Finish';
  if (progressStatus || isDirectProgress) {
    return (
      <MeetingProgressBadge
        progressStatus={progressStatus || (status as string)}
        isNew={isNew}
        className={className}
      />
    );
  }

  const normalizedStatus = (status as MeetingStatus) in MEETING_STATUS_DETAILS ? (status as MeetingStatus) : 'DRAFT';
  const detail = MEETING_STATUS_DETAILS[normalizedStatus] || MEETING_STATUS_DETAILS.DRAFT;
  const IconComponent = STATUS_ICONS[normalizedStatus] || FileEdit;

  const tooltipText = `Tahap ${detail.step} dari 4 — ${detail.label} (${detail.sublabel}): ${detail.tagline}`;

  return (
    <div className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[11px] tracking-wide transition-colors border shadow-2xs select-none",
          detail.colorClass.badgeStyle
        )}
        title={tooltipText}
      >
        {/* Step indicator or Icon */}
        {showStep ? (
          <span
            className={cn(
              "w-4 h-4 rounded-full flex items-center justify-center text-[9.5px] font-extrabold text-white shrink-0 -ml-0.5",
              status === 'DRAFT' && "bg-slate-500",
              status === 'REVIEW' && "bg-[#CA8A04]",
              status === 'APPROVED' && "bg-[#0284C7]",
              status === 'FINAL' && "bg-[#16A34A]"
            )}
          >
            {detail.step}
          </span>
        ) : (
          <IconComponent className="w-3.5 h-3.5 shrink-0" />
        )}

        {/* Text Label */}
        <span>{detail.label}</span>

        {/* Optional sublabel */}
        {showSublabel && (
          <span className="opacity-75 font-normal text-[10px]">
            • {detail.sublabel}
          </span>
        )}
      </div>

      {isNew && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF0DC] border border-[#FEDEBE] text-[#C2410C] font-extrabold text-[10px] uppercase shadow-2xs"
          title="Rapat baru ditambahkan"
        >
          <Sparkles className="w-2.5 h-2.5 text-[#F99D1C]" />
          <span>Baru</span>
        </span>
      )}
    </div>
  );
}

interface MeetingProgressBadgeProps {
  progressStatus?: string | null;
  status?: MeetingStatus | string | null;
  isNew?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

const PROGRESS_ICONS: Record<MeetingProgressStatus, React.ComponentType<{ className?: string }>> = {
  Start: PlayCircle,
  'On Progres': Hourglass,
  Finish: CheckCircle,
};

export function MeetingProgressBadge({
  progressStatus,
  status,
  isNew = false,
  size = 'md',
  showSubtitle = false,
  className,
}: MeetingProgressBadgeProps) {
  const effectiveProgress: MeetingProgressStatus = progressStatus
    ? normalizeProgressStatus(progressStatus)
    : mapStatusToProgress(status);

  const detail = PROGRESS_STATUS_DETAILS[effectiveProgress];
  const IconComponent = PROGRESS_ICONS[effectiveProgress];

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-[11.5px] px-2.5 py-1 gap-1.5',
    lg: 'text-[12.5px] px-3.5 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <div className={cn('inline-flex items-center gap-1.5 flex-wrap', className)}>
      <span
        className={cn(
          'inline-flex items-center font-bold tracking-wide rounded-full border shadow-2xs transition-all select-none',
          sizeClasses,
          detail.colorClass.badgeStyle
        )}
        title={`${detail.label} — ${detail.tagline}. ${detail.description}`}
      >
        <span
          className={cn(
            'w-2 h-2 rounded-full shrink-0',
            detail.colorClass.dot,
            effectiveProgress === 'On Progres' && 'animate-pulse'
          )}
        />
        <IconComponent className={cn(iconSizes, 'shrink-0')} />
        <span>{detail.label}</span>
        {showSubtitle && (
          <span className="opacity-75 font-medium text-[10.5px]">
            ({detail.subtitle})
          </span>
        )}
      </span>

      {isNew && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF0DC] border border-[#FEDEBE] text-[#C2410C] font-extrabold text-[10px] uppercase shadow-2xs"
          title="Rapat baru ditambahkan"
        >
          <Sparkles className="w-2.5 h-2.5 text-[#F99D1C]" />
          <span>Baru</span>
        </span>
      )}
    </div>
  );
}

