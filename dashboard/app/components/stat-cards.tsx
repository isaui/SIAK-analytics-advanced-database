'use client'

import React from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  DollarSign,
  CheckCircle,
  UserCheck,
  Building,
  ChevronRight,
  BarChart4
} from 'lucide-react';

// Individual stat card component
interface StatCardProps {
  title: string;
  icon: React.ReactNode;
  stats: { label: string; value: string | number }[];
  href: string;
  color: string;
}

function StatCard({ title, icon, stats, href, color }: StatCardProps) {
  return (
    <Link href={href} className="block group h-full">
      <div className={`bg-gray-800 rounded-xl shadow-lg border-l-4 ${color} p-6 hover:shadow-xl hover:bg-gray-750 transition-all duration-200 group-hover:scale-105 h-full flex flex-col`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${color.replace('border-l-', 'bg-').replace('-500', '-900/20')} border ${color.replace('border-l-', 'border-').replace('-500', '-500/30')}`}>
              {icon}
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors" />
        </div>
        
        <div className="space-y-3 flex-grow">
          {stats.map((stat, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm text-gray-400">{stat.label}</span>
              <span className="text-lg font-bold text-white">{stat.value}</span>
            </div>
          ))}
          {/* Add spacer if there are fewer stats to maintain consistent height */}
          {stats.length < 3 && <div className="flex-grow"></div>}
        </div>
      </div>
    </Link>
  );
}

interface StatCardsProps {
  stats: {
    registration: {
      total: number;
    };
    financials: {
      totalRevenue: number;
      paidPercentage: number;
    };
    academics: {
      totalRecords: number;
      averageGpa: number;
    };
    attendance: {
      totalRecords: number;
      attendanceRate: number;
    };
    teaching: {
      totalClasses: number;
      activeLecturers: number;
      avgTeachingHours: number;
    };
    rooms: {
      totalBookings: number;
      utilizationRate: number;
    };
  }
}

export default function StatCards({ stats }: StatCardsProps) {
  const dashboardCards = [
    {
      title: 'Student Registrations',
      icon: <Users className="w-6 h-6 text-blue-400" />,
      stats: [
        { label: 'Total Registrations', value: stats.registration.total.toLocaleString() }
      ],
      href: '/dashboard/registrations',
      color: 'border-l-blue-500'
    },
    {
      title: 'Financial Overview',
      icon: <DollarSign className="w-6 h-6 text-green-400" />,
      stats: [
        { label: 'Total Revenue', value: `Rp ${(stats.financials.totalRevenue / 1000000).toFixed(1)}M` },
        { label: 'Payment Rate', value: `${stats.financials.paidPercentage.toFixed(1)}%` }
      ],
      href: '/dashboard/finances',
      color: 'border-l-green-500'
    },
    {
      title: 'Academic Performance',
      icon: <GraduationCap className="w-6 h-6 text-purple-400" />,
      stats: [
        { label: 'Total Records', value: stats.academics.totalRecords.toLocaleString() },
        { label: 'Average GPA', value: stats.academics.averageGpa.toFixed(2) }
      ],
      href: '/dashboard/academics',
      color: 'border-l-purple-500'
    },
    {
      title: 'Attendance Tracking',
      icon: <CheckCircle className="w-6 h-6 text-emerald-400" />,
      stats: [
        { label: 'Total Records', value: stats.attendance.totalRecords.toLocaleString() }
      ],
      href: '/dashboard/attendance',
      color: 'border-l-emerald-500'
    },
    {
      title: 'Teaching Workload',
      icon: <UserCheck className="w-6 h-6 text-orange-400" />,
      stats: [
        { label: 'Total Classes', value: stats.teaching.totalClasses.toLocaleString() },
        { label: 'Active Lecturers', value: stats.teaching.activeLecturers.toLocaleString() },
        { label: 'Avg Hours/Class', value: `${stats.teaching.avgTeachingHours.toFixed(1)}h` }
      ],
      href: '/dashboard/teaching',
      color: 'border-l-orange-500'
    },
    {
      title: 'Room Utilization',
      icon: <Building className="w-6 h-6 text-cyan-400" />,
      stats: [
        { label: 'Total Bookings', value: stats.rooms.totalBookings.toLocaleString() },
        { label: 'Utilization Rate', value: `${stats.rooms.utilizationRate.toFixed(1)}%` }
      ],
      href: '/dashboard/rooms',
      color: 'border-l-cyan-500'
    }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center mb-6">
        <BarChart4 className="w-6 h-6 text-gray-400 mr-3" />
        <h2 className="text-2xl font-semibold text-white">Key Metrics</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardCards.map((card, index) => (
          <div key={index} className="h-full">
            <StatCard
              title={card.title}
              icon={card.icon}
              stats={card.stats}
              href={card.href}
              color={card.color}
            />
          </div>
        ))}
      </div>
    </div>
  );
}