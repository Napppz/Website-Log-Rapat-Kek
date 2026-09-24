'use client';

import React from 'react';
import { MOCK_BUREAU_WORKLOAD } from '@/lib/mock-data';
import { BureauWorkload } from '@/lib/types';

interface BureauDistributionProps {
  onBiroClick?: (code: string) => void;
  workload?: BureauWorkload[];
}

export function BureauDistribution({ onBiroClick, workload: initialWorkload }: BureauDistributionProps) {
  const [workload, setWorkload] = React.useState<BureauWorkload[]>(
    initialWorkload || MOCK_BUREAU_WORKLOAD
  );

  React.useEffect(() => {
    if (initialWorkload) {
      setWorkload(initialWorkload);
      return;
    }

    let isMounted = true;
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.bureauWorkload && Array.isArray(data.bureauWorkload) && data.bureauWorkload.length > 0) {
          setWorkload(data.bureauWorkload);
        }
      })
      .catch((e) => console.warn('Could not load stats from DB:', e));

    return () => {
      isMounted = false;
    };
  }, [initialWorkload]);
  return (
    <div className="lg:col-span-3 rounded-xl bg-white p-6 shadow-sm border border-amber-200/60 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <span className="font-semibold text-[12px] text-amber-700 uppercase tracking-wider">
              Unit Kerja
            </span>
            <h2 className="font-bold text-[18px] text-slate-900">
              Rapat per Biro
            </h2>
            <p className="text-[13px] text-slate-500 mt-1">
              Distribusi keterlibatan biro
            </p>
          </div>
        </div>

        {/* Progress Bars per Bureau */}
        <div className="mt-4 space-y-3.5">
          {workload.map((biro) => (
            <div
              key={biro.code}
              className="cursor-pointer group"
              onClick={() => onBiroClick?.(biro.code)}
            >
              <div className="flex justify-between text-[12px] mb-1">
                <span className="font-bold text-slate-800 group-hover:text-amber-700 transition-colors">
                  {biro.name}
                </span>
                <span className="font-bold text-amber-700">{biro.count} Rapat</span>
              </div>
              <div className="h-2 w-full bg-amber-100/60 rounded-full overflow-hidden">
                <div
                  className={`h-full ${biro.barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${biro.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-2 text-center border-t border-amber-50">
        <span className="text-[12px] text-slate-500">
          Biro Investasi, Kerja Sama &amp; Komunikasi memiliki beban rapat tertinggi (32%)
        </span>
      </div>
    </div>
  );
}
