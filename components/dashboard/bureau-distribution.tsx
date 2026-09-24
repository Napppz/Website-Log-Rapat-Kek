'use client';

import React from 'react';
import { MOCK_BUREAU_WORKLOAD } from '@/lib/mock-data';
import { BureauWorkload } from '@/lib/types';
import { Building2, ChevronRight, ExternalLink } from 'lucide-react';

interface BureauDistributionProps {
  onBiroClick?: (code: string) => void;
  workload?: BureauWorkload[];
}

export function BureauDistribution({
  onBiroClick,
  workload: initialWorkload,
}: BureauDistributionProps) {
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
              Klik biro untuk melihat agenda &amp; arsipnya
            </p>
          </div>
        </div>

        {/* Progress Bars per Bureau */}
        <div className="mt-4 space-y-2">
          {workload.map((biro) => (
            <div
              key={biro.code}
              role="button"
              tabIndex={0}
              className="p-2 -mx-2 rounded-xl hover:bg-amber-50/80 border border-transparent hover:border-amber-200 transition-all cursor-pointer group"
              onClick={() => onBiroClick?.(biro.code)}
              title={`Klik untuk membuka halaman Biro ${biro.code}`}
            >
              <div className="flex items-center justify-between text-[12px] mb-1.5">
                <span className="font-bold text-slate-800 group-hover:text-amber-900 transition-colors flex items-center gap-1 truncate max-w-[170px]">
                  <span>{biro.name}</span>
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-extrabold text-amber-800 text-[11.5px]">
                    {biro.count} Rapat
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>

              <div className="h-2 w-full bg-amber-100/70 rounded-full overflow-hidden">
                <div
                  className={`h-full ${biro.barColor} rounded-full transition-all duration-700 ease-out`}
                  style={{ width: `${biro.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-2.5 text-center border-t border-amber-100">
        <span className="text-[11px] text-slate-500 font-medium">
          💡 Seluruh data terhubung dengan database 5 Biro KEK RI
        </span>
      </div>
    </div>
  );
}
