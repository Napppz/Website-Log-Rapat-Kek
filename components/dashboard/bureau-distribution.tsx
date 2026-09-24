'use client';

import React, { useState, useEffect } from 'react';
import { MOCK_BUREAU_WORKLOAD } from '@/lib/mock-data';
import { BureauWorkload } from '@/lib/types';
import { Building2, ChevronRight, RotateCcw } from 'lucide-react';

interface BureauDistributionProps {
  onBiroClick?: (code: string) => void;
  workload?: BureauWorkload[];
}

export function BureauDistribution({
  onBiroClick,
  workload: initialWorkload,
}: BureauDistributionProps) {
  const [workload, setWorkload] = useState<BureauWorkload[]>(
    initialWorkload || MOCK_BUREAU_WORKLOAD
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
    if (initialWorkload) {
      setWorkload(initialWorkload);
      return;
    }

    let isMounted = true;
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (
          isMounted &&
          data?.bureauWorkload &&
          Array.isArray(data.bureauWorkload) &&
          data.bureauWorkload.length > 0
        ) {
          setWorkload(data.bureauWorkload);
        }
      })
      .catch((e) => console.warn('Could not load stats from DB:', e));

    return () => {
      isMounted = false;
    };
  }, [initialWorkload]);

  return (
    <div className="lg:col-span-3 rounded-2xl bg-white p-6 shadow-sm border border-amber-200/80 flex flex-col justify-between transition-all">
      <div>
        {/* Card Header with Replay Action */}
        <div className="flex items-start justify-between">
          <div>
            <span className="font-semibold text-[11px] text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Unit Kerja</span>
            </span>
            <h2 className="font-bold text-[18px] text-slate-900 mt-0.5">
              Rapat per Biro
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Distribusi agenda sidang 5 biro KEK
            </p>
          </div>

          <button
            type="button"
            onClick={handleReplay}
            className="text-slate-400 hover:text-amber-800 p-1.5 rounded-lg hover:bg-amber-50 cursor-pointer transition-colors"
            title="Putar ulang animasi progres biro"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Animated Progress Bars per Bureau */}
        <div className="mt-4 space-y-2">
          {workload.map((biro, idx) => (
            <div
              key={biro.code}
              role="button"
              tabIndex={0}
              style={{
                transition: 'all 600ms cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: isAnimated ? `${idx * 80}ms` : '0ms',
                transform: isAnimated ? 'translateY(0)' : 'translateY(12px)',
                opacity: isAnimated ? 1 : 0,
              }}
              className="p-2 -mx-2 rounded-xl hover:bg-amber-50/80 border border-transparent hover:border-amber-200 transition-all cursor-pointer group"
              onClick={() => onBiroClick?.(biro.code)}
              title={`Klik untuk membuka seluruh agenda Biro ${biro.name}`}
            >
              {/* Row Header: Biro Name (truncated cleanly) + Count (guaranteed no overlap) */}
              <div className="flex items-center justify-between text-[12px] mb-1.5 gap-2">
                <span
                  className="font-bold text-slate-800 group-hover:text-amber-900 transition-colors truncate flex-1 min-w-0"
                  title={biro.name}
                >
                  {biro.name}
                </span>

                <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <span className="font-extrabold text-amber-800 text-[12px]">
                    {biro.count} Rapat
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>

              {/* Animated Progress Bar Track */}
              <div className="h-2.5 w-full bg-amber-100/70 rounded-full overflow-hidden relative">
                <div
                  className={`h-full ${biro.barColor} rounded-full transition-all duration-900 ease-out relative`}
                  style={{
                    width: isAnimated ? `${Math.max(biro.percentage, 8)}%` : '0%',
                    transitionDelay: isAnimated ? `${120 + idx * 100}ms` : '0ms',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-2.5 text-center border-t border-amber-100">
        <span className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1">
          <span>💡</span>
          <span>Klik biro untuk melihat rekapitulasi lengkap</span>
        </span>
      </div>
    </div>
  );
}
