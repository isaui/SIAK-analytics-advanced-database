-- Fix column lengths for codes
ALTER TABLE dim_faculty ALTER COLUMN faculty_code TYPE VARCHAR(20);
ALTER TABLE dim_lecturer ALTER COLUMN lecturer_code TYPE VARCHAR(20);

-- Add unique constraints for fact tables to support upsert operations
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
