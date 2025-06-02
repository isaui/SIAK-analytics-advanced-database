import { getRoomUsageDetails, getSemesters } from '@/app/actions/room-usage-detail';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse search params
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string) : 1;
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize') as string) : 10;
    const viewType = searchParams.get('viewType') || 'paginated';
    const semesterId = searchParams.get('semesterId') || undefined;
    const building = searchParams.get('building') || undefined;
    const roomId = searchParams.get('roomId') || undefined;
    const searchTerm = searchParams.get('searchTerm') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const minUtilization = searchParams.get('minUtilization') || undefined;
    const maxUtilization = searchParams.get('maxUtilization') || undefined;
    const minOccupancy = searchParams.get('minOccupancy') || undefined;
    
    // For 'all' view, don't pass page and pageSize to get all data
    const filters = {
      semesterId,
      building,
      roomId,
      searchTerm,
      dateFrom,
      dateTo,
      minUtilization,
      maxUtilization,
      minOccupancy,
      ...(viewType === 'paginated' && { page, pageSize })
    };
    
    // Fetch data in parallel for better performance
    const [roomUsage, semesters] = await Promise.all([
      getRoomUsageDetails(filters),
      getSemesters()
    ]);
    
    return NextResponse.json({
      roomUsage,
      semesters
    });
  } catch (error: any) {
    console.error('Error fetching room usage data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch room usage data',
        message: error.message
      },
      { status: 500 }
    );
  }
}