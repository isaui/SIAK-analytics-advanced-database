'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

interface ChartData {
  registrationTrend: Array<{ semester: string; count: number }>;
  gradeDistribution: Array<{ grade: string; count: number }>;
  attendanceTrend: Array<{ month: string; rate: number }>;
  roomUtilization: Array<{ room: string; utilization: number }>;
}

interface DashboardChartsProps {
  chartData: ChartData;
}

// Color schemes for different charts
const COLORS = {
  primary: ['#3B82F6', '#1D4ED8', '#1E40AF', '#1E3A8A'],
  success: ['#10B981', '#059669', '#047857', '#065F46'],
  warning: ['#F59E0B', '#D97706', '#B45309', '#92400E'],
  purple: ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6'],
  emerald: ['#10B981', '#059669', '#047857', '#065F46'],
  rose: ['#F43F5E', '#E11D48', '#BE123C', '#9F1239'],
  cyan: ['#06B6D4', '#0891B2', '#0E7490', '#155E75']
};

const GRADE_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6'];

export function DashboardCharts({ chartData }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Registration Trend */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Registration Trend by Semester</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.registrationTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="semester" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: '#F9FAFB', 
                border: '1px solid #E5E7EB',
                borderRadius: '8px'
              }}
            />
            <Bar 
              dataKey="count" 
              fill={COLORS.primary[0]}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Grade Distribution */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Grade Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData.gradeDistribution}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="count"
              label={({ grade, percent }: any) => `${grade} (${(percent * 100).toFixed(0)}%)`}
              labelLine={false}
              fontSize={12}
            >
              {chartData.gradeDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={GRADE_COLORS[index % GRADE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#F9FAFB', 
                border: '1px solid #E5E7EB',
                borderRadius: '8px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Attendance Trend */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Rate Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData.attendanceTrend}>
            <defs>
              <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.emerald[0]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS.emerald[0]} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: '#F9FAFB', 
                border: '1px solid #E5E7EB',
                borderRadius: '8px'
              }}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke={COLORS.emerald[0]}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#attendanceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Room Utilization */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Room Utilization</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.roomUtilization} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              tick={{ fontSize: 12 }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis 
              dataKey="room" 
              type="category" 
              tick={{ fontSize: 12 }}
              width={80}
            />
            <Tooltip 
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: '#F9FAFB', 
                border: '1px solid #E5E7EB',
                borderRadius: '8px'
              }}
            />
            <Bar 
              dataKey="utilization" 
              fill={COLORS.cyan[0]}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}