import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { logActivity } from '../lib/auth';

type Employee = {
  id: number;
  contractor_id: number;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  login: string;
  role: 'admin' | 'worker';
};

interface EmployeesListProps {
  contractorId: number;
}

export function EmployeesList({ contractorId }: EmployeesListProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
  }, [contractorId]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('contractor_id', contractorId)
        .order('last_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Błąd podczas pobierania pracowników:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać listy pracowników",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tego pracownika?')) return;
    
    try {
      // Najpierw usuń powiązany rekord z tabeli users
      const { data: userData, error: userFetchError } = await supabase
        .from('users')
        .select('id')
        .eq('employee_id', id)
        .single();

      if (userFetchError && userFetchError.code !== 'PGRST116') {
        // PGRST116 to błąd "brak wyników", co może być OK w niektórych przypadkach
        throw userFetchError;
      }

      if (userData) {
        const { error: userDeleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', userData.id);

        if (userDeleteError) throw userDeleteError;
      }

      // Teraz usuń pracownika
      const { error: employeeDeleteError } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (employeeDeleteError) throw employeeDeleteError;
      
      setEmployees(employees.filter(e => e.id !== id));
      
      // Log activity
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        await logActivity(user.id, 'delete', 'employees', id, `Deleted employee with ID: ${id}`);
      }
      
      toast({
        title: "Sukces",
        description: "Pracownik został usunięty pomyślnie",
        variant: "success",
      });
    } catch (error) {
      console.error('Błąd podczas usuwania pracownika:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć pracownika",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <p className="text-center py-2 text-sm text-muted-foreground">Ładowanie pracowników...</p>;
  }

  if (employees.length === 0) {
    return <p className="text-center py-2 text-sm text-muted-foreground">Brak pracowników dla tego kontrahenta</p>;
  }

  return (
    <div className="space-y-2">
      {employees.map(employee => (
        <div 
          key={employee.id} 
          className="p-3 border rounded-md flex justify-between items-center"
        >
          <div>
            <p className="font-medium">{employee.first_name} {employee.last_name}</p>
            <p className="text-sm text-muted-foreground">
              Login: {employee.login} | Rola: {employee.role === 'admin' ? 'Administrator' : 'Pracownik'}
            </p>
            {employee.email && <p className="text-sm text-muted-foreground">Email: {employee.email}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleDeleteEmployee(employee.id)}
              title="Usuń pracownika"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
