'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Search, PieChart, BarChart as BarChartIcon, List } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as PieChartComponent, Pie, Cell 
} from 'recharts';
import { PaginatedRegistrationDetails } from '@/app/actions/registration-details';

type Semester = {
  id: number;
  code: string;
  academicYear: string;
};

type RegistrationListProps = {
  initialData: PaginatedRegistrationDetails;
  semesters: Semester[];
};

export function RegistrationList({ initialData, semesters }: RegistrationListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // View mode state (table or charts)
  const [viewMode, setViewMode] = useState<'table' | 'charts'>('table');

  // Parse current search params
  const currentSearchParams = {
    page: searchParams.get('page') || '1',
    pageSize: searchParams.get('pageSize') || '10',
    semesterId: searchParams.get('semesterId') || '',
    facultyName: searchParams.get('facultyName') || '',
    programName: searchParams.get('programName') || '',
    searchTerm: searchParams.get('searchTerm') || ''
  };
  
  // Local state for search term (to avoid navigation on every keystroke)
  const [searchInputValue, setSearchInputValue] = React.useState(
    currentSearchParams.searchTerm
  );

  // Helper to update URL with search params
  const updateSearchParams = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    // Update params
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    
    // Reset to page 1 if filters change (but not when changing page)
    if (!('page' in params)) {
      newParams.set('page', '1');
    }
    
    router.push(`/registrations?${newParams.toString()}`);
  };

  const handleSearch = () => {
    updateSearchParams({ searchTerm: searchInputValue });
  };

  const handleClearFilters = () => {
    setSearchInputValue('');
    router.push('/registrations');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID');
  };

  const { 
    data: registrations, 
    total, 
    page, 
    pageSize, 
    totalPages,
    faculties,
    programs
  } = initialData;
  
  // Process data for charts
  const registrationsByFaculty = React.useMemo(() => {
    const countMap = new Map<string, number>();
    
    registrations.forEach(reg => {
      const faculty = reg.facultyName || 'Unknown';
      countMap.set(faculty, (countMap.get(faculty) || 0) + 1);
    });
    
    return Array.from(countMap.entries()).map(([name, value]) => ({
      name,
      value
    }));
  }, [registrations]);
  
  const registrationsByProgram = React.useMemo(() => {
    const countMap = new Map<string, number>();
    
    registrations.forEach(reg => {
      const program = reg.programName || 'Unknown';
      countMap.set(program, (countMap.get(program) || 0) + 1);
    });
    
    return Array.from(countMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 programs
  }, [registrations]);
  
  const registrationsBySemester = React.useMemo(() => {
    const countMap = new Map<string, number>();
    
    registrations.forEach(reg => {
      const semester = `${reg.semesterCode} ${reg.academicYear}` || 'Unknown';
      countMap.set(semester, (countMap.get(semester) || 0) + 1);
    });
    
    return Array.from(countMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        // Sort by academicYear and then by semesterCode
        const [codeA, yearA] = a.name.split(' ');
        const [codeB, yearB] = b.name.split(' ');
        return yearA === yearB ? codeA.localeCompare(codeB) : yearA.localeCompare(yearB);
      });
  }, [registrations]);
  
  // COLORS for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

  return (
    <div className="space-y-6">
      {/* Tab Bar for View Mode */}
      <div className="flex justify-center bg-gray-800 rounded-lg shadow p-2">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            className={`px-4 py-2 text-sm font-medium border ${viewMode === 'table' ? 'bg-gray-700 border-gray-500 text-gray-100' : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'} rounded-l-lg focus:outline-none focus:z-10 focus:ring-2 focus:ring-blue-500`}
            onClick={() => setViewMode('table')}
          >
            <div className="flex items-center gap-2">
              <List size={16} />
              <span>Table View</span>
            </div>
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border ${viewMode === 'charts' ? 'bg-gray-700 border-gray-500 text-gray-100' : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'} rounded-r-lg focus:outline-none focus:z-10 focus:ring-2 focus:ring-blue-500`}
            onClick={() => setViewMode('charts')}
          >
            <div className="flex items-center gap-2">
              <BarChartIcon size={16} />
              <span>Charts View</span>
            </div>
          </button>
        </div>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">Semester</label>
            <select
              className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={currentSearchParams.semesterId}
              onChange={(e) => updateSearchParams({ semesterId: e.target.value })}
            >
              <option value="">All Semesters</option>
              {semesters.map((semester) => (
                <option key={semester.id} value={semester.id.toString()}>
                  {semester.code} {semester.academicYear}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">Faculty</label>
            <select
              className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={currentSearchParams.facultyName}
              onChange={(e) => updateSearchParams({ 
                facultyName: e.target.value,
                programName: '' // Reset program when faculty changes
              })}
            >
              <option value="">All Faculties</option>
              {faculties.map((faculty) => (
                <option key={faculty} value={faculty}>
                  {faculty}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">Program</label>
            <select
              className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
              value={currentSearchParams.programName}
              onChange={(e) => updateSearchParams({ programName: e.target.value })}
              disabled={programs.length === 0}
            >
              <option value="">All Programs</option>
              {programs.map((program) => (
                <option key={program} value={program}>
                  {program}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">Search</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by name, NPM, or course"
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                className="px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onClick={handleSearch}
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <button
            className="px-4 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onClick={handleClearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
        {registrations.length === 0 ? (
          <div className="p-8 text-center text-gray-300">No registration data found</div>
        ) : viewMode === 'charts' ? (
          <div className="p-6 space-y-8">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Registration Insights</h2>
            
            {/* Registration by Faculty - Pie Chart */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-200">Distribution by Faculty</h3>
              <div className="bg-gray-900 p-4 rounded-lg">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChartComponent>
                    <Pie
                      data={registrationsByFaculty}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {registrationsByFaculty.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} registrations`, 'Count']} />
                    <Legend />
                  </PieChartComponent>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Top Programs - Bar Chart */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-200">Top Programs</h3>
              <div className="bg-gray-900 p-4 rounded-lg">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={registrationsByProgram}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis 
                      dataKey="name" 
                      tick={{fill: '#ccc'}} 
                      angle={-45} 
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis tick={{fill: '#ccc'}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#333', border: '1px solid #555' }}
                      formatter={(value) => [`${value} registrations`, 'Count']} 
                    />
                    <Bar dataKey="value" name="Registrations" fill="#8884d8">
                      {registrationsByProgram.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Registrations by Semester - Bar Chart */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-200">Registrations by Semester</h3>
              <div className="bg-gray-900 p-4 rounded-lg">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={registrationsBySemester}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" tick={{fill: '#ccc'}} />
                    <YAxis tick={{fill: '#ccc'}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#333', border: '1px solid #555' }}
                      formatter={(value) => [`${value} registrations`, 'Count']} 
                    />
                    <Bar dataKey="value" name="Registrations" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      NPM
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Course Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Course Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Semester
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Registration Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Program
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Faculty
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {registrations.map((reg) => (
                    <tr key={reg.registrationId} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {reg.npm}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {reg.studentName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {reg.courseCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {reg.courseName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {reg.credits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {reg.semesterCode} {reg.academicYear}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {formatDate(reg.registrationDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {reg.programName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {reg.facultyName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 flex items-center justify-between border-t border-gray-700">
              <div className="text-sm text-gray-300">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} registrations
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="px-3 py-1 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  onClick={() => updateSearchParams({ page: String(page - 1) })}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="px-3 py-1 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  onClick={() => updateSearchParams({ page: String(page + 1) })}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}