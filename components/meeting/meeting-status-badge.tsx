import React from 'react';
import { MeetingStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { MEETING_STATUS_DETAILS } from '@/lib/meeting-status';
import { FileEdit, Clock3, CheckCircle2, Award, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MeetingStatusBadgeProps {
  status: MeetingStatus;
  isNew?: boolean;
  showStep?: boolean;
  showSublabel?: boolean;
  className?: string;
}

const STATUS_ICONS: Record<MeetingStatus, React.ComponentType<{ className?: string }>> = {
  DRAFT: FileEdit,
  REVIEW: Clock3,
  APPROVED: CheckCircle2,
  FINAL: Award,
};

export function MeetingStatusBadge({
  status,
  isNew = false,
  showStep = false,
  showSublabel = false,
  className,
}: MeetingStatusBadgeProps) {
  const detail = MEETING_STATUS_DETAILS[status] || MEETING_STATUS_DETAILS.DRAFT;
  const IconComponent = STATUS_ICONS[status] || FileEdit;

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
