const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);

    // Custom business logic errors
    if (err.message === 'QUOTA_FULL') {
        return res.status(400).json({ 
            success: false,
            error: 'Quota full - no seats available in selected quota',
            code: 'QUOTA_FULL'
        });
    }

    if (err.message.includes('Quota full')) {
        return res.status(400).json({ 
            success: false,
            error: err.message,
            code: 'QUOTA_FULL'
        });
    }

    // PostgreSQL error codes
    if (err.code) {
        switch (err.code) {
            case '23505': // Unique violation
                return res.status(400).json({ 
                    success: false,
                    error: 'Duplicate entry - this record already exists',
                    code: 'DUPLICATE_ENTRY',
                    detail: err.detail
                });

            case '23503': // Foreign key violation
                return res.status(400).json({ 
                    success: false,
                    error: 'Invalid reference - related record not found',
                    code: 'FOREIGN_KEY_VIOLATION',
                    detail: err.detail
                });

            case '23514': // Check constraint violation
                return res.status(400).json({ 
                    success: false,
                    error: 'Invalid data - constraint violation',
                    code: 'CONSTRAINT_VIOLATION',
                    detail: err.detail
                });

            case '22P02': // Invalid text representation
                return res.status(400).json({ 
                    success: false,
                    error: 'Invalid data format',
                    code: 'INVALID_FORMAT'
                });

            default:
                console.error('Unhandled PostgreSQL error code:', err.code);
        }
    }

    // Fallback for unexpected errors
    res.status(500).json({ 
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message,
        code: 'INTERNAL_ERROR'
    });
};

module.exports = errorHandler;
