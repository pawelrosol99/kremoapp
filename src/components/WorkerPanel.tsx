import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export function WorkerPanel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [workTime, setWorkTime] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => {
    fetchWorkTime();
  }, []);

  const fetchWorkTime = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const { data, error } = await supabase
        .from('work_time')
        .select('*')
        .eq('employee_id', user.employee_id)
        .order('work_date', { ascending: false });

      if (error) throw error;
      setWorkTime(data || []);
      calculateTotalHours(data);
    } catch (error) {
      console.error('Błąd podczas pobierania czasu pracy:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się pobrać danych czasu pracy',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalHours = (data) => {
    const total = data.reduce((sum, entry) => sum + (entry.hours_worked || 0), 0);
    setTotalHours(total);
  };

  const handleStartWork = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const { data, error } = await supabase
        .from('work_time')
        .insert([{ employee_id: user.employee_id, work_date: new Date().toISOString().split('T')[0], start_time: new Date().toISOString().split('T')[1].slice(0, 8) }])
        .select();

      if (error) throw error;
      setCurrentSession(data[0]);
      toast({
        title: 'Rozpoczęto pracę',
        description: 'Czas pracy został rozpoczęty',
        variant: 'success',
      });
    } catch (error) {
      console.error('Błąd podczas rozpoczynania pracy:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się rozpocząć pracy',
        variant: 'destructive',
      });
    }
  };

  const handleStopWork = async () => {
    try {
      if (!currentSession) return;

      const endTime = new Date().toISOString().split('T')[1].slice(0, 8);
      const startTime = currentSession.start_time;
      const hoursWorked = calculateHoursWorked(startTime, endTime);

      const { error } = await supabase
        .from('work_time')
        .update({ end_time: endTime, hours_worked: hoursWorked })
        .eq('id', currentSession.id);

      if (error) throw error;
      setCurrentSession(null);
      fetchWorkTime();
      toast({
        title: 'Zakończono pracę',
        description: 'Czas pracy został zakończony',
        variant: 'success',
      });
    } catch (error) {
      console.error('Błąd podczas kończenia pracy:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się zakończyć pracy',
        variant: 'destructive',
      });
    }
  };

  const calculateHoursWorked = (start, end) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let hours = endH - startH;
    let minutes = endM - startM;

    if (minutes < 0) {
      hours -= 1;
      minutes += 60;
    }

    if (minutes >= 31) {
      hours += 1;
    }

    return hours;
  };

  if (loading) {
    return <p>Ładowanie...</p>;
  }

  return (
    <div>
      <h1>Panel Pracownika</h1>
      <div>
        <Button onClick={handleStartWork} disabled={!!currentSession}>Start</Button>
        <Button onClick={handleStopWork} disabled={!currentSession}>Stop</Button>
        {currentSession && <p>Praca rozpoczęta o: {currentSession.start_time}</p>}
      </div>
      <div>
        <h2>Historia pracy</h2>
        <ul>
          {workTime.map((entry) => (
            <li key={entry.id}>
              {entry.work_date}: {entry.start_time} - {entry.end_time || '...'} ({entry.hours_worked || 0} godz.)
            </li>
          ))}
        </ul>
        <p>Łączna liczba godzin: {totalHours}</p>
      </div>
    </div>
  );
}
