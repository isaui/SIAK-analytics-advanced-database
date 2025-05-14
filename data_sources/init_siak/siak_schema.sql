-- Faculties Table
CREATE TABLE faculties (
    id SERIAL PRIMARY KEY,
    faculty_code VARCHAR(10) UNIQUE NOT NULL,
    faculty_name VARCHAR(100) NOT NULL
);

-- Programs Tableerr
CREATE TABLE programs (
    id SERIAL PRIMARY KEY,
    program_code VARCHAR(10) UNIQUE NOT NULL,
    program_name VARCHAR(100) NOT NULL,
    faculty_id INTEGER NOT NULL,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id)
);

-- Students Table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    npm VARCHAR(10) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    enrollment_date DATE NOT NULL,
    program_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (program_id) REFERENCES programs(id)
);

-- Lecturers Table
CREATE TABLE lecturers (
    id SERIAL PRIMARY KEY,
    nip VARCHAR(18) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    faculty_id INTEGER NOT NULL,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id)
);

-- Rooms Table
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL,
    building VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL
);

-- Courses Table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(10) UNIQUE NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    credits INTEGER NOT NULL,
    program_id INTEGER NOT NULL,
    FOREIGN KEY (program_id) REFERENCES programs(id)
);

-- Semesters Table (is_active removed)
CREATE TABLE semesters (
    id SERIAL PRIMARY KEY,
    semester_code VARCHAR(10) UNIQUE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

-- Class Schedules Table
CREATE TABLE class_schedules (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    lecturer_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (lecturer_id) REFERENCES lecturers(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (semester_id) REFERENCES semesters(id)
);

-- Registrations Table
CREATE TABLE registrations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    registration_date DATE NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (semester_id) REFERENCES semesters(id),
    UNIQUE (student_id, course_id, semester_id)
);

-- Grades Table
CREATE TABLE grades (
    id SERIAL PRIMARY KEY,
    registration_id INTEGER NOT NULL,
    final_grade DECIMAL(5,2),
    letter_grade VARCHAR(2),
    FOREIGN KEY (registration_id) REFERENCES registrations(id)
);

-- Semester Fees Table (payment_status removed)
CREATE TABLE semester_fees (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    fee_amount DECIMAL(10,2) NOT NULL,
    payment_date DATE,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (semester_id) REFERENCES semesters(id),
    UNIQUE (student_id, semester_id)
);

-- Academic Records Table (for tracking IP and IPK)
CREATE TABLE academic_records (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    semester_gpa DECIMAL(3,2) NOT NULL, -- IP (Indeks Prestasi)
    cumulative_gpa DECIMAL(3,2) NOT NULL, -- IPK (Indeks Prestasi Kumulatif)
    semester_credits INTEGER NOT NULL, -- Credits taken this semester
    credits_passed INTEGER NOT NULL, -- Credits passed/completed this semester
    total_credits INTEGER NOT NULL, -- Total credits earned so far
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (semester_id) REFERENCES semesters(id),
    UNIQUE (student_id, semester_id)
);