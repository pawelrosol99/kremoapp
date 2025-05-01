import { supabase } from './supabase';
import { 
  Contractor, 
  Employee, 
  Company, 
  Driver, 
  Oven, 
  Cremation, 
  DeceasedData, 
  CommissionerData,
  WorkTime
} from '../types';

// Contractor functions
export async function getContractors() {
  const { data, error } = await supabase
    .from('contractors')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as Contractor[];
}

export async function getContractorById(id: number) {
  const { data, error } = await supabase
    .from('contractors')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Contractor;
}

export async function createContractor(contractor: Partial<Contractor>) {
  const { data, error } = await supabase
    .from('contractors')
    .insert([contractor])
    .select();

  if (error) throw error;
  return data[0] as Contractor;
}

export async function updateContractor(id: number, contractor: Partial<Contractor>) {
  const { data, error } = await supabase
    .from('contractors')
    .update(contractor)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0] as Contractor;
}

export async function deleteContractor(id: number) {
  const { error } = await supabase
    .from('contractors')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Employee functions
export async function getEmployeesByContractorId(contractorId: number) {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('contractor_id', contractorId)
    .order('last_name');

  if (error) throw error;
  return data as Employee[];
}

export async function createEmployee(employee: Partial<Employee>) {
  const { data, error } = await supabase
    .from('employees')
    .insert([employee])
    .select();

  if (error) throw error;
  return data[0] as Employee;
}

// Work time functions
export async function getWorkTimeByEmployeeId(employeeId: number) {
  const { data, error } = await supabase
    .from('work_time')
    .select('*')
    .eq('employee_id', employeeId)
    .order('work_date', { ascending: false });

  if (error) throw error;
  return data as WorkTime[];
}

export async function createWorkTime(workTime: Partial<WorkTime>) {
  const { data, error } = await supabase
    .from('work_time')
    .insert([workTime])
    .select();

  if (error) throw error;
  return data[0] as WorkTime;
}

export async function updateWorkTime(id: number, workTime: Partial<WorkTime>) {
  const { data, error } = await supabase
    .from('work_time')
    .update(workTime)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0] as WorkTime;
}

// Company functions
export async function getCompaniesByContractorId(contractorId: number) {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('contractor_id', contractorId)
    .order('name');

  if (error) throw error;
  return data as Company[];
}

// Cremation functions
export async function getCremationsByContractorId(contractorId: number) {
  const { data, error } = await supabase
    .from('cremations')
    .select(`
      *,
      companies(*),
      deceased_data(*),
      commissioner_data(*)
    `)
    .eq('contractor_id', contractorId)
    .order('cremation_date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createCremation(cremation: Partial<Cremation>, deceasedData?: Partial<DeceasedData>, commissionerData?: Partial<CommissionerData>) {
  // Start a transaction
  const { data: cremationData, error: cremationError } = await supabase
    .from('cremations')
    .insert([cremation])
    .select();

  if (cremationError) throw cremationError;
  
  const cremationId = cremationData[0].id;
  
  // Add deceased data if provided
  if (deceasedData) {
    const { error: deceasedError } = await supabase
      .from('deceased_data')
      .insert([{ ...deceasedData, cremation_id: cremationId }]);
      
    if (deceasedError) throw deceasedError;
  }
  
  // Add commissioner data if provided
  if (commissionerData) {
    const { error: commissionerError } = await supabase
      .from('commissioner_data')
      .insert([{ ...commissionerData, cremation_id: cremationId }]);
      
    if (commissionerError) throw commissionerError;
  }
  
  return cremationData[0] as Cremation;
}
