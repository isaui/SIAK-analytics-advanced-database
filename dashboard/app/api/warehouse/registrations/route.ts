import { NextResponse } from 'next/server';
import { getRegistrationDetails, getSemesters } from '@/app/actions/registration-details';

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
    const minCredits = searchParams.get('minCredits') || undefined;
    const maxCredits = searchParams.get('maxCredits') || undefined;
    
    // For 'all' view, don't pass page and pageSize to get all data
    // BUT KEEP ALL FILTERS AVAILABLE
    const filters = {
      semesterId,
      facultyName,
      programName,
      searchTerm,
      minCredits,
      maxCredits,
      ...(viewType === 'paginated' && { page, pageSize })
    };
    
    // Fetch data in parallel for better performance
    const [registrations, semesters] = await Promise.all([
      getRegistrationDetails(filters),
      getSemesters()
    ]);
    
    return NextResponse.json({
      registrations,
      semesters
    });
  } catch (error: any) {
    console.error('Error fetching registration data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch registration data',
        message: error.message
      },
      { status: 500 }
    );
  }
}