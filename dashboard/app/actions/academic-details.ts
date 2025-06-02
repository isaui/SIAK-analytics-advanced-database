import { query } from '@/utils/db';

export type AcademicDetail = {
  academicId: number;
  npm: string;
  studentName: string;
  semesterCode: string;
  academicYear: string;
  semesterGpa: number;
  cumulativeGpa: number;
  semesterCredits: number;
  creditsPassed: number;
  totalCredits: number;
  programName: string;
  facultyName: string;
};

export type AcademicFilters = {
  semesterId?: string;
  facultyName?: string;
  programName?: string;
  searchTerm?: string;
  minGpa?: string;
  maxGpa?: string;
  page?: number;
  pageSize?: number;
};

export type PaginatedAcademicDetails = {
  data: AcademicDetail[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  faculties: string[];
  programs: string[];
  stats: {
    averageGpa: number;
    totalStudents: number;
    totalCredits: number;
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

export async function getAcademicDetails(
  filters: AcademicFilters = {}
): Promise<PaginatedAcademicDetails> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  
  // Check if this is a full data request (no pagination)
  const isFullDataRequest = filters.page === undefined && filters.pageSize === undefined;
  
  try {
    // Construct base query with all necessary joins
    let baseQuery = `
      FROM fact_academic fa
      JOIN dim_student ds ON fa.student_id = ds.student_id
      JOIN dim_semester dsem ON fa.semester_id = dsem.semester_id
    `;

    // Add filters with proper type casting
    let whereConditions = [];
    let params = [];

    // Filter by semester - FIXED: Parse to integer with validation
    if (filters.semesterId && !isNaN(parseInt(filters.semesterId))) {
      whereConditions.push(`dsem.semester_id = $${params.length + 1}`);
      params.push(parseInt(filters.semesterId));
    }

    // Filter by faculty - String is correct
    if (filters.facultyName) {
      whereConditions.push(`ds.faculty_name = $${params.length + 1}`);
      params.push(filters.facultyName);
    }

    // Filter by program - String is correct
    if (filters.programName) {
      whereConditions.push(`ds.program_name = $${params.length + 1}`);
      params.push(filters.programName);
    }

    // Search term for student name or NPM - String is correct
    if (filters.searchTerm) {
      whereConditions.push(`(
        ds.name ILIKE $${params.length + 1} OR
        ds.npm ILIKE $${params.length + 1}
      )`);
      params.push(`%${filters.searchTerm}%`);
    }

    // Filter by minimum GPA - FIXED: Parse to float with validation
    if (filters.minGpa && !isNaN(parseFloat(filters.minGpa))) {
      whereConditions.push(`fa.cumulative_gpa >= $${params.length + 1}`);
      params.push(parseFloat(filters.minGpa));
    }

    // Filter by maximum GPA - FIXED: Parse to float with validation
    if (filters.maxGpa && !isNaN(parseFloat(filters.maxGpa))) {
      whereConditions.push(`fa.cumulative_gpa <= $${params.length + 1}`);
      params.push(parseFloat(filters.maxGpa));
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
        fa.academic_id,
        ds.npm,
        ds.name as student_name,
        dsem.semester_code,
        dsem.academic_year,
        fa.semester_gpa,
        fa.cumulative_gpa,
        fa.semester_credits,
        fa.credits_passed,
        fa.total_credits,
        ds.program_name,
        ds.faculty_name
      ${baseQuery}
      ${whereClause}
      ORDER BY fa.cumulative_gpa DESC NULLS LAST, ds.name ASC
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
        AVG(fa.cumulative_gpa) as average_gpa,
        COUNT(DISTINCT fa.student_id) as total_students,
        SUM(fa.total_credits) as total_credits,
        AVG(fa.total_credits) as average_credits
      ${baseQuery}
      ${whereClause}
    `;
    
    const statsResult = await query(statsQuery, params);
    const stats = {
      averageGpa: parseFloat(statsResult.rows[0].average_gpa) || 0,
      totalStudents: parseInt(statsResult.rows[0].total_students) || 0,
      totalCredits: parseInt(statsResult.rows[0].total_credits) || 0,
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
      academicId: row.academic_id || 0,
      npm: row.npm || '',
      studentName: row.student_name || '',
      semesterCode: row.semester_code || '',
      academicYear: row.academic_year || '',
      semesterGpa: parseFloat(row.semester_gpa) || 0,
      cumulativeGpa: parseFloat(row.cumulative_gpa) || 0,
      semesterCredits: parseInt(row.semester_credits) || 0,
      creditsPassed: parseInt(row.credits_passed) || 0,
      totalCredits: parseInt(row.total_credits) || 0,
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
    console.error('Error fetching academic details:', error);
    return {
      data: [],
      total: 0,
      page: isFullDataRequest ? 1 : page,
      pageSize: isFullDataRequest ? 0 : pageSize,
      totalPages: 0,
      faculties: [],
      programs: [],
      stats: {
        averageGpa: 0,
        totalStudents: 0,
        totalCredits: 0,
        averageCredits: 0
      }
    };
  }
}