import TeachingList from './components/teaching-list';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teaching Load | SIAK Dashboard',
  description: 'Lecturer teaching load and course management analytics'
};

export default async function TeachingPage({
  searchParams,
}: {
  searchParams?: {
    page?: string;
    pageSize?: string;
    semesterId?: string;
    facultyName?: string;
    lecturerId?: string;
    courseId?: string;
    searchTerm?: string;
    minHours?: string;
    maxHours?: string;
    minCompletionRate?: string;
    viewType?: string;
    viewMode?: string;
  };
}) {
  // Get view type (default to paginated)
  const viewType = searchParams?.viewType || 'paginated';
  
  // Default to page 1 if not specified (only for paginated view)
  const page = viewType === 'paginated' ? (searchParams?.page ? parseInt(searchParams.page) : 1) : undefined;
  const pageSize = viewType === 'paginated' ? (searchParams?.pageSize ? parseInt(searchParams.pageSize) : 10) : undefined;

  // Build search params based on view type
  const searchParamString = new URLSearchParams({
    viewType,
    ...(page && { page: page.toString() }),
    ...(pageSize && { pageSize: pageSize.toString() }),
    ...(searchParams?.semesterId && { semesterId: searchParams.semesterId }),
    ...(searchParams?.facultyName && { facultyName: searchParams.facultyName }),
    ...(searchParams?.lecturerId && { lecturerId: searchParams.lecturerId }),
    ...(searchParams?.courseId && { courseId: searchParams.courseId }),
    ...(searchParams?.searchTerm && { searchTerm: searchParams.searchTerm }),
    ...(searchParams?.minHours && { minHours: searchParams.minHours }),
    ...(searchParams?.maxHours && { maxHours: searchParams.maxHours }),
    ...(searchParams?.minCompletionRate && { minCompletionRate: searchParams.minCompletionRate }),
  }).toString();

  // Global styles component
  const GlobalStyles = () => (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          body {
            background-color: #030712 !important;
            color: #f9fafb !important;
            margin: 0;
            padding: 0;
          }
          html {
            background-color: #030712 !important;
          }
          * {
            box-sizing: border-box;
          }
        `
      }} />
    </>
  );

  try {
    const host = process.env.VERCEL_URL || 'http://localhost:3000';
    const apiUrl = `${host}/api/warehouse/teaching?${searchParamString}`;

    // Fetch data from API route (Server-side)
    const response = await fetch(apiUrl, { 
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch teaching data: ${response.status}`);
    }

    const data = await response.json();

    // Map the semester data for the dropdown with better error handling
    const semesterOptions = (data.semesters || [])
      .filter((semester: any) => semester && (semester.semester_code || semester.semester_id))
      .map((semester: any) => {
        const code = semester.semester_code || 'Unknown';
        const year = semester.academic_year || 'Unknown';
        const displayName = `${code} ${year}`.trim();
        
        return {
          id: semester.semester_id?.toString() || '',
          name: displayName === 'Unknown Unknown' ? `Semester ${semester.semester_id}` : displayName
        };
      });

    // Pass the mapped semester options and the response data to the client component
    return (
      <>
        <GlobalStyles />
        <div className="min-h-screen bg-gray-950" style={{ backgroundColor: '#030712' }}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <div className="mb-6 lg:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-100 tracking-tight">
                Teaching Load Management
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-400">
                Monitor lecturer workload, course assignments, and teaching performance metrics
              </p>
            </div>
            
            <TeachingList 
              teachingData={data.teaching || { 
                data: [], 
                total: 0, 
                page: 1, 
                pageSize: 10, 
                totalPages: 0, 
                faculties: [], 
                lecturers: [],
                courses: [],
                stats: { 
                  totalTeachingRecords: 0, 
                  uniqueLecturers: 0, 
                  uniqueCourses: 0, 
                  averageTeachingHours: 0,
                  averageCompletionRate: 0,
                  totalTeachingHours: 0
                } 
              }}
              semesterOptions={semesterOptions}
              defaultViewMode={searchParams?.viewMode || 'table'}
            />
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error('Error loading teaching data:', error);
    
    // Return error state
    return (
      <>
        <GlobalStyles />
        <div className="min-h-screen bg-gray-950" style={{ backgroundColor: '#030712' }}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <div className="mb-6 lg:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-100 tracking-tight">
                Teaching Load Management
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-400">
                Monitor lecturer workload, course assignments, and teaching performance metrics
              </p>
            </div>
            
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-8 text-center">
              <div className="text-red-400 text-lg mb-2">Failed to load teaching data</div>
              <div className="text-gray-500 text-sm">Please try refreshing the page or contact support if the problem persists</div>
            </div>
          </div>
        </div>
      </>
    );
  }
}