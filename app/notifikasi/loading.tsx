import React from 'react';

export default function NotifikasiLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Header Banner Skeleton */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-4 w-40 bg-slate-200 rounded mb-2"></div>
          <div className="h-7 w-64 bg-slate-200 rounded mb-2"></div>
          <div className="h-4 w-96 max-w-full bg-slate-100 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-slate-200 rounded-lg"></div>
          <div className="h-9 w-36 bg-slate-200 rounded-lg"></div>
        </div>
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
        <div className="h-8 w-32 bg-slate-100 rounded-lg"></div>
        <div className="h-8 w-44 bg-slate-100 rounded-lg"></div>
        <div className="h-8 w-40 bg-slate-100 rounded-lg"></div>
      </div>

      {/* Notification Cards Skeleton */}
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-slate-200 bg-white flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0"></div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="h-4 w-60 bg-slate-200 rounded"></div>
                <div className="h-3 w-16 bg-slate-100 rounded"></div>
              </div>
              <div className="h-3.5 w-full max-w-xl bg-slate-100 rounded mb-3"></div>
              <div className="h-3 w-32 bg-slate-100 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
