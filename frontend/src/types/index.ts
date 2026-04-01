export interface Institution {
  id: number;
  code: string;
  name: string;
  address?: string;
  created_at: string;
}

export interface Campus {
  id: number;
  institution_id: number;
  name: string;
  location?: string;
  institution_name?: string;
  created_at: string;
}

export interface Department {
  id: number;
  campus_id: number;
  name: string;
  code: string;
  campus_name?: string;
  created_at: string;
}

export interface Program {
  id: number;
  department_id: number;
  name: string;
  code: string;
  course_type: 'UG' | 'PG';
  entry_type: 'Regular' | 'Lateral';
  admission_mode: 'Government' | 'Management';
  academic_year: string;
  total_intake: number;
  department_name?: string;
  created_at: string;
}

export interface Quota {
  id: number;
  program_id: number;
  quota_type: 'KCET' | 'COMEDK' | 'Management';
  allocated_seats: number;
  seats_filled: number;
  remaining_seats: number;
  is_supernumerary: boolean;
  program_name?: string;
  total_intake?: number;
  created_at: string;
}

export interface Applicant {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  category: 'GM' | 'SC' | 'ST' | 'OBC' | 'EWS' | 'Others';
  allotment_number?: string;
  qualifying_exam?: string;
  marks_obtained?: number;
  entry_type: 'Regular' | 'Lateral';
  quota_type: 'KCET' | 'COMEDK' | 'Management';
  admission_mode: 'Government' | 'Management';
  address?: string;
  parent_name?: string;
  parent_phone?: string;
  created_at: string;
}

export interface Admission {
  id: number;
  applicant_id: number;
  program_id: number;
  quota_id: number;
  admission_number: string;
  admission_date: string;
  fee_status: 'Pending' | 'Paid';
  document_status: 'Pending' | 'Submitted' | 'Verified';
  status: 'Provisional' | 'Confirmed' | 'Cancelled';
  created_at: string;
}

export interface DashboardStats {
  summary: {
    total_seats: string;
    total_filled: string;
    total_remaining: string;
  };
  pending_documents: number;
  pending_fees: number;
  quota_wise_stats: {
    institution_name: string;
    program_name: string;
    academic_year: string;
    total_intake: number;
    quota_type: string;
    allocated_seats: number;
    seats_filled: number;
    remaining_seats: number;
    fill_percentage: string;
  }[];
}

export interface ApplicantFormData {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  category: 'GM' | 'SC' | 'ST' | 'OBC' | 'EWS' | 'Others';
  allotment_number?: string;
  qualifying_exam?: string;
  marks_obtained?: number;
  entry_type: 'Regular' | 'Lateral';
  quota_type: 'KCET' | 'COMEDK' | 'Management';
  admission_mode: 'Government' | 'Management';
  address?: string;
  parent_name?: string;
  parent_phone?: string;
}