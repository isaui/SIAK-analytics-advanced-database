-- DIMENSION TABLES FIRST

-- students, programs, dan faculties
CREATE TABLE dim_student (
    student_id INTEGER PRIMARY KEY,
    npm VARCHAR(10),
    name VARCHAR(100),
    email VARCHAR(100),
    enrollment_date DATE,
    is_active BOOLEAN,
    program_code VARCHAR(10),
    program_name VARCHAR(100),
    faculty_code VARCHAR(10),
    faculty_name VARCHAR(100)
);

-- courses, programs, dan faculties
CREATE TABLE dim_course (
    course_id INTEGER PRIMARY KEY,
    course_code VARCHAR(10),
    course_name VARCHAR(100),
    credits INTEGER,
    program_code VARCHAR(10),
    program_name VARCHAR(100),
    faculty_code VARCHAR(10),
    faculty_name VARCHAR(100)
);

-- lecturers dan faculties
CREATE TABLE dim_lecturer (
    lecturer_id INTEGER PRIMARY KEY,
    nip VARCHAR(18),
    name VARCHAR(100),
    email VARCHAR(100),
    faculty_code VARCHAR(10),
    faculty_name VARCHAR(100)
);

CREATE TABLE dim_semester (
    semester_id INTEGER PRIMARY KEY,
    semester_code VARCHAR(10),
    start_date DATE,
    end_date DATE,
    academic_year VARCHAR(9)
);

CREATE TABLE dim_class (
    class_id INTEGER PRIMARY KEY,
    class_code VARCHAR(50),
    course_code VARCHAR(10),
    course_name VARCHAR(100),
    lecturer_name VARCHAR(100),
    room_number VARCHAR(20),
    day_of_week VARCHAR(10),
    start_time TIME,
    end_time TIME,
    semester_code VARCHAR(10),
    academic_year VARCHAR(9)
);

CREATE TABLE dim_room (
    room_id INTEGER PRIMARY KEY,
    room_number VARCHAR(20),
    building VARCHAR(50),
    capacity INTEGER
);

-- FACT TABLES AFTER DIMENSIONS

CREATE TABLE fact_registration (
    registration_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    registration_date DATE,
    FOREIGN KEY (student_id) REFERENCES dim_student(student_id),
    FOREIGN KEY (course_id) REFERENCES dim_course(course_id),
    FOREIGN KEY (semester_id) REFERENCES dim_semester(semester_id)
);

CREATE TABLE fact_grade (
    grade_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    final_grade DECIMAL(5,2),
    letter_grade VARCHAR(2),
    FOREIGN KEY (student_id) REFERENCES dim_student(student_id),
    FOREIGN KEY (course_id) REFERENCES dim_course(course_id),
    FOREIGN KEY (semester_id) REFERENCES dim_semester(semester_id)
);

CREATE TABLE fact_fee (
    fee_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    fee_amount DECIMAL(10,2),
    payment_date DATE,
    FOREIGN KEY (student_id) REFERENCES dim_student(student_id),
    FOREIGN KEY (semester_id) REFERENCES dim_semester(semester_id)
);

CREATE TABLE fact_academic (
    academic_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    semester_gpa DECIMAL(3,2),
    cumulative_gpa DECIMAL(3,2),
    semester_credits INTEGER,
    credits_passed INTEGER,
    total_credits INTEGER,
    FOREIGN KEY (student_id) REFERENCES dim_student(student_id),
    FOREIGN KEY (semester_id) REFERENCES dim_semester(semester_id)
);
