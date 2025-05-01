import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createWorkTime, updateWorkTime } from '../lib/database';
import { logActivity } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Clock, LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useToast } from '../hooks/use-toast';

export function WorkerPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [workTimeStatus, setWorkTimeStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');
  const [currentWorkTime, setCurrentWorkTime] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserData(user);
        if (user.employee_id) {
          fetchEmployeeData(user.employee_id);
          checkWorkTimeStatus(user.employee_id);
        }
      } catch (e) {
        console.error('Błąd podczas przetwarzania danych użytkownika:', e);
        handleLogout();
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  const fetchEmployeeData = async (employeeId: number) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*, contractors(*)')
        .eq('id', employeeId)
        .single();

      if (error) throw error;
      setEmployeeData(data);
    } catch (error) {
      console.error('Błąd podczas pobierania danych pracownika:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkWorkTimeStatus = async (employeeId: number) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      const { data, error } = await supabase
        .from('work_time')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('work_date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 oznacza brak wyników
        throw error;
      }

      if (data) {
        setCurrentWorkTime(data);
        if (data.start_time && !data.end_time) {
          setWorkTimeStatus('in_progress');
        } else if (data.start_time && data.end_time) {
          setWorkTimeStatus('completed');
        } else {
          setWorkTimeStatus('not_started');
        }
      } else {
        setWorkTimeStatus('not_started');
      }
    } catch (error) {
      console.error('Błąd podczas sprawdzania statusu czasu pracy:', error);
      setWorkTimeStatus('not_started');
    }
  };

  const startWorkTime = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toLocaleTimeString('en-GB'); // Format: HH:MM:SS

      const { data, error } = await supabase
        .from('work_time')
        .insert([
          {
            employee_id: userData.employee_id,
            work_date: today,
            start_time: now
          }
        ])
        .select();

      if (error) throw error;
      
      setCurrentWorkTime(data[0]);
      setWorkTimeStatus('in_progress');
    } catch (error) {
      console.error('Błąd podczas rozpoczynania czasu pracy:', error);
    }
  };

  const endWorkTime = async () => {
    if (!currentWorkTime) return;
    
    try {
      const now = new Date().toLocaleTimeString('en-GB');
      
      // Oblicz czas pracy
      const startTimeParts = currentWorkTime.start_time.split(':');
      const startDate = new Date();
      startDate.setHours(parseInt(startTimeParts[0], 10), parseInt(startTimeParts[1], 10), parseInt(startTimeParts[2] || '0', 10));
      
      const endTimeParts = now.split(':');
      const endDate = new Date();
      endDate.setHours(parseInt(endTimeParts[0], 10), parseInt(endTimeParts[1], 10), parseInt(endTimeParts[2] || '0', 10));
      
      // Oblicz różnicę w godzinach
      const diffMs = endDate.getTime() - startDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      const { error } = await supabase
        .from('work_time')
        .update({
          end_time: now,
          hours_worked: parseFloat(diffHours.toFixed(2))
        })
        .eq('id', currentWorkTime.id);

      if (error) throw error;
      
      checkWorkTimeStatus(userData.employee_id);
    } catch (error) {
      console.error('Błąd podczas kończenia czasu pracy:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast({
      title: "Wylogowano",
      description: "Pomyślnie wylogowano z systemu",
      variant: "default",
    });
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Panel Pracownika</h1>
            {employeeData && (
              <p className="text-sm text-muted-foreground">
                {employeeData.first_name} {employeeData.last_name} | {employeeData.contractors?.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Wyloguj
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Czas pracy
              </CardTitle>
              <CardDescription>Zarządzaj swoim czasem pracy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-6 space-y-4">
                {workTimeStatus === 'not_started' && (
                  <>
                    <p className="text-lg">Nie rozpocząłeś jeszcze pracy dzisiaj</p>
                    <Button onClick={startWorkTime}>Rozpocznij pracę</Button>
                  </>
                )}
                
                {workTimeStatus === 'in_progress' && (
                  <>
                    <p className="text-lg">Praca w toku od {currentWorkTime?.start_time}</p>
                    <Button onClick={endWorkTime}>Zakończ pracę</Button>
                  </>
                )}
                
                {workTimeStatus === 'completed' && (
                  <>
                    <p className="text-lg">Dzisiejsza praca zakończona</p>
                    <p>Rozpoczęcie: {currentWorkTime?.start_time}</p>
                    <p>Zakończenie: {currentWorkTime?.end_time}</p>
                    <p>Łączny czas: {currentWorkTime?.hours_worked} godz.</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
