'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Meeting } from '@/lib/types';
import { FolderOpen, ChevronRight, RotateCcw } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { cn } from '@/lib/utils';

export interface CategoryWorkloadItem {
  key: string;
  label: string;
  count: number;
  percentage: number;
  barColor: string;
  textColor: string;
  icon: string;
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
  icon: string;
  barColor: string;
  textColor: string;
}> = [
    {
      key: 'UNDANGAN_INTERNAL',
      label: 'Undangan Internal',
      icon: '🏢',
      barColor: 'bg-[#31889C]',
      textColor: 'text-[#31889C]',
    },
    {
      key: 'DISPOSISI_Setjen',
      label: 'Disposisi Setjen',
      icon: '🏛️',
      barColor: 'bg-indigo-600',
      textColor: 'text-indigo-600',
    },
    {
      key: 'NASKAH_MASUK',
      label: 'Daftar Naskah Masuk',
      icon: '📥',
      barColor: 'bg-amber-500',
      textColor: 'text-amber-600',
    },
    {
      key: 'DISPOSISI_BIRO',
      label: 'Disposisi Biro',
      icon: '📑',
      barColor: 'bg-purple-600',
      textColor: 'text-purple-600',
    },
    {
      key: 'SURAT_DITUNDA',
      label: 'Tunda Kegiatan',
      icon: '⏳',
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
    <div className={cn("rounded-2xl bg-white p-6 shadow-xs border border-slate-200 flex flex-col justify-between transition-all duration-300 hover:shadow-md", className || "lg:col-span-5")}>
      <div>
        {/* Card Header with Replay Action */}
        <div className="flex items-start justify-between">
          <div>
            <span className="font-semibold text-[11px] text-[#31889C] uppercase tracking-wider flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-[#31889C]" />
              <span>Klasifikasi Dokumen</span>
            </span>
            <h2 className="font-bold text-[18px] text-slate-900 mt-0.5">
              Kegiatan per Kategori
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Distribusi aktivitas &amp; kegiatan per kategori naskah
            </p>
          </div>

          <button
            type="button"
            onClick={handleReplay}
            className="text-slate-400 hover:text-[#31889C] p-1.5 rounded-lg hover:bg-[#F0F9FA] cursor-pointer transition-all duration-200 hover:rotate-180"
            title="Putar ulang animasi progres kategori"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Animated Progress Bars per Category */}
        <div className="mt-4 space-y-2">
          {categories.map((cat, idx) => (
            <div
              key={cat.key}
              role="button"
              tabIndex={0}
              style={{
                transition: 'all 600ms cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: isAnimated ? `${idx * 70}ms` : '0ms',
                transform: isAnimated ? 'translateY(0)' : 'translateY(12px)',
                opacity: isAnimated ? 1 : 0,
              }}
              className="p-2 -mx-2 rounded-xl hover:bg-[#F0F9FA] border border-transparent hover:border-[#BCE3EB] transition-all cursor-pointer group"
              onClick={() => handleItemClick(cat.key)}
              title={`Klik untuk memfilter arsip kegiatan berdasarkan kategori ${cat.label}`}
            >
              {/* Row Header: Category Name + Count */}
              <div className="flex items-center justify-between text-[12px] mb-1.5 gap-2">
                <span
                  className="font-bold text-slate-800 group-hover:text-[#215865] transition-colors truncate flex-1 min-w-0 flex items-center gap-1.5"
                  title={cat.label}
                >
                  <span className="text-[13px] shrink-0">{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </span>

                <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <span className={`font-extrabold ${cat.textColor} text-[12px] tabular-nums`}>
                    {isAnimated ? (
                      <AnimatedCounter value={cat.count} duration={800 + idx * 70} />
                    ) : (
                      0
                    )}{' '}
                    Kegiatan
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#31889C] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>

              {/* Animated Progress Bar Track with Shimmer Shine */}
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                <div
                  className={`h-full ${cat.barColor} rounded-full transition-all duration-900 ease-out relative ${isAnimated ? 'animate-shimmer' : ''
                    }`}
                  style={{
                    width: isAnimated ? `${Math.max(cat.percentage, cat.count > 0 ? 8 : 0)}%` : '0%',
                    transitionDelay: isAnimated ? `${120 + idx * 90}ms` : '0ms',
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
          <span>Klik kategori untuk memfilter daftar kegiatan</span>
        </span>
      </div>
    </div>
  );
}

// Export alias for semantic clarity
export const CategoryDistribution = BureauDistribution;
