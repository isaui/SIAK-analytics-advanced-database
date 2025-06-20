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
  minCredits?: string;
  maxCredits?: string;
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
  stats: {
    totalRegistrations: number;
    totalStudents: number;
    totalCourses: number;
    averageCredits: number;
  };
};

export type SemesterOption = {
  semester_id: number;
  semester_code: string;
  academic_year: string;
};

// Function to get available semesters
export async function getSemesters(): Promise<SemesterOption[]> {
  try {
    const semesterQuery = `
      SELECT 
        semester_id,
        semester_code,
        academic_year
      FROM dim_semester
      ORDER BY academic_year DESC, semester_code ASC
    `;
    
    const result = await query(semesterQuery, []);
    
    return result.rows.map((row) => ({
      semester_id: row.semester_id,
      semester_code: row.semester_code,
      academic_year: row.academic_year
    }));
  } catch (error) {
    console.error('Error fetching semesters:', error);
    return [];
  }
}

export async function getRegistrationDetails(
  filters: RegistrationFilters = {}
): Promise<PaginatedRegistrationDetails> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  
  // Check if this is a full data request (no pagination)
  const isFullDataRequest = filters.page === undefined && filters.pageSize === undefined;
  
  try {
    // Construct base query with all necessary joins
    let baseQuery = `
      FROM fact_registration fr
      JOIN dim_student ds ON fr.student_id = ds.student_id
      JOIN dim_course dc ON fr.course_id = dc.course_id
      JOIN dim_semester dsem ON fr.semester_id = dsem.semester_id
    `;

    // Add filters with proper type casting
    let whereConditions = [];
    let params = [];

    // Filter by semester - Parse to integer with validation
    if (filters.semesterId && !isNaN(parseInt(filters.semesterId))) {
      whereConditions.push(`dsem.semester_id = $${params.length + 1}`);
      params.push(parseInt(filters.semesterId));
    }

    // Filter by faculty
    if (filters.facultyName) {
      whereConditions.push(`ds.faculty_name = $${params.length + 1}`);
      params.push(filters.facultyName);
    }

    // Filter by program
    if (filters.programName) {
      whereConditions.push(`ds.program_name = $${params.length + 1}`);
      params.push(filters.programName);
    }

    // Search term for student name, NPM, or course
    if (filters.searchTerm) {
      whereConditions.push(`(
        ds.name ILIKE $${params.length + 1} OR
        ds.npm ILIKE $${params.length + 1} OR
        dc.course_code ILIKE $${params.length + 1} OR
        dc.course_name ILIKE $${params.length + 1}
      )`);
      params.push(`%${filters.searchTerm}%`);
    }

    // Filter by minimum credits - Parse to integer with validation
    if (filters.minCredits && !isNaN(parseInt(filters.minCredits))) {
      whereConditions.push(`dc.credits >= $${params.length + 1}`);
      params.push(parseInt(filters.minCredits));
    }

    // Filter by maximum credits - Parse to integer with validation
    if (filters.maxCredits && !isNaN(parseInt(filters.maxCredits))) {
      whereConditions.push(`dc.credits <= $${params.length + 1}`);
      params.push(parseInt(filters.maxCredits));
    }

    // Combine where conditions if any
    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Query for total count
    const countQuery = `
      SELECT COUNT(*) as total
      ${baseQuery}
      ${whereClause}
    `;
    
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = isFullDataRequest ? 1 : Math.ceil(total / pageSize);

    // Query for data (with or without pagination)
    let dataQuery = `
      SELECT 
        fr.registration_id,
        ds.npm,
        ds.name as student_name,
        dc.course_code,
        dc.course_name,
        dc.credits,
        dsem.semester_code,
        dsem.academic_year,
        TO_CHAR(fr.registration_date, 'YYYY-MM-DD') as registration_date,
        ds.program_name,
        ds.faculty_name
      ${baseQuery}
      ${whereClause}
      ORDER BY fr.registration_date DESC NULLS LAST, ds.name ASC
    `;

    // Add pagination only if not full data request
    if (!isFullDataRequest) {
      dataQuery += `
        LIMIT ${pageSize}
        OFFSET ${(page - 1) * pageSize}
      `;
    }

    const result = await query(dataQuery, params);

    // Query for statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_registrations,
        COUNT(DISTINCT fr.student_id) as total_students,
        COUNT(DISTINCT fr.course_id) as total_courses,
        AVG(dc.credits) as average_credits
      ${baseQuery}
      ${whereClause}
    `;
    
    const statsResult = await query(statsQuery, params);
    
    const stats = {
      totalRegistrations: parseInt(statsResult.rows[0].total_registrations) || 0,
      totalStudents: parseInt(statsResult.rows[0].total_students) || 0,
      totalCourses: parseInt(statsResult.rows[0].total_courses) || 0,
      averageCredits: parseFloat(statsResult.rows[0].average_credits) || 0
    };

    // Query for unique faculties for filter dropdown
    const facultiesQuery = `
      SELECT DISTINCT ds.faculty_name
      ${baseQuery}
      WHERE ds.faculty_name IS NOT NULL
      ORDER BY ds.faculty_name
    `;
    
    const facultiesResult = await query(facultiesQuery, []);
    const faculties = facultiesResult.rows.map((row) => row.faculty_name);

    // Query for unique programs for filter dropdown
    let programsQuery = `
      SELECT DISTINCT ds.program_name
      ${baseQuery}
      WHERE ds.program_name IS NOT NULL
    `;

    let programParams = [];
    if (filters.facultyName) {
      programsQuery += ` AND ds.faculty_name = $1`;
      programParams.push(filters.facultyName);
    }

    programsQuery += ` ORDER BY ds.program_name`;
    
    const programsResult = await query(programsQuery, programParams);
    const programs = programsResult.rows.map((row) => row.program_name);
    
    // Transform to needed format with better error handling
    const data = result.rows.map((row) => ({
      registrationId: row.registration_id || 0,
      npm: row.npm || '',
      studentName: row.student_name || '',
      courseCode: row.course_code || '',
      courseName: row.course_name || '',
      credits: parseInt(row.credits) || 0,
      semesterCode: row.semester_code || '',
      academicYear: row.academic_year || '',
      registrationDate: row.registration_date || '',
      programName: row.program_name || '',
      facultyName: row.faculty_name || ''
    }));

    return {
      data,
      total,
      page: isFullDataRequest ? 1 : page,
      pageSize: isFullDataRequest ? total : pageSize,
      totalPages,
      faculties,
      programs,
      stats
    };
  } catch (error) {
    console.error('Error fetching registration details:', error);
    return {
      data: [],
      total: 0,
      page: isFullDataRequest ? 1 : page,
      pageSize: isFullDataRequest ? 0 : pageSize,
      totalPages: 0,
      faculties: [],
      programs: [],
      stats: {
        totalRegistrations: 0,
        totalStudents: 0,
        totalCourses: 0,
        averageCredits: 0
      }
    };
  }
}