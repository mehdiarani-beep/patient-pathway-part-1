import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Users } from 'lucide-react';

export default function TeamMemberLandingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'linking' | 'success' | 'error'>('linking');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    handleTeamMemberLinking();
  }, []);

  const handleTeamMemberLinking = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('No user found:', userError);
        setStatus('error');
        setErrorMessage('No user session found. Please sign in again.');
        return;
      }

      // Get invitation token from URL or user metadata
      const invitationTokenFromUrl = searchParams.get('invitation');
      const invitationTokenFromMetadata = user.user_metadata?.invitation_token;
      const invitationToken = invitationTokenFromUrl || invitationTokenFromMetadata;

      // Check if user is a team member
      const isTeamMember = user.user_metadata?.is_team_member || invitationTokenFromUrl;
      
      if (!isTeamMember || !invitationToken) {
        console.log('Not a team member or no invitation token:', {
          isTeamMember,
          invitationToken,
          userMetadata: user.user_metadata
        });
        setStatus('error');
        setErrorMessage('Invalid team member invitation.');
        return;
      }

      console.log('Processing team member linking:', {
        userId: user.id,
        invitationToken,
        source: invitationTokenFromUrl ? 'URL' : 'metadata'
      });

      // Check if they already have a proper doctor profile
      const { data: existingProfile, error: profileError } = await supabase
        .from('doctor_profiles')
        .select('id, doctor_id_clinic, is_staff, clinic_name')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error checking existing profile:', profileError);
        setStatus('error');
        setErrorMessage('Failed to check existing profile.');
        return;
      }

      // If they already have a proper profile, redirect to portal
      if (existingProfile && existingProfile.doctor_id_clinic) {
        console.log('Team member already linked, redirecting to portal');
        setStatus('success');
        toast.success('Welcome back! Redirecting to portal...');
        setTimeout(() => {
          navigate('/portal');
        }, 2000);
        return;
      }

      // Call the link-team-member edge function
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
        setStatus('error');
        setErrorMessage('Failed to link to team. Please contact support.');
        toast.error('Failed to link to team');
      } else if (data?.success) {
        console.log('Team member linked successfully:', data);
        setStatus('success');
        toast.success('Successfully joined the team!');
        
        // Redirect to portal after a short delay
        setTimeout(() => {
          navigate('/portal');
        }, 2000);
      } else {
        console.error('Edge function returned error:', data?.error);
        setStatus('error');
        setErrorMessage(data?.error || 'Failed to link to team');
        toast.error(data?.error || 'Failed to link to team');
      }
    } catch (error) {
      console.error('Error in team member linking:', error);
      setStatus('error');
      setErrorMessage('An unexpected error occurred');
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (loading) return <Loader2 className="w-8 h-8 animate-spin text-blue-500" />;
    if (status === 'success') return <CheckCircle className="w-8 h-8 text-green-500" />;
    if (status === 'error') return <XCircle className="w-8 h-8 text-red-500" />;
    return <Users className="w-8 h-8 text-blue-500" />;
  };

  const getStatusMessage = () => {
    if (loading) return 'Processing team member invitation...';
    if (status === 'success') return 'Successfully joined the team!';
    if (status === 'error') return errorMessage || 'Failed to process invitation';
    return 'Processing...';
  };

  const getStatusColor = () => {
    if (status === 'success') return 'border-green-200 bg-green-50';
    if (status === 'error') return 'border-red-200 bg-red-50';
    return 'border-blue-200 bg-blue-50';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-green-50 to-teal-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#FF6B35] to-[#0E7C9D] bg-clip-text text-transparent mb-2">
            Patient Pathway
          </h1>
          <p className="text-gray-600">Team Member Setup</p>
        </div>

        <Card className={`w-full ${getStatusColor()}`}>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              {getStatusIcon()}
              Team Member Access
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {getStatusMessage()}
            </p>

            {status === 'error' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  If you continue to experience issues, please contact your administrator.
                </p>
                <Button 
                  onClick={() => navigate('/auth')}
                  variant="outline"
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              </div>
            )}

            {status === 'success' && (
              <p className="text-sm text-gray-500">
                Redirecting you to the portal...
              </p>
            )}

            {loading && (
              <p className="text-sm text-gray-500">
                This may take a few moments...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
