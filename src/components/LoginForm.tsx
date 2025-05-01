import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticateUser } from '../lib/auth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { ThemeToggle } from './ThemeToggle';
import { useToast } from '../hooks/use-toast';

export function LoginForm() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Authenticate user with provided credentials
      const userData = await authenticateUser(login, password);
      
      if (!userData) {
        throw new Error('Nieprawidłowy login lub hasło');
      }

      // Zapisz dane użytkownika do localStorage
      localStorage.setItem('user', JSON.stringify(userData));

      // Show success notification
      toast({
        title: "Zalogowano pomyślnie",
        description: `Witaj, ${userData.login}!`,
        variant: "success",
      });

      // Przekierowanie na odpowiednią stronę na podstawie roli użytkownika
      setTimeout(() => {
        if (userData.role === 'super_admin') {
          navigate('/super-admin');
        } else if (userData.role === 'admin') {
          navigate('/contractor-admin');
        } else if (userData.role === 'worker') {
          navigate('/worker');
        }
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
      toast({
        title: "Błąd logowania",
        description: err instanceof Error ? err.message : 'Wystąpił błąd',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Kremacja</CardTitle>
          <CardDescription className="text-center">Zaloguj się do systemu</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="login" className="text-sm font-medium">Login</label>
              <Input
                id="login"
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Twój login"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Hasło</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Twoje hasło"
                required
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">System zarządzania procesem kremacji</p>
        </CardFooter>
      </Card>
    </div>
  );
}
