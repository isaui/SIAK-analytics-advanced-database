"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line 
} from "recharts";
import { ChevronLeft, ChevronRight, Search, X, Filter, List, BarChart3, Users, BookOpen, Calendar, Award } from "lucide-react";

type SemesterOption = {
  id: string;
  name: string;
};

type RegistrationDetail = {
  registrationId: number;
  npm: string;
  studentName: string;
  courseCode: string;
  courseName: string;
  credits: number;
  semesterCode: string;
  academicYear: string;
  registrationDate: string;
  programName: string;
  facultyName: string;
};

type RegistrationData = {
  data: RegistrationDetail[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  faculties: string[];
  programs: string[];
  stats: {
    totalRegistrations: number;
    totalStudents: number;
    totalCourses: number;
    averageCredits: number;
  };
};

type RegistrationListProps = {
  registrationData: RegistrationData;
  semesterOptions: SemesterOption[];
  defaultViewMode?: string;
};

type ViewMode = 'table' | 'charts';

// Color palette for charts
const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

export default function RegistrationList({ registrationData, semesterOptions, defaultViewMode = 'table' }: RegistrationListProps) {
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
  const currentMinCredits = searchParams.get("minCredits") || "";
  const currentMaxCredits = searchParams.get("maxCredits") || "";
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

  // Check if any filters are active
  const hasActiveFilters = currentSemesterId || 
                          currentFacultyName || 
                          currentProgramName || 
                          currentSearchTerm ||
                          currentMinCredits ||
                          currentMaxCredits;

  // Use registrationData.data directly since server-side already handles viewType
  const chartData = registrationData.data;
  
  // Faculty distribution chart data
  const facultyChartData = useMemo(() => {
    const facultyCounts: Record<string, number> = {};
    
    chartData.forEach(item => {
      if (!facultyCounts[item.facultyName]) {
        facultyCounts[item.facultyName] = 0;
      }
      facultyCounts[item.facultyName]++;
    });
    
    return Object.entries(facultyCounts).map(([name, value]) => ({
      name,
      value
    }));
  }, [chartData]);
  
  // Program distribution chart data
  const programChartData = useMemo(() => {
    const programCounts: Record<string, number> = {};
    
    chartData.forEach(item => {
      if (!programCounts[item.programName]) {
        programCounts[item.programName] = 0;
      }
      programCounts[item.programName]++;
    });
    
    // Sort by count in descending order and take top 10
    return Object.entries(programCounts)
      .map(([name, value]) => ({
        name,
        value
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [chartData]);
  
  // Registration trends by semester chart data
  const semesterTrendsData = useMemo(() => {
    const semesterCounts: Record<string, number> = {};
    
    chartData.forEach(item => {
      const semesterKey = `${item.semesterCode} ${item.academicYear}`;
      if (!semesterCounts[semesterKey]) {
        semesterCounts[semesterKey] = 0;
      }
      semesterCounts[semesterKey]++;
    });
    
    // Sort by academic year and semester code
    return Object.entries(semesterCounts)
      .map(([name, value]) => ({
        name,
        value
      }))
      .sort((a, b) => {
        const [aCode, aYear] = a.name.split(' ');
        const [bCode, bYear] = b.name.split(' ');
        if (aYear === bYear) {
          return Number(aCode) - Number(bCode);
        }
        return Number(aYear) - Number(bYear);
      });
  }, [chartData]);

  // Credits distribution data
  const creditsDistributionData = useMemo(() => {
    if (chartData.length === 0) return [];
    
    const creditCounts: Record<number, number> = {};
    
    chartData.forEach(item => {
      if (!creditCounts[item.credits]) {
        creditCounts[item.credits] = 0;
      }
      creditCounts[item.credits]++;
    });
    
    return Object.entries(creditCounts)
      .map(([credits, count]) => ({
        name: `${credits} Credits`,
        value: count,
        credits: parseInt(credits)
      }))
      .sort((a, b) => a.credits - b.credits);
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
              {entry.name}: {entry.value} {entry.name === 'Registrations' || entry.name === 'Count' ? 'registrations' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Format date from ISO to readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Registrations</p>
              <p className="text-2xl font-bold text-gray-100">{registrationData.stats.totalRegistrations.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-600 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-gray-100">{registrationData.stats.totalStudents.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Courses</p>
              <p className="text-2xl font-bold text-gray-100">{registrationData.stats.totalCourses.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-600 rounded-lg">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Average Credits</p>
              <p className="text-2xl font-bold text-gray-100">{registrationData.stats.averageCredits.toFixed(1)}</p>
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
                `Analytics: ${registrationData.data.length.toLocaleString()} total records` :
                `Paginated: ${registrationData.total} total records`
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
                Registration Filters {isAllDataView && <span className="text-sm text-green-400">(Available in Analytics View)</span>}
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
                  {registrationData.faculties.map((faculty) => (
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
                  disabled={registrationData.programs.length === 0}
                >
                  <option value="">All Programs</option>
                  {registrationData.programs.map((program) => (
                    <option key={program} value={program}>
                      {program}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">Min Credits</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="0"
                  value={currentMinCredits}
                  onChange={(e) => handleFilterChange("minCredits", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">Max Credits</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="10"
                  value={currentMaxCredits}
                  onChange={(e) => handleFilterChange("maxCredits", e.target.value)}
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
                  placeholder="Search by student name, NPM, course code or name..."
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
                  <>Showing {registrationData.data.length > 0 ? (registrationData.page - 1) * registrationData.pageSize + 1 : 0} to {Math.min(registrationData.page * registrationData.pageSize, registrationData.total)} of {registrationData.total} results</>
                ) : (
                  <>Showing all {registrationData.data.length.toLocaleString()} registration records</>
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
              <strong>Analytics Mode:</strong> Comprehensive registration analysis from entire dataset 
              ({registrationData.data.length.toLocaleString()} total records). 
              <strong className="text-green-400">Advanced filters available</strong> for targeted registration insights.
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
        {registrationData.data.length === 0 ? (
          <div className="p-8 lg:p-12 text-center">
            <div className="text-gray-400 text-lg mb-2">No registration records found</div>
            <div className="text-gray-500 text-sm">Try adjusting your filters or search terms</div>
          </div>
        ) : viewMode === 'charts' ? (
          <div className="p-4 lg:p-6 space-y-6 lg:space-y-8">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-blue-400" size={20} />
              <h2 className="text-lg lg:text-xl font-semibold text-gray-100">
                Registration Analytics
              </h2>
              <span className="text-sm text-gray-400">
                ({chartData.length.toLocaleString()} registrations)
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
                {/* Registration Distribution by Faculty and Credits Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-base lg:text-lg font-medium text-gray-200">
                      Registration Distribution by Faculty
                      <span className="text-sm text-gray-400 ml-2">({facultyChartData.length} faculties)</span>
                    </h3>
                    <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                      {facultyChartData.length === 0 ? (
                        <div className="h-[300px] flex items-center justify-center text-gray-400">
                          No faculty data to display
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={facultyChartData}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {facultyChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base lg:text-lg font-medium text-gray-200">
                      Credits Distribution
                      <span className="text-sm text-gray-400 ml-2">({creditsDistributionData.length} credit types)</span>
                    </h3>
                    <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                      {creditsDistributionData.length === 0 ? (
                        <div className="h-[300px] flex items-center justify-center text-gray-400">
                          No credits distribution data to display
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={creditsDistributionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis 
                              dataKey="name" 
                              tick={{fill: '#D1D5DB', fontSize: 12}}
                            />
                            <YAxis tick={{fill: '#D1D5DB', fontSize: 12}} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                              dataKey="value" 
                              name="Registrations" 
                              fill="#3B82F6"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top Programs by Registration Count */}
                <div className="space-y-3">
                  <h3 className="text-base lg:text-lg font-medium text-gray-200">
                    Top Programs by Registration Count
                    <span className="text-sm text-gray-400 ml-2">(Top {Math.min(10, programChartData.length)})</span>
                  </h3>
                  <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                    {programChartData.length === 0 ? (
                      <div className="h-[300px] flex items-center justify-center text-gray-400">
                        No program data to display
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={programChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="name" 
                            tick={{fill: '#D1D5DB', fontSize: 12}}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval={0}
                          />
                          <YAxis 
                            tick={{fill: '#D1D5DB', fontSize: 12}}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="value" 
                            name="Registrations" 
                            radius={[4, 4, 0, 0]}
                          >
                            {programChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Registration Trends by Semester */}
                <div className="space-y-3">
                  <h3 className="text-base lg:text-lg font-medium text-gray-200">
                    Registration Trends by Semester
                    <span className="text-sm text-gray-400 ml-2">({semesterTrendsData.length} semesters)</span>
                  </h3>
                  <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                    {semesterTrendsData.length === 0 ? (
                      <div className="h-[300px] flex items-center justify-center text-gray-400">
                        No semester trends data to display
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={semesterTrendsData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="name" 
                            tick={{fill: '#D1D5DB', fontSize: 12}}
                          />
                          <YAxis 
                            tick={{fill: '#D1D5DB', fontSize: 12}}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#10B981"
                            strokeWidth={3}
                            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                            name="Registrations"
                          />
                        </LineChart>
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
                      Course
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Semester
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Registration Date
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
                  {registrationData.data.map((registration) => (
                    <tr key={registration.registrationId} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-200">
                            {registration.studentName}
                          </div>
                          <div className="text-sm text-gray-400 font-mono">
                            {registration.npm}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-200">
                            {registration.courseName}
                          </div>
                          <div className="text-sm text-gray-400 font-mono">
                            {registration.courseCode}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-200">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {registration.credits}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {registration.semesterCode} {registration.academicYear}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {formatDate(registration.registrationDate)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-200 max-w-xs truncate">
                        {registration.programName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-200 max-w-xs truncate">
                        {registration.facultyName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="block lg:hidden divide-y divide-gray-700">
              {registrationData.data.map((registration) => (
                <div key={registration.registrationId} className="p-4 hover:bg-gray-700/30 transition-colors">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-200">{registration.studentName}</div>
                        <div className="text-sm text-gray-400 font-mono">{registration.npm}</div>
                      </div>
                      <div className="text-xs text-gray-400 text-right">
                        {formatDate(registration.registrationDate)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm font-medium text-gray-300">{registration.courseName}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                          <span className="font-mono">{registration.courseCode}</span>
                          <span>•</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {registration.credits} credits
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                          {registration.semesterCode} {registration.academicYear}
                        </span>
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                          {registration.facultyName}
                        </span>
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                          {registration.programName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination - Only for Paginated View */}
            {currentViewType === 'paginated' && (
              <div className="p-4 lg:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-700 bg-gray-800/50">
                <div className="text-sm text-gray-400 order-2 sm:order-1">
                  Showing {registrationData.data.length > 0 ? (registrationData.page - 1) * registrationData.pageSize + 1 : 0} to {Math.min(registrationData.page * registrationData.pageSize, registrationData.total)} of {registrationData.total} registrations
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
                  {Array.from({ length: Math.min(5, registrationData.totalPages) }, (_, i) => {
                    let pageNum = currentPage;
                    if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= registrationData.totalPages - 2) {
                      pageNum = registrationData.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    if (pageNum > 0 && pageNum <= registrationData.totalPages) {
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
                    disabled={currentPage === registrationData.totalPages}
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