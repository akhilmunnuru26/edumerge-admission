const pool = require('../config/database');

exports.createApplicant = async (req, res, next) => {
    const {
        full_name, email, phone, date_of_birth, gender, category,
        allotment_number, qualifying_exam, marks_obtained,
        entry_type, quota_type, admission_mode, address,
        parent_name, parent_phone
    } = req.body;
    
    try {
        const result = await pool.query(
            `INSERT INTO applicants (
                full_name, email, phone, date_of_birth, gender, category,
                allotment_number, qualifying_exam, marks_obtained,
                entry_type, quota_type, admission_mode, address,
                parent_name, parent_phone
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *`,
            [
                full_name, email, phone, date_of_birth, gender, category,
                allotment_number, qualifying_exam, marks_obtained,
                entry_type, quota_type, admission_mode, address,
                parent_name, parent_phone
            ]
        );
        
        res.status(201).json({
            success: true,
            message: 'Applicant created successfully',
            applicant: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.getApplicants = async (req, res, next) => {
    const { quota_type, category, limit = 50, offset = 0, search } = req.query;
    
    try {
        let query = 'SELECT * FROM applicants WHERE 1=1';
        const params = [];
        let paramCount = 1;
        
        if (quota_type) {
            query += ` AND quota_type = $${paramCount}`;
            params.push(quota_type);
            paramCount++;
        }
        
        if (category) {
            query += ` AND category = $${paramCount}`;
            params.push(category);
            paramCount++;
        }
        
        if (search) {
            query += ` AND (full_name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR phone LIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }
        
        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            count: result.rows.length,
            applicants: result.rows
        });
    } catch (error) {
        next(error);
    }
};

exports.getApplicantById = async (req, res, next) => {
    const { applicant_id } = req.params;
    
    try {
        const result = await pool.query(
            'SELECT * FROM applicants WHERE id = $1',
            [applicant_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Applicant not found'
            });
        }
        
        const admission = await pool.query(
            `SELECT a.*, p.name as program_name, q.quota_type
             FROM admissions a
             JOIN programs p ON a.program_id = p.id
             JOIN quotas q ON a.quota_id = q.id
             WHERE a.applicant_id = $1`,
            [applicant_id]
        );
        
        res.json({
            success: true,
            applicant: result.rows[0],
            admission: admission.rows[0] || null
        });
    } catch (error) {
        next(error);
    }
};

exports.updateApplicant = async (req, res, next) => {
    const { applicant_id } = req.params;
    const updates = req.body;
    
    try {
        const fields = Object.keys(updates);
        const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
        const values = fields.map(field => updates[field]);
        
        const result = await pool.query(
            `UPDATE applicants 
             SET ${setClause}, updated_at = NOW()
             WHERE id = $${fields.length + 1}
             RETURNING *`,
            [...values, applicant_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Applicant not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Applicant updated successfully',
            applicant: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteApplicant = async (req, res, next) => {
    const { applicant_id } = req.params;
    
    try {
        const admission = await pool.query(
            'SELECT id FROM admissions WHERE applicant_id = $1',
            [applicant_id]
        );
        
        if (admission.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete applicant - admission exists'
            });
        }
        
        const result = await pool.query(
            'DELETE FROM applicants WHERE id = $1 RETURNING *',
            [applicant_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Applicant not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Applicant deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

