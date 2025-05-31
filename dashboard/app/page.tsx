import { DashboardCharts } from '@/components/dashboard-charts';
import { query } from '@/utils/db';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  DollarSign, 
  CheckCircle, 
  UserCheck, 
  Building,
  Calendar,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
// Types for our dashboard data
interface DashboardStats {
  fact_registration: {
    total: number;
    recent: number;
  };
  fact_fee: {
    total: number;
    totalAmount: number;
    paid: number;
  };
  fact_academic: {
    total: number;
    avgGpa: number;
  };
  fact_grade: {
    total: number;
    avgGrade: number;
  };
  fact_attendance: {
    total: number;
    attendanceRate: number;
  };
  fact_teaching: {
    total: number;
    totalHours: number;
    activeLecturers: number;
  };
  fact_room_usage: {
    total: number;
    avgUtilization: number;
    activeRooms: number;
  };
  charts: {
    registrationTrend: Array<{ semester: string; count: number }>;
    gradeDistribution: Array<{ grade: string; count: number }>;
    attendanceTrend: Array<{ month: string; rate: number }>;
    roomUtilization: Array<{ room: string; utilization: number }>;
  };
}

// Fetch dashboard stats from database
async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [
      registrationStats,
      feeStats,
      academicStats,
      gradeStats,
      attendanceStats,
      teachingStats,
      roomUsageStats,
      registrationTrend,
      gradeDistribution,
      attendanceTrend,
      roomUtilization
    ] = await Promise.all([
      // Registration stats
      query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN registration_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent
        FROM fact_registration
      `),
      
      // Fee stats
      query(`
        SELECT 
          COUNT(*) as total,
          COALESCE(SUM(fee_amount), 0) as total_amount,
          COUNT(CASE WHEN payment_date IS NOT NULL THEN 1 END) as paid
        FROM fact_fee
      `),
      
      // Academic stats
      query(`
        SELECT 
          COUNT(*) as total,
          COALESCE(AVG(cumulative_gpa), 0) as avg_gpa
        FROM fact_academic
        WHERE cumulative_gpa > 0
      `),
      
      // Grade stats
      query(`
        SELECT 
          COUNT(*) as total,
          COALESCE(AVG(final_grade), 0) as avg_grade
        FROM fact_grade
        WHERE final_grade IS NOT NULL AND final_grade > 0
      `),
      
      // Attendance stats
      query(`
        SELECT 
          COUNT(*) as total,
          CASE 
            WHEN COUNT(*) > 0 THEN 
              (COUNT(CASE WHEN check_in_time IS NOT NULL THEN 1 END) * 100.0 / COUNT(*))
            ELSE 0 
          END as attendance_rate
        FROM fact_attendance
      `),
      
      // Teaching stats
      query(`
        SELECT 
          COUNT(*) as total,
          COALESCE(SUM(teaching_hours), 0) as total_hours,
          COUNT(DISTINCT lecturer_id) as active_lecturers
        FROM fact_teaching
      `),
      
      // Room usage stats
      query(`
        SELECT 
          COUNT(*) as total,
          COALESCE(AVG(utilization_rate), 0) as avg_utilization,
          COUNT(DISTINCT room_id) as active_rooms
        FROM fact_room_usage
      `),

      // Charts data: Registration trend by semester
      query(`
        SELECT 
          ds.semester_code as semester,
          COUNT(fr.registration_id) as count
        FROM dim_semester ds
        LEFT JOIN fact_registration fr ON ds.semester_id = fr.semester_id
        GROUP BY ds.semester_id, ds.semester_code
        ORDER BY ds.semester_code
        LIMIT 6
      `),

      // Grade distribution
      query(`
        SELECT 
          letter_grade as grade,
          COUNT(*) as count
        FROM fact_grade
        WHERE letter_grade IS NOT NULL
        GROUP BY letter_grade
        ORDER BY letter_grade
      `),

      // Attendance trend by month
      query(`
        SELECT 
          TO_CHAR(attendance_date, 'Mon YYYY') as month,
          AVG(CASE WHEN check_in_time IS NOT NULL THEN 100.0 ELSE 0.0 END) as rate
        FROM fact_attendance
        WHERE attendance_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', attendance_date), TO_CHAR(attendance_date, 'Mon YYYY')
        ORDER BY DATE_TRUNC('month', attendance_date)
      `),

      // Room utilization by room
      query(`
        SELECT 
          CONCAT('Room ', dr.room_id) as room,
          AVG(fru.utilization_rate) as utilization
        FROM fact_room_usage fru
        JOIN dim_room dr ON fru.room_id = dr.room_id
        GROUP BY dr.room_id
        ORDER BY AVG(fru.utilization_rate) DESC
        LIMIT 10
      `)
    ]);

    return {
      fact_registration: {
        total: parseInt(registrationStats.rows[0]?.total || '0'),
        recent: parseInt(registrationStats.rows[0]?.recent || '0')
      },
      fact_fee: {
        total: parseInt(feeStats.rows[0]?.total || '0'),
        totalAmount: parseFloat(feeStats.rows[0]?.total_amount || '0'),
        paid: parseInt(feeStats.rows[0]?.paid || '0')
      },
      fact_academic: {
        total: parseInt(academicStats.rows[0]?.total || '0'),
        avgGpa: parseFloat(academicStats.rows[0]?.avg_gpa || '0')
      },
      fact_grade: {
        total: parseInt(gradeStats.rows[0]?.total || '0'),
        avgGrade: parseFloat(gradeStats.rows[0]?.avg_grade || '0')
      },
      fact_attendance: {
        total: parseInt(attendanceStats.rows[0]?.total || '0'),
        attendanceRate: parseFloat(attendanceStats.rows[0]?.attendance_rate || '0')
      },
      fact_teaching: {
        total: parseInt(teachingStats.rows[0]?.total || '0'),
        totalHours: parseFloat(teachingStats.rows[0]?.total_hours || '0'),
        activeLecturers: parseInt(teachingStats.rows[0]?.active_lecturers || '0')
      },
      fact_room_usage: {
        total: parseInt(roomUsageStats.rows[0]?.total || '0'),
        avgUtilization: parseFloat(roomUsageStats.rows[0]?.avg_utilization || '0'),
        activeRooms: parseInt(roomUsageStats.rows[0]?.active_rooms || '0')
      },
      charts: {
        registrationTrend: registrationTrend.rows.map(row => ({
          semester: row.semester || 'N/A',
          count: parseInt(row.count || '0')
        })),
        gradeDistribution: gradeDistribution.rows.map(row => ({
          grade: row.grade || 'N/A',
          count: parseInt(row.count || '0')
        })),
        attendanceTrend: attendanceTrend.rows.map(row => ({
          month: row.month || 'N/A',
          rate: parseFloat(row.rate || '0')
        })),
        roomUtilization: roomUtilization.rows.map(row => ({
          room: row.room || 'N/A',
          utilization: parseFloat(row.utilization || '0')
        }))
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return empty stats if database error
    return {
      fact_registration: { total: 0, recent: 0 },
      fact_fee: { total: 0, totalAmount: 0, paid: 0 },
      fact_academic: { total: 0, avgGpa: 0 },
      fact_grade: { total: 0, avgGrade: 0 },
      fact_attendance: { total: 0, attendanceRate: 0 },
      fact_teaching: { total: 0, totalHours: 0, activeLecturers: 0 },
      fact_room_usage: { total: 0, avgUtilization: 0, activeRooms: 0 },
      charts: {
        registrationTrend: [],
        gradeDistribution: [],
        attendanceTrend: [],
        roomUtilization: []
      }
    };
  }
}

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
    <Link href={href} className="block group">
      <div className={`bg-white rounded-xl shadow-lg border-l-4 ${color} p-6 hover:shadow-xl transition-all duration-200 group-hover:scale-105`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${color.replace('border-l-', 'bg-').replace('-500', '-100')}`}>
              {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
        
        <div className="space-y-3">
          {stats.map((stat, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{stat.label}</span>
              <span className="text-lg font-bold text-gray-800">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

// Main dashboard page (Server Component)
export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const dashboardCards = [
    {
      title: 'Student Registrations',
      icon: <Users className="w-6 h-6 text-blue-600" />,
      stats: [
        { label: 'Total Registrations', value: stats.fact_registration.total.toLocaleString() },
        { label: 'This Semester', value: stats.fact_registration.recent.toLocaleString() }
      ],
      href: '/dashboard/registrations',
      color: 'border-l-blue-500'
    },
    {
      title: 'Student Fees',
      icon: <DollarSign className="w-6 h-6 text-green-600" />,
      stats: [
        { label: 'Total Fees', value: `Rp ${(stats.fact_fee.totalAmount / 1000000).toFixed(1)}M` },
        { label: 'Payments Made', value: stats.fact_fee.paid.toLocaleString() }
      ],
      href: '/dashboard/fees',
      color: 'border-l-green-500'
    },
    {
      title: 'Academic Records',
      icon: <GraduationCap className="w-6 h-6 text-purple-600" />,
      stats: [
        { label: 'Total Records', value: stats.fact_academic.total.toLocaleString() },
        { label: 'Average GPA', value: stats.fact_academic.avgGpa.toFixed(2) }
      ],
      href: '/dashboard/academic',
      color: 'border-l-purple-500'
    },
    {
      title: 'Grades',
      icon: <BookOpen className="w-6 h-6 text-indigo-600" />,
      stats: [
        { label: 'Total Grades', value: stats.fact_grade.total.toLocaleString() },
        { label: 'Average Score', value: stats.fact_grade.avgGrade.toFixed(1) }
      ],
      href: '/dashboard/grades',
      color: 'border-l-indigo-500'
    },
    {
      title: 'Attendance',
      icon: <CheckCircle className="w-6 h-6 text-emerald-600" />,
      stats: [
        { label: 'Total Records', value: stats.fact_attendance.total.toLocaleString() },
        { label: 'Attendance Rate', value: `${stats.fact_attendance.attendanceRate.toFixed(1)}%` }
      ],
      href: '/dashboard/attendance',
      color: 'border-l-emerald-500'
    },
    {
      title: 'Teaching Load',
      icon: <UserCheck className="w-6 h-6 text-orange-600" />,
      stats: [
        { label: 'Teaching Sessions', value: stats.fact_teaching.total.toLocaleString() },
        { label: 'Total Hours', value: `${stats.fact_teaching.totalHours.toLocaleString()}h` },
        { label: 'Active Lecturers', value: stats.fact_teaching.activeLecturers.toLocaleString() }
      ],
      href: '/dashboard/teaching',
      color: 'border-l-orange-500'
    },
    {
      title: 'Room Utilization',
      icon: <Building className="w-6 h-6 text-cyan-600" />,
      stats: [
        { label: 'Usage Records', value: stats.fact_room_usage.total.toLocaleString() },
        { label: 'Avg Utilization', value: `${stats.fact_room_usage.avgUtilization.toFixed(1)}%` },
        { label: 'Active Rooms', value: stats.fact_room_usage.activeRooms.toLocaleString() }
      ],
      href: '/dashboard/rooms',
      color: 'border-l-cyan-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">SIAK Data Warehouse</h1>
              <p className="text-gray-600">Analytics and insights from your academic data</p>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Generated: {new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dashboardCards.map((card, index) => (
            <StatCard
              key={index}
              title={card.title}
              icon={card.icon}
              stats={card.stats}
              href={card.href}
              color={card.color}
            />
          ))}
        </div>

        {/* Charts Section */}
        <div className="mt-8 mb-8">
          <div className="flex items-center mb-6">
            <TrendingUp className="w-6 h-6 text-gray-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-800">Analytics Overview</h2>
          </div>
          <DashboardCharts chartData={stats.charts} />
        </div>

        {/* Quick Stats Summary */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.fact_registration.total.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Registrations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Rp {(stats.fact_fee.totalAmount / 1000000).toFixed(1)}M</div>
              <div className="text-sm text-gray-600">Total Fee Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.fact_academic.avgGpa.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Average GPA</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.fact_attendance.attendanceRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Attendance Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}