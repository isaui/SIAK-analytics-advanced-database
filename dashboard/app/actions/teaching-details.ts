import { query } from '@/utils/db';

export type TeachingDetail = {
  teachingId: number;
  lecturerNip: string;
  lecturerName: string;
  lecturerEmail: string;
  courseCode: string;
  courseName: string;
  courseCredits: number;
  className: string;
  building: string;
  capacity: number;
  totalStudents: number;
  totalSessions: number;
  sessionsCompleted: number;
  teachingHours: number;
  completionRate: number;
  facultyName: string;
  semesterCode: string;
  academicYear: string;
};

export type TeachingFilters = {
  semesterId?: string;
  facultyName?: string;
  lecturerId?: string;
  courseId?: string;
  searchTerm?: string;
  minHours?: string;
  maxHours?: string;
  minCompletionRate?: string;
  page?: number;
  pageSize?: number;
};

export type PaginatedTeachingDetails = {
  data: TeachingDetail[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  faculties: string[];
  lecturers: { id: number; nip: string; name: string }[];
  courses: { id: number; code: string; name: string }[];
  stats: {
    totalTeachingRecords: number;
    uniqueLecturers: number;
    uniqueCourses: number;
    averageTeachingHours: number;
    averageCompletionRate: number;
    totalTeachingHours: number;
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

export async function getTeachingDetails(
  filters: TeachingFilters = {}
): Promise<PaginatedTeachingDetails> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  
  // Check if this is a full data request (no pagination)
  const isFullDataRequest = filters.page === undefined && filters.pageSize === undefined;
  
  try {
    // Construct base query with all necessary joins
    let baseQuery = `
      FROM fact_teaching ft
      JOIN dim_lecturer dl ON ft.lecturer_id = dl.lecturer_id
      JOIN dim_course dc ON ft.course_id = dc.course_id
      JOIN dim_semester dsem ON ft.semester_id = dsem.semester_id
      JOIN dim_class dcl ON ft.class_id = dcl.class_id
      JOIN dim_room dr ON ft.room_id = dr.room_id
    `;

    // Add filters
    let whereConditions = [];
    let params = [];

    // Filter by semester
    if (filters.semesterId && !isNaN(parseInt(filters.semesterId))) {
      whereConditions.push(`dsem.semester_id = $${params.length + 1}`);
      params.push(parseInt(filters.semesterId));
    }

    // Filter by faculty
    if (filters.facultyName) {
      whereConditions.push(`dl.faculty_name = $${params.length + 1}`);
      params.push(filters.facultyName);
    }

    // Filter by lecturer
    if (filters.lecturerId && !isNaN(parseInt(filters.lecturerId))) {
      whereConditions.push(`dl.lecturer_id = $${params.length + 1}`);
      params.push(parseInt(filters.lecturerId));
    }

    // Filter by course
    if (filters.courseId && !isNaN(parseInt(filters.courseId))) {
      whereConditions.push(`dc.course_id = $${params.length + 1}`);
      params.push(parseInt(filters.courseId));
    }

    // Search term for lecturer name, NIP, or course
    if (filters.searchTerm) {
      whereConditions.push(`(
        dl.name ILIKE $${params.length + 1} OR
        dl.nip ILIKE $${params.length + 1} OR
        dc.course_name ILIKE $${params.length + 1} OR
        dc.course_code ILIKE $${params.length + 1}
      )`);
      params.push(`%${filters.searchTerm}%`);
    }

    // Filter by teaching hours range
    if (filters.minHours && !isNaN(parseFloat(filters.minHours))) {
      whereConditions.push(`ft.teaching_hours >= $${params.length + 1}`);
      params.push(parseFloat(filters.minHours));
    }

    if (filters.maxHours && !isNaN(parseFloat(filters.maxHours))) {
      whereConditions.push(`ft.teaching_hours <= $${params.length + 1}`);
      params.push(parseFloat(filters.maxHours));
    }

    // Filter by completion rate
    if (filters.minCompletionRate && !isNaN(parseFloat(filters.minCompletionRate))) {
      whereConditions.push(`(
        CASE 
          WHEN ft.total_sessions > 0 
          THEN (ft.sessions_completed::FLOAT / ft.total_sessions * 100)
          ELSE 0 
        END
      ) >= $${params.length + 1}`);
      params.push(parseFloat(filters.minCompletionRate));
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
        ft.teaching_id,
        dl.nip as lecturer_nip,
        dl.name as lecturer_name,
        dl.email as lecturer_email,
        dc.course_code,
        dc.course_name,
        dc.credits as course_credits,
        dcl.class_code as class_name,
        dr.building,
        dr.capacity,
        ft.total_students,
        ft.total_sessions,
        ft.sessions_completed,
        ft.teaching_hours,
        CASE 
          WHEN ft.total_sessions > 0 
          THEN (ft.sessions_completed::FLOAT / ft.total_sessions * 100)
          ELSE 0 
        END as completion_rate,
        dl.faculty_name,
        dsem.semester_code,
        dsem.academic_year
      ${baseQuery}
      ${whereClause}
      ORDER BY ft.teaching_hours DESC, dl.name ASC, dc.course_code ASC
    `;

    // Add pagination only if not full data request
    if (!isFullDataRequest) {
      dataQuery += `
        LIMIT ${pageSize}
        OFFSET ${(page - 1) * pageSize}
      `;
    }

    const result = await query(dataQuery, params);

    // Query for basic statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_teaching_records,
        COUNT(DISTINCT ft.lecturer_id) as unique_lecturers,
        COUNT(DISTINCT ft.course_id) as unique_courses,
        SUM(ft.teaching_hours) as total_teaching_hours
      ${baseQuery}
      ${whereClause}
    `;
    
    const statsResult = await query(statsQuery, params);

    // Query for average teaching hours
    const avgHoursQuery = `
      SELECT AVG(ft.teaching_hours) as avg_teaching_hours
      ${baseQuery}
      ${whereClause}
    `;
    
    const avgHoursResult = await query(avgHoursQuery, params);

    // Query for average completion rate
    const avgCompletionQuery = `
      SELECT AVG(
        CASE 
          WHEN ft.total_sessions > 0 
          THEN (ft.sessions_completed::FLOAT / ft.total_sessions * 100)
          ELSE 0 
        END
      ) as avg_completion_rate
      ${baseQuery}
      ${whereClause}
    `;
    
    const avgCompletionResult = await query(avgCompletionQuery, params);
    
    const stats = {
      totalTeachingRecords: parseInt(statsResult.rows[0].total_teaching_records) || 0,
      uniqueLecturers: parseInt(statsResult.rows[0].unique_lecturers) || 0,
      uniqueCourses: parseInt(statsResult.rows[0].unique_courses) || 0,
      totalTeachingHours: parseFloat(statsResult.rows[0].total_teaching_hours) || 0,
      averageTeachingHours: parseFloat(avgHoursResult.rows[0]?.avg_teaching_hours) || 0,
      averageCompletionRate: parseFloat(avgCompletionResult.rows[0]?.avg_completion_rate) || 0
    };

    // Query for unique faculties for filter dropdown
    const facultiesQuery = `
      SELECT DISTINCT dl.faculty_name
      FROM fact_teaching ft
      JOIN dim_lecturer dl ON ft.lecturer_id = dl.lecturer_id
      JOIN dim_course dc ON ft.course_id = dc.course_id
      JOIN dim_semester dsem ON ft.semester_id = dsem.semester_id
      JOIN dim_class dcl ON ft.class_id = dcl.class_id
      JOIN dim_room dr ON ft.room_id = dr.room_id
      WHERE dl.faculty_name IS NOT NULL
      ORDER BY dl.faculty_name
    `;
    
    const facultiesResult = await query(facultiesQuery, []);
    const faculties = facultiesResult.rows.map((row) => row.faculty_name);

    // Query for lecturers for filter dropdown
    let lecturersQuery = `
      SELECT DISTINCT dl.lecturer_id, dl.nip, dl.name
      FROM fact_teaching ft
      JOIN dim_lecturer dl ON ft.lecturer_id = dl.lecturer_id
      JOIN dim_course dc ON ft.course_id = dc.course_id
      JOIN dim_semester dsem ON ft.semester_id = dsem.semester_id
      JOIN dim_class dcl ON ft.class_id = dcl.class_id
      JOIN dim_room dr ON ft.room_id = dr.room_id
      WHERE dl.name IS NOT NULL
    `;

    let lecturerParams = [];
    if (filters.facultyName) {
      lecturersQuery += ` AND dl.faculty_name = $1`;
      lecturerParams.push(filters.facultyName);
    }

    lecturersQuery += ` ORDER BY dl.name`;
    
    const lecturersResult = await query(lecturersQuery, lecturerParams);
    const lecturers = lecturersResult.rows.map((row) => ({
      id: row.lecturer_id,
      nip: row.nip,
      name: row.name
    }));

    // Query for courses for filter dropdown
    let coursesQuery = `
      SELECT DISTINCT dc.course_id, dc.course_code, dc.course_name
      FROM fact_teaching ft
      JOIN dim_lecturer dl ON ft.lecturer_id = dl.lecturer_id
      JOIN dim_course dc ON ft.course_id = dc.course_id
      JOIN dim_semester dsem ON ft.semester_id = dsem.semester_id
      JOIN dim_class dcl ON ft.class_id = dcl.class_id
      JOIN dim_room dr ON ft.room_id = dr.room_id
      WHERE dc.course_code IS NOT NULL
    `;

    let courseParams = [];
    if (filters.facultyName) {
      coursesQuery += ` AND dl.faculty_name = $${courseParams.length + 1}`;
      courseParams.push(filters.facultyName);
    }
    if (filters.lecturerId && !isNaN(parseInt(filters.lecturerId))) {
      coursesQuery += ` AND dl.lecturer_id = $${courseParams.length + 1}`;
      courseParams.push(parseInt(filters.lecturerId));
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
      teachingId: row.teaching_id || 0,
      lecturerNip: row.lecturer_nip || '',
      lecturerName: row.lecturer_name || '',
      lecturerEmail: row.lecturer_email || '',
      courseCode: row.course_code || '',
      courseName: row.course_name || '',
      courseCredits: parseInt(row.course_credits) || 0,
      className: row.class_name || '',
      building: row.building || '',
      capacity: parseInt(row.capacity) || 0,
      totalStudents: parseInt(row.total_students) || 0,
      totalSessions: parseInt(row.total_sessions) || 0,
      sessionsCompleted: parseInt(row.sessions_completed) || 0,
      teachingHours: parseFloat(row.teaching_hours) || 0,
      completionRate: parseFloat(row.completion_rate) || 0,
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
      lecturers,
      courses,
      stats
    };
  } catch (error) {
    console.error('Error fetching teaching details:', error);
    return {
      data: [],
      total: 0,
      page: isFullDataRequest ? 1 : page,
      pageSize: isFullDataRequest ? 0 : pageSize,
      totalPages: 0,
      faculties: [],
      lecturers: [],
      courses: [],
      stats: {
        totalTeachingRecords: 0,
        uniqueLecturers: 0,
        uniqueCourses: 0,
        averageTeachingHours: 0,
        averageCompletionRate: 0,
        totalTeachingHours: 0
      }
    };
  }
}