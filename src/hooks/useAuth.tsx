import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(prevSession => {
          if (JSON.stringify(prevSession) !== JSON.stringify(session)) {
            return session;
          }
          return prevSession;
        });
        setUser(prevUser => {
          const newUser = session?.user ?? null;
          if (JSON.stringify(prevUser) !== JSON.stringify(newUser)) {
            return newUser;
          }
          return prevUser;
        });
        setLoading(false);

        if (event === 'SIGNED_IN') {
          // Check if email is verified
          if (session?.user && !session.user.email_confirmed_at) {
            navigateRef.current('/verify-email');
          } else if (window.location.pathname === '/auth') {
            // Check if this is a Google OAuth completion
            const urlParams = new URLSearchParams(window.location.search);
            const isGoogleOAuth = urlParams.get('google_oauth') === 'true';
            const invitationToken = urlParams.get('invitation');
            
            if (isGoogleOAuth) {
              // Handle Google OAuth completion
              handleGoogleOAuthCompletion(session.user);
            } else if (invitationToken) {
              // Handle team member invitation
              handleTeamInvitation(invitationToken, session.user.id);
            } else {
              // Using simplified approach - redirect to portal
              navigateRef.current('/portal');
            }
          } else {
            // User is signed in and verified, check for team member linking
            checkAndHandleTeamMemberLinking(session.user);
          }
        } else if (event === 'USER_UPDATED') {
          // Handle email verification
          if (session?.user?.email_confirmed_at && window.location.pathname === '/verify-email') {
            // Check if this is a team member that needs linking
            checkAndHandleTeamMemberLinking(session.user);
            navigateRef.current('/portal');
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, redirecting to auth page');
          setUser(null);
          setSession(null);
          navigateRef.current('/auth');
        }
      }
    );

    // Check initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        setSession(session);
        setUser(session?.user ?? null);
        
        // Only redirect if we're on the auth page and user is not verified
        if (session?.user && !session.user.email_confirmed_at && window.location.pathname === '/auth') {
          navigateRef.current('/verify-email');
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    return () => subscription.unsubscribe();
  }, []);

  const checkAndHandleTeamMemberLinking = async (user: any) => {
    try {
      // Check if user is a team member that needs linking
      if (user.user_metadata?.is_team_member && user.user_metadata?.invitation_token) {
        console.log('Found team member that needs linking:', user.id);
        
        // Check if they already have a doctor profile
        const { data: existingProfile, error: profileError } = await supabase
          .from('doctor_profiles')
          .select('id, doctor_id_clinic, is_staff')
          .eq('user_id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error checking existing profile:', profileError);
          return;
        }

        // If no profile or missing clinic data, link them
        if (!existingProfile || !existingProfile.doctor_id_clinic) {
          console.log('Team member needs linking, calling handleTeamInvitation');
          await handleTeamInvitation(user.user_metadata.invitation_token, user.id);
        } else {
          console.log('Team member already linked:', existingProfile);
        }
      }
    } catch (error) {
      console.error('Error in checkAndHandleTeamMemberLinking:', error);
    }
  };

  const handleGoogleOAuthCompletion = async (user: User) => {
    try {
      console.log('Handling Google OAuth completion for user:', user.email);
      
      // Check for pending invitation token in sessionStorage
      const pendingInvitationToken = sessionStorage.getItem('pending_invitation_token');
      
      // Check if there's an existing invitation for this email
      const { data: teamMember, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('email', user.email)
        .eq('status', 'pending')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking for invitation:', error);
      }

      if (teamMember || pendingInvitationToken) {
        const invitationToken = pendingInvitationToken || teamMember?.invitation_token;
        
        if (invitationToken) {
          console.log('Found invitation for Google OAuth user, linking...');
          
          // Clear the session storage
          sessionStorage.removeItem('pending_invitation_token');
          
          // Use the edge function to handle team member linking
          const { data, error } = await supabase.functions.invoke('link-team-member', {
            body: {
              invitationToken: invitationToken,
              userId: user.id,
              firstName: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || 'Team',
              lastName: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 'Member',
              email: user.email
            }
          });

          if (error) {
            console.error('Error linking team member:', error);
            toast.error('Failed to link to team. Please contact support.');
            navigateRef.current('/portal');
            return;
          }

          if (data?.success) {
            console.log('Team member linked successfully via Google OAuth');
            toast.success('Successfully joined the team via Google!');
            navigateRef.current('/portal');
            return;
          } else {
            console.error('Edge function returned error:', data?.error);
            toast.error(data?.error || 'Failed to link to team');
          }
        }
      }

      // Check if this is a regular user (not a team member)
      const { data: existingProfile, error: profileError } = await supabase
        .from('doctor_profiles')
        .select('id, user_id')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error checking existing profile:', profileError);
      }

      if (existingProfile) {
        // User already has a profile, redirect to portal
        console.log('Existing user with Google OAuth, redirecting to portal');
        navigateRef.current('/portal');
      } else {
        // New user, create profile and redirect to portal
        console.log('New Google OAuth user, creating profile...');
        
        const { error: createError } = await supabase
          .from('doctor_profiles')
          .insert([{
            user_id: user.id,
            first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || 'User',
            last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 'Name',
            email: user.email,
            doctor_id: Math.floor(100000 + Math.random() * 900000).toString(),
            clinic_name: 'My Clinic',
            access_control: true
          }]);

        if (createError) {
          console.error('Error creating profile for Google OAuth user:', createError);
          toast.error('Failed to create profile. Please contact support.');
        } else {
          console.log('Profile created for Google OAuth user');
          toast.success('Welcome! Your account has been set up.');
        }
        
        navigateRef.current('/portal');
      }
    } catch (error) {
      console.error('Error in handleGoogleOAuthCompletion:', error);
      toast.error('Failed to complete Google sign-in');
      navigateRef.current('/portal');
    }
  };

  const handleTeamInvitation = async (invitationToken: string, userId: string) => {
    try {
      // Get user metadata for team member linking
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found for team invitation');
        return;
      }

      const { data, error } = await supabase.functions.invoke('link-team-member', {
        body: {
          invitationToken,
          userId,
          firstName: user.user_metadata?.first_name,
          lastName: user.user_metadata?.last_name,
          email: user.email
        }
      });

      if (error) {
        console.error('Error linking team member:', error);
        toast.error('Failed to join team. Please contact support.');
        navigateRef.current('/auth');
      } else if (data?.success) {
        toast.success('Successfully joined the team!');
        navigateRef.current('/portal');
      } else {
        console.error('Edge function returned error:', data?.error);
        toast.error(data?.error || 'Failed to join team');
        navigateRef.current('/auth');
      }
    } catch (error) {
      console.error('Error in team invitation handling:', error);
      toast.error('Failed to process invitation');
      navigateRef.current('/auth');
    }
  };

  // Removed clinic membership check - using simplified approach

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Attempting to sign in with email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (!error && data.user && !data.user.email_confirmed_at) {
        // If user is not verified, sign them out and show verification message
        await supabase.auth.signOut();
        return { 
          error: { 
            message: 'Please verify your email before signing in. Check your inbox for the verification link.' 
          } 
        };
      }
      
      return { error };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata = {}) => {
    try {
      setLoading(true);
      console.log('Attempting to sign up with email:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      if (error) throw error;

      // If signup is successful but email confirmation is required
      if (data?.user && !data.user.email_confirmed_at) {
        console.log('Sign up successful, email verification required');
        return { error: null };
      }

      return { error };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('Starting sign out process...');
      setLoading(true);
      
      // Clear local state first
      setUser(null);
      setSession(null);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      console.log('Sign out completed successfully');
      
      // Force navigation to auth page
      navigate('/auth', { replace: true });
      
    } catch (error: any) {
      console.error('Sign out error:', error);
      // Even if there's an error, clear local state and redirect
      setUser(null);
      setSession(null);
      navigate('/auth', { replace: true });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
