import { NextResponse } from 'next/server';
import { getRegistrationDetails } from '@/app/actions/registration-details';
import { getAllSemesters } from '@/app/actions/warehouse-stats';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse search params
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string) : 1;
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize') as string) : 10;
    const semesterId = searchParams.get('semesterId') || undefined;
    const facultyName = searchParams.get('facultyName') || undefined;
    const programName = searchParams.get('programName') || undefined;
    const searchTerm = searchParams.get('searchTerm') || undefined;
    
    // Fetch data in parallel for better performance
    const [registrations, semesters] = await Promise.all([
      getRegistrationDetails({
        page,
        pageSize,
        semesterId,
        facultyName,
        programName,
        searchTerm
      }),
      getAllSemesters()
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
