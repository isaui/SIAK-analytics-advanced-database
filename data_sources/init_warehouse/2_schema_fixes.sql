-- Schema fixes for the denormalized star schema warehouse

-- Fix column type and length for denormalized dimension tables
ALTER TABLE dim_student ALTER COLUMN faculty_code TYPE VARCHAR(20);
ALTER TABLE dim_course ALTER COLUMN faculty_code TYPE VARCHAR(20);
ALTER TABLE dim_lecturer ALTER COLUMN faculty_code TYPE VARCHAR(20);
ALTER TABLE dim_lecturer ALTER COLUMN nip TYPE VARCHAR(20);

-- Add unique constraints for primary keys on dimension tables
ALTER TABLE dim_student ADD CONSTRAINT dim_student_pk PRIMARY KEY (student_id);
ALTER TABLE dim_course ADD CONSTRAINT dim_course_pk PRIMARY KEY (course_id);
ALTER TABLE dim_lecturer ADD CONSTRAINT dim_lecturer_pk PRIMARY KEY (lecturer_id);
ALTER TABLE dim_semester ADD CONSTRAINT dim_semester_pk PRIMARY KEY (semester_id);
ALTER TABLE dim_class ADD CONSTRAINT dim_class_pk PRIMARY KEY (class_id);
ALTER TABLE dim_room ADD CONSTRAINT dim_room_pk PRIMARY KEY (room_id);

-- Add unique constraints for fact tables to support upsert operations
-- These constraints are critical for the export process which uses ON CONFLICT clauses

-- fact_registration - composite key for student_id, course_id, semester_id
ALTER TABLE fact_registration ADD CONSTRAINT fact_registration_unique_constraint UNIQUE (student_id, course_id, semester_id);

-- fact_fee - composite key for student_id, semester_id, fee_id
ALTER TABLE fact_fee ADD CONSTRAINT fact_fee_unique_constraint UNIQUE (student_id, semester_id, fee_id);

-- fact_academic - composite key for student_id, semester_id, academic_id
ALTER TABLE fact_academic ADD CONSTRAINT fact_academic_unique_constraint UNIQUE (student_id, semester_id, academic_id);

-- fact_grade - composite key for student_id, course_id, semester_id, grade_id
ALTER TABLE fact_grade ADD CONSTRAINT fact_grade_unique_constraint UNIQUE (student_id, course_id, semester_id, grade_id);

-- fact_attendance - composite key for student_id, class_id, attendance_date
ALTER TABLE fact_attendance ADD CONSTRAINT fact_attendance_unique_constraint UNIQUE (student_id, class_id, attendance_date);
