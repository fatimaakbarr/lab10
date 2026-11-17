-- =========================================================
-- Lab 10 - Task 1: PostgreSQL Installation and SQL
-- Run in psql:  psql -U postgres -f task1.sql
-- (or open it in pgAdmin Query Tool, connected to postgres DB first)
-- =========================================================

-- 0) Check the installed version
SELECT version();

-- 1) Create the database and connect to it
DROP DATABASE IF EXISTS task1_db;
CREATE DATABASE task1_db;
\c task1_db

-- 2) Create the courses table
CREATE TABLE courses (
    id           SERIAL PRIMARY KEY,
    code         VARCHAR(10)  NOT NULL UNIQUE,
    title        VARCHAR(100) NOT NULL,
    credit_hours INTEGER      NOT NULL CHECK (credit_hours BETWEEN 1 AND 4)
);

-- 3) Insert at least five courses
INSERT INTO courses (code, title, credit_hours) VALUES
    ('CS-301',  'Full Stack Web Development',  3),
    ('CS-301L', 'Full Stack Web Development Lab', 1),
    ('CS-220',  'Database Systems',             3),
    ('CS-210',  'Data Structures',              4),
    ('SE-310',  'Software Requirements Engineering', 3),
    ('MA-201',  'Linear Algebra',               2);

-- CHECK constraint test: PostgreSQL must REJECT this (credit_hours = 9)
-- ERROR: new row for relation "courses" violates check constraint "courses_credit_hours_check"
INSERT INTO courses (code, title, credit_hours) VALUES ('CS-999', 'Invalid Course', 9);

-- UNIQUE constraint test: rejected because CS-301 already exists
INSERT INTO courses (code, title, credit_hours) VALUES ('CS-301', 'Duplicate Code', 3);

-- (a) List all courses ordered by title
SELECT * FROM courses ORDER BY title;

-- (b) List courses with 3 or more credit hours
SELECT * FROM courses WHERE credit_hours >= 3 ORDER BY credit_hours DESC, code;

-- (c) Change the title of one course
UPDATE courses SET title = 'Advanced Database Systems' WHERE code = 'CS-220';
SELECT * FROM courses WHERE code = 'CS-220';

-- (d) Delete one course by code
DELETE FROM courses WHERE code = 'MA-201';
SELECT * FROM courses ORDER BY id;

-- (e) Count courses for each value of credit_hours
SELECT credit_hours, COUNT(*) AS total_courses
FROM courses
GROUP BY credit_hours
ORDER BY credit_hours;
