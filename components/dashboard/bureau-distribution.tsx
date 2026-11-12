'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Meeting } from '@/lib/types';
import {
  FolderOpen,
  ChevronRight,
  RotateCcw,
  Building2,
  Landmark,
  Inbox,
  FileSpreadsheet,
  Clock,
  Info,
} from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { cn } from '@/lib/utils';

export interface CategoryWorkloadItem {
  key: string;
  label: string;
  count: number;
  percentage: number;
  barColor: string;
  textColor: string;
  Icon: React.ComponentType<{ className?: string }>;
}

interface BureauDistributionProps {
  meetings?: Meeting[];
  onCategoryClick?: (categoryKey: string) => void;
  // Backward-compatibility props (optional)
  onBiroClick?: (code: string) => void;
  onTeamClick?: (team: any) => void;
  workload?: any[];
  teamWorkload?: any[];
  className?: string;
}

const CATEGORY_DEFINITIONS: Array<{
  key: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  barColor: string;
  textColor: string;
}> = [
    {
      key: 'UNDANGAN_INTERNAL',
      label: 'Undangan Internal',
      Icon: Building2,
      barColor: 'bg-[#31889C]',
      textColor: 'text-[#31889C]',
    },
    {
      key: 'DISPOSISI_Setjen',
      label: 'Disposisi Setjen',
      Icon: Landmark,
      barColor: 'bg-indigo-600',
      textColor: 'text-indigo-600',
    },
    {
      key: 'NASKAH_MASUK',
      label: 'Daftar Naskah Masuk',
      Icon: Inbox,
      barColor: 'bg-amber-500',
      textColor: 'text-amber-600',
    },
    {
      key: 'DISPOSISI_BIRO',
      label: 'Disposisi Biro',
      Icon: FileSpreadsheet,
      barColor: 'bg-purple-600',
      textColor: 'text-purple-600',
    },
    {
      key: 'SURAT_DITUNDA',
      label: 'Tunda Kegiatan',
      Icon: Clock,
      barColor: 'bg-rose-500',
      textColor: 'text-rose-600',
    },
  ];

