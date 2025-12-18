
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Lock, Chrome, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface LoginFormProps {
  invitationToken?: string | null;
  onToggleMode?: () => void;
}

export function LoginForm(props: LoginFormProps) {
  const { invitationToken, onToggleMode } = props;
  // Login form for existing users only
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting to sign in with email:', email);
      
      // Use direct Supabase auth sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        console.error('Login error:', error);
        toast.error(error.message || 'Login failed');
      } else {
        console.log('Login successful:', data);
        toast.success('Signed in successfully');
        
             // If there's an invitation token, link the team member after login
             if (invitationToken) {
               try {
                 console.log('Linking team member with invitation token:', invitationToken);
                 
                 // Use the edge function to handle team member linking
                 const { data: linkData, error: linkError } = await supabase.functions.invoke('link-team-member', {
                   body: {
                     invitationToken: invitationToken,
                     userId: data.user.id,
                     firstName: null, // Will be fetched from team_members table
                     lastName: null,
                     email: data.user.email
                   }
                 });

                 if (linkError) {
                   console.error('Error linking team member:', linkError);
                   toast.error('Failed to link to team. Please contact support.');
                 } else if (linkData?.success) {
                   toast.success('Successfully joined the team!');
                 } else {
                   console.error('Edge function returned error:', linkData?.error);
                   toast.error(linkData?.error || 'Failed to link to team');
                 }
               } catch (error) {
                 console.error('Error in team linking:', error);
               }
             }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const checkForExistingInvitation = async (email: string) => {
    try {
      console.log('Checking for existing invitation for email:', email);
      
      // Check if there's a pending invitation for this email
      const { data: teamMember, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('email', email)
        .eq('status', 'pending')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking for invitation:', error);
        return null;
      }

      if (teamMember) {
        console.log('Found existing invitation:', teamMember);
        return teamMember;
      }

      return null;
    } catch (error) {
      console.error('Error in checkForExistingInvitation:', error);
      return null;
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      console.log('Starting Google sign-in...');
      
      const currentOrigin = window.location.origin;
      
      // Store invitation token in sessionStorage for later retrieval
      if (invitationToken) {
        sessionStorage.setItem('pending_invitation_token', invitationToken);
        console.log('Stored invitation token for Google OAuth:', invitationToken);
      }
      
      // Set redirect URL - we'll handle the invitation linking after OAuth completes
      const redirectUrl = `${currentOrigin}/auth?google_oauth=true`;
      
      console.log('Redirecting to:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      
      if (error) {
        console.error('Google sign-in error:', error);
        if (error.message.includes('OAuth')) {
          toast.error('Google sign-in is not properly configured. Please contact support or use email/password login.');
        } else {
          toast.error('Google sign-in failed. Please try again or use email/password login.');
        }
      }
    } catch (error: any) {
      toast.error('Google sign-in temporarily unavailable. Please use email/password login.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      console.log('Sending password reset email to:', forgotPasswordEmail);
      console.log('Redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('Password reset error:', error);
        toast.error(error.message || 'Failed to send reset email');
      } else {
        console.log('Password reset email sent successfully');
        toast.success('Password reset email sent! Check your inbox and spam folder.');
        setForgotPasswordMode(false);
        setForgotPasswordEmail('');
      }
    } catch (error: any) {
      console.error('Password reset exception:', error);
      toast.error('Failed to send reset email');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
        <CardDescription className="text-center">
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {forgotPasswordMode ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setForgotPasswordMode(false)}
                className="p-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-lg font-semibold">Reset Password</h3>
            </div>
            <p className="text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Having trouble? Check your spam folder
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="email"
                  disabled={forgotPasswordLoading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={forgotPasswordLoading}
              >
                {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </div>
        ) : (
          <>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
            >
              <Chrome className="w-4 h-4 mr-2" />
              {googleLoading ? 'Connecting...' : 'Continue with Google'}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                autoComplete="email"
                disabled={loading || googleLoading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                autoComplete="current-password"
                disabled={loading || googleLoading}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-[#0E7C9D] hover:bg-[#0E7C9D]/90" 
            disabled={loading || googleLoading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
          
          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => setForgotPasswordMode(true)}
              className="text-sm text-[#FF6B35] hover:underline"
            >
              Forgot your password?
            </button>
            {onToggleMode && (
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="text-[#0E7C9D] hover:underline font-medium"
                >
                  Sign up
                </button>
              </p>
            )}
          </div>
        </form>
        </>
        )}
      </CardContent>
    </Card>
  );
}
