import React from 'react';
import { MeetingStatus, MeetingProgressStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import {
  MEETING_STATUS_DETAILS,
  PROGRESS_STATUS_DETAILS,
  normalizeProgressStatus,
  mapStatusToProgress,
} from '@/lib/meeting-status';
import { FileEdit, Clock3, CheckCircle2, Award, PlayCircle, Hourglass, CheckCircle } from 'lucide-react';
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
  // Always map to modern 3-stage progress status ('Belum Dimulai' | 'Dalam Proses' | 'Selesai')
  const resolvedProg = progressStatus || mapStatusToProgress(status);

  return (
    <MeetingProgressBadge
      progressStatus={resolvedProg}
      status={status}
      isNew={isNew}
      showSubtitle={showSublabel}
      className={className}
    />
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

const PROGRESS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Belum Dimulai': PlayCircle,
  'Dalam Proses': Hourglass,
  Selesai: CheckCircle,
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

  const detail = PROGRESS_STATUS_DETAILS[effectiveProgress] || PROGRESS_STATUS_DETAILS['Belum Dimulai'];
  const IconComponent = PROGRESS_ICONS[effectiveProgress] || PlayCircle;

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
            (effectiveProgress === 'Dalam Proses' || effectiveProgress === 'On Progres') && 'animate-pulse'
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
    </div>
  );
}

