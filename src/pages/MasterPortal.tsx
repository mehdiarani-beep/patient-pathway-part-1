import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamManagementPage } from '@/components/dashboard/TeamManagementPage';
import { toast } from 'sonner';
import {
  Loader2,
  Stethoscope,
  Users,
  Copy,
  LogIn,
  Link2,
  Unlink,
  UserPlus,
  Building,
  MapPin,
  Mail,
  Phone,
  Globe,
  LogOut,
} from 'lucide-react';

interface ClinicMembership {
  id: string;
  clinicId: string;
  role: string;
  clinic: {
    clinic_name: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
  };
}

interface ClinicProfile {
  id: string;
  clinic_name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
}

interface DoctorProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  clinic_name: string | null;
  clinic_id: string | null;
  location: string | null;
  specialty: string | null;
  website: string | null;
  address: string | null;
}

interface DoctorInviteResult {
  email: string;
  code: string;
  expiresAt: string;
}

export default function MasterPortal() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState<ClinicMembership[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [clinicProfile, setClinicProfile] = useState<ClinicProfile | null>(null);
  const [clinicProfileLoading, setClinicProfileLoading] = useState(false);
  const [clinicSaving, setClinicSaving] = useState(false);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [inviteForm, setInviteForm] = useState({ firstName: '', lastName: '', email: '' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [latestInvite, setLatestInvite] = useState<DoctorInviteResult | null>(null);
  const [editingDoctor, setEditingDoctor] = useState<DoctorProfile | null>(null);
  const [doctorEditingState, setDoctorEditingState] = useState({
    clinic_name: '',
    location: '',
    phone: '',
    website: '',
    address: '',
    specialty: '',
  });
  const [linkDoctorEmail, setLinkDoctorEmail] = useState('');
  const [linkingDoctor, setLinkingDoctor] = useState(false);
  const [currentTab, setCurrentTab] = useState<'clinic' | 'doctors' | 'team'>('clinic');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/master-login', { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user) {
      fetchClinicContext();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClinicId) {
      loadClinicProfile(selectedClinicId);
      loadClinicDoctors(selectedClinicId);
    } else {
      setClinicProfile(null);
      setDoctors([]);
    }
  }, [selectedClinicId]);

  const fetchClinicContext = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-user-clinic-context');
      if (error) {
        console.error('Error loading clinic memberships:', error);
        toast.error('Failed to load clinic memberships');
        return;
      }

      const ownerMemberships: ClinicMembership[] = (data?.memberships || [])
        .filter((m: any) => m.role === 'owner')
        .map((m: any) => ({
          id: m.id,
          clinicId: m.clinicId,
          role: m.role,
          clinic: {
            clinic_name: m.clinic?.clinic_name || 'Unnamed Clinic',
            address: m.clinic?.address,
            city: m.clinic?.city,
            state: m.clinic?.state,
            zip_code: m.clinic?.zip_code,
          },
        }));

      setMemberships(ownerMemberships);
      if (!selectedClinicId && ownerMemberships.length > 0) {
        setSelectedClinicId(ownerMemberships[0].clinicId);
      }
    } catch (err) {
      console.error('Unexpected error loading clinic context:', err);
      toast.error('Failed to load clinic context');
    }
  };

  const loadClinicProfile = async (clinicId: string) => {
    if (!clinicId) return;
    setClinicProfileLoading(true);

    const client = supabaseAdmin ?? supabase;
    try {
      const { data, error } = await client
        .from('clinic_profiles')
        .select('*')
        .eq('id', clinicId)
        .single();

      if (error) {
        console.error('Error fetching clinic profile:', error);
        toast.error('Failed to load clinic profile');
        setClinicProfile(null);
      } else {
        setClinicProfile(data as ClinicProfile);
      }
    } catch (err) {
      console.error('Unexpected error fetching clinic profile:', err);
      toast.error('Failed to load clinic profile');
      setClinicProfile(null);
    } finally {
      setClinicProfileLoading(false);
    }
  };

  const loadClinicDoctors = async (clinicId: string) => {
    if (!clinicId) return;
    if (!supabaseAdmin) {
      toast.error('Service role key is required to load doctors');
      return;
    }

    setDoctorLoading(true);
    try {
      const { data, error } = await supabaseAdmin
        .from('doctor_profiles')
        .select('id, first_name, last_name, email, phone, clinic_name, clinic_id, location, specialty, website, address')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading doctors:', error);
        toast.error('Failed to load doctor accounts');
        setDoctors([]);
      } else {
        setDoctors(data as DoctorProfile[]);
      }
    } catch (err) {
      console.error('Unexpected error loading doctors:', err);
      toast.error('Failed to load doctor accounts');
      setDoctors([]);
    } finally {
      setDoctorLoading(false);
    }
  };

  const handleClinicFieldChange = (field: keyof ClinicProfile, value: string) => {
    if (!clinicProfile) return;
    setClinicProfile({ ...clinicProfile, [field]: value });
  };

  const handleSaveClinicProfile = async () => {
    if (!clinicProfile || !supabaseAdmin) {
      toast.error('Cannot save clinic profile without service role access');
      return;
    }
    setClinicSaving(true);
    try {
      const { error } = await supabaseAdmin
        .from('clinic_profiles')
        .update({
          clinic_name: clinicProfile.clinic_name,
          address: clinicProfile.address,
          city: clinicProfile.city,
          state: clinicProfile.state,
          zip_code: clinicProfile.zip_code,
          phone: clinicProfile.phone,
          email: clinicProfile.email,
          website: clinicProfile.website,
          description: clinicProfile.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clinicProfile.id);

      if (error) {
        console.error('Error updating clinic profile:', error);
        toast.error('Failed to update clinic profile');
      } else {
        toast.success('Clinic profile updated');
        loadClinicProfile(clinicProfile.id);
      }
    } catch (err) {
      console.error('Unexpected error updating clinic profile:', err);
      toast.error('Failed to update clinic profile');
    } finally {
      setClinicSaving(false);
    }
  };

  const handleCreateDoctorInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedClinicId) {
      toast.error('Select a clinic first');
      return;
    }
    if (!inviteForm.email) {
      toast.error('Doctor email is required');
      return;
    }
    if (!supabaseAdmin) {
      toast.error('Service role key missing, cannot create invite');
      return;
    }

    setInviteLoading(true);
    try {
      const code = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const { error } = await supabaseAdmin
        .from('clinic_members')
        .insert({
          clinic_id: selectedClinicId,
          email: inviteForm.email.toLowerCase().trim(),
          first_name: inviteForm.firstName.trim() || null,
          last_name: inviteForm.lastName.trim() || null,
          role: 'doctor',
          permissions: {
            leads: true,
            content: true,
            payments: false,
            team: false,
          },
          status: 'pending',
          invited_by: user?.id || null,
          invitation_token: code,
          token_expires_at: expiresAt.toISOString(),
        });

      if (error) {
        console.error('Error creating doctor invite:', error);
        toast.error(error.message || 'Failed to create doctor invite');
      } else {
        setLatestInvite({
          email: inviteForm.email,
          code,
          expiresAt: expiresAt.toLocaleDateString(),
        });
        toast.success('Doctor invitation created. Share the code to let them join.');
        setInviteForm({ firstName: '', lastName: '', email: '' });
      }
    } catch (err) {
      console.error('Unexpected error creating doctor invite:', err);
      toast.error('Failed to create doctor invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleLinkExistingDoctor = async () => {
    if (!linkDoctorEmail || !selectedClinicId) {
      toast.error('Email and clinic are required');
      return;
    }
    if (!supabaseAdmin) {
      toast.error('Service role key is required');
      return;
    }

    setLinkingDoctor(true);
    try {
      const { data: doctor, error } = await supabaseAdmin
        .from('doctor_profiles')
        .select('id, clinic_id')
        .ilike('email', linkDoctorEmail.trim())
        .maybeSingle();

      if (error) {
        console.error('Error searching doctor:', error);
        toast.error('Failed to find doctor');
        return;
      }

      if (!doctor) {
        toast.error('No doctor account found for that email');
        return;
      }

      const { error: updateError } = await supabaseAdmin
        .from('doctor_profiles')
        .update({ clinic_id: selectedClinicId })
        .eq('id', doctor.id);

      if (updateError) {
        console.error('Error linking doctor:', updateError);
        toast.error('Failed to link doctor to clinic');
        return;
      }

      toast.success('Doctor linked to clinic');
      setLinkDoctorEmail('');
      loadClinicDoctors(selectedClinicId);
    } catch (err) {
      console.error('Unexpected error linking doctor:', err);
      toast.error('Failed to link doctor');
    } finally {
      setLinkingDoctor(false);
    }
  };

  const handleOpenDoctorPortal = async (doctor: DoctorProfile) => {
    if (!doctor.email) {
      toast.error('Doctor account has no email on file');
      return;
    }
    if (!supabaseAdmin) {
      toast.error('Service role key missing. Cannot create login link.');
      return;
    }

    try {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: doctor.email,
        options: {
          redirectTo: `${window.location.origin}/portal`,
        },
      });

      if (error) {
        console.error('Error generating login link:', error);
        toast.error('Failed to generate login link');
        return;
      }

      const actionLink = (data as any)?.properties?.action_link || (data as any)?.action_link;
      if (actionLink) {
        toast.success('Opening doctor portal...');
        window.location.href = actionLink;
      } else {
        toast.error('Failed to generate login link');
      }
    } catch (err) {
      console.error('Unexpected error generating login link:', err);
      toast.error('Failed to open doctor portal');
    }
  };

  const handleUnlinkDoctor = async (doctor: DoctorProfile) => {
    if (!supabaseAdmin) {
      toast.error('Service role key missing');
      return;
    }
    try {
      const { error } = await supabaseAdmin
        .from('doctor_profiles')
        .update({ clinic_id: null })
        .eq('id', doctor.id);

      if (error) {
        console.error('Error unlinking doctor:', error);
        toast.error('Failed to unlink doctor');
      } else if (selectedClinicId) {
        toast.success('Doctor unlinked from clinic');
        loadClinicDoctors(selectedClinicId);
      }
    } catch (err) {
      console.error('Unexpected error unlinking doctor:', err);
      toast.error('Failed to unlink doctor');
    }
  };

  const openDoctorEditor = (doctor: DoctorProfile) => {
    setEditingDoctor(doctor);
    setDoctorEditingState({
      clinic_name: doctor.clinic_name || '',
      location: doctor.location || '',
      phone: doctor.phone || '',
      website: doctor.website || '',
      address: doctor.address || '',
      specialty: doctor.specialty || '',
    });
  };

  const saveDoctorEdits = async () => {
    if (!editingDoctor) return;
    if (!supabaseAdmin) {
      toast.error('Service role key missing');
      return;
    }

    try {
      const { error } = await supabaseAdmin
        .from('doctor_profiles')
        .update({
          clinic_name: doctorEditingState.clinic_name || null,
          location: doctorEditingState.location || null,
          phone: doctorEditingState.phone || null,
          website: doctorEditingState.website || null,
          address: doctorEditingState.address || null,
          specialty: doctorEditingState.specialty || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingDoctor.id);

      if (error) {
        console.error('Error updating doctor:', error);
        toast.error('Failed to update doctor');
        return;
      }

      toast.success('Doctor profile updated');
      setEditingDoctor(null);
      if (selectedClinicId) {
        loadClinicDoctors(selectedClinicId);
      }
    } catch (err) {
      console.error('Unexpected error updating doctor:', err);
      toast.error('Failed to update doctor');
    }
  };

  const filteredDoctors = useMemo(() => {
    if (!doctorSearch) return doctors;
    return doctors.filter((doctor) => {
      const haystack = `${doctor.first_name || ''} ${doctor.last_name || ''} ${doctor.email || ''}`.toLowerCase();
      return haystack.includes(doctorSearch.toLowerCase());
    });
  }, [doctors, doctorSearch]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-600">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Loading master portal...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/master-login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="px-4 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold">
              MP
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-500">Master Portal</div>
              <div className="text-sm font-semibold text-slate-900">Clinic Admin</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          <button
            className={`w-full flex items-center rounded-full px-3 py-2 text-sm ${
              currentTab === 'clinic'
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => setCurrentTab('clinic')}
          >
            <Building className="mr-2 h-4 w-4" />
            Clinic Profile
          </button>
          <button
            className={`w-full flex items-center rounded-full px-3 py-2 text-sm ${
              currentTab === 'doctors'
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => setCurrentTab('doctors')}
          >
            <Stethoscope className="mr-2 h-4 w-4" />
            Doctor Accounts
          </button>
          <button
            className={`w-full flex items-center rounded-full px-3 py-2 text-sm ${
              currentTab === 'team'
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => setCurrentTab('team')}
          >
            <Users className="mr-2 h-4 w-4" />
            Clinic Team
          </button>
        </nav>
        <div className="px-3 py-3 border-t border-slate-200">
          <button
            className="w-full flex items-center justify-center gap-2 rounded-full text-red-600 px-3 py-2 text-sm hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-slate-500">Master Portal</p>
              <h1 className="text-3xl font-bold text-slate-900">Clinic Administration</h1>
              <p className="text-sm text-slate-600">
                Manage all doctor sub-accounts, clinic members, and clinic branding for your master clinic.
              </p>
            </div>
            {memberships.length > 0 && (
              <div className="flex flex-col gap-2 md:items-end">
                <span className="text-xs font-semibold uppercase text-slate-500">Active Clinic</span>
                <Select value={selectedClinicId ?? ''} onValueChange={(value) => setSelectedClinicId(value)}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    {memberships.map((membership) => (
                      <SelectItem key={membership.id} value={membership.clinicId}>
                        {membership.clinic.clinic_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {memberships.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>No master clinics found</CardTitle>
                <CardDescription>
                  Your account does not have an owner role for any clinics. Please contact support if you need master access.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/portal')}>Go back to Portal</Button>
              </CardContent>
            </Card>
          )}

          {memberships.length > 0 && (
            <Tabs
              value={currentTab}
              onValueChange={(v) => setCurrentTab(v as 'clinic' | 'doctors' | 'team')}
              className="space-y-4"
            >
              <TabsList className="hidden" />

              {/* Clinic profile tab */}
              <TabsContent value="clinic">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-slate-500" />
                      Clinic Profile
                    </CardTitle>
                    <CardDescription>
                      Update the clinic name, address, and branding details shown across all sub accounts.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {clinicProfileLoading && (
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading clinic profile...
                      </div>
                    )}

                    {!clinicProfileLoading && clinicProfile && (
                      <>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-sm font-medium text-slate-700">Clinic Name</label>
                            <Input
                              value={clinicProfile.clinic_name || ''}
                              onChange={(e) => handleClinicFieldChange('clinic_name', e.target.value)}
                              placeholder="Clinic Name"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-700">Website</label>
                            <Input
                              value={clinicProfile.website || ''}
                              onChange={(e) => handleClinicFieldChange('website', e.target.value)}
                              placeholder="https://example.com"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-sm font-medium text-slate-700">Phone</label>
                            <Input
                              value={clinicProfile.phone || ''}
                              onChange={(e) => handleClinicFieldChange('phone', e.target.value)}
                              placeholder="(555) 123-4567"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-700">Email</label>
                            <Input
                              value={clinicProfile.email || ''}
                              onChange={(e) => handleClinicFieldChange('email', e.target.value)}
                              placeholder="clinic@example.com"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-700">Address</label>
                          <Textarea
                            value={clinicProfile.address || ''}
                            onChange={(e) => handleClinicFieldChange('address', e.target.value)}
                            placeholder="123 Medical Plaza, Suite 100"
                          />
                          <div className="mt-3 grid gap-4 md:grid-cols-3">
                            <Input
                              value={clinicProfile.city || ''}
                              onChange={(e) => handleClinicFieldChange('city', e.target.value)}
                              placeholder="City"
                            />
                            <Input
                              value={clinicProfile.state || ''}
                              onChange={(e) => handleClinicFieldChange('state', e.target.value)}
                              placeholder="State"
                            />
                            <Input
                              value={clinicProfile.zip_code || ''}
                              onChange={(e) => handleClinicFieldChange('zip_code', e.target.value)}
                              placeholder="ZIP"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-700">Description</label>
                          <Textarea
                            value={clinicProfile.description || ''}
                            onChange={(e) => handleClinicFieldChange('description', e.target.value)}
                            placeholder="About this clinic"
                            rows={4}
                          />
                        </div>

                        <div className="flex justify-end">
                          <Button onClick={handleSaveClinicProfile} disabled={clinicSaving}>
                            {clinicSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Clinic Profile
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Doctors tab */}
              <TabsContent value="doctors">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5 text-slate-500" />
                        Doctor Accounts
                      </CardTitle>
                      <CardDescription>
                        View all doctor sub accounts linked to this clinic and take quick actions.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        placeholder="Search doctors by name or email..."
                        value={doctorSearch}
                        onChange={(e) => setDoctorSearch(e.target.value)}
                      />

                      {doctorLoading && (
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading doctor accounts...
                        </div>
                      )}

                      {!doctorLoading && filteredDoctors.length === 0 && (
                        <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                          No doctor accounts found for this clinic.
                        </div>
                      )}

                      <div className="space-y-3">
                        {filteredDoctors.map((doctor) => (
                          <Card key={doctor.id} className="border border-slate-200">
                            <CardContent className="space-y-3 py-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-base font-semibold text-slate-900">
                                    {doctor.first_name || doctor.last_name
                                      ? `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim()
                                      : 'Unnamed Doctor'}
                                  </div>
                                  <div className="text-xs text-slate-500">{doctor.email || 'No email on file'}</div>
                                </div>
                                <Badge variant="outline">{doctor.specialty || 'Provider'}</Badge>
                              </div>

                              <div className="grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                                {doctor.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                                    {doctor.phone}
                                  </div>
                                )}
                                {doctor.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                    {doctor.location}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" onClick={() => openDoctorEditor(doctor)}>
                                  <Building className="mr-1.5 h-4 w-4" />
                                  Edit Profile
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleOpenDoctorPortal(doctor)}>
                                  <LogIn className="mr-1.5 h-4 w-4" />
                                  Login as Doctor
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleUnlinkDoctor(doctor)}>
                                  <Unlink className="mr-1.5 h-4 w-4" />
                                  Unlink Clinic
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <UserPlus className="h-5 w-5 text-slate-500" />
                          Invite New Doctor
                        </CardTitle>
                        <CardDescription>Create an invitation code for a new doctor account.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form className="space-y-4" onSubmit={handleCreateDoctorInvite}>
                          <div className="grid gap-4 md:grid-cols-2">
                            <Input
                              placeholder="First name"
                              value={inviteForm.firstName}
                              onChange={(e) => setInviteForm((prev) => ({ ...prev, firstName: e.target.value }))}
                            />
                            <Input
                              placeholder="Last name"
                              value={inviteForm.lastName}
                              onChange={(e) => setInviteForm((prev) => ({ ...prev, lastName: e.target.value }))}
                            />
                          </div>
                          <Input
                            type="email"
                            placeholder="doctor@example.com"
                            value={inviteForm.email}
                            onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                            required
                          />
                          <Button type="submit" className="w-full" disabled={inviteLoading}>
                            {inviteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate Invitation Code
                          </Button>
                        </form>

                        {latestInvite && (
                          <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm">
                            <p className="font-semibold text-slate-900">Invitation generated!</p>
                            <p className="text-slate-600">Share this code with {latestInvite.email}:</p>
                            <div className="mt-2 flex items-center justify-between rounded-md bg-white px-3 py-2 font-mono text-sm">
                              <span>{latestInvite.code}</span>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  navigator.clipboard.writeText(latestInvite.code);
                                  toast.success('Invitation code copied');
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">Expires on {latestInvite.expiresAt}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Link2 className="h-5 w-5 text-slate-500" />
                          Link Existing Doctor
                        </CardTitle>
                        <CardDescription>
                          Assign a doctor account that already exists in Patient Pathway to this clinic.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Input
                          type="email"
                          placeholder="existing-doctor@example.com"
                          value={linkDoctorEmail}
                          onChange={(e) => setLinkDoctorEmail(e.target.value)}
                        />
                        <Button className="w-full" onClick={handleLinkExistingDoctor} disabled={linkingDoctor}>
                          {linkingDoctor && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Link Doctor Account
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Clinic team tab */}
              <TabsContent value="team">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-slate-500" />
                      Clinic Team Members
                    </CardTitle>
                    <CardDescription>Invite staff and managers to help manage this clinic.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TeamManagementPage />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <Dialog open={!!editingDoctor} onOpenChange={(open) => !open && setEditingDoctor(null)}>
          <DialogContent className="md:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Doctor Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Display Clinic Name"
                value={doctorEditingState.clinic_name}
                onChange={(e) => setDoctorEditingState((prev) => ({ ...prev, clinic_name: e.target.value }))}
              />
              <Input
                placeholder="Location"
                value={doctorEditingState.location}
                onChange={(e) => setDoctorEditingState((prev) => ({ ...prev, location: e.target.value }))}
              />
              <Input
                placeholder="Phone"
                value={doctorEditingState.phone}
                onChange={(e) => setDoctorEditingState((prev) => ({ ...prev, phone: e.target.value }))}
              />
              <Input
                placeholder="Website"
                value={doctorEditingState.website}
                onChange={(e) => setDoctorEditingState((prev) => ({ ...prev, website: e.target.value }))}
              />
              <Textarea
                placeholder="Address"
                value={doctorEditingState.address}
                onChange={(e) => setDoctorEditingState((prev) => ({ ...prev, address: e.target.value }))}
              />
              <Input
                placeholder="Specialty"
                value={doctorEditingState.specialty}
                onChange={(e) => setDoctorEditingState((prev) => ({ ...prev, specialty: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditingDoctor(null)}>
                Cancel
              </Button>
              <Button onClick={saveDoctorEdits}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

