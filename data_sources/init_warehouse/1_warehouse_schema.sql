-- Complete Data Warehouse Schema with Fixes and Constraints
-- This script creates the denormalized star schema warehouse and applies all necessary fixes

-- ============================================================================
-- DIMENSION TABLES
-- ============================================================================

-- Students, programs, and faculties (denormalized)
CREATE TABLE dim_student (
    student_id INTEGER,
    npm VARCHAR(10),
    name VARCHAR(100),
    email VARCHAR(100),
    enrollment_date DATE,
    is_active BOOLEAN,
    program_code VARCHAR(10),
    program_name VARCHAR(100),
    faculty_code VARCHAR(20),  -- Fixed length from VARCHAR(10) to VARCHAR(20)
    faculty_name VARCHAR(100),
    CONSTRAINT dim_student_pk PRIMARY KEY (student_id)
);

-- Courses, programs, and faculties (denormalized)
CREATE TABLE dim_course (
    course_id INTEGER,
    course_code VARCHAR(10),
    course_name VARCHAR(100),
    credits INTEGER,
    program_code VARCHAR(10),
    program_name VARCHAR(100),
    faculty_code VARCHAR(20),  -- Fixed length from VARCHAR(10) to VARCHAR(20)
    faculty_name VARCHAR(100),
    CONSTRAINT dim_course_pk PRIMARY KEY (course_id)
);

-- Lecturers and faculties (denormalized)
CREATE TABLE dim_lecturer (
    lecturer_id INTEGER,
    nip VARCHAR(20),           -- Fixed length from VARCHAR(18) to VARCHAR(20)
    name VARCHAR(100),
    email VARCHAR(100),
    faculty_code VARCHAR(20),  -- Fixed length from VARCHAR(10) to VARCHAR(20)
    faculty_name VARCHAR(100),
    CONSTRAINT dim_lecturer_pk PRIMARY KEY (lecturer_id)
);

-- Semester dimension
CREATE TABLE dim_semester (
    semester_id INTEGER,
    semester_code VARCHAR(10),
    start_date DATE,
    end_date DATE,
    academic_year VARCHAR(9),
    CONSTRAINT dim_semester_pk PRIMARY KEY (semester_id)
);

-- Class dimension (denormalized with course, lecturer, and semester info)
CREATE TABLE dim_class (
    class_id INTEGER,
    class_code VARCHAR(50),
    course_code VARCHAR(10),
    course_name VARCHAR(100),
    lecturer_name VARCHAR(100),
    day_of_week VARCHAR(10),
    start_time TIME,
    end_time TIME,
    semester_code VARCHAR(10),
    academic_year VARCHAR(9),
    CONSTRAINT dim_class_pk PRIMARY KEY (class_id)
);

-- Room dimension
CREATE TABLE dim_room (
    room_id INTEGER,
    building VARCHAR(50),
    capacity INTEGER,
    CONSTRAINT dim_room_pk PRIMARY KEY (room_id)
);

-- ============================================================================
-- FACT TABLES
-- ============================================================================

-- Course registration facts
CREATE TABLE fact_registration (
    registration_id INTEGER,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    registration_date DATE,
    CONSTRAINT fact_registration_pk PRIMARY KEY (registration_id),
    CONSTRAINT fact_registration_unique_constraint UNIQUE (student_id, course_id, semester_id),
    CONSTRAINT fact_registration_student_fk FOREIGN KEY (student_id) REFERENCES dim_student(student_id),
    CONSTRAINT fact_registration_course_fk FOREIGN KEY (course_id) REFERENCES dim_course(course_id),
    CONSTRAINT fact_registration_semester_fk FOREIGN KEY (semester_id) REFERENCES dim_semester(semester_id)
);

-- Student grade facts
CREATE TABLE fact_grade (
    grade_id INTEGER,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    final_grade DECIMAL(5,2),
    letter_grade VARCHAR(2),
    CONSTRAINT fact_grade_pk PRIMARY KEY (grade_id),
    CONSTRAINT fact_grade_unique_constraint UNIQUE (student_id, course_id, semester_id, grade_id),
    CONSTRAINT fact_grade_student_fk FOREIGN KEY (student_id) REFERENCES dim_student(student_id),
    CONSTRAINT fact_grade_course_fk FOREIGN KEY (course_id) REFERENCES dim_course(course_id),
    CONSTRAINT fact_grade_semester_fk FOREIGN KEY (semester_id) REFERENCES dim_semester(semester_id)
);

