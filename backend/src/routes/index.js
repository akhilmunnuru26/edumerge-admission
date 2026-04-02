const express = require('express');
const router = express.Router();

const masterController = require('../controllers/masterController');
const applicantController = require('../controllers/applicantController');
const admissionController = require('../controllers/admissionController');


// ============================================
// MASTER DATA ROUTES
// ============================================

// Institutions
router.post('/institutions', masterController.createInstitution);
router.get('/institutions', masterController.getInstitutions);

// Campuses
router.post('/campuses', masterController.createCampus);
router.get('/campuses', masterController.getCampuses);

// Departments
router.post('/departments', masterController.createDepartment);
router.get('/departments', masterController.getDepartments);

// Programs
router.post('/programs', masterController.createProgram);
router.get('/programs', masterController.getPrograms);

// Quotas
router.post('/quotas', masterController.createQuota);
router.get('/quotas', masterController.getQuotas);
router.put('/quotas/:quota_id', masterController.updateQuota);



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
