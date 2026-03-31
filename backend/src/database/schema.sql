-- ============================================
-- EDUMERGE ADMISSION MANAGEMENT SYSTEM
-- PostgreSQL Database Schema
-- ============================================

-- Drop existing tables (for clean setup)
DROP TABLE IF EXISTS admissions CASCADE;
DROP TABLE IF EXISTS applicants CASCADE;
DROP TABLE IF EXISTS quota_seat_usage CASCADE;
DROP TABLE IF EXISTS quotas CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS campuses CASCADE;
DROP TABLE IF EXISTS institutions CASCADE;
DROP SEQUENCE IF EXISTS admission_number_seq;

-- ============================================
-- MASTER DATA TABLES
-- ============================================

CREATE TABLE institutions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE campuses (
    id SERIAL PRIMARY KEY,
    institution_id INT REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    campus_id INT REFERENCES campuses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE programs (
    id SERIAL PRIMARY KEY,
    department_id INT REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    course_type VARCHAR(10) CHECK (course_type IN ('UG', 'PG')),
    entry_type VARCHAR(20) CHECK (entry_type IN ('Regular', 'Lateral')),
    admission_mode VARCHAR(20) CHECK (admission_mode IN ('Government', 'Management')),
    academic_year VARCHAR(10) NOT NULL,
    total_intake INT NOT NULL CHECK (total_intake > 0),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(code, academic_year, department_id)
);

-- ============================================
-- SEAT MATRIX & QUOTA TABLES
-- ============================================

CREATE TABLE quotas (
    id SERIAL PRIMARY KEY,
    program_id INT REFERENCES programs(id) ON DELETE CASCADE,
    quota_type VARCHAR(20) CHECK (quota_type IN ('KCET', 'COMEDK', 'Management')),
    allocated_seats INT NOT NULL CHECK (allocated_seats >= 0),
    is_supernumerary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(program_id, quota_type)
);

-- Seat usage tracking (denormalized for performance)
CREATE TABLE quota_seat_usage (
    quota_id INT REFERENCES quotas(id) ON DELETE CASCADE PRIMARY KEY,
    seats_filled INT DEFAULT 0 CHECK (seats_filled >= 0),
    last_updated TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TRIGGER: Validate quota sum doesn't exceed intake
-- ============================================

CREATE OR REPLACE FUNCTION validate_quota_sum()
RETURNS TRIGGER AS $$
DECLARE
    total_quota INT;
    program_intake INT;
BEGIN
    -- Calculate total base quota for this program
    SELECT COALESCE(SUM(allocated_seats), 0) INTO total_quota
    FROM quotas 
    WHERE program_id = NEW.program_id 
    AND is_supernumerary = FALSE;
    
    -- Get program intake
    SELECT total_intake INTO program_intake
    FROM programs 
    WHERE id = NEW.program_id;
    
    -- Validate
    IF total_quota > program_intake THEN
        RAISE EXCEPTION 'Total quota (%) exceeds program intake (%)', total_quota, program_intake;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_quota_limit
AFTER INSERT OR UPDATE ON quotas
FOR EACH ROW EXECUTE FUNCTION validate_quota_sum();

-- ============================================
-- TRIGGER: Initialize seat usage counter when quota is created
-- ============================================

CREATE OR REPLACE FUNCTION initialize_seat_usage()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO quota_seat_usage (quota_id, seats_filled, last_updated)
    VALUES (NEW.id, 0, NOW())
    ON CONFLICT (quota_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER init_quota_usage
AFTER INSERT ON quotas
FOR EACH ROW EXECUTE FUNCTION initialize_seat_usage();

-- ============================================
-- APPLICANT & ADMISSION TABLES
-- ============================================

CREATE TABLE applicants (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    category VARCHAR(10) CHECK (category IN ('GM', 'SC', 'ST', 'OBC', 'EWS', 'Others')),
    allotment_number VARCHAR(50),
    qualifying_exam VARCHAR(100),
    marks_obtained DECIMAL(5,2),
    entry_type VARCHAR(20) CHECK (entry_type IN ('Regular', 'Lateral')),
    quota_type VARCHAR(20) CHECK (quota_type IN ('KCET', 'COMEDK', 'Management')),
    admission_mode VARCHAR(20) CHECK (admission_mode IN ('Government', 'Management')),
    address TEXT,
    parent_name VARCHAR(255),
    parent_phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE admissions (
    id SERIAL PRIMARY KEY,
    applicant_id INT REFERENCES applicants(id) ON DELETE CASCADE UNIQUE,
    program_id INT REFERENCES programs(id) ON DELETE CASCADE,
    quota_id INT REFERENCES quotas(id) ON DELETE CASCADE,
    admission_number VARCHAR(50) UNIQUE NOT NULL,
    admission_date TIMESTAMP DEFAULT NOW(),
    fee_status VARCHAR(20) DEFAULT 'Pending' CHECK (fee_status IN ('Pending', 'Paid')),
    document_status VARCHAR(20) DEFAULT 'Pending' CHECK (document_status IN ('Pending', 'Submitted', 'Verified')),
    status VARCHAR(20) DEFAULT 'Provisional' CHECK (status IN ('Provisional', 'Confirmed', 'Cancelled')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TRIGGER: Update seat counter on admission
-- ============================================

CREATE OR REPLACE FUNCTION update_seat_counter()
RETURNS TRIGGER AS $$
DECLARE
    available_seats INT;
    filled_seats INT;
BEGIN
    -- Get current seat usage
    SELECT seats_filled INTO filled_seats
    FROM quota_seat_usage
    WHERE quota_id = NEW.quota_id;
    
    -- Get allocated seats
    SELECT allocated_seats INTO available_seats
    FROM quotas
    WHERE id = NEW.quota_id;
    
    -- Check if quota is full
    IF filled_seats >= available_seats THEN
        RAISE EXCEPTION 'Quota full - cannot allocate seat. Filled: %, Allocated: %', filled_seats, available_seats;
    END IF;
    
    -- Increment counter
    UPDATE quota_seat_usage 
    SET seats_filled = seats_filled + 1, 
        last_updated = NOW()
    WHERE quota_id = NEW.quota_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_seat_counter
BEFORE INSERT ON admissions
FOR EACH ROW EXECUTE FUNCTION update_seat_counter();

-- ============================================
-- TRIGGER: Decrement seat counter on admission cancellation
-- ============================================

CREATE OR REPLACE FUNCTION decrement_seat_counter()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != 'Cancelled' AND NEW.status = 'Cancelled' THEN
        UPDATE quota_seat_usage 
        SET seats_filled = seats_filled - 1, 
            last_updated = NOW()
        WHERE quota_id = OLD.quota_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_admission_cancel
AFTER UPDATE ON admissions
FOR EACH ROW EXECUTE FUNCTION decrement_seat_counter();

-- ============================================
-- ADMISSION NUMBER GENERATION
-- ============================================

CREATE SEQUENCE admission_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_admission_number(
    p_institution_code VARCHAR,
    p_academic_year VARCHAR,
    p_course_type VARCHAR,
    p_program_code VARCHAR,
    p_quota_type VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
    seq_number INT;
    admission_num VARCHAR;
BEGIN
    seq_number := nextval('admission_number_seq');
    admission_num := FORMAT('%s/%s/%s/%s/%s/%s',
        p_institution_code,
        p_academic_year,
        p_course_type,
        p_program_code,
        p_quota_type,
        LPAD(seq_number::TEXT, 4, '0')
    );
    RETURN admission_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_programs_academic_year ON programs(academic_year);
CREATE INDEX idx_admissions_program_id ON admissions(program_id);
CREATE INDEX idx_admissions_status ON admissions(status);
CREATE INDEX idx_applicants_email ON applicants(email);
CREATE INDEX idx_quotas_program_id ON quotas(program_id);

-- ============================================
-- SAMPLE DATA (For Testing)
-- ============================================

-- Institution
INSERT INTO institutions (code, name, address) 
VALUES ('INST', 'ABC Engineering College', 'Bangalore, Karnataka');

-- Campus
INSERT INTO campuses (institution_id, name, location) 
VALUES (1, 'Main Campus', 'Electronic City, Bangalore');

-- Department
INSERT INTO departments (campus_id, name, code) 
VALUES (1, 'Computer Science & Engineering', 'CSE');

-- Program
INSERT INTO programs (department_id, name, code, course_type, entry_type, admission_mode, academic_year, total_intake)
VALUES (1, 'Computer Science Engineering', 'CSE', 'UG', 'Regular', 'Government', '2026', 100);

-- Quotas
INSERT INTO quotas (program_id, quota_type, allocated_seats, is_supernumerary)
VALUES 
    (1, 'KCET', 50, FALSE),
    (1, 'COMEDK', 30, FALSE),
    (1, 'Management', 20, FALSE);

-- Sample Applicant
INSERT INTO applicants (
    full_name, email, phone, date_of_birth, gender, category, 
    allotment_number, qualifying_exam, marks_obtained, 
    entry_type, quota_type, admission_mode, address, parent_name, parent_phone
)
VALUES (
    'Akhil Munnuru', 'akhil@example.com', '9876543210', '2004-05-15', 'Male', 'GM',
    'KCET2026001234', 'KCET', 95.50,
    'Regular', 'KCET', 'Government', 'Hyderabad, Telangana', 'Parent Name', '9876543211'
);

-- Sample Admission
INSERT INTO admissions (applicant_id, program_id, quota_id, admission_number)
VALUES (
    1, 
    1, 
    1, 
    generate_admission_number('INST', '2026', 'UG', 'CSE', 'KCET')
);

-- ============================================
-- USEFUL QUERIES
-- ============================================

-- View Dashboard Stats
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    i.name as institution_name,
    p.name as program_name,
    p.academic_year,
    p.total_intake,
    q.quota_type,
    q.allocated_seats,
    COALESCE(qsu.seats_filled, 0) as seats_filled,
    q.allocated_seats - COALESCE(qsu.seats_filled, 0) as remaining_seats,
    ROUND(COALESCE(qsu.seats_filled::DECIMAL / NULLIF(q.allocated_seats, 0) * 100, 0), 2) as fill_percentage
FROM programs p
JOIN departments d ON p.department_id = d.id
JOIN campuses c ON d.campus_id = c.id
JOIN institutions i ON c.institution_id = i.id
JOIN quotas q ON p.id = q.program_id
LEFT JOIN quota_seat_usage qsu ON q.id = qsu.quota_id
ORDER BY p.name, q.quota_type;

-- View All Admissions with Details
CREATE OR REPLACE VIEW admission_details AS
SELECT 
    a.admission_number,
    a.admission_date,
    a.status,
    a.fee_status,
    a.document_status,
    ap.full_name,
    ap.email,
    ap.phone,
    p.name as program_name,
    q.quota_type,
    i.name as institution_name
FROM admissions a
JOIN applicants ap ON a.applicant_id = ap.id
JOIN programs p ON a.program_id = p.id
JOIN quotas q ON a.quota_id = q.id
JOIN departments d ON p.department_id = d.id
JOIN campuses c ON d.campus_id = c.id
JOIN institutions i ON c.institution_id = i.id
ORDER BY a.admission_date DESC;

-- Test queries
-- SELECT * FROM dashboard_stats;
-- SELECT * FROM admission_details;