-- Student fee payment facts
CREATE TABLE fact_fee (
    fee_id INTEGER,
    student_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    fee_amount DECIMAL(10,2),
    payment_date DATE,
    CONSTRAINT fact_fee_pk PRIMARY KEY (fee_id),
    CONSTRAINT fact_fee_unique_constraint UNIQUE (student_id, semester_id, fee_id),
    CONSTRAINT fact_fee_student_fk FOREIGN KEY (student_id) REFERENCES dim_student(student_id),
    CONSTRAINT fact_fee_semester_fk FOREIGN KEY (semester_id) REFERENCES dim_semester(semester_id)
);

-- Student academic performance facts
CREATE TABLE fact_academic (
    academic_id INTEGER,
    student_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    semester_gpa DECIMAL(3,2),
    cumulative_gpa DECIMAL(3,2),
    semester_credits INTEGER,
    credits_passed INTEGER,
    total_credits INTEGER,
    CONSTRAINT fact_academic_pk PRIMARY KEY (academic_id),
    CONSTRAINT fact_academic_unique_constraint UNIQUE (student_id, semester_id, academic_id),
    CONSTRAINT fact_academic_student_fk FOREIGN KEY (student_id) REFERENCES dim_student(student_id),
    CONSTRAINT fact_academic_semester_fk FOREIGN KEY (semester_id) REFERENCES dim_semester(semester_id)
);

-- Student attendance facts
CREATE TABLE fact_attendance (
    attendance_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    attendance_date DATE,
    check_in_time TIME,
    CONSTRAINT fact_attendance_unique_constraint UNIQUE (student_id, class_id, attendance_date),
    CONSTRAINT fact_attendance_student_fk FOREIGN KEY (student_id) REFERENCES dim_student(student_id),
    CONSTRAINT fact_attendance_course_fk FOREIGN KEY (course_id) REFERENCES dim_course(course_id),
    CONSTRAINT fact_attendance_class_fk FOREIGN KEY (class_id) REFERENCES dim_class(class_id),
    CONSTRAINT fact_attendance_room_fk FOREIGN KEY (room_id) REFERENCES dim_room(room_id)
);

-- Lecturer teaching load facts
CREATE TABLE fact_teaching (
    teaching_id INTEGER,
    lecturer_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    total_students INTEGER,
    total_sessions INTEGER,
    sessions_completed INTEGER,
    teaching_hours DECIMAL(5,2),
    CONSTRAINT fact_teaching_pk PRIMARY KEY (teaching_id),
    CONSTRAINT fact_teaching_unique_constraint UNIQUE (lecturer_id, course_id, semester_id, class_id),
    CONSTRAINT fact_teaching_lecturer_fk FOREIGN KEY (lecturer_id) REFERENCES dim_lecturer(lecturer_id),
    CONSTRAINT fact_teaching_course_fk FOREIGN KEY (course_id) REFERENCES dim_course(course_id),
    CONSTRAINT fact_teaching_semester_fk FOREIGN KEY (semester_id) REFERENCES dim_semester(semester_id),
    CONSTRAINT fact_teaching_class_fk FOREIGN KEY (class_id) REFERENCES dim_class(class_id),
    CONSTRAINT fact_teaching_room_fk FOREIGN KEY (room_id) REFERENCES dim_room(room_id)
);

-- Room utilization facts
CREATE TABLE fact_room_usage (
    usage_id INTEGER,
    room_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    usage_date DATE,
    start_time TIME,
    end_time TIME,
    actual_occupancy INTEGER,
    utilization_rate DECIMAL(5,2),
    CONSTRAINT fact_room_usage_pk PRIMARY KEY (usage_id),
    CONSTRAINT fact_room_usage_unique_constraint UNIQUE (room_id, class_id, usage_date, start_time),
    CONSTRAINT fact_room_usage_room_fk FOREIGN KEY (room_id) REFERENCES dim_room(room_id),
    CONSTRAINT fact_room_usage_class_fk FOREIGN KEY (class_id) REFERENCES dim_class(class_id),
    CONSTRAINT fact_room_usage_semester_fk FOREIGN KEY (semester_id) REFERENCES dim_semester(semester_id)
);

-- ============================================================================
-- SCHEMA DEPLOYMENT COMPLETE
-- ============================================================================