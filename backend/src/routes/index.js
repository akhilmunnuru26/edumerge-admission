const express = require('express');
const router = express.Router();

const masterController = require('../controllers/masterController');
const applicantController = require('../controllers/applicantController');
const admissionController = require('../controllers/admissionController');


// ============================================
// APPLICANT ROUTES
// ============================================

router.post('/applicants', applicantController.createApplicant);
router.get('/applicants', applicantController.getApplicants);
router.get('/applicants/:applicant_id', applicantController.getApplicantById);
router.put('/applicants/:applicant_id', applicantController.updateApplicant);
router.delete('/applicants/:applicant_id', applicantController.deleteApplicant);

// ============================================
// ADMISSION ROUTES
// ============================================

router.post('/admissions/allocate', admissionController.allocateSeat);
router.get('/admissions', admissionController.getAdmissions);
router.put('/admissions/:admission_id/confirm', admissionController.confirmAdmission);
router.delete('/admissions/:admission_id', admissionController.cancelAdmission);
router.get('/quotas/:quota_id/availability', admissionController.getQuotaAvailability);

// ============================================
// DASHBOARD ROUTES
// ============================================

router.get('/dashboard/stats', admissionController.getDashboardStats);

module.exports = router;
