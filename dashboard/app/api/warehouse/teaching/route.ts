import { NextResponse } from 'next/server';
import { getTeachingDetails, getSemesters } from '@/app/actions/teaching-details';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse search params
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string) : 1;
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize') as string) : 10;
    const viewType = searchParams.get('viewType') || 'paginated';
    const semesterId = searchParams.get('semesterId') || undefined;
    const facultyName = searchParams.get('facultyName') || undefined;
    const lecturerId = searchParams.get('lecturerId') || undefined;
    const courseId = searchParams.get('courseId') || undefined;
    const searchTerm = searchParams.get('searchTerm') || undefined;
    const minHours = searchParams.get('minHours') || undefined;
    const maxHours = searchParams.get('maxHours') || undefined;
    const minCompletionRate = searchParams.get('minCompletionRate') || undefined;
    
    // For 'all' view, don't pass page and pageSize to get all data
    const filters = {
      semesterId,
      facultyName,
      lecturerId,
      courseId,
      searchTerm,
      minHours,
      maxHours,
      minCompletionRate,
      ...(viewType === 'paginated' && { page, pageSize })
    };
    
    // Fetch data in parallel for better performance
    const [teaching, semesters] = await Promise.all([
      getTeachingDetails(filters),
      getSemesters()
    ]);
    
    return NextResponse.json({
      teaching,
      semesters
    });
  } catch (error: any) {
    console.error('Error fetching teaching data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch teaching data',
        message: error.message
      },
      { status: 500 }
    );
  }
}