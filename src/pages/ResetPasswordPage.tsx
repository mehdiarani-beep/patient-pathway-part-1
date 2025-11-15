import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // First, try to get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error checking session:', sessionError);
      }

      // If no session, try to handle the URL hash which might contain the reset token
      if (!session) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('URL hash params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });

        if (accessToken && refreshToken && type === 'recovery') {
          // Set the session using the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('Error setting session:', error);
            toast.error('Invalid or expired reset link. Please request a new password reset.');
            navigate('/auth');
            return;
          }

          if (data.session) {
            setIsValidSession(true);
            // Clear the URL hash to clean up the URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          }
        }

        // Check URL search params as well (some email clients might use ? instead of #)
        const searchParams = new URLSearchParams(window.location.search);
        const searchAccessToken = searchParams.get('access_token');
        const searchRefreshToken = searchParams.get('refresh_token');
        const searchType = searchParams.get('type');

        if (searchAccessToken && searchRefreshToken && searchType === 'recovery') {
          const { data, error } = await supabase.auth.setSession({
            access_token: searchAccessToken,
            refresh_token: searchRefreshToken
          });

          if (error) {
            console.error('Error setting session from search params:', error);
            toast.error('Invalid or expired reset link. Please request a new password reset.');
            navigate('/auth');
            return;
          }

          if (data.session) {
            setIsValidSession(true);
            // Clear the URL search params to clean up the URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          }
        }
      } else {
        // We have a session, check if it's valid
        setIsValidSession(true);
        return;
      }

      // If we get here, no valid session was found
      toast.error('Invalid or expired reset link. Please request a new password reset.');
      navigate('/auth');
    } catch (error) {
      console.error('Error checking session:', error);
      toast.error('An error occurred. Please try again.');
      navigate('/auth');
    } finally {
      setCheckingSession(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Error updating password:', error);
        toast.error(error.message || 'Failed to update password');
        return;
      }

      toast.success('Password updated successfully! You can now sign in with your new password.');
      navigate('/auth');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-green-50 to-teal-50 px-4">
        <div className="w-full max-w-md">
          <Card className="w-full">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-gray-600">Verifying reset link...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-green-50 to-teal-50 px-4">
        <div className="w-full max-w-md">
          <Card className="w-full">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Invalid Reset Link</h3>
                  <p className="text-gray-600 mb-4">
                    This password reset link is invalid or has expired.
                  </p>
                  <Button onClick={() => navigate('/auth')} className="w-full">
                    Back to Sign In
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-green-50 to-teal-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#FF6B35] to-[#0E7C9D] bg-clip-text text-transparent mb-2">
            Patient Pathway
          </h1>
          <p className="text-gray-600">Reset Your Password</p>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Create New Password</CardTitle>
            <p className="text-center text-gray-600">
              Enter your new password below
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Update Password
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/auth')}
                className="text-gray-600 hover:text-gray-800"
              >
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Password must be at least 6 characters long
          </p>
        </div>
      </div>
    </div>
  );
}
