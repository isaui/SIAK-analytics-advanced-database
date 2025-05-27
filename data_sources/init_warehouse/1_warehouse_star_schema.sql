-- Faculty Dimension
CREATE TABLE dim_faculty (
    faculty_id INTEGER PRIMARY KEY,
    faculty_code VARCHAR(5) NOT NULL,
    faculty_name VARCHAR(100) NOT NULL
);

-- Program Dimension
CREATE TABLE dim_program (
    program_id INTEGER PRIMARY KEY,
    program_code VARCHAR(10) NOT NULL,
    program_name VARCHAR(100) NOT NULL,
    faculty_id INTEGER NOT NULL,
    FOREIGN KEY (faculty_id) REFERENCES dim_faculty(faculty_id)
);

-- Student Dimension
CREATE TABLE dim_student (
    student_id INTEGER PRIMARY KEY,
    npm VARCHAR(10) NOT NULL,
    username VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    enrollment_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL,
    program_id INTEGER NOT NULL,
    FOREIGN KEY (program_id) REFERENCES dim_program(program_id)
);

-- Course Dimension
CREATE TABLE dim_course (
    course_id INTEGER PRIMARY KEY,
    course_code VARCHAR(10) NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    credits INTEGER NOT NULL,
    program_id INTEGER NOT NULL,
    FOREIGN KEY (program_id) REFERENCES dim_program(program_id)
);

-- Semester Dimension
CREATE TABLE dim_semester (
    semester_id INTEGER PRIMARY KEY,
    semester_code VARCHAR(10) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    academic_year VARCHAR(9) NOT NULL -- Derived from semester code
);

-- Registration Fact (for Active Students)
CREATE TABLE fact_registration (
    registration_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    registration_date DATE NOT NULL,
    FOREIGN KEY (student_id) REFERENCES dim_student(student_id),
    FOREIGN KEY (course_id) REFERENCES dim_course(course_id),
    FOREIGN KEY (semester_id) REFERENCES dim_semester(semester_id)
);

-- Fee Fact (for Revenue Analysis)
CREATE TABLE fact_fee (
    fee_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    fee_amount DECIMAL(10,2) NOT NULL,
    payment_date DATE,
    FOREIGN KEY (student_id) REFERENCES dim_student(student_id),
    FOREIGN KEY (semester_id) REFERENCES dim_semester(semester_id)
);

-- Academic Performance Fact
CREATE TABLE fact_academic (
    academic_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    semester_gpa DECIMAL(3,2) NOT NULL,
    cumulative_gpa DECIMAL(3,2) NOT NULL,
    semester_credits INTEGER NOT NULL,
    credits_passed INTEGER NOT NULL,
    total_credits INTEGER NOT NULL,
    FOREIGN KEY (student_id) REFERENCES dim_student(student_id),
    FOREIGN KEY (semester_id) REFERENCES dim_semester(semester_id)
);

-- Course Performance Fact (for grades)
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

-- Lecturer Dimension
CREATE TABLE dim_lecturer (
    lecturer_id INTEGER PRIMARY KEY,
    lecturer_code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    department VARCHAR(100),
    faculty_id INTEGER,
    FOREIGN KEY (faculty_id) REFERENCES dim_faculty(faculty_id)
);

-- Class/Schedule Dimension
CREATE TABLE dim_class (
    class_id INTEGER PRIMARY KEY,
    class_code VARCHAR(20) NOT NULL,
    course_id INTEGER NOT NULL,
    lecturer_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    room VARCHAR(20),
    day_of_week VARCHAR(10),
    start_time TIME,
    end_time TIME,
    FOREIGN KEY (course_id) REFERENCES dim_course(course_id),
    FOREIGN KEY (lecturer_id) REFERENCES dim_lecturer(lecturer_id),
    FOREIGN KEY (semester_id) REFERENCES dim_semester(semester_id)
);

-- Attendance Fact (Simplified to match attendance_faker.py)
CREATE TABLE fact_attendance (
    attendance_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    attendance_date DATE NOT NULL,
    check_in_time TIME,
    FOREIGN KEY (student_id) REFERENCES dim_student(student_id),
    FOREIGN KEY (class_id) REFERENCES dim_class(class_id),
    FOREIGN KEY (course_id) REFERENCES dim_course(course_id),
    FOREIGN KEY (semester_id) REFERENCES dim_semester(semester_id)
);