import { Suspense } from 'react';
import { RegistrationList } from './components/registration-list';
import { PaginatedRegistrationDetails } from '@/app/actions/registration-details';

// Define the Semester type that matches what RegistrationList expects
type Semester = {
  id: number;
  code: string;
  academicYear: string;
};

type ApiResponse = {
  registrations: PaginatedRegistrationDetails;
  semesters: { id: number; name: string }[];
};

async function fetchRegistrationData(searchParams: Record<string, string | undefined>) {
  try {
    // Gunakan API route untuk fetch data
    const host = process.env.VERCEL_URL || 'http://localhost:3000';
    const baseUrl = `${host}`;
    
    // Buat query string dari search params
    const queryParams = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const res = await fetch(`${baseUrl}/api/warehouse/registrations?${queryParams.toString()}`, { 
      cache: 'no-store' 
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch registration data: ${res.status}`);
    }
    
    return await res.json() as ApiResponse;
  } catch (error) {
    console.error('Error fetching registration data:', error);
    // Return empty data structure in case of error
    return {
      registrations: {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
        faculties: [],
        programs: []
      },
      semesters: []
    };
  }
}

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Extract search params
  const page = searchParams.page as string || '1';
  const pageSize = searchParams.pageSize as string || '10';
  const semesterId = searchParams.semesterId as string | undefined;
  const facultyName = searchParams.facultyName as string | undefined;
  const programName = searchParams.programName as string | undefined;
  const searchTerm = searchParams.searchTerm as string | undefined;

  // Fetch data menggunakan API route
  const { registrations, semesters: semestersData } = await fetchRegistrationData({
    page,
    pageSize,
    semesterId,
    facultyName,
    programName,
    searchTerm
  });
  
  // Parse semester data untuk menyesuaikan format yang diharapkan
  const semesters: Semester[] = semestersData.map(sem => {
    const name = sem.name || '';
    let code = '';
    let academicYear = '';
    
    if (name.includes('-')) {
      const parts = name.split('-');
      // Check if it's "1-2022" format or "2022-1" format
      if (parts[0].length <= 2) { // Format: "1-2022"
        code = parts[0];
        academicYear = parts[1];
      } else { // Format: "2022-1"
        code = parts[1];
        academicYear = parts[0];
      }
    } else {
      // Fallback if different format
      code = name;
      academicYear = '';
    }
    
    return {
      id: sem.id,
      code,
      academicYear
    };
  });

  return (
    <div className="container bg-gray-900 mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Registration Details</h1>
      <Suspense fallback={<div>Loading registration data...</div>}>
        <RegistrationList 
          initialData={registrations} 
          semesters={semesters}
        />
      </Suspense>
    </div>
  );
}
