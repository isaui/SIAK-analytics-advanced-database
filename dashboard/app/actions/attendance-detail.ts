import { query } from '@/utils/db';

export type AttendanceDetail = {
  attendanceId: number;
  npm: string;
  studentName: string;
  courseCode: string;
  courseName: string;
  className: string;
  lecturerName: string;
  attendanceDate: string;
  checkInTime: string;
  building: string;
  capacity: number;
  programName: string;
  facultyName: string;
  semesterCode: string;
  academicYear: string;
};

export type AttendanceFilters = {
  semesterId?: string;
  facultyName?: string;
  programName?: string;
  courseId?: string;
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type PaginatedAttendanceDetails = {
  data: AttendanceDetail[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  faculties: string[];
  programs: string[];
  courses: { id: number; code: string; name: string }[];
  stats: {
    totalAttendance: number;
    uniqueStudents: number;
    uniqueCourses: number;
    averageAttendancePerStudent: number;
    attendanceRate: number;
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

export async function getAttendanceDetails(
  filters: AttendanceFilters = {}
): Promise<PaginatedAttendanceDetails> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  
  // Check if this is a full data request (no pagination)
  const isFullDataRequest = filters.page === undefined && filters.pageSize === undefined;
  
  try {
    // Construct base query with all necessary joins
    let baseQuery = `
      FROM fact_attendance fa
      JOIN dim_student ds ON fa.student_id = ds.student_id
      JOIN dim_course dc ON fa.course_id = dc.course_id
      JOIN dim_class dcl ON fa.class_id = dcl.class_id
      JOIN dim_room dr ON fa.room_id = dr.room_id
      JOIN dim_semester dsem ON dcl.semester_code = dsem.semester_code
    `;

    // Add filters
    let whereConditions = [];
    let params = [];

    // Filter by semester
    if (filters.semesterId) {
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

    // Filter by course
    if (filters.courseId) {
      whereConditions.push(`dc.course_id = $${params.length + 1}`);
      params.push(parseInt(filters.courseId));
    }

    // Search term for student name, NPM, or course
    if (filters.searchTerm) {
      whereConditions.push(`(
        ds.name ILIKE $${params.length + 1} OR
        ds.npm ILIKE $${params.length + 1} OR
        dc.course_name ILIKE $${params.length + 1} OR
        dc.course_code ILIKE $${params.length + 1}
      )`);
      params.push(`%${filters.searchTerm}%`);
    }

    // Filter by date range
    if (filters.dateFrom) {
      whereConditions.push(`fa.attendance_date >= $${params.length + 1}`);
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      whereConditions.push(`fa.attendance_date <= $${params.length + 1}`);
      params.push(filters.dateTo);
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
        fa.attendance_id,
        ds.npm,
        ds.name as student_name,
        dc.course_code,
        dc.course_name,
        dcl.class_code as class_name,
        dcl.lecturer_name,
        fa.attendance_date,
        fa.check_in_time,
        dr.building,
        dr.capacity,
        ds.program_name,
        ds.faculty_name,
        dsem.semester_code,
        dsem.academic_year
      ${baseQuery}
      ${whereClause}
      ORDER BY fa.attendance_date DESC, fa.check_in_time DESC, ds.name ASC
    `;

    // Add pagination only if not full data request
    if (!isFullDataRequest) {
      dataQuery += `
        LIMIT ${pageSize}
        OFFSET ${(page - 1) * pageSize}
      `;
    }

    const result = await query(dataQuery, params);

    // Query for statistics - Fixed
    const statsQuery = `
      SELECT 
        COUNT(*) as total_attendance,
        COUNT(DISTINCT fa.student_id) as unique_students,
        COUNT(DISTINCT fa.course_id) as unique_courses
      ${baseQuery}
      ${whereClause}
    `;
    
    const statsResult = await query(statsQuery, params);
    
    // Query for average attendance per student - separate query
    const avgAttendanceQuery = `
      SELECT AVG(attendance_count) as avg_attendance_per_student
      FROM (
        SELECT 
          fa.student_id,
          COUNT(*) as attendance_count
        ${baseQuery}
        ${whereClause}
        GROUP BY fa.student_id
      ) student_attendance
    `;
    
    const avgAttendanceResult = await query(avgAttendanceQuery, params);
    
    // Calculate attendance rate (simplified calculation)
    const attendanceRateQuery = `
      WITH student_course_combinations AS (
        SELECT COUNT(DISTINCT ds.student_id) as total_students,
               COUNT(DISTINCT dc.course_id) as total_courses
        ${baseQuery}
        ${whereClause}
      ),
      actual_attendance AS (
        SELECT COUNT(*) as actual_attendance
        ${baseQuery}
        ${whereClause}
      )
      SELECT 
        CASE 
          WHEN scc.total_students > 0 AND scc.total_courses > 0
          THEN (aa.actual_attendance::FLOAT / (scc.total_students * scc.total_courses) * 100)
          ELSE 0 
        END as attendance_rate
      FROM student_course_combinations scc, actual_attendance aa
    `;
    
    const attendanceRateResult = await query(attendanceRateQuery, params);
    
    const stats = {
      totalAttendance: parseInt(statsResult.rows[0].total_attendance) || 0,
      uniqueStudents: parseInt(statsResult.rows[0].unique_students) || 0,
      uniqueCourses: parseInt(statsResult.rows[0].unique_courses) || 0,
      averageAttendancePerStudent: parseFloat(avgAttendanceResult.rows[0]?.avg_attendance_per_student) || 0,
      attendanceRate: parseFloat(attendanceRateResult.rows[0]?.attendance_rate) || 0
    };

    // Query for unique faculties for filter dropdown
    const facultiesQuery = `
      SELECT DISTINCT ds.faculty_name
      FROM fact_attendance fa
      JOIN dim_student ds ON fa.student_id = ds.student_id
      JOIN dim_course dc ON fa.course_id = dc.course_id
      JOIN dim_class dcl ON fa.class_id = dcl.class_id
      JOIN dim_room dr ON fa.room_id = dr.room_id
      JOIN dim_semester dsem ON dcl.semester_code = dsem.semester_code
      WHERE ds.faculty_name IS NOT NULL
      ORDER BY ds.faculty_name
    `;
    
    const facultiesResult = await query(facultiesQuery, []);
    const faculties = facultiesResult.rows.map((row) => row.faculty_name);

    // Query for unique programs for filter dropdown
    let programsQuery = `
      SELECT DISTINCT ds.program_name
      FROM fact_attendance fa
      JOIN dim_student ds ON fa.student_id = ds.student_id
      JOIN dim_course dc ON fa.course_id = dc.course_id
      JOIN dim_class dcl ON fa.class_id = dcl.class_id
      JOIN dim_room dr ON fa.room_id = dr.room_id
      JOIN dim_semester dsem ON dcl.semester_code = dsem.semester_code
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

    // Query for courses for filter dropdown
    let coursesQuery = `
      SELECT DISTINCT dc.course_id, dc.course_code, dc.course_name
      FROM fact_attendance fa
      JOIN dim_student ds ON fa.student_id = ds.student_id
      JOIN dim_course dc ON fa.course_id = dc.course_id
      JOIN dim_class dcl ON fa.class_id = dcl.class_id
      JOIN dim_room dr ON fa.room_id = dr.room_id
      JOIN dim_semester dsem ON dcl.semester_code = dsem.semester_code
      WHERE dc.course_code IS NOT NULL
    `;

    let courseParams = [];
    if (filters.facultyName) {
      coursesQuery += ` AND ds.faculty_name = $${courseParams.length + 1}`;
      courseParams.push(filters.facultyName);
    }
    if (filters.programName) {
      coursesQuery += ` AND ds.program_name = $${courseParams.length + 1}`;
      courseParams.push(filters.programName);
    }

    coursesQuery += ` ORDER BY dc.course_code`;
    
    const coursesResult = await query(coursesQuery, courseParams);
    const courses = coursesResult.rows.map((row) => ({
      id: row.course_id,
      code: row.course_code,
      name: row.course_name
    }));
    
    // Transform to needed format with better error handling
    const data = result.rows.map((row) => ({
      attendanceId: row.attendance_id || 0,
      npm: row.npm || '',
      studentName: row.student_name || '',
      courseCode: row.course_code || '',
      courseName: row.course_name || '',
      className: row.class_name || '',
      lecturerName: row.lecturer_name || '',
      attendanceDate: row.attendance_date || '',
      checkInTime: row.check_in_time || '',
      building: row.building || '',
      capacity: parseInt(row.capacity) || 0,
      programName: row.program_name || '',
      facultyName: row.faculty_name || '',
      semesterCode: row.semester_code || '',
      academicYear: row.academic_year || ''
    }));

    return {
      data,
      total,
      page: isFullDataRequest ? 1 : page,
      pageSize: isFullDataRequest ? total : pageSize,
      totalPages,
      faculties,
      programs,
      courses,
      stats
    };
  } catch (error) {
    console.error('Error fetching attendance details:', error);
    return {
      data: [],
      total: 0,
      page: isFullDataRequest ? 1 : page,
      pageSize: isFullDataRequest ? 0 : pageSize,
      totalPages: 0,
      faculties: [],
      programs: [],
      courses: [],
      stats: {
        totalAttendance: 0,
        uniqueStudents: 0,
        uniqueCourses: 0,
        averageAttendancePerStudent: 0,
        attendanceRate: 0
      }
    };
  }
}