import { NextResponse } from 'next/server';
import { getAcademicDetails, getSemesters } from '@/app/actions/academic-details';

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
    const searchTerm = searchParams.get('searchTerm') || undefined;
    const minGpa = searchParams.get('minGpa') || undefined;
    const maxGpa = searchParams.get('maxGpa') || undefined;
    
    // For 'all' view, don't pass page and pageSize to get all data
    // BUT KEEP ALL FILTERS AVAILABLE (this is the improvement!)
    const filters = {
      semesterId,
      facultyName,
      programName,
      searchTerm,
      minGpa,
      maxGpa,
      ...(viewType === 'paginated' && { page, pageSize })
    };
    
    // Fetch data in parallel for better performance
    const [academics, semesters] = await Promise.all([
      getAcademicDetails(filters),
      getSemesters()
    ]);
    
    return NextResponse.json({
      academics,
      semesters
    });
  } catch (error: any) {
    console.error('Error fetching academic data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch academic data',
        message: error.message
      },
      { status: 500 }
    );
  }
}