import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { Loader2, Building, MapPin, Mail, Phone, Users, Upload, UserPlus, X, AlertTriangle } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function ConfigurationPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    clinic_name: '',
    location: '',
    email: '',
    phone: '',
    mobile: '',
    logo_url: '',
    providers: ''
  });
  const [contacts, setContacts] = useState<string[]>([]);
  const [isContactListOpen, setIsContactListOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  
  // Team member states
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState<'staff' | 'manager'>('staff');
  const [invitePermissions, setInvitePermissions] = useState({
    leads: false,
    content: false,
    payments: false,
    team: false
  });
  const [inviting, setInviting] = useState(false);
  const [clinicJoinCode, setClinicJoinCode] = useState('');
  const [joiningClinic, setJoiningClinic] = useState(false);

  // Patient invitation states
  const [patientInviteEmail, setPatientInviteEmail] = useState('');
  const [patientInviteFirstName, setPatientInviteFirstName] = useState('');
  const [patientInviteLastName, setPatientInviteLastName] = useState('');
  const [patientInviteMessage, setPatientInviteMessage] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDoctorProfile();
    }
  }, [user]);

  const fetchDoctorProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // First, try to get doctor profiles with clinic information (if migration is applied)
      let profiles, error;
      
      // Start with basic query to avoid relationship issues
      const result = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('user_id', user.id);
      
      profiles = result.data;
      error = result.error;
      
      if (error) {
        console.error('Error fetching doctor profiles:', error);
        setError('Could not fetch doctor profile');
        setLoading(false);
        return;
      }
      
      // Use the first profile if multiple exist
      if (profiles && profiles.length > 0) {
        const profile = profiles[0];
        console.log('Found doctor profile:', profile.id);
        console.log('Clinic ID:', profile.clinic_id);
        setDoctorId(profile.id); // Always use the actual doctor profile ID for team_members table
        
        // Use profile data (clinic_profiles relationship not available yet)
        setProfile({
          clinic_name: profile.clinic_name || '',
          location: profile.location || '',
          email: profile.email || user.email || '',
          phone: profile.phone || '',
          mobile: profile.mobile || '',
          logo_url: profile.logo_url || '',
          providers: profile.providers || ''
        });
        // Fetch team members using doctor profile ID
        await fetchTeamMembers(profile.id);
      } else {
        console.log('No doctor profile found, creating one...');
        
        // Create a doctor profile if none exists
        const { data: newProfile, error: createError } = await supabase
          .from('doctor_profiles')
          .insert([{ 
            user_id: user.id,
            first_name: 'Doctor',
            last_name: 'User',
            email: user.email,
            doctor_id: Math.floor(100000 + Math.random() * 900000).toString(),
            access_control: true
          }])
          .select();

        if (createError) {
          console.error('Error creating doctor profile:', createError);
          setError('Failed to create doctor profile');
          setLoading(false);
          return;
        }

        if (newProfile && newProfile.length > 0) {
          console.log('Created new doctor profile:', newProfile[0].id);
          setDoctorId(newProfile[0].id);
          setProfile({
            clinic_name: '',
            location: '',
            email: newProfile[0].email || user.email || '',
            phone: '',
            mobile: '',
            logo_url: '',
            providers: ''
          });
          // Fetch team members for the new profile
          await fetchTeamMembers(newProfile[0].id);
        } else {
          setError('Failed to create doctor profile');
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load clinic configuration');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async (doctorId: string) => {
    try {
      // Start with team_members table (current structure)
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('doctor_id', doctorId) // Use doctor_id for team_members table
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching team members:', error);
        setTeamMembers([]);
        return;
      }

      // Transform team_members data to match expected structure
      const transformedMembers = (data || []).map(member => ({
        ...member,
        clinic_profiles: { clinic_name: 'Clinic' } // Default clinic name
      }));

      setTeamMembers(transformedMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    }
  };

  const handleInviteTeamMember = async () => {
    console.log('handleInviteTeamMember called!');
    console.log('inviteEmail:', inviteEmail);
    console.log('doctorId:', doctorId);
    
    if (!inviteEmail || !doctorId) {
      toast.error('Please enter an email address');
      return;
    }

    if (!inviteEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setInviting(true);
    try {
      // Generate a unique invitation token
      const invitationToken = crypto.randomUUID();
      
      // Create a team member record in the database with the invitation token
      const { data: teamMemberData, error: teamMemberError } = await supabase
        .from('team_members')
        .insert({
          doctor_id: doctorId,
          email: inviteEmail.toLowerCase().trim(),
          first_name: inviteFirstName.trim() || null,
          last_name: inviteLastName.trim() || null,
          role: inviteRole,
          permissions: invitePermissions,
          status: 'pending',
          invited_by: user?.id,
          invitation_token: invitationToken,
          token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        })
        .select()
        .single();

      if (teamMemberError) {
        console.error('Error creating team member record:', teamMemberError);
        toast.error('Failed to create team member invitation');
        return;
      }

      // Use the send-invitation function with the proper invitation token
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: {
          patientEmail: inviteEmail.toLowerCase().trim(),
          patientFirstName: inviteFirstName.trim() || null,
          patientLastName: inviteLastName.trim() || null,
          message: `You've been invited to join our clinic team. Please sign up to get started.`,
          doctorId: doctorId,
          invitationToken: invitationToken // Use the generated invitation token
        },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) {
        console.error('Invitation error:', error);
        toast.error(error.message || 'Failed to send invitation');
        return;
      }

      if (data?.success) {
        toast.success('Team member invitation sent successfully!');
        
            // Clear form
            setInviteEmail('');
            setInviteFirstName('');
            setInviteLastName('');
            setInviteRole('staff');
            setInvitePermissions({
              leads: false,
              content: false,
              payments: false,
              team: false
            });
        
        // Refresh team members list
        await fetchTeamMembers(doctorId);
      } else {
        toast.error('Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting team member:', error);
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleJoinClinicByCode = async () => {
    if (!clinicJoinCode.trim()) {
      toast.error('Enter a clinic invitation code');
      return;
    }

    setJoiningClinic(true);
    try {
      const { data, error } = await supabase.functions.invoke('join-clinic-by-code', {
        body: { invitationCode: clinicJoinCode.trim() }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast.success('Clinic linked successfully');
        setClinicJoinCode('');
        fetchDoctorProfile();
      } else {
        toast.error(data?.error || 'Failed to join clinic');
      }
    } catch (error: any) {
      console.error('Error joining clinic:', error);
      toast.error(error?.message || 'Failed to join clinic');
    } finally {
      setJoiningClinic(false);
    }
  };

  // Diagnostic function to check team member status
  const checkTeamMemberStatus = async (memberId: string) => {
    try {
      console.log('=== DIAGNOSTIC: Checking team member status ===');
      
      // Check team_members table
      const { data: teamMember, error: teamError } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', memberId)
        .single();
      
      console.log('Team member record:', teamMember);
      if (teamError) console.error('Team member error:', teamError);
      
      if (teamMember?.linked_user_id) {
        // Check doctor_profiles table
        const { data: profile, error: profileError } = await supabase
          .from('doctor_profiles')
          .select('*')
          .eq('user_id', teamMember.linked_user_id)
          .single();
        
        console.log('Doctor profile record:', profile);
        if (profileError) console.error('Doctor profile error:', profileError);
        
        // Check auth.users table (this might fail due to RLS)
        try {
          const { data: authUser, error: authError } = await supabase
            .from('auth.users')
            .select('id, email, created_at')
            .eq('id', teamMember.linked_user_id)
            .single();
          
          console.log('Auth user record:', authUser);
          if (authError) console.error('Auth user error:', authError);
        } catch (authError) {
          console.log('Cannot access auth.users table (expected due to RLS):', authError);
        }
      }
      
      console.log('=== END DIAGNOSTIC ===');
    } catch (error) {
      console.error('Diagnostic error:', error);
    }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    try {
      console.log('Starting team member removal for ID:', memberId);
      
      if (!doctorId) {
        toast.error('Doctor ID not found');
        return;
      }

      // Call the remove-team-member edge function to handle all deletions
      console.log('Calling remove-team-member edge function...');
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error('No active session');
        return;
      }

      const { data, error } = await supabase.functions.invoke('remove-team-member', {
        body: {
          teamMemberId: memberId,
          doctorId: doctorId
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`
        }
      });

      if (error) {
        console.error('Error removing team member:', error);
        toast.error(`Failed to remove team member: ${error.message}`);
        return;
      }

      if (!data.success) {
        console.error('Team member removal failed:', data);
        toast.error(data.error || 'Failed to remove team member');
        return;
      }

      console.log('Team member removed successfully:', data);
      toast.success(`Team member removed successfully`);
      
      // Refresh the team members list
      await fetchTeamMembers(doctorId);
    } catch (error: any) {
      console.error('Error removing team member:', error);
      toast.error(`Failed to remove team member: ${error.message}`);
    }
  };

  const handleSendPatientInvite = async () => {
    if (!patientInviteEmail || !doctorId) {
      toast.error('Please enter a patient email address');
      return;
    }

    if (!patientInviteEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSendingInvite(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: {
          patientEmail: patientInviteEmail.toLowerCase().trim(),
          patientFirstName: patientInviteFirstName.trim() || null,
          patientLastName: patientInviteLastName.trim() || null,
          message: patientInviteMessage.trim() || null,
          doctorId: doctorId
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast.success('Team Member invitation sent successfully!');
        
        // Clear form
        setPatientInviteEmail('');
        setPatientInviteFirstName('');
        setPatientInviteLastName('');
        setPatientInviteMessage('');
      } else {
        throw new Error(data?.error || 'Failed to send invitation');
      }
    } catch (error: any) {
      console.error('Error sending team member invitation:', error);
      toast.error('Failed to send invitation', {
        description: error.message || 'Please try again later'
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const handleSave = async () => {
    if (!user || !doctorId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('doctor_profiles')
        .update({
          clinic_name: profile.clinic_name,
          location: profile.location,
          email: profile.email,
          phone: profile.phone,
          mobile: profile.mobile,
          logo_url: profile.logo_url,
          providers: profile.providers,
          updated_at: new Date().toISOString()
        })
        .eq('id', doctorId);

      if (error) throw error;
      
      toast.success('Clinic configuration saved successfully');
      
      // Refresh the profile data to ensure we have the latest
      fetchDoctorProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save clinic configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !doctorId) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      console.log('Starting logo upload process');
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Delete old logo if exists
      if (profile.logo_url) {
        try {
          const urlParts = profile.logo_url.split('/');
          const oldFileName = urlParts[urlParts.length - 1];
          if (oldFileName && oldFileName.includes('logo-')) {
            console.log('Attempting to delete old file:', `logos/${oldFileName}`);
            await supabase.storage
              .from('profiles')
              .remove([`logos/${oldFileName}`]);
          }
        } catch (error) {
          console.log('Could not delete old logo:', error);
        }
      }

      console.log('Uploading new logo to path:', filePath);
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      console.log('Public URL:', urlData.publicUrl);

      // Update the profile with the new URL
      setProfile(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      
      // Update the doctor profile directly
      const { error: updateError } = await supabase
        .from('doctor_profiles')
        .update({ 
          logo_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', doctorId);
        
      if (updateError) {
        console.error('Error updating logo URL:', updateError);
        throw updateError;
      }
      
      toast.success('Logo uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo', {
        description: error.message || 'Please try again later'
      });
    } finally {
      setUploading(false);
    }
  };
const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv') {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const newContacts = lines.map(line => line.trim()).filter(line => line !== '');
      setContacts(prev => [...prev, ...newContacts]);
      toast.success('Contacts imported successfully!');
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clinic Configuration</h2>
          <p className="text-gray-600">Manage your clinic information and settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2 border-2 border-indigo-100 bg-indigo-50/30 rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Join Master Clinic
            </CardTitle>
            <CardDescription>
              Enter the invitation code provided by your master clinic to link your doctor account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.clinic_name ? (
              <div className="rounded-md bg-white px-3 py-2 text-sm text-gray-700">
                Currently linked to <span className="font-semibold">{profile.clinic_name}</span>
              </div>
            ) : (
              <div className="rounded-md bg-white px-3 py-2 text-sm text-gray-700">
                This account is not yet linked to a master clinic.
              </div>
            )}
            <div className="flex flex-col gap-2 md:flex-row">
              <Input
                placeholder="Enter clinic invitation code"
                value={clinicJoinCode}
                onChange={(e) => setClinicJoinCode(e.target.value)}
              />
              <Button onClick={handleJoinClinicByCode} disabled={joiningClinic}>
                {joiningClinic && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Join Clinic
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              A clinic administrator can generate this code from the master portal.
            </p>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="border-2 border-gray-200 rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-500" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clinic_name">Clinic Name</Label>
              <Input
                id="clinic_name"
                value={profile.clinic_name}
                onChange={(e) => handleInputChange('clinic_name', e.target.value)}
                placeholder="Enter clinic name"
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={profile.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter clinic address/location"
              />
            </div>

            <div>
              <Label htmlFor="providers">Providers (Doctors)</Label>
              <Textarea
                id="providers"
                value={profile.providers}
                onChange={(e) => handleInputChange('providers', e.target.value)}
                placeholder="List all doctors/providers (one per line)"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-2 border-gray-200 rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-green-500" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="clinic@example.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                type="tel"
                value={profile.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
                placeholder="(555) 987-6543"
              />
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card className="md:col-span-2 border-2 border-gray-200 rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-500" />
              Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={profile.logo_url}
                  onChange={(e) => handleInputChange('logo_url', e.target.value)}
                  placeholder="https://your-domain.com/logo.png"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a URL or upload your logo below
                </p>
              </div>
              
              <div>
                <Label htmlFor="logo_upload">Upload Logo</Label>
                <div className="mt-2">
                  <input
                    id="logo_upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('logo_upload')?.click()}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Choose Logo File
                  </Button>
                </div>
              </div>
            </div>

            {profile.logo_url && (
              <div className="mt-4">
                <Label>Logo Preview</Label>
                <div className="mt-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <img
                    src={profile.logo_url}
                    alt="Clinic Logo"
                    className="max-h-20 max-w-40 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                      target.onerror = null;
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
{/* Contact List Management */}
        <Card className="md:col-span-2 border-2 border-gray-200 rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Contact List Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="csv_upload">Import Contacts from CSV</Label>
              <input
                id="csv_upload"
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById('csv_upload')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload CSV File
              </Button>
            </div>
            <div>
              <Label>Manually Add Contacts</Label>
              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Manage Contacts
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Contact List</h4>
                      <div className="h-40 overflow-y-auto border rounded-md p-2">
                        {contacts.map((contact, index) => (
                          <div key={index} className="text-sm">{contact}</div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Member Invitation */}
        <Card className="md:col-span-2 border-2 border-gray-200 rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" />
              Team Member Invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Send Member Invitation</h3>
              <p className="text-sm text-gray-600">
                Invite members to your clinic portal to access the clinic portal.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patient_invite_email">Team Member's Email Address *</Label>
                  <Input
                    id="patient_invite_email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="member@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="patient_invite_first_name">First Name</Label>
                  <Input
                    id="patient_invite_first_name"
                    type="text"
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    placeholder="Ryan"
                  />
                </div>
                <div>
                  <Label htmlFor="patient_invite_last_name">Last Name</Label>
                  <Input
                    id="patient_invite_last_name"
                    type="text"
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    placeholder="Vaugh"
                  />
                </div>
                <div>
                  <Label htmlFor="invite_role">Role</Label>
                  <select
                    id="invite_role"
                    value={inviteRole}
                    onChange={(e) => {
                      const role = e.target.value as 'staff' | 'manager';
                      setInviteRole(role);
                      // Set default permissions based on role
                      if (role === 'manager') {
                        setInvitePermissions({
                          leads: true,
                          content: true,
                          payments: false,
                          team: false
                        });
                      } else {
                        setInvitePermissions({
                          leads: false,
                          content: false,
                          payments: false,
                          team: false
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="patient_invite_message">Personal Message (Optional)</Label>
                  <Textarea
                    id="patient_invite_message"
                    value={patientInviteMessage}
                    onChange={(e) => setPatientInviteMessage(e.target.value)}
                    placeholder="Add a personal message here to include in the invitation..."
                    rows={3}
                  />
                </div>
              </div>
              
              <Button 
                onClick={() => {
                  console.log('Button clicked!');
                  handleInviteTeamMember();
                }} 
                disabled={inviting || !inviteEmail}
                className="w-full md:w-auto"
              >
                {inviting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Send Team Member Invitation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Team Members */}
        <Card className='md:col-span-2 border-2 border-gray-200 rounded-lg'>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Current Team Members
            </CardTitle>
            <CardDescription>
              Manage your team members and their permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No team members yet</p>
                <p className="text-sm">Invite team members using the form above</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {(member.first_name?.[0] || '') + (member.last_name?.[0] || '')}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {member.first_name} {member.last_name}
                          </h4>
                          <p className="text-sm text-gray-500">{member.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              member.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                              member.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {member.role?.charAt(0).toUpperCase() + member.role?.slice(1) || 'Staff'}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              member.status === 'accepted' ? 'bg-green-100 text-green-700' :
                              member.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {member.status?.charAt(0).toUpperCase() + member.status?.slice(1) || 'Unknown'}
                            </span>
                          </div>
                          {member.permissions && (
                            <div className="flex gap-1 mt-2">
                              {member.permissions.leads && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Leads</span>
                              )}
                              {member.permissions.content && (
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">Content</span>
                              )}
                              {member.permissions.payments && (
                                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">Payments</span>
                              )}
                              {member.permissions.team && (
                                <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">Team</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {member.status === 'pending' && (
                      <div className="text-sm text-gray-500">
                        Pending
                      </div>
                    )}
                    {member.status === 'accepted' && member.role !== 'owner' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-red-500" />
                              Remove Team Member
                            </AlertDialogTitle>
               <AlertDialogDescription>
                 Are you sure you want to remove <strong>{member.first_name} {member.last_name}</strong> from your team?
                 <br /><br />
                 <span className="text-red-600 font-medium">This action will permanently delete:</span>
                 <ol className="list-decimal list-inside mt-2 text-sm space-y-1">
                   <li>Their doctor profile (first)</li>
                   <li>Their team member record (second)</li>
                   <li>Their authentication account (last)</li>
                 </ol>
                 <br />
                 <span className="text-red-600 font-medium">This will also:</span>
                 <ul className="list-disc list-inside mt-1 text-sm">
                   <li>Remove them from the team</li>
                   <li>Revoke all access to the portal</li>
                   <li>Delete all associated data</li>
                 </ul>
                 <br />
                 <span className="font-medium text-red-700">This action cannot be undone.</span>
               </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveTeamMember(member.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Yes, Remove Team Member
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
      </div>

      {/* Save Button (Mobile) */}
      <div className="md:hidden">
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}