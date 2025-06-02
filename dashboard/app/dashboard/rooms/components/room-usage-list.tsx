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
  Scatter,
  Area,
  AreaChart
} from "recharts";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  X, 
  Filter, 
  List, 
  BarChart3, 
  MapPin,
  Users, 
  Clock,
  TrendingUp,
  Building,
  Activity,
  Gauge
} from "lucide-react";

type SemesterOption = {
  id: string;
  name: string;
};

type RoomOption = {
  id: number;
  building: string;
  capacity: number;
};

type RoomUsageDetail = {
  usageId: number;
  building: string;
  capacity: number;
  classCode: string;
  courseCode: string;
  courseName: string;
  lecturerName: string;
  usageDate: string;
  startTime: string;
  endTime: string;
  actualOccupancy: number;
  utilizationRate: number;
  occupancyRate: number;
  semesterCode: string;
  academicYear: string;
  duration: number;
};

type RoomUsageData = {
  data: RoomUsageDetail[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  buildings: string[];
  rooms: RoomOption[];
  stats: {
    totalUsageRecords: number;
    uniqueRooms: number;
    averageUtilizationRate: number;
    averageOccupancyRate: number;
    peakOccupancy: number;
    totalUsageHours: number;
  };
};

type RoomUsageListProps = {
  roomUsageData: RoomUsageData;
  semesterOptions: SemesterOption[];
  defaultViewMode?: string;
};

type ViewMode = 'table' | 'charts';

// Color palette for charts
const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

export default function RoomUsageList({ roomUsageData, semesterOptions, defaultViewMode = 'table' }: RoomUsageListProps) {
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
  const currentBuilding = searchParams.get("building") || "";
  const currentRoomId = searchParams.get("roomId") || "";
  const currentSearchTerm = searchParams.get("searchTerm") || "";
  const currentDateFrom = searchParams.get("dateFrom") || "";
  const currentDateTo = searchParams.get("dateTo") || "";
  const currentMinUtilization = searchParams.get("minUtilization") || "";
  const currentMaxUtilization = searchParams.get("maxUtilization") || "";
  const currentMinOccupancy = searchParams.get("minOccupancy") || "";
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
    
    // If changing building, reset room filter
    if (key === "building") {
      params.delete("roomId");
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
                          currentBuilding || 
                          currentRoomId ||
                          currentSearchTerm ||
                          currentDateFrom ||
                          currentDateTo ||
                          currentMinUtilization ||
                          currentMaxUtilization ||
                          currentMinOccupancy;

  // Use roomUsageData.data directly since server-side already handles viewType
  const chartData = roomUsageData.data;
  
  // Daily Usage Trend Data
  const dailyUsageData = useMemo(() => {
    if (chartData.length === 0) return [];
    
    const dailyStats: Record<string, { 
      date: string,
      totalUsage: number, 
      avgUtilization: number, 
      avgOccupancy: number,
      totalRecords: number 
    }> = {};
    
    chartData.forEach(item => {
      const date = item.usageDate;
      if (!dailyStats[date]) {
        dailyStats[date] = { 
          date, 
          totalUsage: 0, 
          avgUtilization: 0, 
          avgOccupancy: 0,
          totalRecords: 0 
        };
      }
      dailyStats[date].totalUsage += item.duration;
      dailyStats[date].avgUtilization += item.utilizationRate;
      dailyStats[date].avgOccupancy += item.occupancyRate;
      dailyStats[date].totalRecords++;
    });
    
    return Object.values(dailyStats)
      .map(stats => ({
        date: stats.date,
        totalUsage: Math.round(stats.totalUsage / 60), // Convert to hours
        avgUtilization: parseFloat((stats.avgUtilization / stats.totalRecords).toFixed(1)),
        avgOccupancy: parseFloat((stats.avgOccupancy / stats.totalRecords).toFixed(1))
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days
  }, [chartData]);

  // Building Performance Comparison
  const buildingPerformanceData = useMemo(() => {
    const buildingStats: Record<string, { 
      totalUsage: number, 
      totalRecords: number,
      avgUtilization: number,
      avgOccupancy: number,
      rooms: Set<string>
    }> = {};
    
    chartData.forEach(item => {
      if (!buildingStats[item.building]) {
        buildingStats[item.building] = { 
          totalUsage: 0, 
          totalRecords: 0,
          avgUtilization: 0,
          avgOccupancy: 0,
          rooms: new Set()
        };
      }
      buildingStats[item.building].totalUsage += item.duration;
      buildingStats[item.building].totalRecords++;
      buildingStats[item.building].avgUtilization += item.utilizationRate;
      buildingStats[item.building].avgOccupancy += item.occupancyRate;
      buildingStats[item.building].rooms.add(`${item.building}-${item.capacity}`);
    });
    
    return Object.entries(buildingStats)
      .map(([building, stats]) => ({
        building,
        totalHours: parseFloat((stats.totalUsage / 60).toFixed(1)),
        avgUtilization: parseFloat((stats.avgUtilization / stats.totalRecords).toFixed(1)),
        avgOccupancy: parseFloat((stats.avgOccupancy / stats.totalRecords).toFixed(1)),
        roomCount: stats.rooms.size,
        usageCount: stats.totalRecords
      }))
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [chartData]);

  // Time Slot Usage Analysis
  const timeSlotUsageData = useMemo(() => {
    const timeStats: Record<number, { 
      hour: number, 
      usage: number, 
      avgUtilization: number,
      recordCount: number 
    }> = {};
    
    chartData.forEach(item => {
      if (item.startTime) {
        const hour = parseInt(item.startTime.split(':')[0]);
        if (!timeStats[hour]) {
          timeStats[hour] = { hour, usage: 0, avgUtilization: 0, recordCount: 0 };
        }
        timeStats[hour].usage += item.duration;
        timeStats[hour].avgUtilization += item.utilizationRate;
        timeStats[hour].recordCount++;
      }
    });
    
    return Object.values(timeStats)
      .map(stat => ({
        hour: `${stat.hour.toString().padStart(2, '0')}:00`,
        usage: Math.round(stat.usage / 60), // Convert to hours
        avgUtilization: parseFloat((stat.avgUtilization / stat.recordCount).toFixed(1)),
        sessions: stat.recordCount
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
  }, [chartData]);

  // Utilization Rate Distribution
  const utilizationDistributionData = useMemo(() => {
    if (chartData.length === 0) return [];
    
    const ranges = [
      { name: '0-20%', min: 0, max: 20, count: 0 },
      { name: '20-40%', min: 20, max: 40, count: 0 },
      { name: '40-60%', min: 40, max: 60, count: 0 },
      { name: '60-80%', min: 60, max: 80, count: 0 },
      { name: '80-100%', min: 80, max: 100, count: 0 }
    ];
    
    chartData.forEach(item => {
      const rate = item.utilizationRate;
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

  // Occupancy vs Capacity Correlation
  const occupancyCapacityData = useMemo(() => {
    return chartData.map(item => ({
      capacity: item.capacity,
      occupancy: item.actualOccupancy,
      occupancyRate: item.occupancyRate,
      building: item.building,
      course: item.courseCode,
      utilizationRate: item.utilizationRate
    }));
  }, [chartData]);

  // Room Efficiency Ranking
  const roomEfficiencyData = useMemo(() => {
    const roomStats: Record<string, { 
      building: string,
      capacity: number,
      totalOccupancy: number,
      totalSessions: number,
      avgUtilization: number,
      totalHours: number
    }> = {};
    
    chartData.forEach(item => {
      const roomKey = `${item.building} (${item.capacity})`;
      if (!roomStats[roomKey]) {
        roomStats[roomKey] = { 
          building: item.building,
          capacity: item.capacity,
          totalOccupancy: 0,
          totalSessions: 0,
          avgUtilization: 0,
          totalHours: 0
        };
      }
      roomStats[roomKey].totalOccupancy += item.actualOccupancy;
      roomStats[roomKey].totalSessions++;
      roomStats[roomKey].avgUtilization += item.utilizationRate;
      roomStats[roomKey].totalHours += item.duration / 60;
    });
    
    return Object.entries(roomStats)
      .map(([room, stats]) => ({
        room,
        building: stats.building,
        capacity: stats.capacity,
        avgOccupancy: parseFloat((stats.totalOccupancy / stats.totalSessions).toFixed(1)),
        avgUtilization: parseFloat((stats.avgUtilization / stats.totalSessions).toFixed(1)),
        totalHours: parseFloat(stats.totalHours.toFixed(1)),
        efficiency: parseFloat(((stats.avgUtilization / stats.totalSessions) * (stats.totalOccupancy / stats.totalSessions / stats.capacity) * 100).toFixed(1))
      }))
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 10);
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
                 entry.name.includes('Hours') || entry.name.includes('Usage') ? `${entry.value}h` : 
                 entry.value) : 
                entry.value
              }
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

  // Format utilization rate for display
  const formatUtilizationRate = (rate: number) => {
    return `${rate.toFixed(1)}%`;
  };

  // Get utilization rate color
  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'text-green-400';
    if (rate >= 60) return 'text-blue-400';
    if (rate >= 40) return 'text-yellow-400';
    if (rate >= 20) return 'text-orange-400';
    return 'text-red-400';
  };

  // Get occupancy rate color
  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return 'text-green-400';
    if (rate >= 70) return 'text-blue-400';
    if (rate >= 50) return 'text-yellow-400';
    if (rate >= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Usage Records</p>
              <p className="text-2xl font-bold text-gray-100">{roomUsageData.stats.totalUsageRecords}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-600 rounded-lg">
              <Building className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Unique Rooms</p>
              <p className="text-2xl font-bold text-gray-100">{roomUsageData.stats.uniqueRooms}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Gauge className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Avg Utilization</p>
              <p className="text-2xl font-bold text-gray-100">{formatUtilizationRate(roomUsageData.stats.averageUtilizationRate)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-600 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Avg Occupancy</p>
              <p className="text-2xl font-bold text-gray-100">{formatUtilizationRate(roomUsageData.stats.averageOccupancyRate)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-600 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Peak Occupancy</p>
              <p className="text-2xl font-bold text-gray-100">{roomUsageData.stats.peakOccupancy}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Hours</p>
              <p className="text-2xl font-bold text-gray-100">{roomUsageData.stats.totalUsageHours.toFixed(0)}h</p>
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
                `Analytics: ${roomUsageData.data.length.toLocaleString()} total records` :
                `Paginated: ${roomUsageData.total} total records`
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
                Space Management Filters {isAllDataView && <span className="text-sm text-green-400">(Available in Analytics View)</span>}
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
                <label className="block text-sm font-medium mb-2 text-gray-200">Building</label>
                <select
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={currentBuilding}
                  onChange={(e) => handleFilterChange("building", e.target.value)}
                >
                  <option value="">All Buildings</option>
                  {roomUsageData.buildings.map((building) => (
                    <option key={building} value={building}>
                      {building}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">Room</label>
                <select
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  value={currentRoomId}
                  onChange={(e) => handleFilterChange("roomId", e.target.value)}
                  disabled={roomUsageData.rooms.length === 0}
                >
                  <option value="">All Rooms</option>
                  {roomUsageData.rooms.map((room) => (
                    <option key={room.id} value={room.id.toString()}>
                      {room.building} (Cap: {room.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">Search</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Class, course, lecturer..."
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
            
            {/* Advanced Filters */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  <label className="block text-sm font-medium mb-2 text-gray-200">Min Utilization (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="0"
                    value={currentMinUtilization}
                    onChange={(e) => handleFilterChange("minUtilization", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-200">Max Utilization (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="100"
                    value={currentMaxUtilization}
                    onChange={(e) => handleFilterChange("maxUtilization", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-200">Min Occupancy</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="0"
                    value={currentMinOccupancy}
                    onChange={(e) => handleFilterChange("minOccupancy", e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-6">
              <div className="text-sm text-gray-400 order-2 sm:order-1">
                {!isAllDataView ? (
                  <>Showing {roomUsageData.data.length > 0 ? (roomUsageData.page - 1) * roomUsageData.pageSize + 1 : 0} to {Math.min(roomUsageData.page * roomUsageData.pageSize, roomUsageData.total)} of {roomUsageData.total} results</>
                ) : (
                  <>Showing all {roomUsageData.data.length.toLocaleString()} usage records</>
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
              <strong>Space Analytics Mode:</strong> Comprehensive facility utilization analysis from entire dataset 
              ({roomUsageData.data.length.toLocaleString()} total records). 
              <strong className="text-green-400">Advanced filters available</strong> for targeted space optimization insights.
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
        {roomUsageData.data.length === 0 ? (
          <div className="p-8 lg:p-12 text-center">
            <div className="text-gray-400 text-lg mb-2">No room usage records found</div>
            <div className="text-gray-500 text-sm">Try adjusting your filters or search terms</div>
          </div>
        ) : viewMode === 'charts' ? (
          <div className="p-4 lg:p-6 space-y-6 lg:space-y-8">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-blue-400" size={20} />
              <h2 className="text-lg lg:text-xl font-semibold text-gray-100">
                Space Utilization Analytics
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
                {/* Daily Usage Trend */}
                <div className="space-y-3">
                  <h3 className="text-base lg:text-lg font-medium text-gray-200">
                    Daily Usage Trends
                    <span className="text-sm text-gray-400 ml-2">(Last 30 days)</span>
                  </h3>
                  <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={dailyUsageData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          tick={{fill: '#D1D5DB', fontSize: 12}}
                          tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis tick={{fill: '#D1D5DB', fontSize: 12}} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="totalUsage" 
                          stroke="#3B82F6" 
                          fill="#3B82F6" 
                          fillOpacity={0.3}
                          name="Total Usage (Hours)"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="avgUtilization" 
                          stroke="#10B981" 
                          fill="#10B981" 
                          fillOpacity={0.3}
                          name="Avg Utilization Rate"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Building Performance and Time Slot Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Building Performance */}
                  <div className="space-y-3">
                    <h3 className="text-base lg:text-lg font-medium text-gray-200">
                      Building Performance Comparison
                    </h3>
                    <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={buildingPerformanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="building" 
                            tick={{fill: '#D1D5DB', fontSize: 10}}
                            angle={-45}
                            textAnchor="end"
                            height={80}
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

                  {/* Time Slot Usage */}
                  <div className="space-y-3">
                    <h3 className="text-base lg:text-lg font-medium text-gray-200">
                      Peak Usage Hours
                    </h3>
                    <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={timeSlotUsageData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="hour" 
                            tick={{fill: '#D1D5DB', fontSize: 12}}
                          />
                          <YAxis tick={{fill: '#D1D5DB', fontSize: 12}} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="usage" 
                            name="Usage (Hours)" 
                            fill="#8B5CF6"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Utilization Distribution and Occupancy Correlation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Utilization Rate Distribution */}
                  <div className="space-y-3">
                    <h3 className="text-base lg:text-lg font-medium text-gray-200">
                      Utilization Rate Distribution
                    </h3>
                    <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={utilizationDistributionData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {utilizationDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Occupancy vs Capacity */}
                  <div className="space-y-3">
                    <h3 className="text-base lg:text-lg font-medium text-gray-200">
                      Occupancy vs Room Capacity
                    </h3>
                    <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                      <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart data={occupancyCapacityData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="capacity" 
                            tick={{fill: '#D1D5DB', fontSize: 12}}
                            name="Room Capacity"
                          />
                          <YAxis 
                            dataKey="occupancy" 
                            tick={{fill: '#D1D5DB', fontSize: 12}}
                            name="Actual Occupancy"
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-lg">
                                    <p className="text-gray-200 font-bold">{data.building}</p>
                                    <p className="text-blue-400">Course: {data.course}</p>
                                    <p className="text-green-400">Capacity: {data.capacity}</p>
                                    <p className="text-yellow-400">Occupancy: {data.occupancy}</p>
                                    <p className="text-purple-400">Rate: {data.occupancyRate.toFixed(1)}%</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Scatter name="Room Usage" fill="#F59E0B" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Room Efficiency Ranking */}
                <div className="space-y-3">
                  <h3 className="text-base lg:text-lg font-medium text-gray-200">
                    Most Efficient Rooms
                    <span className="text-sm text-gray-400 ml-2">(Top 10 by efficiency score)</span>
                  </h3>
                  <div className="bg-gray-900 border border-gray-700 p-3 lg:p-4 rounded-lg">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={roomEfficiencyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="room" 
                          tick={{fill: '#D1D5DB', fontSize: 8}}
                          angle={-45}
                          textAnchor="end"
                          height={120}
                        />
                        <YAxis tick={{fill: '#D1D5DB', fontSize: 12}} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="efficiency" 
                          name="Efficiency Score"
                          radius={[4, 4, 0, 0]}
                        >
                          {roomEfficiencyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
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
                      Room & Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Class & Course
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Utilization
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Occupancy
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Semester
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {roomUsageData.data.map((usage) => (
                    <tr key={usage.usageId} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-200">
                            {usage.building}
                          </div>
                          <div className="text-sm text-gray-400">
                            Capacity: {usage.capacity}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-200">
                            {usage.classCode}
                          </div>
                          <div className="text-sm text-gray-400">
                            {usage.courseCode} - {usage.courseName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {usage.lecturerName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-200">
                            {formatDate(usage.usageDate)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {formatTime(usage.startTime)} - {formatTime(usage.endTime)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {usage.duration} minutes
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className={`text-sm font-medium ${getUtilizationColor(usage.utilizationRate)}`}>
                            {formatUtilizationRate(usage.utilizationRate)}
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(usage.utilizationRate, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className={`text-sm font-medium ${getOccupancyColor(usage.occupancyRate)}`}>
                            {usage.actualOccupancy}/{usage.capacity}
                          </div>
                          <div className="text-sm text-gray-400">
                            {formatUtilizationRate(usage.occupancyRate)}
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(usage.occupancyRate, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-200">
                          {usage.semesterCode} {usage.academicYear}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="block lg:hidden divide-y divide-gray-700">
              {roomUsageData.data.map((usage) => (
                <div key={usage.usageId} className="p-4 hover:bg-gray-700/30 transition-colors">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-200">{usage.building}</div>
                        <div className="text-sm text-gray-400">Capacity: {usage.capacity}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getUtilizationColor(usage.utilizationRate)}`}>
                          {formatUtilizationRate(usage.utilizationRate)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Utilization
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Class:</span>
                        <span className="ml-1 text-gray-200">{usage.classCode}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Course:</span>
                        <span className="ml-1 text-gray-200">{usage.courseCode} - {usage.courseName}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Lecturer:</span>
                        <span className="ml-1 text-gray-200">{usage.lecturerName}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Schedule:</span>
                        <span className="ml-1 text-gray-200">
                          {formatDate(usage.usageDate)} • {formatTime(usage.startTime)} - {formatTime(usage.endTime)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Occupancy:</span>
                        <span className={`ml-1 font-medium ${getOccupancyColor(usage.occupancyRate)}`}>
                          {usage.actualOccupancy}/{usage.capacity} ({formatUtilizationRate(usage.occupancyRate)})
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                        {usage.semesterCode} {usage.academicYear}
                      </span>
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                        {usage.duration} min
                      </span>
                    </div>
                    
                    {/* Progress bars for mobile */}
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Utilization</span>
                          <span>{formatUtilizationRate(usage.utilizationRate)}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(usage.utilizationRate, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Occupancy</span>
                          <span>{formatUtilizationRate(usage.occupancyRate)}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(usage.occupancyRate, 100)}%` }}
                          ></div>
                        </div>
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
                  Showing {roomUsageData.data.length > 0 ? (roomUsageData.page - 1) * roomUsageData.pageSize + 1 : 0} to {Math.min(roomUsageData.page * roomUsageData.pageSize, roomUsageData.total)} of {roomUsageData.total} records
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
                  {Array.from({ length: Math.min(5, roomUsageData.totalPages) }, (_, i) => {
                    let pageNum = currentPage;
                    if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= roomUsageData.totalPages - 2) {
                      pageNum = roomUsageData.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    if (pageNum > 0 && pageNum <= roomUsageData.totalPages) {
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
                    disabled={currentPage === roomUsageData.totalPages}
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