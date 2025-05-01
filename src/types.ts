export interface User {
  id: number;
  login: string;
  password: string;
  role: 'super_admin' | 'admin' | 'worker';
  employee_id?: number;
  created_at: string;
}

export interface Contractor {
  id: number;
  name: string;
  street?: string;
  city?: string;
  phone?: string;
  email?: string;
  nip?: string;
  created_at: string;
}

export interface Employee {
  id: number;
  contractor_id: number;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  login: string;
  password: string;
  role: 'admin' | 'worker';
  created_at: string;
}

export interface Company {
  id: number;
  contractor_id: number;
  name: string;
  short_name?: string;
  street?: string;
  city?: string;
  phone?: string;
  email?: string;
  nip?: string;
  created_at: string;
}

export interface Driver {
  id: number;
  company_id: number;
  first_name: string;
  last_name: string;
  phone?: string;
  created_at: string;
}

export interface Oven {
  id: number;
  contractor_id: number;
  name: string;
  color: string;
  custom_color?: string;
  created_at: string;
}

export interface Cremation {
  id: number;
  contractor_id: number;
  company_id?: number;
  cremation_date: string;
  cremation_time: string;
  family_visit?: 'present' | 'not_present' | 'no_data';
  cremation_type?: 'normal' | 'exhumation';
  weight?: 'up_to_100kg' | 'plus_100kg' | 'max';
  password?: string;
  unique_number: string;
  created_by?: number;
  created_at: string;
}

export interface DeceasedData {
  id: number;
  cremation_id: number;
  full_name?: string;
  birth_place?: string;
  birth_date?: string;
  death_place?: string;
  death_date?: string;
  registry_office?: string;
  death_certificate_number?: string;
  created_at: string;
}

export interface CommissionerData {
  id: number;
  cremation_id: number;
  full_name?: string;
  residence?: string;
  phone?: string;
  email?: string;
  id_number?: string;
  id_series?: string;
  created_at: string;
}

export interface WorkTime {
  id: number;
  employee_id: number;
  work_date: string;
  start_time?: string;
  end_time?: string;
  hours_worked?: number;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  details?: string;
  created_at: string;
}

export interface CremationCertificate {
  id: number;
  contractor_id: number;
  image_url: string;
  template_data?: any;
  created_at: string;
}
