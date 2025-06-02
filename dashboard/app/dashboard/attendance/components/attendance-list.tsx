"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie
} from "recharts";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  X, 
  Filter, 
  List, 
  BarChart3, 
  Calendar,
  Users, 
  BookOpen, 
  Clock,
  TrendingUp,
  MapPin
} from "lucide-react";

type SemesterOption = {
  id: string;
  name: string;
};

type CourseOption = {
  id: number;
  code: string;
  name: string;
};

type AttendanceDetail = {
  attendanceId: number;
  npm: string;
  studentName: string;
  courseCode: string;
  courseName: string;
  className: string;
  lecturerName: string;
  attendanceDate: string;
  checkInTime: string;
  building: string;
  capacity: number;
  programName: string;
  facultyName: string;
  semesterCode: string;
  academicYear: string;
};

type AttendanceData = {
  data: AttendanceDetail[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  faculties: string[];
  programs: string[];
  courses: CourseOption[];
  stats: {
    totalAttendance: number;
    uniqueStudents: number;
    uniqueCourses: number;
    averageAttendancePerStudent: number;
    attendanceRate: number;
  };
};

type AttendanceListProps = {
  attendanceData: AttendanceData;
  semesterOptions: SemesterOption[];
  defaultViewMode?: string;
};

type ViewMode = 'table' | 'charts';

// Color palette for charts
const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

export default function AttendanceList({ attendanceData, semesterOptions, defaultViewMode = 'table' }: AttendanceListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchInput, setSearchInput] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(
    (defaultViewMode === 'charts' ? 'charts' : 'table') as ViewMode
  );
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Get current view type from URL (paginated or all)
  const currentViewType = searchParams.get("viewType") || "paginated";
  const isAllDataView = currentViewType === "all";
  
  // Get current filter values from URL
  const currentSemesterId = searchParams.get("semesterId") || "";
  const currentFacultyName = searchParams.get("facultyName") || "";
  const currentProgramName = searchParams.get("programName") || "";
  const currentCourseId = searchParams.get("courseId") || "";
  const currentSearchTerm = searchParams.get("searchTerm") || "";
  const currentDateFrom = searchParams.get("dateFrom") || "";
  const currentDateTo = searchParams.get("dateTo") || "";
  const currentPage = Number(searchParams.get("page") || "1");
  
  // Set the search input from URL on mount
  useEffect(() => {
    if (currentSearchTerm) {
      setSearchInput(currentSearchTerm);
    }
  }, [currentSearchTerm]);

  // Handle view type change (paginated vs all)
  const handleViewTypeChange = (newViewType: 'paginated' | 'all') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("viewType", newViewType);
    
    // Reset page when switching to all view
    if (newViewType === 'all') {
      params.delete("page");
      params.delete("pageSize");
    } else {
      // Set default pagination for paginated view
      if (!params.has("page")) params.set("page", "1");
      if (!params.has("pageSize")) params.set("pageSize", "10");
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Navigate with filters
  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    // Reset to page 1 when filters change (only for paginated view)
    if (currentViewType === 'paginated') {
      params.set("page", "1");
    }
    
    // If changing faculty, reset program and course filters
    if (key === "facultyName") {
      params.delete("programName");
      params.delete("courseId");
    }
    
    // If changing program, reset course filter
    if (key === "programName") {
      params.delete("courseId");
    }

    // Update viewMode in URL
    params.set("viewMode", viewMode);
    
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Handle search input submission
  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchInput.trim()) {
      params.set("searchTerm", searchInput);
    } else {
      params.delete("searchTerm");
    }
    
    // Reset to page 1 when searching (only for paginated view)
    if (currentViewType === 'paginated') {
      params.set("page", "1");
    }
    params.set("viewMode", viewMode);
    
    router.push(`${pathname}?${params.toString()}`);
    setShowMobileFilters(false);
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    const params = new URLSearchParams();
    params.set("viewType", currentViewType);
    params.set("viewMode", viewMode);
    
    // Keep pagination for paginated view
    if (currentViewType === 'paginated') {
      params.set("page", "1");
      params.set("pageSize", "10");
    }
    
    router.push(`${pathname}?${params.toString()}`);
    setSearchInput("");
    setShowMobileFilters(false);
  };
  
  // Handle pagination (only for paginated view)
  const handlePageChange = (newPage: number) => {
    if (currentViewType !== 'paginated') return;
    
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    params.set("viewMode", viewMode);
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Toggle view mode (table or charts)
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    const params = new URLSearchParams(searchParams.toString());
    params.set("viewMode", mode);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Check if any filters are active
  const hasActiveFilters = currentSemesterId || 
                          currentFacultyName || 
                          currentProgramName || 
                          currentCourseId ||
                          currentSearchTerm ||
                          currentDateFrom ||
                          currentDateTo;

  // Use attendanceData.data directly since server-side already handles viewType
  const chartData = attendanceData.data;
  
  // Daily Attendance Trend Data
  const dailyAttendanceData = useMemo(() => {
    if (chartData.length === 0) return [];
    
    const dailyStats: Record<string, number> = {};
    
    chartData.forEach(item => {
      const date = item.attendanceDate;
      dailyStats[date] = (dailyStats[date] || 0) + 1;
    });
    
    return Object.entries(dailyStats)
      .map(([date, count]) => ({
        date,
        attendance: count
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days
  }, [chartData]);

  // Course Attendance Distribution
  const courseAttendanceData = useMemo(() => {
    const courseStats: Record<string, number> = {};
    
    chartData.forEach(item => {
      const courseKey = `${item.courseCode} - ${item.courseName}`;
      courseStats[courseKey] = (courseStats[courseKey] || 0) + 1;
    });
    
    return Object.entries(courseStats)
      .map(([course, count]) => ({ course, attendance: count }))
      .sort((a, b) => b.attendance - a.attendance)
      .slice(0, 10); // Top 10 courses
  }, [chartData]);

  // Faculty Attendance Performance
  const facultyAttendanceData = useMemo(() => {
    const facultyStats: Record<string, { total: number, students: Set<string> }> = {};
    
    chartData.forEach(item => {
      if (!facultyStats[item.facultyName]) {
        facultyStats[item.facultyName] = { total: 0, students: new Set() };
      }
      facultyStats[item.facultyName].total++;
      facultyStats[item.facultyName].students.add(item.npm);
    });
    
    return Object.entries(facultyStats)
      .map(([faculty, stats]) => ({
        faculty,
        totalAttendance: stats.total,
        uniqueStudents: stats.students.size,
        avgAttendancePerStudent: parseFloat((stats.total / stats.students.size).toFixed(1))
      }))
      .sort((a, b) => b.totalAttendance - a.totalAttendance);
  }, [chartData]);

  // Time Distribution Data (by hour)
  const timeDistributionData = useMemo(() => {
    const timeStats: Record<number, number> = {};
    
    chartData.forEach(item => {
      if (item.checkInTime) {
        const hour = parseInt(item.checkInTime.split(':')[0]);
        timeStats[hour] = (timeStats[hour] || 0) + 1;
      }
    });
    
    return Object.entries(timeStats)
      .map(([hour, count]) => ({
        hour: `${hour}:00`,
        attendance: count
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
  }, [chartData]);

  // Building Utilization Data
  const buildingUtilizationData = useMemo(() => {
    const buildingStats: Record<string, number> = {};
    
    chartData.forEach(item => {
      buildingStats[item.building] = (buildingStats[item.building] || 0) + 1;
    });
    
    return Object.entries(buildingStats)
      .map(([building, count]) => ({ building, attendance: count }))
      .sort((a, b) => b.attendance - a.attendance)
      .slice(0, 8); // Top 8 buildings
  }, [chartData]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-lg">
          <p className="text-gray-200 font-bold">{label || data.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-blue-400">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    return timeString || '-';
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Attendance</p>
              <p className="text-2xl font-bold text-gray-100">{attendanceData.stats.totalAttendance.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-600 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Unique Students</p>
              <p className="text-2xl font-bold text-gray-100">{attendanceData.stats.uniqueStudents}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-600 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Courses</p>
              <p className="text-2xl font-bold text-gray-100">{attendanceData.stats.uniqueCourses}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-600 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Avg per Student</p>
              <p className="text-2xl font-bold text-gray-100">{attendanceData.stats.averageAttendancePerStudent.toFixed(1)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-600 rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-100">{attendanceData.stats.attendanceRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header with View Type Tabs and View Mode Toggle */}
      <div className="flex flex-col gap-4">
        {/* View Type Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg bg-gray-800 p-1 shadow-lg border border-gray-700">
            <button
              className={`px-4 sm:px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                currentViewType === 'paginated' 
                  ? 'bg-gray-700 text-gray-100 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
              }`}
              onClick={() => handleViewTypeChange('paginated')}
            >
              <div className="flex items-center gap-2">
                <List size={16} />
                <span>Paginated View</span>
              </div>
            </button>
            <button
              className={`px-4 sm:px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                currentViewType === 'all' 
                  ? 'bg-gray-700 text-gray-100 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
              }`}
              onClick={() => handleViewTypeChange('all')}
            >
              <div className="flex items-center gap-2">
                <BarChart3 size={16} />
                <span>Analytics View</span>
              </div>
            </button>
          </div>
        </div>

        {/* View Mode Toggle and Info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>
              {isAllDataView ? 
                `Analytics: ${attendanceData.data.length.toLocaleString()} total records` :
                `Paginated: ${attendanceData.total} total records`
              }
            </span>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-900/50 text-blue-300 border border-blue-700">
                Filtered
              </span>
            )}
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex justify-center sm:justify-end">
            <div className="inline-flex rounded-lg bg-gray-800 p-1 shadow-lg border border-gray-700">
              <button
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                  viewMode === 'table' 
                    ? 'bg-gray-700 text-gray-100 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                }`}
                onClick={() => handleViewModeChange('table')}
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <List size={14} />
                  <span className="hidden sm:inline">Table</span>
                </div>
              </button>
              <button
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                  viewMode === 'charts' 
                    ? 'bg-gray-700 text-gray-100 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                }`}
                onClick={() => handleViewModeChange('charts')}
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <BarChart3 size={14} />
                  <span className="hidden sm:inline">Charts</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters - Available for Both Views (Improvement) */}
      <>
        {/* Mobile Filter Toggle */}
        <div className="block lg:hidden">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-200 transition-colors"
          >
            <Filter size={16} />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-blue-600 text-white rounded-full">
                !
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        <div className={`bg-gray-800 border border-gray-700 rounded-lg shadow-lg transition-all duration-300 ${
          showMobileFilters || 'hidden lg:block'
        }`}>
          <div className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base lg:text-lg font-semibold text-gray-100">
                Filters {isAllDataView && <span className="text-sm text-green-400">(Available in Analytics View)</span>}
              </h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="lg:hidden p-1 text-gray-400 hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">Semester</label>
                <select
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={currentSemesterId}
                  onChange={(e) => handleFilterChange("semesterId", e.target.value)}
                >
                  <option value="">All Semesters</option>
                  {semesterOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">Faculty</label>
                <select
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={currentFacultyName}
                  onChange={(e) => handleFilterChange("facultyName", e.target.value)}
                >
                  <option value="">All Faculties</option>
                  {attendanceData.faculties.map((faculty) => (
                    <option key={faculty} value={faculty}>
                      {faculty}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">Program</label>
                <select
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  value={currentProgramName}
                  onChange={(e) => handleFilterChange("programName", e.target.value)}
                  disabled={attendanceData.programs.length === 0}
                >
                  <option value="">All Programs</option>
                  {attendanceData.programs.map((program) => (
                    <option key={program} value={program}>
                      {program}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">Course</label>
                <select
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  value={currentCourseId}
                  onChange={(e) => handleFilterChange("courseId", e.target.value)}
                  disabled={attendanceData.courses.length === 0}
                >
                  <option value="">All Courses</option>
                  {attendanceData.courses.map((course) => (
                    <option key={course.id} value={course.id.toString()}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Date Range and Search Section */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-200">Date From</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={currentDateFrom}
                    onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-200">Date To</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={currentDateTo}
                    onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-200">Search</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Student, NPM, or course..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                      className="px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      onClick={handleSearch}
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-6">
              <div className="text-sm text-gray-400 order-2 sm:order-1">
                {!isAllDataView ? (
                  <>Showing {attendanceData.data.length > 0 ? (attendanceData.page - 1) * attendanceData.pageSize + 1 : 0} to {Math.min(attendanceData.page * attendanceData.pageSize, attendanceData.total)} of {attendanceData.total} results</>
                ) : (
                  <>Showing all {attendanceData.data.length.toLocaleString()} attendance records</>
                )}
              </div>
              <button
                className="px-4 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm order-1 sm:order-2"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </>

      {/* Analytics View Info */}
      {currentViewType === 'all' && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 lg:p-6">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0"></div>
            <div className="text-sm text-gray-300">
              <strong>Analytics Mode:</strong> Viewing comprehensive data from entire dataset 
              ({attendanceData.data.length.toLocaleString()} total records) for strategic insights. 
              <strong className="text-green-400">Filters are now available</strong> to focus your analysis on specific segments.
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
        {attendanceData.data.length === 0 ? (
          <div className="p-8 lg:p-12 text-center">
            <div className="text-gray-400 text-lg mb-2">No attendance records found</div>
            <div className="text-gray-500 text-sm">Try adjusting your filters or search terms</div>
          </div>
        ) : viewMode === 'charts' ? (
          <div className="p-4 lg:p-6 space-y-6 lg:space-y-8">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-blue-400" size={20} />
              <h2 className="text-lg lg:text-xl font-semibold text-gray-100">
                {isAllDataView ? 'Comprehensive Analytics' : 'Filtered Data Analytics'}
              </h2>
              <span className="text-sm text-gray-400">
                ({chartData.length.toLocaleString()} records)
              </span>
            </div>

            {chartData.length === 0 ? (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
                <div className="text-gray-400 text-lg mb-2">No data available for charts</div>
                <div className="text-gray-500 text-sm">
                  Current filters return no results. Try adjusting your filters.
                </div>
              </div>
            ) : (
              <>
                {/* Daily Attendance Trend */}
                <div className="space-y-3">
                  <h3 className="text-base lg:text-lg font-medium text-gray-200">
                    Daily Attendance Trend
                    <span className="text-sm text-gray-400 ml-2">(Last 30 days)</span>
                  </h3>
                  <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dailyAttendanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          tick={{fill: '#D1D5DB', fontSize: 12}}
                          tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis tick={{fill: '#D1D5DB', fontSize: 12}} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                          type="monotone" 
                          dataKey="attendance" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Course and Faculty Performance */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Course Attendance Distribution */}
                  <div className="space-y-3">
                    <h3 className="text-base lg:text-lg font-medium text-gray-200">
                      Top Courses by Attendance
                      <span className="text-sm text-gray-400 ml-2">(Top 10)</span>
                    </h3>
                    <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={courseAttendanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="course" 
                            tick={{fill: '#D1D5DB', fontSize: 10}}
                            angle={-45}
                            textAnchor="end"
                            height={100}
                          />
                          <YAxis tick={{fill: '#D1D5DB', fontSize: 12}} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="attendance" 
                            name="Attendance Count"
                            radius={[4, 4, 0, 0]}
                          >
                            {courseAttendanceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Faculty Performance */}
                  <div className="space-y-3">
                    <h3 className="text-base lg:text-lg font-medium text-gray-200">
                      Faculty Attendance Performance
                    </h3>
                    <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={facultyAttendanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="faculty" 
                            tick={{fill: '#D1D5DB', fontSize: 10}}
                            angle={-45}
                            textAnchor="end"
                            height={100}
                          />
                          <YAxis tick={{fill: '#D1D5DB', fontSize: 12}} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="totalAttendance" 
                            name="Total Attendance" 
                            fill="#10B981"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Time and Building Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Time Distribution */}
                  <div className="space-y-3">
                    <h3 className="text-base lg:text-lg font-medium text-gray-200">
                      Attendance by Time of Day
                    </h3>
                    <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={timeDistributionData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="hour" 
                            tick={{fill: '#D1D5DB', fontSize: 12}}
                          />
                          <YAxis tick={{fill: '#D1D5DB', fontSize: 12}} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="attendance" 
                            name="Attendance Count" 
                            fill="#8B5CF6"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Building Utilization */}
                  <div className="space-y-3">
                    <h3 className="text-base lg:text-lg font-medium text-gray-200">
                      Building Utilization
                    </h3>
                    <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={buildingUtilizationData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="attendance"
                            nameKey="building"
                            label={({ building, attendance }) => `${building}: ${attendance}`}
                          >
                            {buildingUtilizationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-750">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Class & Lecturer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Program
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {attendanceData.data.map((attendance) => (
                    <tr key={attendance.attendanceId} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-200">
                            {attendance.studentName}
                          </div>
                          <div className="text-sm text-gray-400 font-mono">
                            {attendance.npm}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-200">
                            {attendance.courseCode}
                          </div>
                          <div className="text-sm text-gray-400 max-w-xs truncate">
                            {attendance.courseName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-200">
                            {attendance.className}
                          </div>
                          <div className="text-sm text-gray-400">
                            {attendance.lecturerName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-200">
                            {formatDate(attendance.attendanceDate)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {formatTime(attendance.checkInTime)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-200">
                            {attendance.building}
                          </div>
                          <div className="text-sm text-gray-400">
                            Capacity: {attendance.capacity}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm text-gray-200 max-w-xs truncate">
                            {attendance.programName}
                          </div>
                          <div className="text-sm text-gray-400 max-w-xs truncate">
                            {attendance.facultyName}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="block lg:hidden divide-y divide-gray-700">
              {attendanceData.data.map((attendance) => (
                <div key={attendance.attendanceId} className="p-4 hover:bg-gray-700/30 transition-colors">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-200">{attendance.studentName}</div>
                        <div className="text-sm text-gray-400 font-mono">{attendance.npm}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-200">
                          {formatDate(attendance.attendanceDate)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTime(attendance.checkInTime)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Course:</span>
                        <span className="ml-1 text-gray-200">{attendance.courseCode} - {attendance.courseName}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Class:</span>
                        <span className="ml-1 text-gray-200">{attendance.className}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Lecturer:</span>
                        <span className="ml-1 text-gray-200">{attendance.lecturerName}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Location:</span>
                        <span className="ml-1 text-gray-200">{attendance.building}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                        {attendance.facultyName}
                      </span>
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                        {attendance.programName}
                      </span>
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                        {attendance.semesterCode} {attendance.academicYear}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination - Only for Paginated View */}
            {currentViewType === 'paginated' && (
              <div className="p-4 lg:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-700 bg-gray-800/50">
                <div className="text-sm text-gray-400 order-2 sm:order-1">
                  Showing {attendanceData.data.length > 0 ? (attendanceData.page - 1) * attendanceData.pageSize + 1 : 0} to {Math.min(attendanceData.page * attendanceData.pageSize, attendanceData.total)} of {attendanceData.total} records
                </div>
                
                <div className="flex items-center space-x-2 order-1 sm:order-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, attendanceData.totalPages) }, (_, i) => {
                    let pageNum = currentPage;
                    if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= attendanceData.totalPages - 2) {
                      pageNum = attendanceData.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    if (pageNum > 0 && pageNum <= attendanceData.totalPages) {
                      return (
                        <button
                          key={i}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                          } border border-gray-600 transition-colors`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    return null;
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === attendanceData.totalPages}
                    className="px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}