import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function MasterLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        setError('Invalid credentials. Please check your email and password.');
        return;
      }

      // Check if this user has an owner membership for any clinic
      const { data: context, error: contextError } = await supabase.functions.invoke('get-user-clinic-context');

      if (contextError) {
        console.error('Error loading clinic context:', contextError);
        setError('Failed to verify master access. Please try again.');
        await supabase.auth.signOut();
        return;
      }

      const hasOwnerClinic = Array.isArray(context?.memberships)
        && context.memberships.some((m: any) => m.role === 'owner');

      if (!hasOwnerClinic) {
        setError('Your account does not have master clinic access.');
        toast.error('Master access required for this portal.');
        await supabase.auth.signOut();
        return;
      }

      toast.success('Master access granted');
      navigate('/master', { replace: true });
    } catch (err) {
      console.error('Master login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-slate-800">
              Master Clinic Portal
            </CardTitle>
            <CardDescription className="mt-2 text-slate-600">
              Restricted access for clinic owner accounts
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Access Master Portal
                </div>
              )}
            </Button>

            <div className="mt-4 text-center text-xs text-slate-500">
              Only users with an owner role on a clinic can access this portal.
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


