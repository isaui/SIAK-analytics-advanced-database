import { query } from '@/utils/db';

export type FinanceDetail = {
  feeId: number;
  npm: string;
  studentName: string;
  semesterCode: string;
  academicYear: string;
  feeAmount: number;
  paymentDate: string;
  programName: string;
  facultyName: string;
};

export type FinanceFilters = {
  semesterId?: string;
  facultyName?: string;
  programName?: string;
  searchTerm?: string;
  minAmount?: string;
  maxAmount?: string;
  page?: number;
  pageSize?: number;
};

export type PaginatedFinanceDetails = {
  data: FinanceDetail[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  faculties: string[];
  programs: string[];
  stats: {
    totalAmount: number;
    averageAmount: number;
    totalPayments: number;
    averagePaymentsPerStudent: number;
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

export async function getFinanceDetails(
  filters: FinanceFilters = {}
): Promise<PaginatedFinanceDetails> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  
  // Check if this is a full data request (no pagination)
  const isFullDataRequest = filters.page === undefined && filters.pageSize === undefined;
  
  try {
    // Construct base query with all necessary joins
    let baseQuery = `
      FROM fact_fee ff
      JOIN dim_student ds ON ff.student_id = ds.student_id
      JOIN dim_semester dsem ON ff.semester_id = dsem.semester_id
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

    // Search term for student name or NPM
    if (filters.searchTerm) {
      whereConditions.push(`(
        ds.name ILIKE $${params.length + 1} OR
        ds.npm ILIKE $${params.length + 1}
      )`);
      params.push(`%${filters.searchTerm}%`);
    }

    // Filter by minimum amount - Parse to float with validation
    if (filters.minAmount && !isNaN(parseFloat(filters.minAmount))) {
      whereConditions.push(`ff.fee_amount >= $${params.length + 1}`);
      params.push(parseFloat(filters.minAmount));
    }

    // Filter by maximum amount - Parse to float with validation
    if (filters.maxAmount && !isNaN(parseFloat(filters.maxAmount))) {
      whereConditions.push(`ff.fee_amount <= $${params.length + 1}`);
      params.push(parseFloat(filters.maxAmount));
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
        ff.fee_id, 
        ds.npm, 
        ds.name as student_name, 
        dsem.semester_code,
        dsem.academic_year,
        ff.fee_amount,
        TO_CHAR(ff.payment_date, 'YYYY-MM-DD') as payment_date,
        ds.program_name,
        ds.faculty_name
      ${baseQuery}
      ${whereClause}
      ORDER BY ff.payment_date DESC NULLS LAST, ds.name ASC
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
        SUM(ff.fee_amount) as total_amount,
        AVG(ff.fee_amount) as average_amount,
        COUNT(*) as total_payments,
        COUNT(DISTINCT ff.student_id) as unique_students
      ${baseQuery}
      ${whereClause}
    `;
    
    const statsResult = await query(statsQuery, params);
    const uniqueStudents = parseInt(statsResult.rows[0].unique_students) || 1;
    const totalPayments = parseInt(statsResult.rows[0].total_payments) || 0;
    
    const stats = {
      totalAmount: parseFloat(statsResult.rows[0].total_amount) || 0,
      averageAmount: parseFloat(statsResult.rows[0].average_amount) || 0,
      totalPayments: totalPayments,
      averagePaymentsPerStudent: uniqueStudents > 0 ? Math.round(totalPayments / uniqueStudents * 100) / 100 : 0
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
      feeId: row.fee_id || 0,
      npm: row.npm || '',
      studentName: row.student_name || '',
      semesterCode: row.semester_code || '',
      academicYear: row.academic_year || '',
      feeAmount: parseFloat(row.fee_amount) || 0,
      paymentDate: row.payment_date || '',
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
    console.error('Error fetching finance details:', error);
    return {
      data: [],
      total: 0,
      page: isFullDataRequest ? 1 : page,
      pageSize: isFullDataRequest ? 0 : pageSize,
      totalPages: 0,
      faculties: [],
      programs: [],
      stats: {
        totalAmount: 0,
        averageAmount: 0,
        totalPayments: 0,
        averagePaymentsPerStudent: 0
      }
    };
  }
}