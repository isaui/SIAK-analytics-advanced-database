import { NextResponse } from 'next/server';
import { getFinanceDetails, getSemesters } from '@/app/actions/finance-details';

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
    const minAmount = searchParams.get('minAmount') || undefined;
    const maxAmount = searchParams.get('maxAmount') || undefined;
    
    // For 'all' view, don't pass page and pageSize to get all data
    // BUT KEEP ALL FILTERS AVAILABLE
    const filters = {
      semesterId,
      facultyName,
      programName,
      searchTerm,
      minAmount,
      maxAmount,
      ...(viewType === 'paginated' && { page, pageSize })
    };
    
    // Fetch data in parallel for better performance
    const [finances, semesters] = await Promise.all([
      getFinanceDetails(filters),
      getSemesters()
    ]);
    
    return NextResponse.json({
      finances,
      semesters
    });
  } catch (error: any) {
    console.error('Error fetching finance data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch finance data',
        message: error.message
      },
      { status: 500 }
    );
  }
}