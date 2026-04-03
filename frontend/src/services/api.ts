import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    // console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// ============================================
// MASTER DATA API
// ============================================

export const masterAPI = {
  // Institutions
  getInstitutions: () => api.get('/institutions'),
  createInstitution: (data: any) => api.post('/institutions', data),
  
  // Campuses
  getCampuses: (institutionId?: number) => 
    api.get('/campuses', { params: { institution_id: institutionId } }),
  createCampus: (data: any) => api.post('/campuses', data),
  
  // Departments
  getDepartments: (campusId?: number) => 
    api.get('/departments', { params: { campus_id: campusId } }),
  createDepartment: (data: any) => api.post('/departments', data),
  
  // Programs
  getPrograms: (filters?: any) => 
    api.get('/programs', { params: filters }),
  createProgram: (data: any) => api.post('/programs', data),
  
  // Quotas
  getQuotas: (programId?: number) => 
    api.get('/quotas', { params: { program_id: programId } }),
  createQuota: (data: any) => api.post('/quotas', data),
};

// ============================================
// APPLICANT API
// ============================================

export const applicantAPI = {
  getApplicants: (filters?: any) => 
    api.get('/applicants', { params: filters }),
  getApplicantById: (id: number) => 
    api.get(`/applicants/${id}`),
  createApplicant: (data: any) => 
    api.post('/applicants', data),
  updateApplicant: (id: number, data: any) => 
    api.put(`/applicants/${id}`, data),
  deleteApplicant: (id: number) => 
    api.delete(`/applicants/${id}`),
};

// ============================================
// ADMISSION API
// ============================================

export const admissionAPI = {
  getAdmissions: (filters?: any) => 
    api.get('/admissions', { params: filters }),
  allocateSeat: (data: { applicant_id: number; program_id: number; quota_id: number }) => 
    api.post('/admissions/allocate', data),
  confirmAdmission: (id: number, data: any) => 
    api.put(`/admissions/${id}/confirm`, data),
  cancelAdmission: (id: number) => 
    api.delete(`/admissions/${id}`),
  getQuotaAvailability: (quotaId: number) => 
    api.get(`/quotas/${quotaId}/availability`),
};

// ============================================
// DASHBOARD API
// ============================================

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;