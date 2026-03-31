const pool = require('../config/database');


 // Allocate seat to applicant
 // CRITICAL: Uses database transaction to prevent race conditions
 
exports.allocateSeat = async (req, res, next) => {
    const { applicant_id, program_id, quota_id } = req.body;
    
    // Validation
    if (!applicant_id || !program_id || !quota_id) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: applicant_id, program_id, quota_id'
        });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Check if applicant already has admission
        const existingAdmission = await client.query(
            'SELECT id, admission_number FROM admissions WHERE applicant_id = $1',
            [applicant_id]
        );
        
        if (existingAdmission.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                error: 'Applicant already has an admission',
                code: 'DUPLICATE_ADMISSION',
                existing_admission_number: existingAdmission.rows[0].admission_number
            });
        }
        
        // Insert admission record
        // Trigger will validate quota availability and increment counter atomically
        const result = await client.query(
            `INSERT INTO admissions (applicant_id, program_id, quota_id, admission_number)
             VALUES ($1, $2, $3, 
                 generate_admission_number(
                     (SELECT i.code FROM programs p 
                      JOIN departments d ON p.department_id = d.id 
                      JOIN campuses c ON d.campus_id = c.id 
                      JOIN institutions i ON c.institution_id = i.id 
                      WHERE p.id = $2),
                     (SELECT academic_year FROM programs WHERE id = $2),
                     (SELECT course_type FROM programs WHERE id = $2),
                     (SELECT code FROM programs WHERE id = $2),
                     (SELECT quota_type FROM quotas WHERE id = $3)
                 )
             )
             RETURNING *`,
            [applicant_id, program_id, quota_id]
        );
        
        await client.query('COMMIT');
        
        res.status(201).json({ 
            success: true, 
            message: 'Seat allocated successfully',
            admission: result.rows[0]
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        
        // Pass quota full errors to error handler
        if (error.message.includes('Quota full')) {
            error.message = 'QUOTA_FULL';
        }
        
        next(error);
    } finally {
        client.release();
    }
};


 // Get available seats for a quota
 
exports.getQuotaAvailability = async (req, res, next) => {
    const { quota_id } = req.params;
    
    try {
        const result = await pool.query(
            `SELECT 
                q.id,
                q.quota_type,
                q.allocated_seats,
                COALESCE(qsu.seats_filled, 0) as seats_filled,
                q.allocated_seats - COALESCE(qsu.seats_filled, 0) as remaining_seats,
                p.name as program_name
             FROM quotas q
             LEFT JOIN quota_seat_usage qsu ON q.id = qsu.quota_id
             JOIN programs p ON q.program_id = p.id
             WHERE q.id = $1`,
            [quota_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Quota not found'
            });
        }
        
        res.json({
            success: true,
            quota: result.rows[0]
        });
        
    } catch (error) {
        next(error);
    }
};


 // Confirm admission (after fee payment)
 
exports.confirmAdmission = async (req, res, next) => {
    const { admission_id } = req.params;
    const { fee_status, document_status } = req.body;
    
    try {
        // Check if admission exists
        const admission = await pool.query(
            'SELECT * FROM admissions WHERE id = $1',
            [admission_id]
        );
        
        if (admission.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Admission not found'
            });
        }
        
        // Update status to "Confirmed" only if fee is paid
        let status = admission.rows[0].status;
        if (fee_status === 'Paid') {
            status = 'Confirmed';
        }
        
        const result = await pool.query(
            `UPDATE admissions 
             SET fee_status = COALESCE($1, fee_status),
                 document_status = COALESCE($2, document_status),
                 status = $3,
                 updated_at = NOW()
             WHERE id = $4
             RETURNING *`,
            [fee_status, document_status, status, admission_id]
        );
        
        res.json({
            success: true,
            message: 'Admission updated successfully',
            admission: result.rows[0]
        });
        
    } catch (error) {
        next(error);
    }
};


 // Get all admissions with filters
 
exports.getAdmissions = async (req, res, next) => {
    const { program_id, status, quota_type, limit = 50, offset = 0 } = req.query;
    
    try {
        let query = 'SELECT * FROM admission_details WHERE 1=1';
        const params = [];
        let paramCount = 1;
        
        if (program_id) {
            query += ` AND program_id = $${paramCount}`;
            params.push(program_id);
            paramCount++;
        }
        
        if (status) {
            query += ` AND status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }
        
        if (quota_type) {
            query += ` AND quota_type = $${paramCount}`;
            params.push(quota_type);
            paramCount++;
        }
        
        query += ` ORDER BY admission_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            count: result.rows.length,
            admissions: result.rows
        });
        
    } catch (error) {
        next(error);
    }
};


  // Get dashboard statistics

exports.getDashboardStats = async (req, res, next) => {
    try {
        const stats = await pool.query('SELECT * FROM dashboard_stats');
        
        // Calculate overall summary
        const summary = await pool.query(`
            SELECT 
                SUM(allocated_seats) as total_seats,
                SUM(COALESCE(seats_filled, 0)) as total_filled,
                SUM(allocated_seats - COALESCE(seats_filled, 0)) as total_remaining
            FROM quotas q
            LEFT JOIN quota_seat_usage qsu ON q.id = qsu.quota_id
            WHERE q.is_supernumerary = FALSE
        `);
        
        // Get pending documents count
        const pendingDocs = await pool.query(`
            SELECT COUNT(*) as count
            FROM admissions
            WHERE document_status IN ('Pending', 'Submitted')
        `);
        
        // Get pending fees count
        const pendingFees = await pool.query(`
            SELECT COUNT(*) as count
            FROM admissions
            WHERE fee_status = 'Pending'
        `);
        
        res.json({
            success: true,
            summary: summary.rows[0],
            pending_documents: parseInt(pendingDocs.rows[0].count),
            pending_fees: parseInt(pendingFees.rows[0].count),
            quota_wise_stats: stats.rows
        });
        
    } catch (error) {
        next(error);
    }
};


//   Cancel admission (releases seat)

exports.cancelAdmission = async (req, res, next) => {
    const { admission_id } = req.params;
    
    try {
        const result = await pool.query(
            `UPDATE admissions 
             SET status = 'Cancelled',
                 updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [admission_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Admission not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Admission cancelled - seat released',
            admission: result.rows[0]
        });
        
    } catch (error) {
        next(error);
    }
};