import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Zap, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [validation, setValidation] = useState({
    usernameLength: false,
    passwordLength: false,
    passwordMatch: false,
    emailValid: false,
    hasName: false,
  });

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');

    // Update validation
    if (name === 'username') {
      setValidation(prev => ({ ...prev, usernameLength: value.length >= 3 }));
    }
    if (name === 'password') {
      setValidation(prev => ({
        ...prev,
        passwordLength: value.length >= 6,
        passwordMatch: value === formData.confirmPassword,
      }));
    }
    if (name === 'confirmPassword') {
      setValidation(prev => ({
        ...prev,
        passwordMatch: value === formData.password,
      }));
    }
    if (name === 'email') {
      setValidation(prev => ({
        ...prev,
        emailValid: validateEmail(value),
      }));
    }
    if (name === 'name') {
      setValidation(prev => ({ ...prev, hasName: value.length > 0 }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    if (!validation.usernameLength) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!validation.hasName) {
      setError('Full name is required');
      return;
    }
    if (!validation.emailValid) {
      setError('Valid email is required');
      return;
    }
    if (!validation.passwordLength) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!validation.passwordMatch) {
      setError('Passwords do not match');
      return;
    }

    try {
      await register(
        formData.username,
        formData.name,
        formData.email,
        formData.password
      );
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err: any) {
      const message = err.message || 'Registration failed';
      setError(message);
      toast.error(message);
    }
  };

  const isFormValid = Object.values(validation).every(v => v);

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
          <p className="text-muted-foreground">Join the ultimate AI casino</p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Join thousands of players in CoinKrazy AI2</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {validation.usernameLength && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Valid
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {validation.emailValid && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Valid
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              {/* Validation checklist */}
              <div className="bg-muted/50 p-3 rounded space-y-2 text-xs">
                <p className="font-semibold">Requirements:</p>
                <div className="space-y-1">
                  <p className={validation.usernameLength ? 'text-green-600' : 'text-muted-foreground'}>
                    {validation.usernameLength ? '✓' : '○'} Username: 3+ characters
                  </p>
                  <p className={validation.hasName ? 'text-green-600' : 'text-muted-foreground'}>
                    {validation.hasName ? '✓' : '○'} Full name provided
                  </p>
                  <p className={validation.emailValid ? 'text-green-600' : 'text-muted-foreground'}>
                    {validation.emailValid ? '✓' : '○'} Valid email address
                  </p>
                  <p className={validation.passwordLength ? 'text-green-600' : 'text-muted-foreground'}>
                    {validation.passwordLength ? '✓' : '○'} Password: 6+ characters
                  </p>
                  <p className={validation.passwordMatch ? 'text-green-600' : 'text-muted-foreground'}>
                    {validation.passwordMatch ? '✓' : '○'} Passwords match
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full font-bold text-lg"
                disabled={isLoading || !isFormValid}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Account
              </Button>
            </form>

            {/* Sign in link */}
            <div className="mt-6 pt-6 border-t border-border/30 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link to="/login" className="text-primary hover:underline font-semibold">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Terms notice */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          By registering, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Register;
