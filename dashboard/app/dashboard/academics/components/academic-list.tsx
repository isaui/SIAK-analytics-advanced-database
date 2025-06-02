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
  ScatterChart,
  Scatter 
} from "recharts";
import { ChevronLeft, ChevronRight, Search, X, Filter, List, BarChart3, Award, TrendingUp, Users, BookOpen } from "lucide-react";

type SemesterOption = {
  id: string;
  name: string;
};

type AcademicDetail = {
  academicId: number;
  npm: string;
  studentName: string;
  semesterCode: string;
  academicYear: string;
  semesterGpa: number;
  cumulativeGpa: number;
  semesterCredits: number;
  creditsPassed: number;
  totalCredits: number;
  programName: string;
  facultyName: string;
};

type AcademicData = {
  data: AcademicDetail[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  faculties: string[];
  programs: string[];
  stats: {
    averageGpa: number;
    totalStudents: number;
    totalCredits: number;
    averageCredits: number;
  };
};

type AcademicListProps = {
  academicData: AcademicData;
  semesterOptions: SemesterOption[];
  defaultViewMode?: string;
};

type ViewMode = 'table' | 'charts';

// Color palette for charts
const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

export default function AcademicList({ academicData, semesterOptions, defaultViewMode = 'table' }: AcademicListProps) {
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
  const currentSearchTerm = searchParams.get("searchTerm") || "";
  const currentMinGpa = searchParams.get("minGpa") || "";
  const currentMaxGpa = searchParams.get("maxGpa") || "";
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
    
    // If changing faculty, reset program filter
    if (key === "facultyName") {
      params.delete("programName");
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

  // Check if any filters are active (NOW AVAILABLE FOR BOTH VIEWS!)
  const hasActiveFilters = currentSemesterId || 
                          currentFacultyName || 
                          currentProgramName || 
                          currentSearchTerm ||
                          currentMinGpa ||
                          currentMaxGpa;

  // Use academicData.data directly since server-side already handles viewType
  const chartData = academicData.data;
  
  // GPA Distribution Chart Data - Fixed logic
  const gpaDistributionData = useMemo(() => {
    if (chartData.length === 0) return [];
    
    // Dynamic range calculation based on actual data
    const gpas = chartData.map(item => item.cumulativeGpa).sort((a, b) => a - b);
    const minGpa = Math.floor(Math.min(...gpas) * 10) / 10;
    const maxGpa = Math.ceil(Math.max(...gpas) * 10) / 10;
    
    // If all GPAs are the same or very close, create single range
    if (maxGpa - minGpa < 0.2) {
      const centerGpa = Math.round((minGpa + maxGpa) / 2 * 10) / 10;
      return [{
        name: `${centerGpa - 0.1}-${centerGpa + 0.1}`,
        value: chartData.length,
        count: chartData.length
      }];
    }
    
    // Create dynamic ranges
    const ranges = [
      { name: '0.0-1.0', min: 0, max: 1, count: 0 },
      { name: '1.0-2.0', min: 1, max: 2, count: 0 },
      { name: '2.0-2.5', min: 2, max: 2.5, count: 0 },
      { name: '2.5-3.0', min: 2.5, max: 3, count: 0 },
      { name: '3.0-3.5', min: 3, max: 3.5, count: 0 },
      { name: '3.5-4.0', min: 3.5, max: 4.1, count: 0 }
    ];
    
    chartData.forEach(item => {
      const gpa = item.cumulativeGpa;
      ranges.forEach(range => {
        if (gpa >= range.min && gpa < range.max) {
          range.count++;
        }
      });
    });
    
    // Filter out empty ranges
    return ranges
      .filter(range => range.count > 0)
      .map(({ name, count }) => ({ name, value: count, count }));
  }, [chartData]);

  // Faculty Performance Chart Data
  const facultyPerformanceData = useMemo(() => {
    const facultyStats: Record<string, { totalGpa: number, count: number, totalCredits: number }> = {};
    
    chartData.forEach(item => {
      if (!facultyStats[item.facultyName]) {
        facultyStats[item.facultyName] = { totalGpa: 0, count: 0, totalCredits: 0 };
      }
      facultyStats[item.facultyName].totalGpa += item.cumulativeGpa;
      facultyStats[item.facultyName].count++;
      facultyStats[item.facultyName].totalCredits += item.totalCredits;
    });
    
    return Object.entries(facultyStats).map(([name, stats]) => ({
      name,
      averageGpa: parseFloat((stats.totalGpa / stats.count).toFixed(2)),
      studentCount: stats.count,
      averageCredits: Math.round(stats.totalCredits / stats.count)
    }));
  }, [chartData]);

  // Program Performance Chart Data
  const programPerformanceData = useMemo(() => {
    const programStats: Record<string, { totalGpa: number, count: number }> = {};
    
    chartData.forEach(item => {
      if (!programStats[item.programName]) {
        programStats[item.programName] = { totalGpa: 0, count: 0 };
      }
      programStats[item.programName].totalGpa += item.cumulativeGpa;
      programStats[item.programName].count++;
    });
    
    return Object.entries(programStats)
      .map(([name, stats]) => ({
        name,
        averageGpa: parseFloat((stats.totalGpa / stats.count).toFixed(2)),
        studentCount: stats.count
      }))
      .sort((a, b) => b.averageGpa - a.averageGpa)
      .slice(0, 10);
  }, [chartData]);

  // Credits vs GPA Scatter Plot Data
  const creditsGpaData = useMemo(() => {
    return chartData.map(item => ({
      credits: item.totalCredits,
      gpa: item.cumulativeGpa,
      name: item.studentName
    }));
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
                (entry.name.includes('GPA') ? entry.value.toFixed(2) : entry.value) : 
                entry.value
              }
            </p>
          ))}
          {/* Show additional info if available */}
          {data.payload?.count && data.name !== 'Student Count' && (
            <p className="text-green-400">Students: {data.payload.count}</p>
          )}
        </div>
      );
    }
    return null;
  };
  
  // Format GPA for display
  const formatGpa = (gpa: number) => {
    return gpa.toFixed(2);
  };

  // Get GPA color based on value
  const getGpaColor = (gpa: number) => {
    if (gpa >= 3.5) return 'text-green-400';
    if (gpa >= 3.0) return 'text-blue-400';
    if (gpa >= 2.5) return 'text-yellow-400';
    if (gpa >= 2.0) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-gray-100">{academicData.stats.totalStudents}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-600 rounded-lg">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Average GPA</p>
              <p className="text-2xl font-bold text-gray-100">{formatGpa(academicData.stats.averageGpa)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-600 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Average Credits</p>
              <p className="text-2xl font-bold text-gray-100">{Math.round(academicData.stats.averageCredits)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-600 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Credits</p>
              <p className="text-2xl font-bold text-gray-100">{academicData.stats.totalCredits.toLocaleString()}</p>
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
                `Analytics: ${academicData.data.length.toLocaleString()} total records` :
                `Paginated: ${academicData.total} total records`
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

      {/* Filters - NOW AVAILABLE FOR BOTH VIEWS! */}
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
                Academic Performance Filters {isAllDataView && <span className="text-sm text-green-400">(Available in Analytics View)</span>}
              </h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="lg:hidden p-1 text-gray-400 hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  {academicData.faculties.map((faculty) => (
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
                  disabled={academicData.programs.length === 0}
                >
                  <option value="">All Programs</option>
                  {academicData.programs.map((program) => (
                    <option key={program} value={program}>
                      {program}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">Min GPA</label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="0.0"
                  value={currentMinGpa}
                  onChange={(e) => handleFilterChange("minGpa", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">Max GPA</label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="4.0"
                  value={currentMaxGpa}
                  onChange={(e) => handleFilterChange("maxGpa", e.target.value)}
                />
              </div>
            </div>
            
            {/* Search Section - Separated for better spacing */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <label className="block text-sm font-medium mb-3 text-gray-200">Search</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  className="flex-1 px-4 py-3 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                  placeholder="Search by student name or NPM..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  className="px-4 py-3 border border-gray-600 rounded-lg shadow-sm bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  onClick={handleSearch}
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-6">
              <div className="text-sm text-gray-400 order-2 sm:order-1">
                {!isAllDataView ? (
                  <>Showing {academicData.data.length > 0 ? (academicData.page - 1) * academicData.pageSize + 1 : 0} to {Math.min(academicData.page * academicData.pageSize, academicData.total)} of {academicData.total} results</>
                ) : (
                  <>Showing all {academicData.data.length.toLocaleString()} academic records</>
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

      {/* Analytics View Info - UPDATED MESSAGE */}
      {currentViewType === 'all' && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 lg:p-6">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0"></div>
            <div className="text-sm text-gray-300">
              <strong>Analytics Mode:</strong> Comprehensive academic performance analysis from entire dataset 
              ({academicData.data.length.toLocaleString()} total records). 
              <strong className="text-green-400">Advanced filters available</strong> for targeted performance insights.
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
        {academicData.data.length === 0 ? (
          <div className="p-8 lg:p-12 text-center">
            <div className="text-gray-400 text-lg mb-2">No academic records found</div>
            <div className="text-gray-500 text-sm">Try adjusting your filters or search terms</div>
          </div>
        ) : viewMode === 'charts' ? (
          <div className="p-4 lg:p-6 space-y-6 lg:space-y-8">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-blue-400" size={20} />
              <h2 className="text-lg lg:text-xl font-semibold text-gray-100">
                Academic Performance Analytics
              </h2>
              <span className="text-sm text-gray-400">
                ({chartData.length.toLocaleString()} students)
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
            {/* GPA Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-base lg:text-lg font-medium text-gray-200">
                  GPA Distribution 
                  <span className="text-sm text-gray-400 ml-2">({chartData.length.toLocaleString()} students)</span>
                </h3>
                <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                  {gpaDistributionData.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-gray-400">
                      No GPA data to display
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={gpaDistributionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="name" 
                          tick={{fill: '#D1D5DB', fontSize: 12}}
                        />
                        <YAxis tick={{fill: '#D1D5DB', fontSize: 12}} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="value" 
                          name="Student Count" 
                          fill="#3B82F6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Faculty Performance */}
              <div className="space-y-3">
                <h3 className="text-base lg:text-lg font-medium text-gray-200">
                  Faculty Performance
                  <span className="text-sm text-gray-400 ml-2">({facultyPerformanceData.length} faculties)</span>
                </h3>
                <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                  {facultyPerformanceData.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-gray-400">
                      No faculty data to display
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={facultyPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="name" 
                          tick={{fill: '#D1D5DB', fontSize: 12}}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          tick={{fill: '#D1D5DB', fontSize: 12}}
                          domain={['dataMin - 0.1', 'dataMax + 0.1']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="averageGpa" 
                          name="Average GPA" 
                          fill="#10B981"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Program Performance */}
            <div className="space-y-3">
              <h3 className="text-base lg:text-lg font-medium text-gray-200">
                Top Programs by GPA
                <span className="text-sm text-gray-400 ml-2">(Top {Math.min(10, programPerformanceData.length)})</span>
              </h3>
              <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                {programPerformanceData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    No program data to display
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={programPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="name" 
                        tick={{fill: '#D1D5DB', fontSize: 12}}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tick={{fill: '#D1D5DB', fontSize: 12}}
                        domain={['dataMin - 0.1', 'dataMax + 0.1']}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="averageGpa" 
                        name="Average GPA" 
                        radius={[4, 4, 0, 0]}
                      >
                        {programPerformanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Credits vs GPA Scatter Plot */}
            <div className="space-y-3">
              <h3 className="text-base lg:text-lg font-medium text-gray-200">
                Credits vs GPA Correlation
                <span className="text-sm text-gray-400 ml-2">({creditsGpaData.length} students)</span>
              </h3>
              <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                {creditsGpaData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    No correlation data to display
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={creditsGpaData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="credits" 
                        tick={{fill: '#D1D5DB', fontSize: 12}}
                        name="Total Credits"
                      />
                      <YAxis 
                        dataKey="gpa" 
                        tick={{fill: '#D1D5DB', fontSize: 12}}
                        name="GPA"
                        domain={['dataMin - 0.1', 'dataMax + 0.1']}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-lg">
                                <p className="text-gray-200 font-bold">{data.name}</p>
                                <p className="text-blue-400">Credits: {data.credits}</p>
                                <p className="text-green-400">GPA: {data.gpa.toFixed(2)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter name="Students" fill="#8B5CF6" />
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
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
                      Semester GPA
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Cumulative GPA
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Semester
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Program
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Faculty
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {academicData.data.map((academic) => (
                    <tr key={academic.academicId} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-200">
                            {academic.studentName}
                          </div>
                          <div className="text-sm text-gray-400 font-mono">
                            {academic.npm}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getGpaColor(academic.semesterGpa)}`}>
                          {formatGpa(academic.semesterGpa)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getGpaColor(academic.cumulativeGpa)}`}>
                          {formatGpa(academic.cumulativeGpa)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        <div className="flex flex-col">
                          <span>Semester: {academic.semesterCredits}</span>
                          <span>Passed: {academic.creditsPassed}</span>
                          <span>Total: {academic.totalCredits}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {academic.semesterCode} {academic.academicYear}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-200 max-w-xs truncate">
                        {academic.programName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-200 max-w-xs truncate">
                        {academic.facultyName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="block lg:hidden divide-y divide-gray-700">
              {academicData.data.map((academic) => (
                <div key={academic.academicId} className="p-4 hover:bg-gray-700/30 transition-colors">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-200">{academic.studentName}</div>
                        <div className="text-sm text-gray-400 font-mono">{academic.npm}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getGpaColor(academic.cumulativeGpa)}`}>
                          {formatGpa(academic.cumulativeGpa)}
                        </div>
                        <div className="text-xs text-gray-400">Cumulative GPA</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Semester GPA:</span>
                        <span className={`ml-1 font-medium ${getGpaColor(academic.semesterGpa)}`}>
                          {formatGpa(academic.semesterGpa)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Total Credits:</span>
                        <span className="ml-1 text-gray-200">{academic.totalCredits}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                        {academic.semesterCode} {academic.academicYear}
                      </span>
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                        {academic.facultyName}
                      </span>
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                        {academic.programName}
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
                  Showing {academicData.data.length > 0 ? (academicData.page - 1) * academicData.pageSize + 1 : 0} to {Math.min(academicData.page * academicData.pageSize, academicData.total)} of {academicData.total} records
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
                  {Array.from({ length: Math.min(5, academicData.totalPages) }, (_, i) => {
                    let pageNum = currentPage;
                    if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= academicData.totalPages - 2) {
                      pageNum = academicData.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    if (pageNum > 0 && pageNum <= academicData.totalPages) {
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
                    disabled={currentPage === academicData.totalPages}
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