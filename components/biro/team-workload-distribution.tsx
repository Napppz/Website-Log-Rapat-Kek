'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Briefcase, Network, Radio, Laptop, ShieldCheck } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/animated-counter';

interface TeamItem {
  id: string;
  code: string;
  name: string;
  meetingCount: number;
}

interface TeamWorkloadDistributionProps {
  biroShortName: string;
  teams: TeamItem[];
  totalMeetings: number;
  meetingStatusBreakdown?: {
    approved: number;
    review: number;
    draft: number;
  };
}

function getTeamIcon(code: string) {
  switch (code.toUpperCase()) {
    case 'INV':
      return <Briefcase className="w-4 h-4 text-[#31889C]" />;
    case 'KS':
      return <Network className="w-4 h-4 text-[#2E7D32]" />;
    case 'KOM':
      return <Radio className="w-4 h-4 text-[#D97706]" />;
    case 'SI':
      return <Laptop className="w-4 h-4 text-[#0284C7]" />;
    default:
      return <Layers className="w-4 h-4 text-[#31889C]" />;
  }
}

export function TeamWorkloadDistribution({
  biroShortName,
  teams,
  totalMeetings,
  meetingStatusBreakdown,
}: TeamWorkloadDistributionProps) {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 120);
    return () => clearTimeout(timer);
  }, []);

  const hasTeams = teams && teams.length > 0;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between col-span-1 lg:col-span-3 h-full hover:shadow-md transition-all duration-300">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-[15px] text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#31889C]" />
              {hasTeams ? `Beban Rapat Tim Kerja` : `Distribusi Status Rapat`}
            </h3>
            <p className="text-[11.5px] text-slate-500 mt-0.5 truncate max-w-[200px]" title={biroShortName}>
              {hasTeams
                ? `Alokasi sesi rapat di ${biroShortName}`
                : `Status pengesahan rapat ${biroShortName}`}
            </p>
          </div>
          <span className="text-[11px] font-bold text-[#31889C] bg-[#E8F5F7] px-2 py-0.5 rounded-full border border-[#BCE3EB] shrink-0">
            {totalMeetings} Agenda
          </span>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-3.5">
          {hasTeams ? (
            teams.map((t) => {
              const pct = totalMeetings > 0 ? Math.round((t.meetingCount / totalMeetings) * 100) : 0;
              return (
                <div key={t.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                      <div className="w-5 h-5 rounded-md bg-[#F0F9FA] border border-[#BCE3EB] flex items-center justify-center shrink-0">
                        {getTeamIcon(t.code)}
                      </div>
                      <span className="font-bold text-slate-800 truncate text-[12px]" title={t.name}>
                        {t.name.startsWith('Tim ') ? t.name : `Tim ${t.name}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-bold text-slate-900 text-[12px]">
                        <AnimatedCounter value={t.meetingCount} />
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#31889C] to-[#266F80] rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: isAnimated ? `${Math.max(pct, t.meetingCount > 0 ? 8 : 0)}%` : '0%',
                      }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <>
              {/* Fallback to status breakdown when biro operates centrally */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Disetujui / Sah
                  </span>
                  <span className="font-bold text-slate-900">
                    <AnimatedCounter value={meetingStatusBreakdown?.approved || 0} />
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: isAnimated
                        ? `${
                            totalMeetings > 0
                              ? Math.round(
                                  ((meetingStatusBreakdown?.approved || 0) / totalMeetings) * 100
                                )
                              : 0
                          }%`
                        : '0%',
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Menunggu Review
                  </span>
                  <span className="font-bold text-slate-900">
                    <AnimatedCounter value={meetingStatusBreakdown?.review || 0} />
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: isAnimated
                        ? `${
                            totalMeetings > 0
                              ? Math.round(
                                  ((meetingStatusBreakdown?.review || 0) / totalMeetings) * 100
                                )
                              : 0
                          }%`
                        : '0%',
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    Draft Notula
                  </span>
                  <span className="font-bold text-slate-900">
                    <AnimatedCounter value={meetingStatusBreakdown?.draft || 0} />
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: isAnimated
                        ? `${
                            totalMeetings > 0
                              ? Math.round(
                                  ((meetingStatusBreakdown?.draft || 0) / totalMeetings) * 100
                                )
                              : 0
                          }%`
                        : '0%',
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Unit Kerja KEK
        </span>
        <span className="font-bold text-[#31889C]">{biroShortName}</span>
      </div>
    </div>
  );
}
