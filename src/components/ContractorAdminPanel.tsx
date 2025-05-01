import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Calendar, ChevronDown, ChevronUp, Cog, Flame, LogOut, Pencil, Plus, Settings, Trash2, User, UserCog, Users } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useToast } from '../hooks/use-toast';
import { DriversList } from './DriversList';
import { EmployeesList } from './EmployeesList';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

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
  const [newEmployee, setNewEmployee] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    login: '',
    password: '',
    role: 'worker',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [groupedCremations, setGroupedCremations] = useState([]);
  const [cremationDate, setCremationDate] = useState('');
  const [cremationTime, setCremationTime] = useState('');
  const [selectedBadges, setSelectedBadges] = useState({});
  const [loadingOvens, setLoadingOvens] = useState(false);
  const [cremations, setCremations] = useState([]);
  const [selectedOven, setSelectedOven] = useState<any>(null);
  
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
  
  const handleCompanySearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
  
    if (term.length >= 2) {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .ilike('name', `%${term}%`)
          .eq('contractor_id', contractorData.id);
  
        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error('Błąd podczas wyszukiwania firm:', error);
        toast({
          title: 'Błąd',
          description: 'Nie udało się wyszukać firm',
          variant: 'destructive',
        });
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectCompany = (company) => {
    setSelectedCompany(company);
    setSearchTerm(company.name);
    setSearchResults([]);
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

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!newEmployee.first_name || !newEmployee.last_name || !newEmployee.login || !newEmployee.password) {
      toast({
        title: 'Błąd walidacji',
        description: 'Wszystkie wymagane pola muszą być wypełnione!',
        variant: 'destructive',
      });
      return;
    }
  
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([{ ...newEmployee, contractor_id: contractorData.id }])
        .select();
  
      if (error) throw error;
  
      setNewEmployee({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        login: '',
        password: '',
        role: 'worker',
      });
  
      toast({
        title: 'Sukces',
        description: 'Pracownik został dodany pomyślnie',
        variant: 'success',
      });
  
      fetchEmployees(); // Odśwież listę pracowników
    } catch (error) {
      console.error('Błąd podczas dodawania pracownika:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się dodać pracownika',
        variant: 'destructive',
      });
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('contractor_id', contractorData.id);
  
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Błąd podczas pobierania pracowników:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się pobrać listy pracowników',
        variant: 'destructive',
      });
    }
  };

  const handleSelectCompanyFromList = (company) => {
    setSelectedCompany(company);
    setShowCompanyDialog(false);
  };

  const handleBadgeSelection = (group, label) => {
    setSelectedBadges((prev) => ({
      ...prev,
      [group]: label,
    }));
  };

  const badges = [
    { label: 'Obecna', color: 'bg-red-500 text-white' },
    { label: 'Nieobecna', color: 'bg-green-500 text-white' },
    { label: 'Brak danych', color: 'bg-gray-300 text-black' },
    { label: 'Zwykła', color: 'bg-yellow-500 text-black' },
    { label: 'Ekshumacja', color: 'bg-purple-500 text-white' },
    { label: 'Do 100kg', color: 'bg-blue-200 text-black' },
    { label: '+100kg', color: 'bg-blue-500 text-white' },
    { label: 'Max', color: 'bg-purple-700 text-white' },
  ];

  const badgeGroups = [
    {
      title: 'Rodzina',
      badges: [
        { label: 'Obecna', color: 'bg-red-500 text-white' },
        { label: 'Nieobecna', color: 'bg-green-500 text-white' },
        { label: 'Brak danych', color: 'bg-gray-300 text-black' },
      ],
    },
    {
      title: 'Rodzaj kremacji',
      badges: [
        { label: 'Normalna', color: 'bg-yellow-500 text-black' },
        { label: 'Ekshumacja', color: 'bg-purple-500 text-white' },
      ],
    },
    {
      title: 'Waga',
      badges: [
        { label: 'Do 100kg', color: 'bg-blue-200 text-black' },
        { label: '+100kg', color: 'bg-blue-500 text-white' },
        { label: 'Max', color: 'bg-purple-700 text-white' },
      ],
    },
  ];

  // Dodano funkcję grupującą kremacje według dni tygodnia.
  const groupCremationsByDay = (cremations) => {
    const daysOfWeek = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
    const grouped = {};
  
    cremations.forEach((cremation) => {
      const date = new Date(cremation.cremation_date);
      const dayName = daysOfWeek[date.getDay()];
      const formattedDate = `${date.getDate()} ${date.toLocaleString('pl-PL', { month: 'long' })}`;
  
      if (!grouped[formattedDate]) {
        grouped[formattedDate] = { day: dayName, date: formattedDate, cremations: [] };
      }
  
      grouped[formattedDate].cremations.push(cremation);
    });
  
    return Object.values(grouped);
  };
  
  // Pobranie i grupowanie kremacji.
  useEffect(() => {
    const fetchCremations = async () => {
      try {
        const { data, error } = await supabase
          .from('cremations')
          .select(`
            id,
            cremation_date,
            cremation_time,
            family_visit,
            cremation_type,
            weight,
            unique_number,
            company_id,
            companies (name, short_name, city)
          `)
          .eq('contractor_id', contractorData.id)
          .order('cremation_date', { ascending: true });
    
        if (error) throw error;
    
        const formattedCremations = data.map(cremation => ({
          ...cremation,
          company_name: cremation.companies?.name || 'Brak firmy',
          short_name: cremation.companies?.short_name || '',
          city: cremation.companies?.city || '',
        }));
    
        setGroupedCremations(groupCremationsByDay(formattedCremations));
      } catch (error) {
        console.error('Błąd podczas pobierania kremacji:', error);
        toast({
          title: 'Błąd',
          description: 'Nie udało się pobrać listy kremacji',
          variant: 'destructive',
        });
      }
    };
  
    if (contractorData?.id) {
      fetchCremations();
    }
  }, [contractorData]);

  // Naprawiono funkcję handleAddCremation, aby poprawnie obsługiwała strukturę selectedBadges jako obiekt.
  const handleAddCremation = async (e) => {
    e.preventDefault();
    if (!selectedCompany || !cremationDate || !cremationTime) {
      toast({
        title: 'Błąd walidacji',
        description: 'Wszystkie wymagane pola muszą być wypełnione!',
        variant: 'destructive',
      });
      return;
    }
  
    try {
      const uniqueNumber = `KREM-${Date.now()}`;
      const { data, error } = await supabase
        .from('cremations')
        .insert([{
          contractor_id: contractorData.id,
          company_id: selectedCompany.id,
          cremation_date: cremationDate,
          cremation_time: cremationTime,
          family_visit: selectedBadges['Rodzina'] === 'Obecna' ? 'present' : selectedBadges['Rodzina'] === 'Nieobecna' ? 'not_present' : 'no_data',
          cremation_type: selectedBadges['Rodzaj kremacji'] === 'Normalna' ? 'normal' : selectedBadges['Rodzaj kremacji'] === 'Ekshumacja' ? 'exhumation' : null,
          weight: selectedBadges['Waga'] === 'Do 100kg' ? 'up_to_100kg' : selectedBadges['Waga'] === '+100kg' ? 'plus_100kg' : selectedBadges['Waga'] === 'Max' ? 'max' : null,
          unique_number: uniqueNumber,
        }])
        .select();
  
      if (error) throw error;
  
      setCremations((prev) => [...prev, data[0]]);
      setCremationDate('');
      setCremationTime('');
      setSelectedCompany(null);
      setSearchTerm('');
      setSelectedBadges({});
  
      toast({
        title: 'Sukces',
        description: 'Kremacja została dodana pomyślnie',
        variant: 'success',
      });
    } catch (error) {
      console.error('Błąd podczas dodawania kremacji:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się dodać kremacji',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const initializeDefaultOven = async () => {
      if (contractorData?.id && ovens.length === 0) {
        try {
          const { data, error } = await supabase
            .from('ovens')
            .insert([{ name: 'Piec nr 1', color: 'gray', contractor_id: contractorData.id }])
            .select();

          if (error) throw error;

          setOvens([...ovens, data[0]]);
        } catch (error) {
          console.error('Błąd podczas inicjalizacji domyślnego pieca:', error);
          toast({
            title: 'Błąd',
            description: 'Nie udało się dodać domyślnego pieca',
            variant: 'destructive',
          });
        }
      }
    };

    initializeDefaultOven();
  }, [contractorData, ovens]);

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
                  <form className="space-y-4" onSubmit={handleAddCremation}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="cremation_date" className="text-sm font-medium">Data kremacji *</label>
                        <Input
                          id="cremation_date"
                          type="date"
                          className="w-full"
                          value={cremationDate}
                          onChange={(e) => setCremationDate(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="cremation_time" className="text-sm font-medium">Godzina kremacji *</label>
                        <Input
                          id="cremation_time"
                          type="time"
                          className="w-full"
                          value={cremationTime}
                          onChange={(e) => setCremationTime(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="company_search" className="text-sm font-medium">Wyszukaj firmę</label>
                        <Input
                          id="company_search"
                          placeholder="Wpisz nazwę firmy, NIP, miasto..."
                          value={searchTerm}
                          onChange={handleCompanySearch}
                          className="w-full"
                        />
                        <div className="absolute bg-white border rounded shadow-md mt-1 w-full max-h-40 overflow-y-auto">
                          {searchResults.map(company => (
                            <div
                              key={company.id}
                              className="p-2 cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSelectCompany(company)}
                            >
                              <p className="font-bold">{company.name}</p>
                              <p className="text-sm text-gray-500">{company.city}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {searchResults.map(company => (
                        <div
                          key={company.id}
                          className="p-2 border rounded cursor-pointer hover:bg-muted"
                          onClick={() => handleSelectCompany(company)}
                        >
                          {company.name} ({company.city})
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {badgeGroups.map(group => (
                        <div key={group.title} className="flex-1 border rounded-lg p-4">
                          <h4 className="font-medium mb-2 text-center">{group.title}</h4>
                          <div className="flex justify-center gap-2">
                            {group.badges.map(badge => (
                              <div
                                key={badge.label}
                                className={`px-2 py-1 text-sm rounded-full cursor-pointer ${selectedBadges[group.title] === badge.label ? badge.color : 'opacity-60'}`}
                                onClick={() => handleBadgeSelection(group.title, badge.label)}
                              >
                                {badge.label}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4">
                      {multiOvenEnabled && (
                        <div className="flex flex-wrap gap-2">
                          {ovens.map((oven) => (
                            <button
                              key={oven.id}
                              className={`px-4 py-2 rounded-md text-sm font-medium ${selectedOven?.id === oven.id ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                              style={{ backgroundColor: oven.color === 'custom' ? oven.custom_color : ovenColors.find(c => c.value === oven.color)?.bgColor }}
                              onClick={() => setSelectedOven(oven)}
                            >
                              {oven.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button type="submit" className="w-full">Dodaj kremację</Button>
                  </form>
                </div>
                
                <Tabs defaultValue="list">
                  <TabsList className="mb-4">
                    <TabsTrigger value="list">Lista</TabsTrigger>
                    <TabsTrigger value="calendar">Kalendarz</TabsTrigger>
                  </TabsList>

                  <TabsContent value="list">
                    <Tabs defaultValue="all">
                      <TabsList className="mb-4">
                        <TabsTrigger value="all">Wszystkie</TabsTrigger>
                        {ovens.map((oven) => (
                          <TabsTrigger key={oven.id} value={oven.id.toString()}>{oven.name}</TabsTrigger>
                        ))}
                      </TabsList>

                      <TabsContent value="all">
                        {groupedCremations.map(({ day, date, cremations }) => (
                          <div key={date} className="mb-6">
                            <h3 className="text-lg font-bold mb-2">{day}, {date}</h3>
                            {cremations.map(cremation => (
                              <div key={cremation.id} className={`flex items-start gap-4 p-4 border rounded-lg`} style={{ borderColor: ovens.find(o => o.id === cremation.oven_id)?.color || 'gray' }}>
                                <div className="text-xl font-bold w-20 text-right pt-2">{cremation.time}</div>
                                <div className="flex-1">
                                  <div className="border rounded-lg p-4 bg-card">
                                    <div className="flex justify-between">
                                      <div>
                                        <h4 className="font-medium">{cremation.company_name}</h4>
                                        <p className="text-sm text-muted-foreground">{cremation.short_name}, {cremation.city}</p>
                                      </div>
                                      <div className="flex gap-1">
                                        {cremation.badges.map(badge => (
                                          <span key={badge} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {badge}
                                          </span>
                                        ))}
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cremation.hasData ? 'bg-black text-white' : 'bg-gray-300 text-black'}`}>
                                          <i className="icon-pencil"></i>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </TabsContent>

                      {ovens.map((oven) => (
                        <TabsContent key={oven.id} value={oven.id.toString()}>
                          {groupedCremations
                            .filter(({ cremations }) => cremations.some(c => c.oven_id === oven.id))
                            .map(({ day, date, cremations }) => (
                              <div key={date} className="mb-6">
                                <h3 className="text-lg font-bold mb-2">{day}, {date}</h3>
                                {cremations
                                  .filter(c => c.oven_id === oven.id)
                                  .map(cremation => (
                                    <div key={cremation.id} className={`flex items-start gap-4 p-4 border rounded-lg`} style={{ borderColor: oven.color === 'custom' ? oven.custom_color : ovenColors.find(c => c.value === oven.color)?.bgColor }}>
                                      <div className="text-xl font-bold w-20 text-right pt-2">{cremation.time}</div>
                                      <div className="flex-1">
                                        <div className="border rounded-lg p-4 bg-card">
                                          <div className="flex justify-between">
                                            <div>
                                              <h4 className="font-medium">{cremation.company_name}</h4>
                                              <p className="text-sm text-muted-foreground">{cremation.short_name}, {cremation.city}</p>
                                            </div>
                                            <div className="flex gap-1">
                                              {cremation.badges.map(badge => (
                                                <span key={badge} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                  {badge}
                                                </span>
                                              ))}
                                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cremation.hasData ? 'bg-black text-white' : 'bg-gray-300 text-black'}`}>
                                                <i className="icon-pencil"></i>
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            ))}
                        </TabsContent>
                      ))}
                    </Tabs>
                  </TabsContent>

                  <TabsContent value="calendar">
                    <p>Widok kalendarza w trakcie implementacji...</p>
                  </TabsContent>
                </Tabs>
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

      <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wybierz firmę</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Wyszukaj firmę..."
            value={searchTerm}
            onChange={handleCompanySearch}
            className="mb-4"
          />
          <div className="space-y-2">
            {searchResults.map(company => (
              <div
                key={company.id}
                className="p-2 border rounded cursor-pointer hover:bg-muted"
                onClick={() => handleSelectCompanyFromList(company)}
              >
                {company.name} ({company.city})
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
