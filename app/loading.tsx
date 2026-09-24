import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col w-full gap-6 animate-pulse">
      {/* Banner Skeleton */}
      <div className="h-44 rounded-xl bg-amber-100/60 border border-amber-200" />

      {/* 5 Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-white border border-amber-200/60 p-4 space-y-3">
            <div className="h-4 bg-amber-100 rounded w-1/2" />
            <div className="h-7 bg-amber-200 rounded w-1/3" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
          </div>
        ))}
      </div>

      {/* 3 Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 h-72 rounded-xl bg-white border border-amber-200/60 p-6" />
        <div className="lg:col-span-4 h-72 rounded-xl bg-white border border-amber-200/60 p-6" />
        <div className="lg:col-span-3 h-72 rounded-xl bg-white border border-amber-200/60 p-6" />
      </div>

      {/* Table Skeleton */}
      <div className="h-80 rounded-xl bg-white border border-amber-200/60 p-6" />
    </div>
  );
}
