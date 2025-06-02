import { getAttendanceDetails, getSemesters } from '@/app/actions/attendance-detail';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse search params
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string) : 1;
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize') as string) : 10;
    const viewType = searchParams.get('viewType') || 'paginated';
    const semesterId = searchParams.get('semesterId') || undefined;
    const facultyName = searchParams.get('facultyName') || undefined;
    const programName = searchParams.get('programName') || undefined;
    const courseId = searchParams.get('courseId') || undefined;
    const searchTerm = searchParams.get('searchTerm') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    
    // For 'all' view, don't pass page and pageSize to get all data
    const filters = {
      semesterId,
      facultyName,
      programName,
      courseId,
      searchTerm,
      dateFrom,
      dateTo,
      ...(viewType === 'paginated' && { page, pageSize })
    };
    
    // Fetch data in parallel for better performance
    const [attendance, semesters] = await Promise.all([
      getAttendanceDetails(filters),
      getSemesters()
    ]);
    
    return NextResponse.json({
      attendance,
      semesters
    });
  } catch (error: any) {
    console.error('Error fetching attendance data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch attendance data',
        message: error.message
      },
      { status: 500 }
    );
  }
}