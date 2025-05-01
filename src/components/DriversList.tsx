import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { logActivity } from '../lib/auth';

type Driver = {
  id: number;
  company_id: number;
  first_name: string;
  last_name: string;
  phone?: string;
};

interface DriversListProps {
  companyId: number;
}

export function DriversList({ companyId }: DriversListProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDrivers();
  }, [companyId]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('company_id', companyId)
        .order('last_name');

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Błąd podczas pobierania kierowców:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać listy kierowców",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDriver = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tego kierowcę?')) return;
    
    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setDrivers(drivers.filter(d => d.id !== id));
      
      // Log activity
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        await logActivity(user.id, 'delete', 'drivers', id, `Deleted driver with ID: ${id}`);
      }
      
      toast({
        title: "Sukces",
        description: "Kierowca został usunięty pomyślnie",
        variant: "success",
      });
    } catch (error) {
      console.error('Błąd podczas usuwania kierowcy:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć kierowcy",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;
    
    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          first_name: editingDriver.first_name,
          last_name: editingDriver.last_name,
          phone: editingDriver.phone
        })
        .eq('id', editingDriver.id);

      if (error) throw error;
      
      setDrivers(drivers.map(d => 
        d.id === editingDriver.id ? editingDriver : d
      ));
      
      // Log activity
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        await logActivity(user.id, 'update', 'drivers', editingDriver.id, `Updated driver: ${editingDriver.first_name} ${editingDriver.last_name}`);
      }
      
      toast({
        title: "Sukces",
        description: "Dane kierowcy zostały zaktualizowane",
        variant: "success",
      });
      
      setEditingDriver(null);
    } catch (error) {
      console.error('Błąd podczas aktualizacji kierowcy:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować danych kierowcy",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <p className="text-center py-2 text-sm text-muted-foreground">Ładowanie kierowców...</p>;
  }

  if (drivers.length === 0) {
    return <p className="text-center py-2 text-sm text-muted-foreground">Brak kierowców dla tej firmy</p>;
  }

  return (
    <div className="space-y-2">
      {drivers.map(driver => (
        <div 
          key={driver.id} 
          className="p-3 border rounded-md flex justify-between items-center"
        >
          <div>
            <p className="font-medium">{driver.first_name} {driver.last_name}</p>
            {driver.phone && <p className="text-sm text-muted-foreground">Tel: {driver.phone}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setEditingDriver({...driver})}
              title="Edytuj kierowcę"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleDeleteDriver(driver.id)}
              title="Usuń kierowcę"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      
      {editingDriver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edytuj kierowcę</h3>
            <form onSubmit={handleUpdateDriver} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="edit_first_name" className="text-sm font-medium">Imię</label>
                <Input
                  id="edit_first_name"
                  value={editingDriver.first_name}
                  onChange={e => setEditingDriver({...editingDriver, first_name: e.target.value})}
                  placeholder="Imię kierowcy"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit_last_name" className="text-sm font-medium">Nazwisko</label>
                <Input
                  id="edit_last_name"
                  value={editingDriver.last_name}
                  onChange={e => setEditingDriver({...editingDriver, last_name: e.target.value})}
                  placeholder="Nazwisko kierowcy"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit_phone" className="text-sm font-medium">Telefon</label>
                <Input
                  id="edit_phone"
                  value={editingDriver.phone || ''}
                  onChange={e => setEditingDriver({...editingDriver, phone: e.target.value})}
                  placeholder="Numer telefonu"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingDriver(null)}>
                  Anuluj
                </Button>
                <Button type="submit">
                  Zapisz zmiany
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
