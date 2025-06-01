'use client'

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// Dark theme chart color palettes
const COLORS = [
  '#60a5fa', // blue-400
  '#34d399', // emerald-400
  '#a78bfa', // violet-400
  '#fbbf24', // amber-400
  '#f87171', // red-400
  '#818cf8', // indigo-400
  '#f472b6', // pink-400
  '#2dd4bf', // teal-400
  '#fb923c', // orange-400
  '#a3e635'  // lime-400
];

interface DashboardChartsProps {
  data: {
    registration: {
      semesterTrend: Array<{ semester: string; count: number }>;
      programDistribution: Array<{ program: string; count: number }>;
    };
    academics: {
      gpaDistribution: Array<{ gpaRange: string; count: number }>;
      programPerformance: Array<{ program: string; avgGpa: number }>;
    };
    financials: {
      revenueByFeeType: Array<{ feeType: string; amount: number }>;
      paymentTrend: Array<{ month: string; amount: number }>;
    };
    attendance: {
      byDayOfWeek: Array<{ day: string; rate: number }>;
    };
    rooms: {
      topRooms: Array<{ room: string; utilization: number }>;
      usageByTimeOfDay: Array<{ timeSlot: string; count: number }>;
    };
  };
}

// Custom tooltip formatter to format large numbers
const formatNumber = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
};

// Format currency as Rupiah
const formatRupiah = (value: number) => {
  return `Rp ${formatNumber(value)}`;
};

// Custom dark theme tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
        <p className="text-gray-300 text-sm">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-white text-sm">
            <span style={{ color: entry.color }}>{entry.name}: </span>
            {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Dashboard charts component
export default function DashboardCharts({ data }: DashboardChartsProps) {
  // No view mode state needed as attendance chart is removed
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Registration Trend Chart */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-white">Registration Trend by Semester (Last 6 Semesters)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.registration.semesterTrend}
              margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="semester"
                angle={-45}
                textAnchor="end"
                tickMargin={10}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={formatNumber} 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <Tooltip 
                content={<CustomTooltip />}
                formatter={(value) => [formatNumber(value as number), 'Registrations']} 
              />
              <Bar 
                dataKey="count" 
                name="Registrations" 
                fill="#60a5fa"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Program Distribution Chart */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-white">Registration by Program</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.registration.programDistribution.slice(0, 5)}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                type="number" 
                tickFormatter={formatNumber}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis 
                type="category" 
                dataKey="program"
                width={90}
                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <Tooltip 
                content={<CustomTooltip />}
                formatter={(value) => [formatNumber(value as number), 'Students']} 
              />
              <Bar 
                dataKey="count" 
                name="Students" 
                fill="#34d399"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* Payment by Semester Chart */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-white">Payment Amount by Semester</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.financials.paymentTrend}
              margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="month"
                angle={-45}
                textAnchor="end"
                tickMargin={10}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => formatRupiah(value)}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <Tooltip 
                content={<CustomTooltip />}
                formatter={(value) => [(value as number).toLocaleString(), 'Students']} 
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                name="Revenue" 
                stroke="#10b981"
                fill="#34d399"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GPA Distribution Chart */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-white">GPA Distribution</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.academics.gpaDistribution}
              margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="gpaRange"
                angle={-45}
                textAnchor="end"
                tickMargin={10}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={formatNumber}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <Tooltip 
                content={<CustomTooltip />}
                formatter={(value) => [formatNumber(value as number), 'Students']} 
              />
              <Bar 
                dataKey="count" 
                name="Students" 
                fill="#a78bfa"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Program Performance Chart */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-white">Academic Performance by Program</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.academics.programPerformance}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                type="number" 
                domain={[0, 4]} 
                tickFormatter={(value) => value.toFixed(2)}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis 
                type="category" 
                dataKey="program"
                width={90}
                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <Tooltip 
                content={<CustomTooltip />}
                formatter={(value) => [(value as number).toFixed(2), 'Average GPA']} 
              />
              <Bar 
                dataKey="avgGpa" 
                name="Average GPA" 
                fill="#a78bfa"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>



      {/* Room Utilization Chart */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-white">Top 5 Rooms by Utilization Rate</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.rooms.topRooms.slice(0, 5)}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                type="number" 
                domain={[0, 100]} 
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis 
                type="category" 
                dataKey="room"
                width={90}
                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <Tooltip 
                content={<CustomTooltip />}
                formatter={(value) => [`${value}%`, 'Utilization Rate']} 
              />
              <Bar 
                dataKey="utilization" 
                name="Utilization" 
                fill="#818cf8"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Room Usage by Time Chart */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-white">Room Usage by Time</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.rooms.usageByTimeOfDay}
              margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="timeSlot"
                angle={-45}
                textAnchor="end"
                tickMargin={10}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={formatNumber}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <Tooltip 
                content={<CustomTooltip />}
                formatter={(value) => [formatNumber(value as number), 'Bookings']} 
              />
              <Bar 
                dataKey="count" 
                name="Bookings" 
                fill="#2dd4bf"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}