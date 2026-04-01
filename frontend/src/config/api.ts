export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Master Data
  institutions: '/institutions',
  campuses: '/campuses',
  departments: '/departments',
  programs: '/programs',
  quotas: '/quotas',
  
  // Applicants
  applicants: '/applicants',
  
  // Admissions
  admissions: '/admissions',
  allocateSeat: '/admissions/allocate',
  
  // Dashboard
  dashboardStats: '/dashboard/stats',
};