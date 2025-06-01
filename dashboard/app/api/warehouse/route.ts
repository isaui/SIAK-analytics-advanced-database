import { NextResponse } from 'next/server';
import { getRegistrationStats, getFinancialStats, getAcademicStats, getAttendanceStats, getTeachingStats, getRoomStats, getAllSemesters } from '@/app/actions/warehouse-stats';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  const semesterId = searchParams.get('semesterId');
  
  try {
    let data;
    
    switch (endpoint) {
      case 'registrations':
        data = await getRegistrationStats(semesterId || undefined);
        break;
      case 'financials':
        data = await getFinancialStats();
        break;
      case 'academics':
        data = await getAcademicStats();
        break;
      case 'attendance':
        data = await getAttendanceStats();
        break;
      case 'teaching':
        data = await getTeachingStats();
        break;
      case 'rooms':
        data = await getRoomStats();
        break;
      case 'semesters':
        data = await getAllSemesters();
        break;
      case 'all':
        const [registrations, financials, academics, attendance, teaching, rooms] = 
          await Promise.all([
            getRegistrationStats(semesterId || undefined),
            getFinancialStats(),
            getAcademicStats(),
            getAttendanceStats(),
            getTeachingStats(),
            getRoomStats()
          ]);
        
        data = {
          registration: registrations,
          financials,
          academics,
          attendance,
          teaching,
          rooms
        };
        break;
      default:
        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
