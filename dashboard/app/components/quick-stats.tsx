'use client'

import { PieChart } from 'lucide-react';

interface QuickStatsProps {
  stats: {
    registration: {
      total: number;
    };
    financials: {
      totalRevenue: number;
    };
    academics: {
      averageGpa: number;
    };
    attendance: {
      totalRecords: number;
    };
  }
}

export default function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="mt-12 bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
      <div className="flex items-center mb-4">
        <PieChart className="w-5 h-5 text-gray-400 mr-2" />
        <h2 className="text-xl font-semibold text-white">At a Glance</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.registration.total.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Total Registrations</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">Rp {(stats.financials.totalRevenue / 1000000).toFixed(1)}M</div>
          <div className="text-sm text-gray-400">Total Revenue</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.academics.averageGpa.toFixed(2)}</div>
          <div className="text-sm text-gray-400">Average GPA</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400">{stats.attendance.totalRecords.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Attendance Records</div>
        </div>
      </div>
    </div>
  );
}