'use client';

import React from 'react';
import { Info, ArrowRight } from 'lucide-react';
import { MOCK_FOLLOW_UP_STATUS } from '@/lib/mock-data';
import { FollowUpStatusMetric } from '@/lib/types';

interface FollowUpStatusChartProps {
  onManageMatrixClick?: () => void;
  followUpData?: FollowUpStatusMetric[];
  totalResolutions?: number;
}

export function FollowUpStatusChart({
  onManageMatrixClick,
  followUpData = MOCK_FOLLOW_UP_STATUS,
  totalResolutions,
}: FollowUpStatusChartProps) {
  const data = followUpData && followUpData.length > 0 ? followUpData : MOCK_FOLLOW_UP_STATUS;
  const total = totalResolutions !== undefined ? totalResolutions : data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="lg:col-span-4 rounded-xl bg-white p-6 shadow-sm border border-amber-200/60 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="font-semibold text-[12px] text-amber-700 uppercase tracking-wider">
              Matriks Monitoring
            </span>
            <h2 className="font-bold text-[18px] text-slate-900">
              Status Tindak Lanjut
            </h2>
            <p className="text-[13px] text-slate-500 mt-1">
              Total {total} butir kesepakatan dewan
            </p>
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-amber-700 p-1 cursor-pointer transition-colors"
            title="Info Metrik Tindak Lanjut"
            onClick={() => alert('Metrik dihitung otomatis berdasarkan laporan pemantauan PIC biro pelaksana.')}
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Donut Chart & Legend */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-6">
          {/* Donut Gauge SVG */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#FEF3C7"
                strokeWidth="12"
              />

              {/* Dynamic Segments */}
              {data.map((item, idx) => (
                <circle
                  key={item.label || idx}
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="12"
                  strokeDasharray={item.dasharray}
                  strokeDashoffset={item.dashoffset}
                  className="transition-all duration-500"
                />
              ))}
            </svg>

            {/* Center Label */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="font-bold text-[20px] text-slate-900 leading-none">
                {total}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">
                Resolusi
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 w-full sm:w-auto">
            {data.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 text-slate-800 text-[12px]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: item.color,
                      border: item.borderColor ? `1px solid ${item.borderColor}` : undefined,
                    }}
                  />
                  <span className="font-medium text-slate-700">{item.label}</span>
                </div>
                <span
                  className="font-bold"
                  style={{ color: item.color === '#DC2626' ? '#DC2626' : '#92400E' }}
                >
                  {item.percentage}% ({item.count})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action link */}
      <div className="mt-4 pt-2">
        <button
          type="button"
          onClick={onManageMatrixClick}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-colors text-amber-800 font-semibold text-[13px] cursor-pointer"
        >
          <span>Kelola Matriks &amp; Disposisi</span>
          <ArrowRight className="w-4 h-4 text-amber-700" />
        </button>
      </div>
    </div>
  );
}
