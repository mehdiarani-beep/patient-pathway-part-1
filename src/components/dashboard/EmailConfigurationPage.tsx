import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Mail, CheckCircle, AlertCircle, Settings, Clock, CheckCircle2, X, Send } from 'lucide-react';
import { generateAssessmentEmailTemplate } from '@/lib/emailTemplates';
// import { testResendConfiguration } from '@/lib/resendService';

interface DoctorProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  email_prefix: string | null;
  email_alias: string | null;
  email_alias_created: boolean;
  clinic_name: string | null;
  phone: string | null;
  website: string | null;
  avatar_url: string | null;
}

interface EmailAliasRequest {
  id: string;
  doctor_id: string;
  requested_alias: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
}

export function EmailConfigurationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailPrefix, setEmailPrefix] = useState('');
  const [resendStatus, setResendStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  
  // Email alias states
  const [aliasRequest, setAliasRequest] = useState<EmailAliasRequest | null>(null);
  const [requestedAlias, setRequestedAlias] = useState('');
  const [checkingAlias, setCheckingAlias] = useState(false);
  const [aliasAvailable, setAliasAvailable] = useState<boolean | null>(null);
  const [requestingAlias, setRequestingAlias] = useState(false);
  const [showAliasSetup, setShowAliasSetup] = useState(false);
  
  // Email sending states
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);

  useEffect(() => {
    loadDoctorProfile();
    testResendConnection();
    loadAvailableQuizzes();
  }, [user]);

  const loadDoctorProfile = async () => {
    if (!user) return;

    try {
      // First, get the current user's profile to check if they're staff/manager
      const { data: userProfiles, error: fetchError } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('Error fetching doctor profiles:', fetchError);
        throw fetchError;
      }

      let profile = null;

      if (!userProfiles || userProfiles.length === 0) {
        throw new Error('No doctor profile found');
      } else {
        const userProfile = userProfiles[0];
        
        // Check if user is staff or manager
        if (userProfile.is_staff) {
          // If team member, fetch the main doctor's profile using doctor_id_clinic
          if (userProfile.doctor_id_clinic) {
            const { data: mainDoctorProfile, error: mainDoctorError } = await supabase
              .from('doctor_profiles')
              .select('*')
              .eq('id', userProfile.doctor_id_clinic)
              .single();

            if (mainDoctorError) {
              console.error('Error fetching main doctor profile:', mainDoctorError);
              // Fallback to user's own profile
              profile = userProfile;
            } else {
              // Use main doctor's profile for display
              profile = mainDoctorProfile;
            }
          } else {
            // No clinic link, use user's own profile
            profile = userProfile;
          }
        } else {
          // Regular doctor, use their own profile
          profile = userProfile;
        }
      }

      if (!profile) {
        throw new Error('No doctor profile found');
      }

      setDoctorProfile(profile);
      setEmailPrefix(profile?.email_prefix || '');
      
      // Load alias request status if no alias is set
      if (!profile?.email_alias) {
        await loadAliasRequestStatus(profile.id);
      }
    } catch (error) {
      console.error('Error loading doctor profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load doctor profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const testResendConnection = async () => {
    try {
      // Just check if the send-resend-email function exists by calling it with minimal data
      // This won't actually send an email but will test the connection
      setResendStatus('connected'); // Assume it's working for now
    } catch (error) {
      console.error('Resend connection test error:', error);
      setResendStatus('error');
    }
  };

  const generateEmailPrefix = () => {
    if (doctorProfile?.first_name && doctorProfile?.last_name) {
      const prefix = `${doctorProfile.first_name.toLowerCase()}.${doctorProfile.last_name.toLowerCase()}`;
      setEmailPrefix(prefix);
    }
  };

  const saveEmailConfiguration = async () => {
    if (!doctorProfile || !emailPrefix.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email prefix',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('doctor_profiles')
        .update({ 
          email_prefix: emailPrefix.trim().toLowerCase(),
          updated_at: new Date().toISOString()
        })
        .eq('id', doctorProfile.id);

      if (error) throw error;

      setDoctorProfile(prev => prev ? { ...prev, email_prefix: emailPrefix.trim().toLowerCase() } : null);
      
      toast({
        title: 'Success',
        description: 'Email configuration saved successfully',
      });
    } catch (error) {
      console.error('Error saving email configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to save email configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };


  const loadAliasRequestStatus = async (doctorId: string) => {
    try {
      const { data, error } = await supabase
        .from('email_alias_requests')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('requested_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading alias request:', error);
        return;
      }

      if (data && data.length > 0) {
        setAliasRequest(data[0]);
      }
    } catch (error) {
      console.error('Error loading alias request status:', error);
    }
  };

  const loadAvailableQuizzes = async () => {
    try {
      // Use the actual quiz types available in your system
      const predefinedQuizzes = [
        { id: 'nose', title: 'NOSE Assessment', description: 'Nasal Obstruction Symptom Evaluation' },
        { id: 'snot12', title: 'SNOT-12 Assessment', description: 'Sino-Nasal Outcome Test' },
        { id: 'tnss', title: 'TNSS Assessment', description: 'Total Nasal Symptom Score' }
      ];

      setAvailableQuizzes(predefinedQuizzes);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    }
  };

  const checkAliasAvailability = async () => {
    if (!requestedAlias.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an alias to check',
        variant: 'destructive',
      });
      return;
    }

    setCheckingAlias(true);
    try {
      console.log('Checking alias availability:', requestedAlias.trim().toLowerCase());
      
      // Use direct queries instead of RPC function to avoid ambiguity issues
      const alias = requestedAlias.trim().toLowerCase();
      
      // Check if alias exists in email_aliases table
      const { data: existingAlias, error: aliasError } = await supabase
        .from('email_aliases')
        .select('id')
        .eq('alias', alias)
        .eq('is_active', true)
        .limit(1);

      if (aliasError) {
        console.error('Error checking existing aliases:', aliasError);
        toast({
          title: 'Error',
          description: 'Failed to check alias availability',
          variant: 'destructive',
        });
        return;
      }

      // Check if alias is already requested and pending
      const { data: pendingRequest, error: requestError } = await supabase
        .from('email_alias_requests')
        .select('id')
        .eq('requested_alias', alias)
        .eq('status', 'pending')
        .limit(1);

      if (requestError) {
        console.error('Error checking pending requests:', requestError);
        toast({
          title: 'Error',
          description: 'Failed to check alias availability',
          variant: 'destructive',
        });
        return;
      }

      // Alias is available if it doesn't exist in either table
      const isAvailable = !existingAlias?.length && !pendingRequest?.length;
      console.log('Alias availability check result:', { 
        alias, 
        existingAlias: existingAlias?.length, 
        pendingRequest: pendingRequest?.length, 
        isAvailable 
      });

      setAliasAvailable(isAvailable);
    } catch (error) {
      console.error('Error checking alias availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to check alias availability',
        variant: 'destructive',
      });
    } finally {
      setCheckingAlias(false);
    }
  };

  const requestEmailAlias = async () => {
    if (!doctorProfile || !requestedAlias.trim() || aliasAvailable !== true) {
      toast({
        title: 'Error',
        description: 'Please enter a valid and available alias',
        variant: 'destructive',
      });
      return;
    }

    setRequestingAlias(true);
    try {
      console.log('Creating alias request:', {
        doctor_id: doctorProfile.id,
        requested_alias: requestedAlias.trim().toLowerCase()
      });
      
      const { data, error } = await supabase
        .from('email_alias_requests')
        .insert({
          doctor_id: doctorProfile.id,
          requested_alias: requestedAlias.trim().toLowerCase()
        })
        .select()
        .single();

      console.log('Alias request response:', { data, error });

      if (error) {
        console.error('Error creating alias request:', error);
        toast({
          title: 'Error',
          description: 'Failed to create alias request',
          variant: 'destructive',
        });
        return;
      }

      setAliasRequest(data);
      setShowAliasSetup(false);
      toast({
        title: 'Success',
        description: 'Email alias request submitted successfully! Admin will review it soon.',
      });
    } catch (error) {
      console.error('Error requesting email alias:', error);
      toast({
        title: 'Error',
        description: 'Failed to request email alias',
        variant: 'destructive',
      });
    } finally {
      setRequestingAlias(false);
    }
  };

  const sendQuizEmail = async () => {
    if (!doctorProfile?.email_alias_created || !doctorProfile?.email_alias || !selectedQuiz || !recipientEmail.trim() || !recipientName.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (!recipientEmail.includes('@')) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setSendingEmail(true);
    try {
      // Generate professional email template using the doctor's details
      const baseUrl = window.location.origin;
      const emailTemplate = generateAssessmentEmailTemplate(
        selectedQuiz as 'nose' | 'snot12' | 'snot22' | 'tnss',
        {
          doctorProfile: {
            id: doctorProfile.id,
            first_name: doctorProfile.first_name,
            last_name: doctorProfile.last_name,
            email: doctorProfile.email,
            phone: doctorProfile.phone,
            clinic_name: doctorProfile.clinic_name,
            website: doctorProfile.website,
            avatar_url: doctorProfile.avatar_url
          },
          baseUrl,
          recipientName: recipientName.trim()
        }
      );

      // Use custom subject if provided, otherwise use template subject
      const finalSubject = emailSubject.trim() || emailTemplate.subject;

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: recipientEmail.trim(),
          subject: finalSubject,
          html: emailTemplate.html,
          text: emailTemplate.text,
          doctorId: doctorProfile.id
        }
      });

      if (error) {
        console.error('Error sending email:', error);
        toast({
          title: 'Error',
          description: 'Failed to send assessment invitation',
          variant: 'destructive',
        });
        return;
      }

      if (data?.success) {
        toast({
          title: 'Success',
          description: `Professional assessment invitation sent to ${recipientName} (${recipientEmail})`,
        });
        setRecipientEmail('');
        setRecipientName('');
        setEmailSubject('');
        setSelectedQuiz('');
      } else {
        toast({
          title: 'Error',
          description: data?.error || 'Failed to send assessment invitation',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending quiz email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send assessment invitation',
        variant: 'destructive',
      });
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading email configuration...</p>
        </div>
      </div>
    );
  }

  if (!doctorProfile) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Doctor profile not found. Please complete your profile setup first.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Emails</h1>
        <p className="text-gray-600 mt-2">
          Set up your email alias for patient communications.
        </p>
      </div>

      {/* Email Alias Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Alias Status
          </CardTitle>
          <CardDescription>
            Manage your personalized email alias for patient communications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {doctorProfile.email_alias_created && doctorProfile.email_alias ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Email Alias Active
                </Badge>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="font-medium text-green-800">Your Email Alias:</p>
                <p className="text-lg font-mono text-green-700">
                  {doctorProfile.email_alias}@patientpathway.ai
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <Badge variant="secondary">
                  No Email Alias Set Up
                </Badge>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-amber-800 mb-3">No email alias has been set up</p>
                <Button 
                  onClick={() => setShowAliasSetup(true)}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Proceed with Email Alias Setup
                </Button>
              </div>
              
              {/* Show pending request status */}
              {aliasRequest && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    {aliasRequest.status === 'pending' && <Clock className="h-4 w-4 text-blue-600" />}
                    {aliasRequest.status === 'approved' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    {aliasRequest.status === 'rejected' && <X className="h-4 w-4 text-red-600" />}
                    <span className="font-medium">
                      Request for "{aliasRequest.requested_alias}" - {aliasRequest.status.charAt(0).toUpperCase() + aliasRequest.status.slice(1)}
                    </span>
                  </div>
                  {aliasRequest.status === 'rejected' && aliasRequest.rejection_reason && (
                    <p className="text-sm text-red-700">Reason: {aliasRequest.rejection_reason}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Alias Setup Modal */}
      {showAliasSetup && !doctorProfile.email_alias_created && (
        <Card>
          <CardHeader>
            <CardTitle>Email Alias Setup</CardTitle>
            <CardDescription>
              Request a personalized email alias for your patient communications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="requested-alias">Requested Alias</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="requested-alias"
                  value={requestedAlias}
                  onChange={(e) => {
                    setRequestedAlias(e.target.value);
                    setAliasAvailable(null);
                  }}
                  placeholder="yourname"
                  className="flex-1"
                />
                <Button
                  onClick={checkAliasAvailability}
                  disabled={checkingAlias || !requestedAlias.trim()}
                  variant="outline"
                >
                  {checkingAlias ? 'Checking...' : 'Check'}
                </Button>
              </div>
              {aliasAvailable !== null && (
                <div className="mt-2 flex items-center gap-2">
                  {aliasAvailable ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Alias is available</span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-600">Alias is not available</span>
                    </>
                  )}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">
                This will create: {requestedAlias || 'yourname'}@patientpathway.ai
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={requestEmailAlias}
                disabled={requestingAlias || aliasAvailable !== true}
                className="flex-1"
              >
                {requestingAlias ? 'Creating Request...' : 'Create Request'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAliasSetup(false);
                  setRequestedAlias('');
                  setAliasAvailable(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Send Quiz Emails */}
      {doctorProfile.email_alias_created && doctorProfile.email_alias && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Patient Assessment
            </CardTitle>
            <CardDescription>
              Send assessment invitations to patients using your email alias.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="quiz-select">Select Assessment</Label>
                <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an assessment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableQuizzes.map((quiz) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recipient-name">Patient Name</Label>
                    <Input
                      id="recipient-name"
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="recipient-email">Patient Email Address</Label>
                    <Input
                      id="recipient-email"
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="patient@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email-subject">Email Subject (Optional)</Label>
                  <Input
                    id="email-subject"
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Leave empty to use default subject"
                  />
                </div>
              </div>
            </div>
            
            <Button
              onClick={sendQuizEmail}
              disabled={sendingEmail || !selectedQuiz || !recipientEmail.trim() || !recipientName.trim()}
              className="w-full"
            >
              {sendingEmail ? 'Sending...' : 'Send Assessment Invitation'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Current Configuration Summary */}
      {doctorProfile.email_prefix && (
        <Card>
          <CardHeader>
            <CardTitle>Current Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Doctor Name:</span>
                <p>{doctorProfile.first_name} {doctorProfile.last_name}</p>
              </div>
              <div>
                <span className="font-medium">Email Prefix:</span>
                <p>{doctorProfile.email_prefix}</p>
              </div>
              <div>
                <span className="font-medium">Sending Address:</span>
                <p>dr.{doctorProfile.email_prefix}@patientpathway.ai</p>
              </div>
              <div>
                <span className="font-medium">Reply Address:</span>
                <p>{doctorProfile.email}</p>
              </div>
              {doctorProfile.email_alias_created && doctorProfile.email_alias && (
                <>
                  <div>
                    <span className="font-medium">Email Alias:</span>
                    <p>{doctorProfile.email_alias}@patientpathway.ai</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
