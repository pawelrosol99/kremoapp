import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getContractors, createContractor, updateContractor, deleteContractor, createEmployee } from '../lib/database';
import { logActivity } from '../lib/auth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { ChevronDown, ChevronUp, LogOut, Pencil, Trash2, UserPlus, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { useToast } from '../hooks/use-toast';

type Contractor = {
  id: number;
  name: string;
  street?: string;
  city?: string;
  phone?: string;
  email?: string;
  nip?: string;
  expanded?: boolean;
};

type Employee = {
  id: number;
  contractor_id: number;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  login: string;
  password: string;
  role: 'admin' | 'worker';
};

export function SuperAdminPanel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContractor, setNewContractor] = useState<Partial<Contractor>>({
    name: '',
    street: '',
    city: '',
    phone: '',
    email: '',
    nip: ''
  });
  const [activeTab, setActiveTab] = useState('contractors');
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    login: '',
    password: '',
    role: 'admin'
  });
  const [selectedContractorId, setSelectedContractorId] = useState<number | null>(null);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    fetchContractors();
  }, []);

  const fetchContractors = async () => {
    try {
      const { data, error } = await supabase
        .from('contractors')
        .select('*')
        .order('name');
        
      if (error) throw error;
      setContractors(data || []);
    } catch (error) {
      console.error('Błąd podczas pobierania kontrahentów:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać listy kontrahentów",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const toggleContractorExpand = (id: number) => {
    setContractors(contractors.map(c => 
      c.id === id ? { ...c, expanded: !c.expanded } : c
    ));
  };

  const handleAddContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newContractor.name) {
        toast({
          title: "Błąd walidacji",
          description: "Nazwa kontrahenta jest wymagana!",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('contractors')
        .insert([newContractor])
        .select();
        
      if (error) throw error;
      
      const contractor = data[0];
      setContractors([contractor, ...contractors]);
      setNewContractor({
        name: '',
        street: '',
        city: '',
        phone: '',
        email: '',
        nip: ''
      });
      
      // Log activity
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        await logActivity(user.id, 'create', 'contractors', contractor.id, `Created contractor: ${contractor.name}`);
      }
      
      toast({
        title: "Sukces",
        description: `Kontrahent "${contractor.name}" został dodany pomyślnie`,
        variant: "success",
      });
      
      fetchContractors();
    } catch (error) {
      console.error('Błąd podczas dodawania kontrahenta:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się dodać kontrahenta",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContractor = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tego kontrahenta?')) return;
    
    try {
      const { error } = await supabase
        .from('contractors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setContractors(contractors.filter(c => c.id !== id));
      
      // Log activity
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        await logActivity(user.id, 'delete', 'contractors', id, `Deleted contractor with ID: ${id}`);
      }
      
      toast({
        title: "Sukces",
        description: "Kontrahent został usunięty pomyślnie",
        variant: "success",
      });
    } catch (error) {
      console.error('Błąd podczas usuwania kontrahenta:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć kontrahenta",
        variant: "destructive",
      });
    }
  };

  const handleUpdateContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContractor) return;
    
    try {
      const { error } = await supabase
        .from('contractors')
        .update(editingContractor)
        .eq('id', editingContractor.id);

      if (error) throw error;
      
      setContractors(contractors.map(c => 
        c.id === editingContractor.id ? editingContractor : c
      ));
      
      // Log activity
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        await logActivity(user.id, 'update', 'contractors', editingContractor.id, `Updated contractor: ${editingContractor.name}`);
      }
      
      toast({
        title: "Sukces",
        description: `Kontrahent "${editingContractor.name}" został zaktualizowany`,
        variant: "success",
      });
      
      setEditingContractor(null);
    } catch (error) {
      console.error('Błąd podczas aktualizacji kontrahenta:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować kontrahenta",
        variant: "destructive",
      });
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractorId) {
      toast({
        title: "Błąd walidacji",
        description: "Wybierz kontrahenta!",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([{ ...newEmployee, contractor_id: selectedContractorId }])
        .select();

      if (error) throw error;
      
      // Dodaj również użytkownika do tabeli users
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          login: newEmployee.login,
          password: newEmployee.password,
          role: newEmployee.role,
          employee_id: data[0].id
        }]);

      if (userError) throw userError;
      
      // Log activity
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        await logActivity(
          user.id, 
          'create', 
          'employees', 
          data[0].id, 
          `Created employee: ${newEmployee.first_name} ${newEmployee.last_name} for contractor ID: ${selectedContractorId}`
        );
      }
      
      setNewEmployee({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        login: '',
        password: '',
        role: 'admin'
      });
      
      toast({
        title: "Sukces",
        description: `Pracownik ${newEmployee.first_name} ${newEmployee.last_name} został dodany pomyślnie`,
        variant: "success",
      });
      
      // Refresh the contractors list to show the new employee
      fetchContractors();
    } catch (error) {
      console.error('Błąd podczas dodawania pracownika:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się dodać pracownika",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">Panel Super Admina</h1>
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
        <Tabs defaultValue="contractors" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="contractors">Kontrahenci</TabsTrigger>
          </TabsList>
          
          <TabsContent value="contractors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dodaj nowego kontrahenta</CardTitle>
                <CardDescription>Wprowadź dane nowego kontrahenta</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddContractor} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">Nazwa *</label>
                      <Input
                        id="name"
                        value={newContractor.name}
                        onChange={e => setNewContractor({...newContractor, name: e.target.value})}
                        placeholder="Nazwa kontrahenta"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="nip" className="text-sm font-medium">NIP</label>
                      <Input
                        id="nip"
                        value={newContractor.nip || ''}
                        onChange={e => setNewContractor({...newContractor, nip: e.target.value})}
                        placeholder="NIP kontrahenta"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="street" className="text-sm font-medium">Ulica</label>
                      <Input
                        id="street"
                        value={newContractor.street || ''}
                        onChange={e => setNewContractor({...newContractor, street: e.target.value})}
                        placeholder="Ulica"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="city" className="text-sm font-medium">Miasto</label>
                      <Input
                        id="city"
                        value={newContractor.city || ''}
                        onChange={e => setNewContractor({...newContractor, city: e.target.value})}
                        placeholder="Miasto"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium">Telefon</label>
                      <Input
                        id="phone"
                        value={newContractor.phone || ''}
                        onChange={e => setNewContractor({...newContractor, phone: e.target.value})}
                        placeholder="Numer telefonu"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">Email</label>
                      <Input
                        id="email"
                        type="email"
                        value={newContractor.email || ''}
                        onChange={e => setNewContractor({...newContractor, email: e.target.value})}
                        placeholder="Adres email"
                      />
                    </div>
                  </div>
                  <Button type="submit">Dodaj kontrahenta</Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4">
              {loading ? (
                <p>Ładowanie kontrahentów...</p>
              ) : contractors.length === 0 ? (
                <p>Brak kontrahentów</p>
              ) : (
                contractors.map(contractor => (
                  <Card key={contractor.id} className="overflow-hidden">
                    <div 
                      className="p-4 flex justify-between items-center cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleContractorExpand(contractor.id)}
                    >
                      <div>
                        <h3 className="font-semibold">{contractor.name}</h3>
                        {contractor.nip && <p className="text-sm text-muted-foreground">NIP: {contractor.nip}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingContractor({...contractor});
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteContractor(contractor.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {contractor.expanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    
                    {contractor.expanded && (
                      <div className="px-4 pb-4 pt-2 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium">Adres</p>
                            <p className="text-sm text-muted-foreground">
                              {contractor.street || 'Brak'}, {contractor.city || 'Brak'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Kontakt</p>
                            <p className="text-sm text-muted-foreground">
                              Tel: {contractor.phone || 'Brak'}, Email: {contractor.email || 'Brak'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <h4 className="font-medium mb-2 flex items-center">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Dodaj pracownika
                          </h4>
                          <form onSubmit={handleAddEmployee} className="space-y-4">
                            <input type="hidden" value={contractor.id} onChange={() => setSelectedContractorId(contractor.id)} />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label htmlFor={`first_name_${contractor.id}`} className="text-sm font-medium">Imię</label>
                                <Input
                                  id={`first_name_${contractor.id}`}
                                  value={newEmployee.first_name}
                                  onChange={e => setNewEmployee({...newEmployee, first_name: e.target.value})}
                                  placeholder="Imię pracownika"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <label htmlFor={`last_name_${contractor.id}`} className="text-sm font-medium">Nazwisko</label>
                                <Input
                                  id={`last_name_${contractor.id}`}
                                  value={newEmployee.last_name}
                                  onChange={e => setNewEmployee({...newEmployee, last_name: e.target.value})}
                                  placeholder="Nazwisko pracownika"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <label htmlFor={`phone_${contractor.id}`} className="text-sm font-medium">Telefon</label>
                                <Input
                                  id={`phone_${contractor.id}`}
                                  value={newEmployee.phone || ''}
                                  onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})}
                                  placeholder="Numer telefonu"
                                />
                              </div>
                              <div className="space-y-2">
                                <label htmlFor={`email_${contractor.id}`} className="text-sm font-medium">Email</label>
                                <Input
                                  id={`email_${contractor.id}`}
                                  type="email"
                                  value={newEmployee.email || ''}
                                  onChange={e => setNewEmployee({...newEmployee, email: e.target.value})}
                                  placeholder="Adres email"
                                />
                              </div>
                              <div className="space-y-2">
                                <label htmlFor={`login_${contractor.id}`} className="text-sm font-medium">Login</label>
                                <Input
                                  id={`login_${contractor.id}`}
                                  value={newEmployee.login}
                                  onChange={e => setNewEmployee({...newEmployee, login: e.target.value})}
                                  placeholder="Login do systemu"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <label htmlFor={`password_${contractor.id}`} className="text-sm font-medium">Hasło</label>
                                <Input
                                  id={`password_${contractor.id}`}
                                  type="password"
                                  value={newEmployee.password}
                                  onChange={e => setNewEmployee({...newEmployee, password: e.target.value})}
                                  placeholder="Hasło do systemu"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <label htmlFor={`role_${contractor.id}`} className="text-sm font-medium">Rola</label>
                                <select
                                  id={`role_${contractor.id}`}
                                  value={newEmployee.role}
                                  onChange={e => setNewEmployee({...newEmployee, role: e.target.value as 'admin' | 'worker'})}
                                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  required
                                >
                                  <option value="admin">Admin</option>
                                  <option value="worker">Pracownik</option>
                                </select>
                              </div>
                            </div>
                            
                            <Button 
                              type="submit" 
                              onClick={() => setSelectedContractorId(contractor.id)}
                            >
                              Dodaj pracownika
                            </Button>
                          </form>
                          
                          <div className="mt-6 border-t pt-4">
                            <h4 className="font-medium mb-3">Lista pracowników</h4>
                            <EmployeesList contractorId={contractor.id} />
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      {editingContractor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Edytuj kontrahenta</CardTitle>
              <CardDescription>Zmień dane kontrahenta</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateContractor} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="edit_name" className="text-sm font-medium">Nazwa *</label>
                    <Input
                      id="edit_name"
                      value={editingContractor.name}
                      onChange={e => setEditingContractor({...editingContractor, name: e.target.value})}
                      placeholder="Nazwa kontrahenta"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit_nip" className="text-sm font-medium">NIP</label>
                    <Input
                      id="edit_nip"
                      value={editingContractor.nip || ''}
                      onChange={e => setEditingContractor({...editingContractor, nip: e.target.value})}
                      placeholder="NIP kontrahenta"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit_street" className="text-sm font-medium">Ulica</label>
                    <Input
                      id="edit_street"
                      value={editingContractor.street || ''}
                      onChange={e => setEditingContractor({...editingContractor, street: e.target.value})}
                      placeholder="Ulica"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit_city" className="text-sm font-medium">Miasto</label>
                    <Input
                      id="edit_city"
                      value={editingContractor.city || ''}
                      onChange={e => setEditingContractor({...editingContractor, city: e.target.value})}
                      placeholder="Miasto"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit_phone" className="text-sm font-medium">Telefon</label>
                    <Input
                      id="edit_phone"
                      value={editingContractor.phone || ''}
                      onChange={e => setEditingContractor({...editingContractor, phone: e.target.value})}
                      placeholder="Numer telefonu"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit_email" className="text-sm font-medium">Email</label>
                    <Input
                      id="edit_email"
                      type="email"
                      value={editingContractor.email || ''}
                      onChange={e => setEditingContractor({...editingContractor, email: e.target.value})}
                      placeholder="Adres email"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditingContractor(null)}>
                    Anuluj
                  </Button>
                  <Button type="submit">
                    Zapisz zmiany
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
