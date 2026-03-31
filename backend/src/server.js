const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet());

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// ============================================
// ROUTES
// ============================================

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.use('/api', routes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.path
    });
});

app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const startServer = async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection verified');
        
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════╗
║   EDUMERGE ADMISSION MANAGEMENT SYSTEM     ║
╠════════════════════════════════════════════╣
║  🚀 Server running on port ${PORT}          ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}               ║
║  💾 Database: ${process.env.DB_NAME || 'edumerge_db'}               ║
║  📡 Health: http://localhost:${PORT}/health    ║
╚════════════════════════════════════════════╝
            `);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    pool.end(() => {
        console.log('Database pool closed');
        process.exit(0);
    });
});

startServer();

module.exports = app;