export function BureauDistribution({
  meetings,
  onCategoryClick,
  onBiroClick,
  className,
}: BureauDistributionProps) {
  const [isAnimated, setIsAnimated] = useState(false);
  const [fallbackStats, setFallbackStats] = useState<Record<string, number>>({});

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

  // If meetings prop is not provided, fetch stats from API
  useEffect(() => {
    if (meetings && meetings.length > 0) return;

    let isMounted = true;
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.categoryDistribution && Array.isArray(data.categoryDistribution)) {
          const map: Record<string, number> = {};
          data.categoryDistribution.forEach((c: any) => {
            map[c.key] = c.count;
          });
          setFallbackStats(map);
        }
      })
      .catch((e) => console.warn('Could not load category stats from API:', e));

    return () => {
      isMounted = false;
    };
  }, [meetings]);

  // Compute live counts and percentages per category
  const categories: CategoryWorkloadItem[] = useMemo(() => {
    const meetingList = meetings || [];
    const total = meetingList.length;

    return CATEGORY_DEFINITIONS.map((def) => {
      let count = 0;

      if (meetingList.length > 0) {
        count = meetingList.filter((m) => {
          const cat = ((m as any).documentCategory || 'UNDANGAN_INTERNAL').toUpperCase();
          const sub = ((m as any).documentSubCategory || '').toUpperCase();

          if (def.key === 'UNDANGAN_INTERNAL') {
            return cat === 'UNDANGAN_INTERNAL';
          }
          if (def.key === 'DISPOSISI_Setjen') {
            return cat === 'DISPOSISI_Setjen' || (cat === 'NASKAH_MASUK' && sub === 'DISPOSISI_Setjen');
          }
          if (def.key === 'NASKAH_MASUK') {
            return (
              (cat === 'NASKAH_MASUK' || cat === 'DAFTAR_NASKAH_MASUK') &&
              sub !== 'DISPOSISI_Setjen' &&
              sub !== 'DISPOSISI_BIRO'
            );
          }
          if (def.key === 'DISPOSISI_BIRO') {
            return cat === 'DISPOSISI_BIRO' || (cat === 'NASKAH_MASUK' && sub === 'DISPOSISI_BIRO');
          }
          if (def.key === 'SURAT_DITUNDA') {
            return cat === 'SURAT_DITUNDA' || cat === 'TUNDA_RAPAT';
          }
          return false;
        }).length;
      } else {
        count = fallbackStats[def.key] ?? 0;
      }

      const totalMeetingsCount = total > 0 ? total : Object.values(fallbackStats).reduce((a, b) => a + b, 0);
      const percentage = totalMeetingsCount > 0 ? Math.round((count / totalMeetingsCount) * 100) : 0;

      return {
        ...def,
        count,
        percentage,
      };
    });
  }, [meetings, fallbackStats]);

  const handleItemClick = (key: string) => {
    if (onCategoryClick) {
      onCategoryClick(key);
    } else if (onBiroClick) {
      onBiroClick(key);
    }
  };

  return (
    <div className={cn("rounded-xl bg-white p-6 shadow-2xs border border-slate-200 flex flex-col justify-between", className || "lg:col-span-5")}>
      <div>
        {/* Card Header with Replay Action */}
        <div className="flex items-start justify-between">
          <div>
            <span className="font-semibold text-[11px] text-[#31889C] uppercase tracking-wider flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-[#31889C]" />
              <span>Klasifikasi Dokumen</span>
            </span>
            <h2 className="font-bold text-[17px] text-slate-900 mt-0.5">
              Kegiatan per Kategori
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Distribusi aktivitas &amp; kegiatan per kategori naskah
            </p>
          </div>

          <button
            type="button"
            onClick={handleReplay}
            className="text-slate-400 hover:text-[#31889C] p-1.5 rounded-lg hover:bg-[#F0F9FA] cursor-pointer transition-colors"
            title="Segarkan tampilan progres kategori"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bars per Category */}
        <div className="mt-4 space-y-2">
          {categories.map((cat, idx) => {
            const CatIcon = cat.Icon;
            return (
              <div
                key={cat.key}
                role="button"
                tabIndex={0}
                className="p-2 -mx-2 rounded-lg hover:bg-[#F0F9FA] border border-transparent hover:border-[#BCE3EB] transition-colors cursor-pointer group"
                onClick={() => handleItemClick(cat.key)}
                title={`Klik untuk memfilter log book kegiatan berdasarkan kategori ${cat.label}`}
              >
                {/* Row Header: Category Name + Count */}
                <div className="flex items-center justify-between text-[12px] mb-1.5 gap-2">
                  <span
                    className="font-semibold text-slate-800 group-hover:text-[#215865] transition-colors truncate flex-1 min-w-0 flex items-center gap-2"
                    title={cat.label}
                  >
                    <CatIcon className={cn("w-3.5 h-3.5 shrink-0", cat.textColor)} />
                    <span className="truncate">{cat.label}</span>
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                    <span className="font-bold text-slate-800 text-[12px] tabular-nums">
                      {isAnimated ? (
                        <AnimatedCounter value={cat.count} duration={500} />
                      ) : (
                        cat.count
                      )}{' '}
                      <span className="font-normal text-slate-500">Kegiatan</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#31889C] transition-colors" />
                  </div>
                </div>

                {/* Progress Bar Track */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${cat.barColor} rounded-full transition-all duration-500 ease-out`}
                    style={{
                      width: isAnimated ? `${Math.max(cat.percentage, cat.count > 0 ? 6 : 0)}%` : '0%',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-2.5 text-center border-t border-slate-100">
        <span className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Klik kategori untuk memfilter daftar kegiatan</span>
        </span>
      </div>
    </div>
  );
}

// Export alias for semantic clarity
export const CategoryDistribution = BureauDistribution;
