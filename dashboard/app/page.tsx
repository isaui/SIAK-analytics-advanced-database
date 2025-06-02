import { Calendar } from 'lucide-react';
import StatCards from './components/stat-cards';
import DashboardCharts from './components/dashboard-charts';
import QuickStats from './components/quick-stats';
import { DashboardStats } from './actions/warehouse-stats';

async function fetchDashboardStats() {
  try {
    // Gunakan API route untuk menghindari koneksi database saat build time
    const host = process.env.VERCEL_URL || 'http://localhost:3000';
    const baseUrl = `${host}`;
    
    const res = await fetch(`${baseUrl}/api/warehouse?endpoint=all`, { cache: 'no-store' });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }
    
    return await res.json() as DashboardStats;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Return empty data structure in case of error
    return {
      registration: { total: 0, semesterTrend: [], programDistribution: [] },
      financials: { totalRevenue: 0, paidPercentage: 0, revenueByFeeType: [], paymentTrend: [] },
      academics: { totalRecords: 0, averageGpa: 0, gpaDistribution: [], programPerformance: [] },
      attendance: { totalRecords: 0, attendanceRate: 0, trendsOverTime: [], byDayOfWeek: [] },
      teaching: { totalClasses: 0, activeLecturers: 0, avgTeachingHours: 0, teachingLoadDistribution: [] },
      rooms: { totalBookings: 0, utilizationRate: 0, topRooms: [], usageByTimeOfDay: [] }
    };
  }
}

// Main dashboard page (Server Component)
export default async function DashboardPage() {
  // Fetch dashboard stats via API route
  const stats = await fetchDashboardStats();

  return (
    <div className="min-h-screen bg-gray-900">

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics Overview */}
        <StatCards stats={stats} />

        {/* Analytics Charts */}
        <div className="mt-12 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Analytics Overview</h2>
          <DashboardCharts data={stats} />
        </div>

        {/* Quick Stats Summary */}
        <QuickStats stats={stats} />
      </div>
    </div>
  );
}