import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const { login, adminLogin, isLoading } = useAuth();
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isAdminLogin) {
        // Admin login
        const email = formData.email;
        const password = formData.password;
        if (!email || !password) {
          setError('Email and password required');
          return;
        }
        await adminLogin(email, password);
        toast.success('Admin logged in successfully!');
        navigate('/admin');
      } else {
        // Player login
        const { username, password } = formData;
        if (!username || !password) {
          setError('Username and password required');
          return;
        }
        await login(username, password);
        toast.success('Logged in successfully!');
        navigate('/');
      }
    } catch (err: any) {
      const message = err.message || 'Login failed';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-primary rounded-lg">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-black">COINKRAZY AI2</h1>
          </div>
          <p className="text-muted-foreground">Welcome back to the ultimate AI casino</p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl">
              {isAdminLogin ? 'Admin Login' : 'Player Login'}
            </CardTitle>
            <CardDescription>
              {isAdminLogin 
                ? 'Enter your admin credentials to access the dashboard' 
                : 'Enter your username and password to play'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isAdminLogin ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full font-bold text-lg"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isAdminLogin ? 'Admin Login' : 'Login'}
              </Button>
            </form>

            {/* Toggle between admin and player login */}
            <div className="mt-6 pt-6 border-t border-border/30">
              <button
                onClick={() => {
                  setIsAdminLogin(!isAdminLogin);
                  setError('');
                  setFormData({ username: '', email: '', password: '' });
                }}
                className="text-sm text-primary hover:underline w-full text-center"
              >
                {isAdminLogin ? 'Not an admin? Login as player' : 'Admin login?'}
              </button>
            </div>

            {/* Links */}
            <div className="mt-6 space-y-3 text-sm text-center">
              <div>
                <span className="text-muted-foreground">New player? </span>
                <Link to="/register" className="text-primary hover:underline font-semibold">
                  Sign up now
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
