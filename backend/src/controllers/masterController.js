const pool = require('../config/database');


// INSTITUTION CONTROLLERS

exports.createInstitution = async (req, res, next) => {
    const { code, name, address } = req.body;
    
    try {
        const result = await pool.query(
            'INSERT INTO institutions (code, name, address) VALUES ($1, $2, $3) RETURNING *',
            [code, name, address]
        );
        
        res.status(201).json({
            success: true,
            institution: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.getInstitutions = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM institutions ORDER BY created_at DESC');
        
        res.json({
            success: true,
            institutions: result.rows
        });
    } catch (error) {
        next(error);
    }
};


// CAMPUS CONTROLLERS

exports.createCampus = async (req, res, next) => {
    const { institution_id, name, location } = req.body;
    
    try {
        const result = await pool.query(
            'INSERT INTO campuses (institution_id, name, location) VALUES ($1, $2, $3) RETURNING *',
            [institution_id, name, location]
        );
        
        res.status(201).json({
            success: true,
            campus: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.getCampuses = async (req, res, next) => {
    const { institution_id } = req.query;
    
    try {
        let query = `
            SELECT c.*, i.name as institution_name 
            FROM campuses c
            JOIN institutions i ON c.institution_id = i.id
        `;
        const params = [];
        
        if (institution_id) {
            query += ' WHERE c.institution_id = $1';
            params.push(institution_id);
        }
        
        query += ' ORDER BY c.created_at DESC';
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            campuses: result.rows
        });
    } catch (error) {
        next(error);
    }
};


// DEPARTMENT CONTROLLERS


exports.createDepartment = async (req, res, next) => {
    const { campus_id, name, code } = req.body;
    
    try {
        const result = await pool.query(
            'INSERT INTO departments (campus_id, name, code) VALUES ($1, $2, $3) RETURNING *',
            [campus_id, name, code]
        );
        
        res.status(201).json({
            success: true,
            department: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.getDepartments = async (req, res, next) => {
    const { campus_id } = req.query;
    
    try {
        let query = `
            SELECT d.*, c.name as campus_name 
            FROM departments d
            JOIN campuses c ON d.campus_id = c.id
        `;
        const params = [];
        
        if (campus_id) {
            query += ' WHERE d.campus_id = $1';
            params.push(campus_id);
        }
        
        query += ' ORDER BY d.created_at DESC';
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            departments: result.rows
        });
    } catch (error) {
        next(error);
    }
};


// PROGRAM CONTROLLERS


exports.createProgram = async (req, res, next) => {
    const { 
        department_id, name, code, course_type, entry_type, 
        admission_mode, academic_year, total_intake 
    } = req.body;
    
    try {
        const result = await pool.query(
            `INSERT INTO programs (
                department_id, name, code, course_type, entry_type, 
                admission_mode, academic_year, total_intake
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [department_id, name, code, course_type, entry_type, admission_mode, academic_year, total_intake]
        );
        
        res.status(201).json({
            success: true,
            program: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.getPrograms = async (req, res, next) => {
    const { department_id, academic_year, course_type } = req.query;
    
    try {
        let query = `
            SELECT p.*, d.name as department_name, d.code as department_code
            FROM programs p
            JOIN departments d ON p.department_id = d.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;
        
        if (department_id) {
            query += ` AND p.department_id = $${paramCount}`;
            params.push(department_id);
            paramCount++;
        }
        
        if (academic_year) {
            query += ` AND p.academic_year = $${paramCount}`;
            params.push(academic_year);
            paramCount++;
        }
        
        if (course_type) {
            query += ` AND p.course_type = $${paramCount}`;
            params.push(course_type);
            paramCount++;
        }
        
        query += ' ORDER BY p.created_at DESC';
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            programs: result.rows
        });
    } catch (error) {
        next(error);
    }
};


// QUOTA CONTROLLERS


exports.createQuota = async (req, res, next) => {
    const { program_id, quota_type, allocated_seats, is_supernumerary } = req.body;
    
    try {
        const result = await pool.query(
            `INSERT INTO quotas (program_id, quota_type, allocated_seats, is_supernumerary)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [program_id, quota_type, allocated_seats, is_supernumerary || false]
        );
        
        res.status(201).json({
            success: true,
            message: 'Quota created successfully',
            quota: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.getQuotas = async (req, res, next) => {
    const { program_id } = req.query;
    
    try {
        let query = `
            SELECT q.*, p.name as program_name, p.total_intake,
                   COALESCE(qsu.seats_filled, 0) as seats_filled,
                   q.allocated_seats - COALESCE(qsu.seats_filled, 0) as remaining_seats
            FROM quotas q
            JOIN programs p ON q.program_id = p.id
            LEFT JOIN quota_seat_usage qsu ON q.id = qsu.quota_id
        `;
        const params = [];
        
        if (program_id) {
            query += ' WHERE q.program_id = $1';
            params.push(program_id);
        }
        
        query += ' ORDER BY q.quota_type';
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            quotas: result.rows
        });
    } catch (error) {
        next(error);
    }
};

exports.updateQuota = async (req, res, next) => {
    const { quota_id } = req.params;
    const { allocated_seats } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE quotas 
             SET allocated_seats = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [allocated_seats, quota_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Quota not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Quota updated successfully',
            quota: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};