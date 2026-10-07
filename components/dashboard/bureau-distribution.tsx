'use client';

import React, { useState, useEffect } from 'react';
import { BureauWorkload, TeamWorkloadMetric } from '@/lib/types';
import { Layers, ChevronRight, RotateCcw } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/animated-counter';

interface BureauDistributionProps {
  onBiroClick?: (code: string) => void;
  onTeamClick?: (team: TeamWorkloadMetric) => void;
  workload?: BureauWorkload[];
  teamWorkload?: TeamWorkloadMetric[];
}

export function BureauDistribution({
  onBiroClick,
  onTeamClick,
  workload: initialWorkload,
  teamWorkload: initialTeamWorkload,
}: BureauDistributionProps) {
  const [teamWorkload, setTeamWorkload] = useState<TeamWorkloadMetric[]>(
    initialTeamWorkload || []
  );
  const [isAnimated, setIsAnimated] = useState(false);

  // Trigger cascade waterfall animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnimated(false);
    setTimeout(() => {
      setIsAnimated(true);
    }, 80);
  };

  useEffect(() => {
    if (initialTeamWorkload && initialTeamWorkload.length > 0) {
      setTeamWorkload(initialTeamWorkload);
      return;
    }

    let isMounted = true;
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (
          isMounted &&
          data?.teamWorkload &&
          Array.isArray(data.teamWorkload) &&
          data.teamWorkload.length > 0
        ) {
          setTeamWorkload(data.teamWorkload);
        }
      })
      .catch((e) => console.warn('Could not load stats from DB:', e));

    return () => {
      isMounted = false;
    };
  }, [initialTeamWorkload]);

  const teamColors: Record<string, string> = {
    INV: 'bg-[#31889C]',
    KS: 'bg-emerald-600',
    KOM: 'bg-amber-500',
  };

  return (
    <div className="lg:col-span-3 rounded-2xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col justify-between transition-all duration-300 hover:shadow-md">
      <div>
        {/* Card Header with Replay Action */}
        <div className="flex items-start justify-between">
          <div>
            <span className="font-semibold text-[11px] text-[#31889C] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#31889C]" />
              <span>Tim Kerja IKK</span>
            </span>
            <h2 className="font-bold text-[18px] text-slate-900 mt-0.5">
              Rapat per Tim
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Distribusi agenda sidang 3 tim Biro IKK
            </p>
          </div>

          <button
            type="button"
            onClick={handleReplay}
            className="text-slate-400 hover:text-[#31889C] p-1.5 rounded-lg hover:bg-[#F0F9FA] cursor-pointer transition-all duration-200 hover:rotate-180"
            title="Putar ulang animasi progres tim"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Animated Progress Bars per Team */}
        <div className="mt-4 space-y-2">
          {teamWorkload.map((team, idx) => (
            <div
              key={team.id || team.code}
              role="button"
              tabIndex={0}
              style={{
                transition: 'all 600ms cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: isAnimated ? `${idx * 80}ms` : '0ms',
                transform: isAnimated ? 'translateY(0)' : 'translateY(12px)',
                opacity: isAnimated ? 1 : 0,
              }}
              className="p-2 -mx-2 rounded-xl hover:bg-[#F0F9FA] border border-transparent hover:border-[#BCE3EB] transition-all cursor-pointer group"
              onClick={() => {
                if (onTeamClick) {
                  onTeamClick(team);
                } else if (onBiroClick) {
                  onBiroClick(team.code);
                }
              }}
              title={`Klik untuk membuka rincian pekerjaan dan agenda ${team.fullName}`}
            >
              {/* Row Header: Team Name + Count */}
              <div className="flex items-center justify-between text-[12px] mb-1.5 gap-2">
                <span
                  className="font-bold text-slate-800 group-hover:text-[#215865] transition-colors truncate flex-1 min-w-0"
                  title={team.fullName}
                >
                  {team.fullName}
                </span>

                <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <span className="font-extrabold text-[#31889C] text-[12px] tabular-nums">
                    {isAnimated ? (
                      <AnimatedCounter value={team.meetingCount} duration={800 + idx * 80} />
                    ) : (
                      0
                    )}{' '}
                    Rapat
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#31889C] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>

              {/* Animated Progress Bar Track with Shimmer Shine */}
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                <div
                  className={`h-full ${teamColors[team.code] || 'bg-[#31889C]'} rounded-full transition-all duration-900 ease-out relative ${
                    isAnimated ? 'animate-shimmer' : ''
                  }`}
                  style={{
                    width: isAnimated ? `${Math.max(team.meetingPercentage, 8)}%` : '0%',
                    transitionDelay: isAnimated ? `${120 + idx * 100}ms` : '0ms',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-2.5 text-center border-t border-slate-100">
        <span className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1">
          <span>💡</span>
          <span>Klik tim untuk melihat rincian pekerjaan &amp; rapat</span>
        </span>
      </div>
    </div>
  );
}

