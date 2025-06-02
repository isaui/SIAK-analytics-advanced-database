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
  Pie,
  ScatterChart,
  Scatter
} from "recharts";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  X, 
  Filter, 
  List, 
  BarChart3, 
  GraduationCap,
  Users, 
  BookOpen, 
  Clock,
  TrendingUp,
  Target,
  UserCheck
} from "lucide-react";

type SemesterOption = {
  id: string;
  name: string;
};

type LecturerOption = {
  id: number;
  nip: string;
  name: string;
};

type CourseOption = {
  id: number;
  code: string;
  name: string;
};

type TeachingDetail = {
  teachingId: number;
  lecturerNip: string;
  lecturerName: string;
  lecturerEmail: string;
  courseCode: string;
  courseName: string;
  courseCredits: number;
  className: string;
  building: string;
  capacity: number;
  totalStudents: number;
  totalSessions: number;
  sessionsCompleted: number;
  teachingHours: number;
  completionRate: number;
  facultyName: string;
  semesterCode: string;
  academicYear: string;
};

type TeachingData = {
  data: TeachingDetail[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  faculties: string[];
  lecturers: LecturerOption[];
  courses: CourseOption[];
  stats: {
    totalTeachingRecords: number;
    uniqueLecturers: number;
    uniqueCourses: number;
    averageTeachingHours: number;
    averageCompletionRate: number;
    totalTeachingHours: number;
  };
};

type TeachingListProps = {
  teachingData: TeachingData;
  semesterOptions: SemesterOption[];
  defaultViewMode?: string;
};

type ViewMode = 'table' | 'charts';

// Color palette for charts
const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

export default function TeachingList({ teachingData, semesterOptions, defaultViewMode = 'table' }: TeachingListProps) {
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
  const currentLecturerId = searchParams.get("lecturerId") || "";
  const currentCourseId = searchParams.get("courseId") || "";
  const currentSearchTerm = searchParams.get("searchTerm") || "";
  const currentMinHours = searchParams.get("minHours") || "";
  const currentMaxHours = searchParams.get("maxHours") || "";
  const currentMinCompletionRate = searchParams.get("minCompletionRate") || "";
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
    
    // If changing faculty, reset lecturer and course filters
    if (key === "facultyName") {
      params.delete("lecturerId");
      params.delete("courseId");
    }
    
    // If changing lecturer, reset course filter
    if (key === "lecturerId") {
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
                          currentLecturerId || 
                          currentCourseId ||
                          currentSearchTerm ||
                          currentMinHours ||
                          currentMaxHours ||
                          currentMinCompletionRate;

  // Use teachingData.data directly since server-side already handles viewType
  const chartData = teachingData.data;
  
  // Teaching Hours Distribution
  const teachingHoursDistribution = useMemo(() => {
    if (chartData.length === 0) return [];
    
    const ranges = [
      { name: '0-10h', min: 0, max: 10, count: 0 },
      { name: '10-20h', min: 10, max: 20, count: 0 },
      { name: '20-30h', min: 20, max: 30, count: 0 },
      { name: '30-40h', min: 30, max: 40, count: 0 },
      { name: '40h+', min: 40, max: Infinity, count: 0 }
    ];
    
    chartData.forEach(item => {
      const hours = item.teachingHours;
      ranges.forEach(range => {
        if (hours >= range.min && hours < range.max) {
          range.count++;
        }
      });
    });
    
    return ranges
      .filter(range => range.count > 0)
      .map(({ name, count }) => ({ name, value: count, count }));
  }, [chartData]);

  // Faculty Workload Analysis
  const facultyWorkloadData = useMemo(() => {
    const facultyStats: Record<string, { 
      totalHours: number, 
      lecturerCount: number, 
      courseCount: number,
      avgCompletionRate: number 
    }> = {};
    
    chartData.forEach(item => {
      if (!facultyStats[item.facultyName]) {
        facultyStats[item.facultyName] = { 
          totalHours: 0, 
          lecturerCount: 0, 
          courseCount: 0,
          avgCompletionRate: 0 
        };
      }
      facultyStats[item.facultyName].totalHours += item.teachingHours;
      facultyStats[item.facultyName].avgCompletionRate += item.completionRate;
    });
    
    // Calculate unique lecturers and courses per faculty
    const facultyCounts: Record<string, { lecturers: Set<string>, courses: Set<string> }> = {};
    chartData.forEach(item => {
      if (!facultyCounts[item.facultyName]) {
        facultyCounts[item.facultyName] = { lecturers: new Set(), courses: new Set() };
      }
      facultyCounts[item.facultyName].lecturers.add(item.lecturerNip);
      facultyCounts[item.facultyName].courses.add(item.courseCode);
    });
    
    return Object.entries(facultyStats).map(([faculty, stats]) => {
      const counts = facultyCounts[faculty];
      const recordCount = chartData.filter(item => item.facultyName === faculty).length;
      return {
        faculty,
        totalHours: parseFloat(stats.totalHours.toFixed(1)),
        avgHours: parseFloat((stats.totalHours / counts.lecturers.size).toFixed(1)),
        lecturerCount: counts.lecturers.size,
        courseCount: counts.courses.size,
        avgCompletionRate: parseFloat((stats.avgCompletionRate / recordCount).toFixed(1))
      };
    }).sort((a, b) => b.totalHours - a.totalHours);
  }, [chartData]);

  // Top Lecturers by Teaching Hours
  const topLecturersData = useMemo(() => {
    const lecturerStats: Record<string, { 
      name: string,
      totalHours: number, 
      courseCount: number,
      studentCount: number,
      avgCompletionRate: number,
      faculty: string
    }> = {};
    
    chartData.forEach(item => {
      const key = item.lecturerNip;
      if (!lecturerStats[key]) {
        lecturerStats[key] = { 
          name: item.lecturerName,
          totalHours: 0, 
          courseCount: 0,
          studentCount: 0,
          avgCompletionRate: 0,
          faculty: item.facultyName
        };
      }
      lecturerStats[key].totalHours += item.teachingHours;
      lecturerStats[key].courseCount++;
      lecturerStats[key].studentCount += item.totalStudents;
      lecturerStats[key].avgCompletionRate += item.completionRate;
    });
    
    return Object.entries(lecturerStats)
      .map(([nip, stats]) => ({
        lecturer: `${stats.name} (${nip})`,
        totalHours: parseFloat(stats.totalHours.toFixed(1)),
        courseCount: stats.courseCount,
        studentCount: stats.studentCount,
        avgCompletionRate: parseFloat((stats.avgCompletionRate / stats.courseCount).toFixed(1)),
        faculty: stats.faculty
      }))
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 10);
  }, [chartData]);

  // Completion Rate Distribution
  const completionRateData = useMemo(() => {
    if (chartData.length === 0) return [];
    
    const ranges = [
      { name: '0-25%', min: 0, max: 25, count: 0 },
      { name: '25-50%', min: 25, max: 50, count: 0 },
      { name: '50-75%', min: 50, max: 75, count: 0 },
      { name: '75-90%', min: 75, max: 90, count: 0 },
      { name: '90-100%', min: 90, max: 100, count: 0 }
    ];
    
    chartData.forEach(item => {
      const rate = item.completionRate;
      ranges.forEach(range => {
        if (rate >= range.min && rate < range.max) {
          range.count++;
        }
      });
    });
    
    return ranges
      .filter(range => range.count > 0)
      .map(({ name, count }) => ({ name, value: count, count }));
  }, [chartData]);

  // Student-to-Teaching Hours Correlation
  const studentHoursCorrelation = useMemo(() => {
    return chartData.map(item => ({
      students: item.totalStudents,
      hours: item.teachingHours,
      lecturer: item.lecturerName,
      course: item.courseCode,
      completionRate: item.completionRate
    }));
  }, [chartData]);

  // Room Utilization by Teaching
  const roomUtilizationData = useMemo(() => {
    const roomStats: Record<string, { 
      hours: number, 
      capacity: number, 
      utilizationScore: number 
    }> = {};
    
    chartData.forEach(item => {
      if (!roomStats[item.building]) {
        roomStats[item.building] = { hours: 0, capacity: 0, utilizationScore: 0 };
      }
      roomStats[item.building].hours += item.teachingHours;
      roomStats[item.building].capacity = Math.max(roomStats[item.building].capacity, item.capacity);
    });
    
    return Object.entries(roomStats)
      .map(([building, stats]) => ({
        building,
        hours: parseFloat(stats.hours.toFixed(1)),
        capacity: stats.capacity,
        utilizationScore: parseFloat((stats.hours / stats.capacity * 100).toFixed(1))
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 8);
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
              {entry.name}: {typeof entry.value === 'number' ? 
                (entry.name.includes('Rate') || entry.name.includes('%') ? `${entry.value}%` : 
                 entry.name.includes('Hours') ? `${entry.value}h` : entry.value) : 
                entry.value
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Format hours for display
  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  // Format completion rate for display
  const formatCompletionRate = (rate: number) => {
    return `${rate.toFixed(1)}%`;
  };

  // Get completion rate color
  const getCompletionRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-400';
    if (rate >= 75) return 'text-blue-400';
    if (rate >= 50) return 'text-yellow-400';
    if (rate >= 25) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Teaching Records</p>
              <p className="text-2xl font-bold text-gray-100">{teachingData.stats.totalTeachingRecords}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-600 rounded-lg">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Lecturers</p>
              <p className="text-2xl font-bold text-gray-100">{teachingData.stats.uniqueLecturers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-600 rounded-lg">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Courses</p>
              <p className="text-2xl font-bold text-gray-100">{teachingData.stats.uniqueCourses}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-600 rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Avg Hours</p>
              <p className="text-2xl font-bold text-gray-100">{formatHours(teachingData.stats.averageTeachingHours)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-600 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-100">{formatCompletionRate(teachingData.stats.averageCompletionRate)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Hours</p>
              <p className="text-2xl font-bold text-gray-100">{formatHours(teachingData.stats.totalTeachingHours)}</p>
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
                `Analytics: ${teachingData.data.length.toLocaleString()} total records` :
                `Paginated: ${teachingData.total} total records`
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

      {/* Filters - Available for Both Views */}
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
                Advanced Filters {isAllDataView && <span className="text-sm text-green-400">(Available in Analytics View)</span>}
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
                  {teachingData.faculties.map((faculty) => (
                    <option key={faculty} value={faculty}>
                      {faculty}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">Lecturer</label>
                <select
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  value={currentLecturerId}
                  onChange={(e) => handleFilterChange("lecturerId", e.target.value)}
                  disabled={teachingData.lecturers.length === 0}
                >
                  <option value="">All Lecturers</option>
                  {teachingData.lecturers.map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.id.toString()}>
                      {lecturer.name} ({lecturer.nip})
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
                  disabled={teachingData.courses.length === 0}
                >
                  <option value="">All Courses</option>
                  {teachingData.courses.map((course) => (
                    <option key={course.id} value={course.id.toString()}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Teaching Hours and Completion Rate Filters */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-200">Min Teaching Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="0"
                    value={currentMinHours}
                    onChange={(e) => handleFilterChange("minHours", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-200">Max Teaching Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="100"
                    value={currentMaxHours}
                    onChange={(e) => handleFilterChange("maxHours", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-200">Min Completion Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="0"
                    value={currentMinCompletionRate}
                    onChange={(e) => handleFilterChange("minCompletionRate", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-200">Search</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Lecturer, NIP, or course..."
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
                  <>Showing {teachingData.data.length > 0 ? (teachingData.page - 1) * teachingData.pageSize + 1 : 0} to {Math.min(teachingData.page * teachingData.pageSize, teachingData.total)} of {teachingData.total} results</>
                ) : (
                  <>Showing all {teachingData.data.length.toLocaleString()} teaching records</>
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
              <strong>Analytics Mode:</strong> Comprehensive teaching load analysis from entire dataset 
              ({teachingData.data.length.toLocaleString()} total records). 
              <strong className="text-green-400">Advanced filters available</strong> for targeted workload analysis.
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
        {teachingData.data.length === 0 ? (
          <div className="p-8 lg:p-12 text-center">
            <div className="text-gray-400 text-lg mb-2">No teaching records found</div>
            <div className="text-gray-500 text-sm">Try adjusting your filters or search terms</div>
          </div>
        ) : viewMode === 'charts' ? (
          <div className="p-4 lg:p-6 space-y-6 lg:space-y-8">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-blue-400" size={20} />
              <h2 className="text-lg lg:text-xl font-semibold text-gray-100">
                Teaching Load Analytics
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
                {/* Teaching Hours and Completion Rate Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Teaching Hours Distribution */}
                  <div className="space-y-3">
                    <h3 className="text-base lg:text-lg font-medium text-gray-200">
                      Teaching Hours Distribution
                    </h3>
                    <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={teachingHoursDistribution}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="name" 
                            tick={{fill: '#D1D5DB', fontSize: 12}}
                          />
                          <YAxis tick={{fill: '#D1D5DB', fontSize: 12}} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="value" 
                            name="Lecturers"
                            radius={[4, 4, 0, 0]}
                            fill="#3B82F6"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Completion Rate Distribution */}
                  <div className="space-y-3">
                    <h3 className="text-base lg:text-lg font-medium text-gray-200">
                      Session Completion Rate Distribution
                    </h3>
                    <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={completionRateData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {completionRateData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Faculty Workload Analysis */}
                <div className="space-y-3">
                  <h3 className="text-base lg:text-lg font-medium text-gray-200">
                    Faculty Workload Analysis
                  </h3>
                  <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={facultyWorkloadData}>
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
                          dataKey="totalHours" 
                          name="Total Hours" 
                          fill="#10B981"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Lecturers and Student-Hours Correlation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Lecturers by Teaching Hours */}
                  <div className="space-y-3">
                    <h3 className="text-base lg:text-lg font-medium text-gray-200">
                      Top Lecturers by Teaching Load
                      <span className="text-sm text-gray-400 ml-2">(Top 10)</span>
                    </h3>
                    <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topLecturersData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="lecturer" 
                            tick={{fill: '#D1D5DB', fontSize: 8}}
                            angle={-45}
                            textAnchor="end"
                            height={120}
                          />
                          <YAxis tick={{fill: '#D1D5DB', fontSize: 12}} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="totalHours" 
                            name="Teaching Hours"
                            radius={[4, 4, 0, 0]}
                          >
                            {topLecturersData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Student-Hours Correlation */}
                  <div className="space-y-3">
                    <h3 className="text-base lg:text-lg font-medium text-gray-200">
                      Student Count vs Teaching Hours
                    </h3>
                    <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                      <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart data={studentHoursCorrelation}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="students" 
                            tick={{fill: '#D1D5DB', fontSize: 12}}
                            name="Students"
                          />
                          <YAxis 
                            dataKey="hours" 
                            tick={{fill: '#D1D5DB', fontSize: 12}}
                            name="Teaching Hours"
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-lg">
                                    <p className="text-gray-200 font-bold">{data.lecturer}</p>
                                    <p className="text-blue-400">Course: {data.course}</p>
                                    <p className="text-green-400">Students: {data.students}</p>
                                    <p className="text-yellow-400">Hours: {data.hours}h</p>
                                    <p className="text-purple-400">Completion: {data.completionRate.toFixed(1)}%</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Scatter name="Teaching Load" fill="#8B5CF6" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Room Utilization */}
                <div className="space-y-3">
                  <h3 className="text-base lg:text-lg font-medium text-gray-200">
                    Room Utilization by Teaching Hours
                    <span className="text-sm text-gray-400 ml-2">(Top 8 buildings)</span>
                  </h3>
                  <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={roomUtilizationData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="building" 
                          tick={{fill: '#D1D5DB', fontSize: 12}}
                        />
                        <YAxis tick={{fill: '#D1D5DB', fontSize: 12}} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="hours" 
                          name="Teaching Hours" 
                          fill="#F59E0B"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
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
                      Lecturer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Class & Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Teaching Load
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Faculty
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {teachingData.data.map((teaching) => (
                    <tr key={teaching.teachingId} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-200">
                            {teaching.lecturerName}
                          </div>
                          <div className="text-sm text-gray-400 font-mono">
                            NIP: {teaching.lecturerNip}
                          </div>
                          <div className="text-xs text-gray-500">
                            {teaching.lecturerEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-200">
                            {teaching.courseCode}
                          </div>
                          <div className="text-sm text-gray-400 max-w-xs truncate">
                            {teaching.courseName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {teaching.courseCredits} SKS
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-200">
                            {teaching.className}
                          </div>
                          <div className="text-sm text-gray-400">
                            {teaching.building}
                          </div>
                          <div className="text-xs text-gray-500">
                            Capacity: {teaching.capacity}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-blue-400">
                            {formatHours(teaching.teachingHours)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {teaching.totalStudents} students
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className={`text-sm font-medium ${getCompletionRateColor(teaching.completionRate)}`}>
                            {formatCompletionRate(teaching.completionRate)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {teaching.sessionsCompleted}/{teaching.totalSessions} sessions
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(teaching.completionRate, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm text-gray-200 max-w-xs truncate">
                            {teaching.facultyName}
                          </div>
                          <div className="text-sm text-gray-400">
                            {teaching.semesterCode} {teaching.academicYear}
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
              {teachingData.data.map((teaching) => (
                <div key={teaching.teachingId} className="p-4 hover:bg-gray-700/30 transition-colors">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-200">{teaching.lecturerName}</div>
                        <div className="text-sm text-gray-400 font-mono">NIP: {teaching.lecturerNip}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-blue-400">
                          {formatHours(teaching.teachingHours)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Teaching Hours
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Course:</span>
                        <span className="ml-1 text-gray-200">{teaching.courseCode} - {teaching.courseName}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Class:</span>
                        <span className="ml-1 text-gray-200">{teaching.className} ({teaching.building})</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Students:</span>
                        <span className="ml-1 text-gray-200">{teaching.totalStudents}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Progress:</span>
                        <span className={`ml-1 font-medium ${getCompletionRateColor(teaching.completionRate)}`}>
                          {formatCompletionRate(teaching.completionRate)} ({teaching.sessionsCompleted}/{teaching.totalSessions})
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                        {teaching.facultyName}
                      </span>
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                        {teaching.semesterCode} {teaching.academicYear}
                      </span>
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                        {teaching.courseCredits} SKS
                      </span>
                    </div>
                    
                    {/* Progress bar for mobile */}
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(teaching.completionRate, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination - Only for Paginated View */}
            {currentViewType === 'paginated' && (
              <div className="p-4 lg:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-700 bg-gray-800/50">
                <div className="text-sm text-gray-400 order-2 sm:order-1">
                  Showing {teachingData.data.length > 0 ? (teachingData.page - 1) * teachingData.pageSize + 1 : 0} to {Math.min(teachingData.page * teachingData.pageSize, teachingData.total)} of {teachingData.total} records
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
                  {Array.from({ length: Math.min(5, teachingData.totalPages) }, (_, i) => {
                    let pageNum = currentPage;
                    if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= teachingData.totalPages - 2) {
                      pageNum = teachingData.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    if (pageNum > 0 && pageNum <= teachingData.totalPages) {
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
                    disabled={currentPage === teachingData.totalPages}
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