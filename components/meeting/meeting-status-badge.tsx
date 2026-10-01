import React from 'react';
import { MeetingStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface MeetingStatusBadgeProps {
  status: MeetingStatus;
  isNew?: boolean;
}

export function MeetingStatusBadge({ status, isNew = false }: MeetingStatusBadgeProps) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      {status === 'FINAL' && (
        <Badge variant="final" dot className="font-bold shadow-2xs">
          FINAL
        </Badge>
      )}

      {status === 'APPROVED' && (
        <Badge variant="approved" dot className="font-bold shadow-2xs">
          APPROVED
        </Badge>
      )}

      {status === 'REVIEW' && (
        <Badge variant="review" dot className="font-bold shadow-2xs">
          REVIEW
        </Badge>
      )}

      {status === 'DRAFT' && (
        <Badge variant="draft" dot className="font-bold shadow-2xs">
          DRAFT
        </Badge>
      )}

      {isNew && (
        <Badge variant="orange" className="font-bold uppercase text-[10px] shadow-2xs">
          BARU
        </Badge>
      )}
    </div>
  );
}
