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
import { ChevronLeft, ChevronRight, Search, X, Filter, List, BarChart3, DollarSign, CreditCard, Users, TrendingUp } from "lucide-react";

type SemesterOption = {
  id: string;
  name: string;
};

type FinanceDetail = {
  feeId: number;
  npm: string;
  studentName: string;
  semesterCode: string;
  academicYear: string;
  feeAmount: number;
  paymentDate: string;
  programName: string;
  facultyName: string;
};

type FinanceData = {
  data: FinanceDetail[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  faculties: string[];
  programs: string[];
  stats: {
    totalAmount: number;
    averageAmount: number;
    totalPayments: number;
    averagePaymentsPerStudent: number;
  };
};

type FinanceListProps = {
  financeData: FinanceData;
  semesterOptions: SemesterOption[];
  defaultViewMode?: string;
};

type ViewMode = 'table' | 'charts';

// Color palette for charts
const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

export default function FinanceList({ financeData, semesterOptions, defaultViewMode = 'table' }: FinanceListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchInput, setSearchInput] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(
    (defaultViewMode === 'charts' ? 'charts' : 'table') as ViewMode
  );
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Format currency for display - moved to the top to prevent reference errors
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };
  
  // Format date from ISO to readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Get current view type from URL (paginated or all)
  const currentViewType = searchParams.get("viewType") || "paginated";
  const isAllDataView = currentViewType === "all";
  
  // Get current filter values from URL
  const currentSemesterId = searchParams.get("semesterId") || "";
  const currentFacultyName = searchParams.get("facultyName") || "";
  const currentProgramName = searchParams.get("programName") || "";
  const currentSearchTerm = searchParams.get("searchTerm") || "";
  const currentMinAmount = searchParams.get("minAmount") || "";
  const currentMaxAmount = searchParams.get("maxAmount") || "";
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
                          currentMinAmount ||
                          currentMaxAmount;

  // Use financeData.data directly since server-side already handles viewType
  const chartData = financeData.data;
  
  // Faculty distribution chart data
  const facultyChartData = useMemo(() => {
    const facultyCounts: Record<string, { count: number, amount: number }> = {};
    
    chartData.forEach(item => {
      if (!facultyCounts[item.facultyName]) {
        facultyCounts[item.facultyName] = { count: 0, amount: 0 };
      }
      facultyCounts[item.facultyName].count++;
      facultyCounts[item.facultyName].amount += item.feeAmount;
    });
    
    return Object.entries(facultyCounts).map(([name, data]) => ({
      name,
      value: data.amount,
      count: data.count
    }));
  }, [chartData]);
  
  // Program distribution chart data
  const programChartData = useMemo(() => {
    const programCounts: Record<string, { count: number, amount: number }> = {};
    
    chartData.forEach(item => {
      if (!programCounts[item.programName]) {
        programCounts[item.programName] = { count: 0, amount: 0 };
      }
      programCounts[item.programName].count++;
      programCounts[item.programName].amount += item.feeAmount;
    });
    
    // Sort by amount in descending order and take top 10
    return Object.entries(programCounts)
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [chartData]);
  
  // Payment trends by semester chart data
  const semesterTrendsData = useMemo(() => {
    const semesterCounts: Record<string, { count: number, amount: number }> = {};
    
    chartData.forEach(item => {
      const semesterKey = `${item.semesterCode} ${item.academicYear}`;
      if (!semesterCounts[semesterKey]) {
        semesterCounts[semesterKey] = { count: 0, amount: 0 };
      }
      semesterCounts[semesterKey].count++;
      semesterCounts[semesterKey].amount += item.feeAmount;
    });
    
    // Sort by academic year and semester code
    return Object.entries(semesterCounts)
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        averageAmount: Math.round(data.amount / data.count)
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

  // Payment amount distribution data
  const amountDistributionData = useMemo(() => {
    if (chartData.length === 0) return [];
    
    const amounts = chartData.map(item => item.feeAmount).sort((a, b) => a - b);
    const maxAmount = Math.max(...amounts);
    const minAmount = Math.min(...amounts);
    
    // Create amount ranges
    const ranges: any[] = [];
    const rangeSize = Math.ceil((maxAmount - minAmount) / 6);
    
    for (let i = 0; i < 6; i++) {
      const start = minAmount + (i * rangeSize);
      const end = i === 5 ? maxAmount : start + rangeSize - 1;
      ranges.push({
        name: `${formatCurrency(start)} - ${formatCurrency(end)}`,
        min: start,
        max: end,
        count: 0
      });
    }
    
    chartData.forEach(item => {
      const amount = item.feeAmount;
      ranges.forEach(range => {
        if (amount >= range.min && amount <= range.max) {
          range.count++;
        }
      });
    });
    
    return ranges
      .filter(range => range.count > 0)
      .map(({ name, count }) => ({ name, value: count, count }));
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
              {entry.name}: {entry.name.includes('Amount') || entry.name.includes('Payment') ? 
                formatCurrency(entry.value) : 
                entry.value
              }
            </p>
          ))}
          {data.payload?.count && data.name !== 'Payment Count' && (
            <p className="text-green-400">Payments: {data.payload.count}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-600 rounded-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Amount</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-100">
                {formatCurrency(financeData.stats.totalAmount)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Payments</p>
              <p className="text-2xl font-bold text-gray-100">{financeData.stats.totalPayments.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-600 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Average Amount</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-100">
                {formatCurrency(financeData.stats.averageAmount)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-600 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Avg. per Student</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-100">
                {financeData.stats.averagePaymentsPerStudent}
              </p>
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
                `Analytics: ${financeData.data.length.toLocaleString()} total records` :
                `Paginated: ${financeData.total} total records`
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
                Payment Filters {isAllDataView && <span className="text-sm text-green-400">(Available in Analytics View)</span>}
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
                  {financeData.faculties.map((faculty) => (
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
                  disabled={financeData.programs.length === 0}
                >
                  <option value="">All Programs</option>
                  {financeData.programs.map((program) => (
                    <option key={program} value={program}>
                      {program}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">Min Amount</label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="0"
                  value={currentMinAmount}
                  onChange={(e) => handleFilterChange("minAmount", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">Max Amount</label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="10000000"
                  value={currentMaxAmount}
                  onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
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
                  <>Showing {financeData.data.length > 0 ? (financeData.page - 1) * financeData.pageSize + 1 : 0} to {Math.min(financeData.page * financeData.pageSize, financeData.total)} of {financeData.total} results</>
                ) : (
                  <>Showing all {financeData.data.length.toLocaleString()} payment records</>
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
              <strong>Analytics Mode:</strong> Comprehensive payment analysis from entire dataset 
              ({financeData.data.length.toLocaleString()} total records). 
              <strong className="text-green-400">Advanced filters available</strong> for targeted financial insights.
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
        {financeData.data.length === 0 ? (
          <div className="p-8 lg:p-12 text-center">
            <div className="text-gray-400 text-lg mb-2">No payment records found</div>
            <div className="text-gray-500 text-sm">Try adjusting your filters or search terms</div>
          </div>
        ) : viewMode === 'charts' ? (
          <div className="p-4 lg:p-6 space-y-6 lg:space-y-8">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-blue-400" size={20} />
              <h2 className="text-lg lg:text-xl font-semibold text-gray-100">
                Payment Analytics
              </h2>
              <span className="text-sm text-gray-400">
                ({chartData.length.toLocaleString()} payments)
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
                {/* Payment Distribution by Faculty and Amount Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-base lg:text-lg font-medium text-gray-200">
                      Payment Distribution by Faculty
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
                      Payment Amount Distribution
                      <span className="text-sm text-gray-400 ml-2">({amountDistributionData.length} ranges)</span>
                    </h3>
                    <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                      {amountDistributionData.length === 0 ? (
                        <div className="h-[300px] flex items-center justify-center text-gray-400">
                          No amount distribution data to display
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={amountDistributionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis 
                              dataKey="name" 
                              tick={{fill: '#D1D5DB', fontSize: 10}}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis tick={{fill: '#D1D5DB', fontSize: 12}} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                              dataKey="value" 
                              name="Payment Count" 
                              fill="#3B82F6"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top Programs by Payment Amount */}
                <div className="space-y-3">
                  <h3 className="text-base lg:text-lg font-medium text-gray-200">
                    Top Programs by Payment Amount
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
                            tickFormatter={(value) => `${(value/1000000).toFixed(0)}M`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="amount" 
                            name="Total Amount" 
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

                {/* Payment Trends by Semester */}
                <div className="space-y-3">
                  <h3 className="text-base lg:text-lg font-medium text-gray-200">
                    Payment Trends by Semester
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
                            tickFormatter={(value) => `${(value/1000000).toFixed(0)}M`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Line 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#10B981"
                            strokeWidth={3}
                            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                            name="Total Amount"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="averageAmount" 
                            stroke="#F59E0B"
                            strokeWidth={2}
                            dot={{ fill: '#F59E0B', strokeWidth: 2, r: 3 }}
                            name="Average Amount"
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
                      Fee Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Payment Date
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
                  {financeData.data.map((finance) => (
                    <tr key={finance.feeId} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-200">
                            {finance.studentName}
                          </div>
                          <div className="text-sm text-gray-400 font-mono">
                            {finance.npm}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">
                        {formatCurrency(finance.feeAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {formatDate(finance.paymentDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {`${finance.semesterCode} ${finance.academicYear}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-200 max-w-xs truncate">
                        {finance.programName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-200 max-w-xs truncate">
                        {finance.facultyName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="block lg:hidden divide-y divide-gray-700">
              {financeData.data.map((finance) => (
                <div key={finance.feeId} className="p-4 hover:bg-gray-700/30 transition-colors">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-200">{finance.studentName}</div>
                        <div className="text-sm text-gray-400 font-mono">{finance.npm}</div>
                      </div>
                      <div className="text-sm font-medium text-green-400">
                        {formatCurrency(finance.feeAmount)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm text-gray-300">
                        Payment Date: {formatDate(finance.paymentDate)}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                          {finance.semesterCode} {finance.academicYear}
                        </span>
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                          {finance.facultyName}
                        </span>
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                          {finance.programName}
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
                  Showing {financeData.data.length > 0 ? (financeData.page - 1) * financeData.pageSize + 1 : 0} to {Math.min(financeData.page * financeData.pageSize, financeData.total)} of {financeData.total} payments
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
                  {Array.from({ length: Math.min(5, financeData.totalPages) }, (_, i) => {
                    let pageNum = currentPage;
                    if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= financeData.totalPages - 2) {
                      pageNum = financeData.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    if (pageNum > 0 && pageNum <= financeData.totalPages) {
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
                    disabled={currentPage === financeData.totalPages}
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