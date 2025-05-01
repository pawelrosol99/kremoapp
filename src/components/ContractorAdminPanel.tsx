import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Calendar, CircleCheck, ChevronDown, ChevronUp, Cog, Flame, CircleHelp, LogOut, Pencil, Plus, Settings, Tag, Trash2, User, UserCheck, UserCog, Users, Weight, CircleX } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useToast } from '../hooks/use-toast';
import { DriversList } from './DriversList';
import { EmployeesList } from './EmployeesList';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

type Company = {
  id: number;
  name: string;
  short_name?: string;
  city?: string;
  street?: string;
  phone?: string;
  email?: string;
  nip?: string;
  expanded?: boolean;
};

type Driver = {
  id: number;
  company_id: number;
  first_name: string;
  last_name: string;
  phone?: string;
};

export function ContractorAdminPanel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [contractorData, setContractorData] = useState<any>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [newCompany, setNewCompany] = useState<Partial<Company>>({
    name: '',
    short_name: '',
    city: '',
    street: '',
    phone: '',
    email: '',
    nip: ''
  });
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [activeTab, setActiveTab] = useState('companies');
  const [newDriver, setNewDriver] = useState<Partial<Driver>>({
    first_name: '',
    last_name: '',
    phone: ''
  });
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [multiOvenEnabled, setMultiOvenEnabled] = useState(false);
  const [newOven, setNewOven] = useState<{ name: string; color: string; custom_color?: string }>({
    name: '',
    color: 'red'
  });
  const [ovens, setOvens] = useState<any[]>([]);
  const [loadingOvens, setLoadingOvens] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [cremationMarking, setCremationMarking] = useState<{
    familyVisit?: 'present' | 'not_present' | 'no_data';
    cremationType?: 'normal' | 'exhumation';
    weight?: 'up_to_100kg' | 'plus_100kg' | 'max';
  }>({});
  
  // Predefined oven colors
  const ovenColors = [
    { value: 'red', label: 'Czerwony', bgColor: '#ffb3b3' },
    { value: 'pink', label: 'Różowy', bgColor: '#ffb3ff' },
    { value: 'orange', label: 'Pomarańczowy', bgColor: '#ffcc99' },
    { value: 'yellow', label: 'Żółty', bgColor: '#ffffb3' },
    { value: 'green', label: 'Zielony', bgColor: '#b3ffb3' },
    { value: 'teal', label: 'Morski', bgColor: '#99ffcc' },
    { value: 'blue', label: 'Niebieski', bgColor: '#b3b3ff' },
    { value: 'navy', label: 'Granatowy', bgColor: '#9999ff' },
    { value: 'purple', label: 'Fioletowy', bgColor: '#d9b3ff' },
    { value: 'brown', label: 'Brązowy', bgColor: '#d9b38c' },
    { value: 'gray', label: 'Szary', bgColor: '#cccccc' },
    { value: 'custom', label: 'Własny', bgColor: '#ffffff' },
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserData(user);
        if (user.employee_id) {
          fetchContractorData(user.employee_id);
        }
      } catch (e) {
        console.error('Błąd podczas przetwarzania danych użytkownika:', e);
        handleLogout();
      }
    } else {
      navigate('/');
    }
  }, [navigate]);
  
  useEffect(() => {
    if (contractorData?.id) {
      fetchOvens(contractorData.id);
    }
  }, [contractorData]);
  
  const fetchOvens = async (contractorId: number) => {
    setLoadingOvens(true);
    try {
      const { data, error } = await supabase
        .from('ovens')
        .select('*')
        .eq('contractor_id', contractorId)
        .order('name');
        
      if (error) throw error;
      setOvens(data || []);
    } catch (error) {
      console.error('Błąd podczas pobierania pieców:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać listy pieców",
        variant: "destructive",
      });
    } finally {
      setLoadingOvens(false);
    }
  };
  
  const handleAddOven = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractorData) return;
    
    try {
      if (!newOven.name) {
        toast({
          title: "Błąd walidacji",
          description: "Nazwa pieca jest wymagana!",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('ovens')
        .insert([{
          ...newOven,
          contractor_id: contractorData.id
        }])
        .select();
        
      if (error) throw error;
      
      // Log activity
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        await logActivity(user.id, 'create', 'ovens', data[0].id, `Dodano piec: ${data[0].name}`);
      }
      
      setOvens([...ovens, data[0]]);
      setNewOven({
        name: '',
        color: 'red',
        custom_color: undefined
      });
      
      toast({
        title: "Sukces",
        description: `Piec "${data[0].name}" został dodany pomyślnie`,
        variant: "success",
      });
    } catch (error) {
      console.error('Błąd podczas dodawania pieca:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się dodać pieca",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteOven = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć ten piec?')) return;
    
    try {
      const { error } = await supabase
        .from('ovens')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setOvens(ovens.filter(o => o.id !== id));
      
      // Log activity
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        await logActivity(user.id, 'delete', 'ovens', id, `Usunięto piec o ID: ${id}`);
      }
      
      toast({
        title: "Sukces",
        description: "Piec został usunięty pomyślnie",
        variant: "success",
      });
    } catch (error) {
      console.error('Błąd podczas usuwania pieca:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć pieca",
        variant: "destructive",
      });
    }
  };
  
  const handleCompanySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.length >= 3) {
      const results = companies.filter(company => {
        const searchTermLower = term.toLowerCase();
        return (
          company.name?.toLowerCase().includes(searchTermLower) ||
          company.short_name?.toLowerCase().includes(searchTermLower) ||
          company.city?.toLowerCase().includes(searchTermLower) ||
          company.street?.toLowerCase().includes(searchTermLower) ||
          company.nip?.toLowerCase().includes(searchTermLower)
        );
      });
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const fetchContractorData = async (employeeId: number) => {
    try {
      // Pobierz dane pracownika
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('contractor_id')
        .eq('id', employeeId)
        .single();

      if (employeeError) throw employeeError;

      // Pobierz dane kontrahenta
      if (employeeData?.contractor_id) {
        const { data: contractor, error: contractorError } = await supabase
          .from('contractors')
          .select('*')
          .eq('id', employeeData.contractor_id)
          .single();

        if (contractorError) throw contractorError;
        setContractorData(contractor);
        fetchCompanies(employeeData.contractor_id);
      }
    } catch (error) {
      console.error('Błąd podczas pobierania danych kontrahenta:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać danych kontrahenta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async (contractorId: number) => {
    setLoadingCompanies(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('contractor_id', contractorId)
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Błąd podczas pobierania firm:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać listy firm",
        variant: "destructive",
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractorData) return;
    
    try {
      if (!newCompany.name) {
        toast({
          title: "Błąd walidacji",
          description: "Nazwa firmy jest wymagana!",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('companies')
        .insert([{
          ...newCompany,
          contractor_id: contractorData.id
        }])
        .select();
        
      if (error) throw error;
      
      // Log activity
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        await logActivity(user.id, 'create', 'companies', data[0].id, `Dodano firmę: ${data[0].name}`);
      }
      
      setCompanies([...companies, {...data[0], expanded: false}]);
      setNewCompany({
        name: '',
        short_name: '',
        city: '',
        street: '',
        phone: '',
        email: '',
        nip: ''
      });
      
      toast({
        title: "Sukces",
        description: `Firma "${data[0].name}" została dodana pomyślnie`,
        variant: "success",
      });
    } catch (error) {
      console.error('Błąd podczas dodawania firmy:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się dodać firmy",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCompany = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tę firmę?')) return;
    
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCompanies(companies.filter(c => c.id !== id));
      
      // Log activity
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        await logActivity(user.id, 'delete', 'companies', id, `Usunięto firmę o ID: ${id}`);
      }
      
      toast({
        title: "Sukces",
        description: "Firma została usunięta pomyślnie",
        variant: "success",
      });
    } catch (error) {
      console.error('Błąd podczas usuwania firmy:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć firmy",
        variant: "destructive",
      });
    }
  };

  const toggleCompanyExpand = (id: number) => {
    setCompanies(companies.map(c => 
      c.id === id ? { ...c, expanded: !c.expanded } : c
    ));
  };

  const handleAddDriver = async (e: React.FormEvent, companyId: number) => {
    e.preventDefault();
    
    try {
      if (!newDriver.first_name || !newDriver.last_name) {
        toast({
          title: "Błąd walidacji",
          description: "Imię i nazwisko kierowcy są wymagane!",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('drivers')
        .insert([{
          ...newDriver,
          company_id: companyId
        }])
        .select();
        
      if (error) throw error;
      
      // Log activity
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        await logActivity(
          user.id, 
          'create', 
          'drivers', 
          data[0].id, 
          `Dodano kierowcę: ${data[0].first_name} ${data[0].last_name}`
        );
      }
      
      setNewDriver({
        first_name: '',
        last_name: '',
        phone: ''
      });
      
      toast({
        title: "Sukces",
        description: `Kierowca "${data[0].first_name} ${data[0].last_name}" został dodany pomyślnie`,
        variant: "success",
      });
      
      // We're not closing the company card anymore, just refreshing the drivers
      // Refresh the companies but maintain expanded state
      if (contractorData) {
        const currentExpandedState = {};
        companies.forEach(c => {
          if (c.expanded) {
            currentExpandedState[c.id] = true;
          }
        });
        
        const { data: refreshedCompanies, error: fetchError } = await supabase
          .from('companies')
          .select('*')
          .eq('contractor_id', contractorData.id)
          .order('name');
          
        if (!fetchError && refreshedCompanies) {
          setCompanies(refreshedCompanies.map(c => ({
            ...c,
            expanded: currentExpandedState[c.id] || false
          })));
        }
      }
    } catch (error) {
      console.error('Błąd podczas dodawania kierowcy:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się dodać kierowcy",
        variant: "destructive",
      });
    }
  };

  const logActivity = async (userId: number, action: string, entityType: string, entityId?: number, details?: string) => {
    try {
      await supabase
        .from('activity_logs')
        .insert([
          {
            user_id: userId,
            action,
            entity_type: entityType,
            entity_id: entityId,
            details
          }
        ]);
    } catch (error) {
      console.error('Error logging activity:', error);
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
            <h1 className="text-xl font-bold">Panel Administratora Kontrahenta</h1>
            {contractorData && <p className="text-sm text-muted-foreground">{contractorData.name}</p>}
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
        <Tabs defaultValue="companies" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="companies" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Firmy
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Terminarz
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Ustawienia
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="companies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dodaj nową firmę</CardTitle>
                <CardDescription>Wprowadź dane nowej firmy</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCompany} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">Nazwa *</label>
                      <Input
                        id="name"
                        value={newCompany.name}
                        onChange={e => setNewCompany({...newCompany, name: e.target.value})}
                        placeholder="Nazwa firmy"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="short_name" className="text-sm font-medium">Skrócona nazwa</label>
                      <Input
                        id="short_name"
                        value={newCompany.short_name || ''}
                        onChange={e => setNewCompany({...newCompany, short_name: e.target.value})}
                        placeholder="Skrócona nazwa"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="nip" className="text-sm font-medium">NIP</label>
                      <Input
                        id="nip"
                        value={newCompany.nip || ''}
                        onChange={e => setNewCompany({...newCompany, nip: e.target.value})}
                        placeholder="NIP firmy"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="city" className="text-sm font-medium">Miasto</label>
                      <Input
                        id="city"
                        value={newCompany.city || ''}
                        onChange={e => setNewCompany({...newCompany, city: e.target.value})}
                        placeholder="Miasto"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="street" className="text-sm font-medium">Ulica</label>
                      <Input
                        id="street"
                        value={newCompany.street || ''}
                        onChange={e => setNewCompany({...newCompany, street: e.target.value})}
                        placeholder="Ulica"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium">Telefon</label>
                      <Input
                        id="phone"
                        value={newCompany.phone || ''}
                        onChange={e => setNewCompany({...newCompany, phone: e.target.value})}
                        placeholder="Numer telefonu"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">Email</label>
                      <Input
                        id="email"
                        type="email"
                        value={newCompany.email || ''}
                        onChange={e => setNewCompany({...newCompany, email: e.target.value})}
                        placeholder="Adres email"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj firmę
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4">
              {loadingCompanies ? (
                <p className="text-center py-4">Ładowanie firm...</p>
              ) : companies.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">Brak firm do wyświetlenia</p>
                    <p className="text-sm text-muted-foreground mt-2">Dodaj swoją pierwszą firmę przy pomocy formularza powyżej</p>
                  </CardContent>
                </Card>
              ) : (
                companies.map(company => (
                  <Card key={company.id} className="overflow-hidden">
                    <div 
                      className="p-4 flex justify-between items-center cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleCompanyExpand(company.id)}
                    >
                      <div>
                        <h3 className="font-semibold">{company.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {company.city && `${company.city} • `}
                          {company.nip && `NIP: ${company.nip}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCompany({...company});
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCompany(company.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {company.expanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    
                    {company.expanded && (
                      <div className="px-4 pb-4 pt-2">
                        {/* Company details card */}
                        <Card className="p-4 mb-4 bg-background border">
                          <h4 className="font-medium mb-3">Dane firmy</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium">Adres</p>
                              <p className="text-sm text-muted-foreground">
                                {company.street ? company.street : 'Brak'}
                                {company.city ? `, ${company.city}` : ''}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Kontakt</p>
                              <p className="text-sm text-muted-foreground">
                                Tel: {company.phone || 'Brak'}, Email: {company.email || 'Brak'}
                              </p>
                            </div>
                          </div>
                        </Card>
                        
                        {/* Driver management card */}
                        <Card className="p-4 bg-secondary/30">
                          <div className="mb-4">
                            <h4 className="font-medium mb-3 flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              Dodaj kierowcę
                            </h4>
                            <form onSubmit={(e) => handleAddDriver(e, company.id)} className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <label htmlFor={`first_name_${company.id}`} className="text-sm font-medium">Imię *</label>
                                  <Input
                                    id={`first_name_${company.id}`}
                                    value={newDriver.first_name}
                                    onChange={e => setNewDriver({...newDriver, first_name: e.target.value})}
                                    placeholder="Imię kierowcy"
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label htmlFor={`last_name_${company.id}`} className="text-sm font-medium">Nazwisko *</label>
                                  <Input
                                    id={`last_name_${company.id}`}
                                    value={newDriver.last_name}
                                    onChange={e => setNewDriver({...newDriver, last_name: e.target.value})}
                                    placeholder="Nazwisko kierowcy"
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label htmlFor={`phone_${company.id}`} className="text-sm font-medium">Telefon</label>
                                  <Input
                                    id={`phone_${company.id}`}
                                    value={newDriver.phone || ''}
                                    onChange={e => setNewDriver({...newDriver, phone: e.target.value})}
                                    placeholder="Numer telefonu"
                                  />
                                </div>
                              </div>
                              <Button type="submit" className="flex items-center">
                                <Plus className="h-4 w-4 mr-2" />
                                Dodaj kierowcę
                              </Button>
                            </form>
                          </div>
                          
                          <div className="mt-4 border-t pt-4">
                            <h4 className="font-medium mb-2">Lista kierowców</h4>
                            <DriversList companyId={company.id} />
                          </div>
                        </Card>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Terminarz kremacji</CardTitle>
                <CardDescription>Zarządzaj harmonogramem kremacji</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border rounded-lg p-4 bg-card">
                  <h3 className="text-lg font-medium mb-4">Dodaj nową kremację</h3>
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="cremation_date" className="text-sm font-medium">Data kremacji *</label>
                        <Input
                          id="cremation_date"
                          type="date"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="cremation_time" className="text-sm font-medium">Godzina kremacji *</label>
                        <Input
                          id="cremation_time"
                          type="time"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="company_search" className="text-sm font-medium">Wyszukaj firmę</label>
                        <div className="flex gap-2">
                          <Input
                            id="company_search"
                            placeholder="Wpisz nazwę firmy, NIP, miasto..."
                            className="flex-1"
                          />
                          <Button type="button" variant="outline">
                            Wybierz z listy
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Oznaczenia kremacji</h4>
                      <div className="flex flex-wrap gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Wizyta rodziny</label>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm">Obecna</Button>
                            <Button type="button" variant="outline" size="sm">Nieobecna</Button>
                            <Button type="button" variant="outline" size="sm">Brak danych</Button>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Rodzaj kremacji</label>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm">Zwykła</Button>
                            <Button type="button" variant="outline" size="sm">Ekshumacja</Button>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Waga</label>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm">do 100kg</Button>
                            <Button type="button" variant="outline" size="sm">+100kg</Button>
                            <Button type="button" variant="outline" size="sm">max</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button type="submit">Dodaj kremację</Button>
                  </form>
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-xl font-bold">Poniedziałek, 1 maja 2025</h3>
                  
                  <div className="flex items-start gap-4">
                    <div className="text-xl font-bold w-20 text-right pt-2">09:00</div>
                    <div className="flex-1">
                      <div className="border rounded-lg p-4 bg-card">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium">Zakład Pogrzebowy XYZ</h4>
                            <p className="text-sm text-muted-foreground">Warszawa</p>
                          </div>
                          <div className="flex gap-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Zwykła
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="text-xl font-bold w-20 text-right pt-2">12:30</div>
                    <div className="flex-1">
                      <div className="border rounded-lg p-4 bg-card border-l-4 border-l-red-500">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium">Usługi Pogrzebowe ABC</h4>
                            <p className="text-sm text-muted-foreground">Kraków</p>
                          </div>
                          <div className="flex gap-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              Rodzina obecna
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Ustawienia</CardTitle>
                <CardDescription>Zarządzaj ustawieniami swojego konta</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="ovens">
                  <TabsList className="mb-4">
                    <TabsTrigger value="ovens" className="flex items-center gap-1">
                      <Flame className="h-4 w-4" />
                      Piece
                    </TabsTrigger>
                    <TabsTrigger value="employees" className="flex items-center gap-1">
                      <UserCog className="h-4 w-4" />
                      Pracownicy
                    </TabsTrigger>
                    <TabsTrigger value="account" className="flex items-center gap-1">
                      <Cog className="h-4 w-4" />
                      Konto
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="ovens">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="multi-oven" 
                          checked={multiOvenEnabled}
                          onCheckedChange={setMultiOvenEnabled}
                        />
                        <Label htmlFor="multi-oven">Więcej niż jeden piec</Label>
                      </div>
                      
                      {multiOvenEnabled && (
                        <div>
                          <h3 className="text-lg font-medium mb-4">Dodaj nowy piec</h3>
                          <form onSubmit={handleAddOven} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label htmlFor="oven_name" className="text-sm font-medium">Nazwa pieca *</label>
                                <Input
                                  id="oven_name"
                                  value={newOven.name}
                                  onChange={(e) => setNewOven({...newOven, name: e.target.value})}
                                  placeholder="Nazwa pieca"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium block mb-2">Kolor</label>
                                <div className="grid grid-cols-6 gap-2">
                                  {ovenColors.map((color) => (
                                    <div 
                                      key={color.value}
                                      className={`w-10 h-10 rounded-md cursor-pointer transition-all ${newOven.color === color.value ? 'ring-4 ring-primary' : 'ring-1 ring-border hover:ring-2'}`}
                                      style={{ backgroundColor: color.bgColor }}
                                      onClick={() => setNewOven({...newOven, color: color.value})}
                                      title={color.label}
                                    />
                                  ))}
                                  {newOven.color === 'custom' && (
                                    <div className="col-span-6 mt-2">
                                      <Input
                                        type="color"
                                        value={newOven.custom_color || '#ffffff'}
                                        onChange={(e) => setNewOven({...newOven, custom_color: e.target.value})}
                                        className="h-10 w-full"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button type="submit">Dodaj piec</Button>
                          </form>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4">Lista pieców</h3>
                        {ovens.length === 0 ? (
                          <p className="text-muted-foreground">Nie dodano jeszcze żadnych pieców.</p>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {ovens.map((oven) => (
                              <Card key={oven.id} className="p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-6 h-6 rounded-full"
                                    style={{ 
                                      backgroundColor: oven.color === 'custom' && oven.custom_color 
                                        ? oven.custom_color 
                                        : ovenColors.find(c => c.value === oven.color)?.bgColor || '#cccccc'
                                    }}
                                  />
                                  <div>
                                    <p className="font-medium">{oven.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {oven.color === 'custom' ? 'Niestandardowy' : ovenColors.find(c => c.value === oven.color)?.label}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleDeleteOven(oven.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="employees">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Dodaj nowego pracownika</h3>
                        <form className="space-y-4" onSubmit={handleAddEmployee}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="emp_first_name" className="text-sm font-medium">Imię *</label>
                              <Input
                                id="emp_first_name"
                                value={newEmployee.first_name}
                                onChange={e => setNewEmployee({...newEmployee, first_name: e.target.value})}
                                placeholder="Imię pracownika"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="emp_last_name" className="text-sm font-medium">Nazwisko *</label>
                              <Input
                                id="emp_last_name"
                                value={newEmployee.last_name}
                                onChange={e => setNewEmployee({...newEmployee, last_name: e.target.value})}
                                placeholder="Nazwisko pracownika"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="emp_phone" className="text-sm font-medium">Telefon</label>
                              <Input
                                id="emp_phone"
                                value={newEmployee.phone || ''}
                                onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})}
                                placeholder="Numer telefonu"
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="emp_email" className="text-sm font-medium">Email</label>
                              <Input
                                id="emp_email"
                                type="email"
                                value={newEmployee.email || ''}
                                onChange={e => setNewEmployee({...newEmployee, email: e.target.value})}
                                placeholder="Adres email"
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="emp_login" className="text-sm font-medium">Login *</label>
                              <Input
                                id="emp_login"
                                value={newEmployee.login}
                                onChange={e => setNewEmployee({...newEmployee, login: e.target.value})}
                                placeholder="Login do systemu"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="emp_password" className="text-sm font-medium">Hasło *</label>
                              <Input
                                id="emp_password"
                                type="password"
                                value={newEmployee.password}
                                onChange={e => setNewEmployee({...newEmployee, password: e.target.value})}
                                placeholder="Hasło do systemu"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="emp_role" className="text-sm font-medium">Rola *</label>
                              <select
                                id="emp_role"
                                value={newEmployee.role}
                                onChange={e => setNewEmployee({...newEmployee, role: e.target.value as 'admin' | 'worker'})}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                required
                              >
                                <option value="admin">Administrator</option>
                                <option value="worker">Pracownik</option>
                              </select>
                            </div>
                          </div>
                          <Button type="submit">Dodaj pracownika</Button>
                        </form>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4">Lista pracowników</h3>
                        {contractorData && <EmployeesList contractorId={contractorData.id} />}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="account">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Ustawienia konta</h3>
                      <p className="text-muted-foreground">Funkcjonalność w trakcie implementacji...</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
