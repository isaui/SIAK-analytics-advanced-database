import { query } from '@/utils/db';

export type RegistrationDetail = {
  registrationId: number;
  npm: string;
  studentName: string;
  courseCode: string;
  courseName: string;
  credits: number;
  semesterCode: string;
  academicYear: string;
  registrationDate: string;
  programName: string;
  facultyName: string;
};

export type RegistrationFilters = {
  semesterId?: string;
  facultyName?: string;
  programName?: string;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
};

export type PaginatedRegistrationDetails = {
  data: RegistrationDetail[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  faculties: string[];
  programs: string[];
};

export async function getRegistrationDetails(
  filters: RegistrationFilters = {}
): Promise<PaginatedRegistrationDetails> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  
  try {
    // Construct base query with all necessary joins
    let baseQuery = `
      FROM fact_registration fr
      JOIN dim_student ds ON fr.student_id = ds.student_id
      JOIN dim_course dc ON fr.course_id = dc.course_id
      JOIN dim_semester dsem ON fr.semester_id = dsem.semester_id
    `;

    // Add filters
    const whereConditions = [];
    const queryParams: any[] = [];

    if (filters.semesterId) {
      whereConditions.push(`fr.semester_id = $${queryParams.length + 1}`);
      queryParams.push(filters.semesterId);
    }

    if (filters.programName) {
      whereConditions.push(`ds.program_name = $${queryParams.length + 1}`);
      queryParams.push(filters.programName);
    }

    if (filters.facultyName) {
      whereConditions.push(`ds.faculty_name = $${queryParams.length + 1}`);
      queryParams.push(filters.facultyName);
    }

    if (filters.searchTerm) {
      whereConditions.push(`(
        ds.npm ILIKE $${queryParams.length + 1} OR
        ds.name ILIKE $${queryParams.length + 1} OR
        dc.course_code ILIKE $${queryParams.length + 1} OR
        dc.course_name ILIKE $${queryParams.length + 1}
      )`);
      queryParams.push(`%${filters.searchTerm}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Run all queries in parallel for better performance
    const [countResult, dataResult, facultiesResult, programsResult] = await Promise.all([
      // Get total count for pagination
      query(`
        SELECT COUNT(*) as total
        ${baseQuery}
        ${whereClause}
      `, queryParams),
      
      // Get actual data with pagination
      query(`
        SELECT 
          fr.registration_id,
          ds.npm,
          ds.name as student_name,
          dc.course_code,
          dc.course_name,
          dc.credits,
          dsem.semester_code,
          dsem.academic_year,
          fr.registration_date,
          ds.program_name,
          ds.faculty_name
        ${baseQuery}
        ${whereClause}
        ORDER BY fr.registration_date DESC, ds.name
        LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
      `, queryParams),
      
      // Get faculties list
      query(`
        SELECT DISTINCT faculty_name
        FROM dim_student
        ORDER BY faculty_name
      `),
      
      // Get programs list (filtered by faculty if provided)
      filters.facultyName 
        ? query(`
            SELECT DISTINCT program_name
            FROM dim_student
            WHERE faculty_name = $1
            ORDER BY program_name
          `, [filters.facultyName])
        : query(`
            SELECT DISTINCT program_name
            FROM dim_student
            ORDER BY program_name
          `)
    ]);
    
    const total = parseInt(countResult.rows[0]?.total || '0', 10);
    const totalPages = Math.ceil(total / pageSize);
    
    const data = dataResult.rows.map(row => ({
      registrationId: row.registration_id,
      npm: row.npm,
      studentName: row.student_name,
      courseCode: row.course_code,
      courseName: row.course_name,
      credits: parseInt(row.credits),
      semesterCode: row.semester_code,
      academicYear: row.academic_year,
      registrationDate: row.registration_date,
      programName: row.program_name,
      facultyName: row.faculty_name
    }));

    const faculties = facultiesResult.rows.map(row => row.faculty_name);
    const programs = programsResult.rows.map(row => row.program_name);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
      faculties,
      programs
    };
  } catch (error) {
    console.error('Error fetching registration details:', error);
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      faculties: [],
      programs: []
    };
  }
}
