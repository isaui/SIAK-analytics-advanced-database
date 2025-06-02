import { query } from '@/utils/db';

export type RoomUsageDetail = {
  usageId: number;
  building: string;
  capacity: number;
  classCode: string;
  courseCode: string;
  courseName: string;
  lecturerName: string;
  usageDate: string;
  startTime: string;
  endTime: string;
  actualOccupancy: number;
  utilizationRate: number;
  occupancyRate: number;
  semesterCode: string;
  academicYear: string;
  duration: number; // in minutes
};

export type RoomUsageFilters = {
  semesterId?: string;
  building?: string;
  roomId?: string;
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
  minUtilization?: string;
  maxUtilization?: string;
  minOccupancy?: string;
  page?: number;
  pageSize?: number;
};

export type PaginatedRoomUsageDetails = {
  data: RoomUsageDetail[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  buildings: string[];
  rooms: { id: number; building: string; capacity: number }[];
  stats: {
    totalUsageRecords: number;
    uniqueRooms: number;
    averageUtilizationRate: number;
    averageOccupancyRate: number;
    peakOccupancy: number;
    totalUsageHours: number;
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

export async function getRoomUsageDetails(
  filters: RoomUsageFilters = {}
): Promise<PaginatedRoomUsageDetails> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  
  // Check if this is a full data request (no pagination)
  const isFullDataRequest = filters.page === undefined && filters.pageSize === undefined;
  
  try {
    // Construct base query with all necessary joins
    let baseQuery = `
      FROM fact_room_usage fru
      JOIN dim_room dr ON fru.room_id = dr.room_id
      JOIN dim_class dcl ON fru.class_id = dcl.class_id
      JOIN dim_semester dsem ON fru.semester_id = dsem.semester_id
    `;

    // Add filters with proper type casting
    let whereConditions = [];
    let params = [];

    // Filter by semester - Parse to integer
    if (filters.semesterId && !isNaN(parseInt(filters.semesterId))) {
      whereConditions.push(`dsem.semester_id = $${params.length + 1}`);
      params.push(parseInt(filters.semesterId));
    }

    // Filter by building - String is correct
    if (filters.building) {
      whereConditions.push(`dr.building = $${params.length + 1}`);
      params.push(filters.building);
    }

    // Filter by room - Parse to integer
    if (filters.roomId && !isNaN(parseInt(filters.roomId))) {
      whereConditions.push(`dr.room_id = $${params.length + 1}`);
      params.push(parseInt(filters.roomId));
    }

    // Search term for class, course, or lecturer - String is correct
    if (filters.searchTerm) {
      whereConditions.push(`(
        dcl.class_code ILIKE $${params.length + 1} OR
        dcl.course_code ILIKE $${params.length + 1} OR
        dcl.course_name ILIKE $${params.length + 1} OR
        dcl.lecturer_name ILIKE $${params.length + 1}
      )`);
      params.push(`%${filters.searchTerm}%`);
    }

    // Filter by date range
    if (filters.dateFrom) {
      whereConditions.push(`fru.usage_date >= $${params.length + 1}`);
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      whereConditions.push(`fru.usage_date <= $${params.length + 1}`);
      params.push(filters.dateTo);
    }

    // Filter by utilization rate range - Parse to float with validation
    if (filters.minUtilization && !isNaN(parseFloat(filters.minUtilization))) {
      whereConditions.push(`fru.utilization_rate >= $${params.length + 1}`);
      params.push(parseFloat(filters.minUtilization));
    }

    if (filters.maxUtilization && !isNaN(parseFloat(filters.maxUtilization))) {
      whereConditions.push(`fru.utilization_rate <= $${params.length + 1}`);
      params.push(parseFloat(filters.maxUtilization));
    }

    // Filter by minimum occupancy - Parse to integer with validation
    if (filters.minOccupancy && !isNaN(parseInt(filters.minOccupancy))) {
      whereConditions.push(`fru.actual_occupancy >= $${params.length + 1}`);
      params.push(parseInt(filters.minOccupancy));
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
        fru.usage_id,
        dr.building,
        dr.capacity,
        dcl.class_code,
        dcl.course_code,
        dcl.course_name,
        dcl.lecturer_name,
        fru.usage_date,
        fru.start_time,
        fru.end_time,
        fru.actual_occupancy,
        fru.utilization_rate,
        CASE 
          WHEN dr.capacity > 0 
          THEN (fru.actual_occupancy::FLOAT / dr.capacity * 100)
          ELSE 0 
        END as occupancy_rate,
        dsem.semester_code,
        dsem.academic_year,
        EXTRACT(EPOCH FROM (fru.end_time - fru.start_time)) / 60 as duration_minutes
      ${baseQuery}
      ${whereClause}
      ORDER BY fru.usage_date DESC, fru.start_time ASC, dr.building ASC
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
        COUNT(*) as total_usage_records,
        COUNT(DISTINCT fru.room_id) as unique_rooms,
        AVG(fru.utilization_rate) as avg_utilization_rate,
        MAX(fru.actual_occupancy) as peak_occupancy
      ${baseQuery}
      ${whereClause}
    `;
    
    const statsResult = await query(statsQuery, params);

    // Query for average occupancy rate
    const avgOccupancyQuery = `
      SELECT AVG(
        CASE 
          WHEN dr.capacity > 0 
          THEN (fru.actual_occupancy::FLOAT / dr.capacity * 100)
          ELSE 0 
        END
      ) as avg_occupancy_rate
      ${baseQuery}
      ${whereClause}
    `;
    
    const avgOccupancyResult = await query(avgOccupancyQuery, params);

    // Query for total usage hours
    const totalHoursQuery = `
      SELECT SUM(
        EXTRACT(EPOCH FROM (fru.end_time - fru.start_time)) / 3600
      ) as total_usage_hours
      ${baseQuery}
      ${whereClause}
    `;
    
    const totalHoursResult = await query(totalHoursQuery, params);
    
    const stats = {
      totalUsageRecords: parseInt(statsResult.rows[0].total_usage_records) || 0,
      uniqueRooms: parseInt(statsResult.rows[0].unique_rooms) || 0,
      averageUtilizationRate: parseFloat(statsResult.rows[0].avg_utilization_rate) || 0,
      averageOccupancyRate: parseFloat(avgOccupancyResult.rows[0]?.avg_occupancy_rate) || 0,
      peakOccupancy: parseInt(statsResult.rows[0].peak_occupancy) || 0,
      totalUsageHours: parseFloat(totalHoursResult.rows[0]?.total_usage_hours) || 0
    };

    // Query for unique buildings for filter dropdown
    const buildingsQuery = `
      SELECT DISTINCT dr.building
      ${baseQuery}
      WHERE dr.building IS NOT NULL
      ORDER BY dr.building
    `;
    
    const buildingsResult = await query(buildingsQuery, []);
    const buildings = buildingsResult.rows.map((row) => row.building);

    // Query for rooms for filter dropdown
    let roomsQuery = `
      SELECT DISTINCT dr.room_id, dr.building, dr.capacity
      ${baseQuery}
      WHERE dr.building IS NOT NULL
    `;

    let roomParams = [];
    if (filters.building) {
      roomsQuery += ` AND dr.building = $1`;
      roomParams.push(filters.building);
    }

    roomsQuery += ` ORDER BY dr.building, dr.capacity DESC`;
    
    const roomsResult = await query(roomsQuery, roomParams);
    const rooms = roomsResult.rows.map((row) => ({
      id: row.room_id,
      building: row.building,
      capacity: row.capacity
    }));
    
    // Transform to needed format with better error handling
    const data = result.rows.map((row) => ({
      usageId: row.usage_id || 0,
      building: row.building || '',
      capacity: parseInt(row.capacity) || 0,
      classCode: row.class_code || '',
      courseCode: row.course_code || '',
      courseName: row.course_name || '',
      lecturerName: row.lecturer_name || '',
      usageDate: row.usage_date || '',
      startTime: row.start_time || '',
      endTime: row.end_time || '',
      actualOccupancy: parseInt(row.actual_occupancy) || 0,
      utilizationRate: parseFloat(row.utilization_rate) || 0,
      occupancyRate: parseFloat(row.occupancy_rate) || 0,
      semesterCode: row.semester_code || '',
      academicYear: row.academic_year || '',
      duration: parseInt(row.duration_minutes) || 0
    }));

    return {
      data,
      total,
      page: isFullDataRequest ? 1 : page,
      pageSize: isFullDataRequest ? total : pageSize,
      totalPages,
      buildings,
      rooms,
      stats
    };
  } catch (error) {
    console.error('Error fetching room usage details:', error);
    return {
      data: [],
      total: 0,
      page: isFullDataRequest ? 1 : page,
      pageSize: isFullDataRequest ? 0 : pageSize,
      totalPages: 0,
      buildings: [],
      rooms: [],
      stats: {
        totalUsageRecords: 0,
        uniqueRooms: 0,
        averageUtilizationRate: 0,
        averageOccupancyRate: 0,
        peakOccupancy: 0,
        totalUsageHours: 0
      }
    };
  }
}