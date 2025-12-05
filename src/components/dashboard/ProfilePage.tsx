import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar,
  Camera,
  Save,
  Upload,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { getOrCreateDoctorProfile, DoctorProfile } from '@/lib/profileUtils';
import { useClinicPhysicians, ClinicPhysician, PhysicianFormData } from '@/hooks/useClinicPhysicians';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [userRole, setUserRole] = useState<string>('owner');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    avatar_url: '',
    doctor_id: ''
  });
  const [teamMemberData, setTeamMemberData] = useState({
    first_name: '',
    last_name: ''
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [physicianProfile, setPhysicianProfile] = useState<ClinicPhysician | null>(null);
  const { updatePhysician, emptyForm } = useClinicPhysicians();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [physicianFormData, setPhysicianFormData] = useState<PhysicianFormData>(emptyForm);

  useEffect(() => {
    if (user) {
      fetchDoctorProfile();
    }
  }, [user]);

  const fetchDoctorProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // First, get the current user's profile to check if they're staff/manager
      const { data: userProfiles, error: fetchError } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('Error fetching doctor profiles:', fetchError);
        setError('Failed to fetch doctor profile');
        return;
      }

      let profile = null;
      let userProfile = null;

      if (!userProfiles || userProfiles.length === 0) {
        // No profile exists, create one (regular doctor)
        profile = await getOrCreateDoctorProfile(user.id, user.email || undefined);
        setIsTeamMember(false);
        setUserRole('owner');
      } else {
        userProfile = userProfiles[0];
        
        // Check if user is staff
        if (userProfile.is_staff) {
          setIsTeamMember(true);
          setUserRole('staff');
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
          setIsTeamMember(false);
          // Regular doctor, use their own profile
          profile = userProfile;
        }
      }

      // Fetch role from clinic_members if available
      if (userProfile?.clinic_id) {
        const { data: clinicMember } = await supabase
          .from('clinic_members')
          .select('role')
          .eq('user_id', user.id)
          .eq('clinic_id', userProfile.clinic_id)
          .single();
        
        if (clinicMember?.role) {
          setUserRole(clinicMember.role);
          if (clinicMember.role === 'physician') {
            // Fetch physician-specific profile
            const { data: physicianData, error: physicianError } = await supabase
              .from('clinic_physicians')
              .select('*')
              .eq('email', user.email)
              .single();

            if (physicianError) {
              console.error('Error fetching physician profile:', physicianError);
            } else {
              setPhysicianProfile(physicianData);
              setPhysicianFormData({
                first_name: physicianData.first_name,
                last_name: physicianData.last_name,
                degree_type: physicianData.degree_type,
                credentials: (physicianData.credentials || []).join(', '),
                mobile: physicianData.mobile || '',
                email: physicianData.email || '',
                bio: physicianData.bio || '',
                headshot_url: physicianData.headshot_url || ''
              });
            }
          }
        }
      }
      
      if (profile) {
        setDoctorProfile(profile);
        
        if (userProfile?.is_staff) {
          // For team members, separate personal data from clinic data
          setFormData({
            first_name: userProfile.first_name || '', // Personal data
            last_name: userProfile.last_name || '', // Personal data
            email: profile.email || user.email || '', // Clinic data
            phone: profile.phone || '', // Clinic data
            avatar_url: profile.avatar_url || '', // Clinic data
            doctor_id: profile.doctor_id || '' // Clinic data
          });
          setTeamMemberData({
            first_name: userProfile.first_name || '',
            last_name: userProfile.last_name || ''
          });
        } else {
          // Regular doctor, use their own profile
          setFormData({
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            email: profile.email || user.email || '',
            phone: profile.phone || '',
            avatar_url: profile.avatar_url || '',
            doctor_id: profile.doctor_id || ''
          });
        }
      } else {
        setError('Failed to fetch or create doctor profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent any default behavior that might cause page reload
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image must be less than 5MB');
      return;
    }

    // Store the selected file for later upload
    setSelectedFile(file);
    
    // Create a preview URL for immediate display
    const previewUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, avatar_url: previewUrl }));
    
    toast.success('Image selected! Click "Save Profile" to upload and save your changes.');
    
    // Clear the input value to allow selecting the same file again
    event.target.value = '';
  };

  const handleSave = async () => {
    if (!user) return;

    if (userRole === 'physician') {
      if (!physicianProfile) return;
      setSaving(true);
      try {
        await updatePhysician(physicianProfile.id, physicianFormData);
        setDialogOpen(false);
        await fetchDoctorProfile();
      } catch (error) {
        console.error('Error updating physician profile:', error);
      } finally {
        setSaving(false);
      }
      return;
    }
    
    // Validate names
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error('Please enter both first name and last name');
      return;
    }

    setSaving(true);
    try {
      // Unified update for non-physician users: allow owner/staff to update the displayed clinic/doctor profile
      let finalAvatarUrl = formData.avatar_url;

      // If there's a selected file, upload it first
      if (selectedFile) {
        setUploading(true);
        try {
          const fileExt = selectedFile.name.split('.').pop();
          const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
          const filePath = `avatars/${fileName}`;

          // Delete old avatar if exists on the displayed profile
          if (doctorProfile?.avatar_url && !doctorProfile.avatar_url.startsWith('blob:')) {
            try {
              const urlParts = doctorProfile.avatar_url.split('/');
              const oldFileName = urlParts[urlParts.length - 1];
              if (oldFileName && oldFileName.includes('avatar-')) {
                await supabase.storage
                  .from('profiles')
                  .remove([`avatars/${oldFileName}`]);
              }
            } catch (error) {
              console.warn('Could not delete old avatar:', error);
            }
          }

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('profiles')
            .upload(filePath, selectedFile, {
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) {
            console.error('Upload error details:', uploadError);
            throw uploadError;
          }

          const { data: urlData } = supabase.storage
            .from('profiles')
            .getPublicUrl(filePath);

          finalAvatarUrl = urlData.publicUrl;

          if (formData.avatar_url.startsWith('blob:')) {
            URL.revokeObjectURL(formData.avatar_url);
          }
        } catch (error: any) {
          console.error('Error uploading image:', error);
          toast.error('Failed to upload profile picture', {
            description: error.message || 'Please try again later'
          });
          setUploading(false);
          setSaving(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      const profileData = {
        user_id: user.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        avatar_url: finalAvatarUrl,
        doctor_id: formData.doctor_id || generateDoctorId(),
        updated_at: new Date().toISOString()
      };

      // Update the displayed doctor profile (which may be the clinic/main doctor for team members)
      if (doctorProfile?.id) {
        const { error } = await supabase
          .from('doctor_profiles')
          .update(profileData)
          .eq('id', doctorProfile.id);

        if (error) throw error;
      } else {
        // Fallback: update/create a doctor_profile tied to this user if no displayed profile
        const { data: existingProfiles, error: fetchError } = await supabase
          .from('doctor_profiles')
          .select('id')
          .eq('user_id', user.id);

        if (fetchError) throw fetchError;

        if (existingProfiles && existingProfiles.length > 0) {
          const { error } = await supabase
            .from('doctor_profiles')
            .update(profileData)
            .eq('id', existingProfiles[0].id);
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from('doctor_profiles')
            .insert([profileData])
            .select();
          if (error) throw error;
          if (data && data.length > 0) {
            setDoctorProfile(data[0]);
          }
        }
      }

      // Also update the personal profile record for the user (first/last) if present
      try {
        const { data: personalProfiles } = await supabase
          .from('doctor_profiles')
          .select('id')
          .eq('user_id', user.id);

        if (personalProfiles && personalProfiles.length > 0) {
          await supabase
            .from('doctor_profiles')
            .update({ first_name: formData.first_name, last_name: formData.last_name, updated_at: new Date().toISOString() })
            .eq('user_id', user.id);
        }
      } catch (err) {
        console.warn('Could not update personal profile record:', err);
      }

      const hadFileToUpload = !!selectedFile;
      setFormData(prev => ({ ...prev, avatar_url: finalAvatarUrl }));
      setSelectedFile(null);

      setSuccessMessage('Profile updated successfully! All changes have been saved.');
      if (hadFileToUpload) {
        toast.success('Profile updated successfully!', {
          description: 'Your profile information and profile picture have been saved.',
          duration: 3000
        });
      } else {
        toast.success('Profile updated successfully!', {
          description: 'Your profile information has been saved.',
          duration: 3000
        });
      }
      
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(null), 3000);
    
    // Refresh doctor profile
    await fetchDoctorProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const generateDoctorId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const getInitials = () => {
    if (isTeamMember) {
      if (teamMemberData.first_name && teamMemberData.last_name) {
        return (teamMemberData.first_name.charAt(0) + teamMemberData.last_name.charAt(0)).toUpperCase();
      }
    } else {
      if (formData.first_name && formData.last_name) {
        return (formData.first_name.charAt(0) + formData.last_name.charAt(0)).toUpperCase();
      }
    }
    if (formData.email) {
      return formData.email.substring(0, 2).toUpperCase();
    }
    return isTeamMember ? 'TM' : 'DR';
  };

  const getRoleDisplayName = () => {
    const roleMap: Record<string, string> = {
      owner: 'Owner',
      staff: 'Staff',
      physician: 'Physician'
    };
    return roleMap[userRole] || 'User';
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0E7C9D]"></div>
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Profile</h3>
          <p className="text-red-700">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Show success message if exists */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 left-4 z-50 mx-auto max-w-md"
          >
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-green-800 font-medium">{successMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#0E7C9D] to-[#FD904B] bg-clip-text text-transparent mb-4">
          {getRoleDisplayName()} Profile
        </h1>
        <p className="text-gray-600 text-lg">
          Manage your professional information and account settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="rounded-3xl shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
            <CardTitle className='text-2xl font-bold text-[#0E7C9D] text-center mt-2 items-center'>
              Profile Details
            </CardTitle>
          <CardContent className="p-8 text-center">
            <div className="relative inline-block mb-6">
              <Avatar className="w-32 h-32 ring-4 ring-[#0E7C9D]/20">
                {formData.avatar_url ? (
                  <AvatarImage 
                    src={formData.avatar_url} 
                    alt={isTeamMember ? `${teamMemberData.first_name} ${teamMemberData.last_name}` : `${formData.first_name} ${formData.last_name}`}
                    onError={(e) => {
                      console.error('Avatar image failed to load:', e);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : null}
                <AvatarFallback className="bg-gradient-to-r from-[#0E7C9D] to-[#FD904B] text-white text-3xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
                <button 
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('avatar-upload') as HTMLInputElement;
                    input?.click();
                  }}
                  disabled={saving || uploading}
                  className={`absolute bottom-2 right-2 bg-[#0E7C9D] text-white p-2 rounded-full cursor-pointer hover:bg-[#0E7C9D]/90 transition-colors shadow-lg ${saving || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {uploading ? <Upload className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                disabled={saving || uploading}
                className="hidden"
              />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {isTeamMember ? `${teamMemberData.first_name} ${teamMemberData.last_name}` : `${formData.first_name} ${formData.last_name}`}
            </h2>
            <Badge className="bg-[#0E7C9D]/10 text-[#0E7C9D] px-4 py-2 rounded-2xl mb-4">
              {getRoleDisplayName()}
            </Badge>
            
            {formData.doctor_id && (
              <Badge className="bg-[#0E7C9D] text-white px-4 py-2 rounded-2xl mb-4 ml-2">
                ID: {formData.doctor_id}
              </Badge>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-3xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-[#0E7C9D] flex items-center gap-2">
                <User className="w-6 h-6" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={isTeamMember ? teamMemberData.first_name : formData.first_name}
                    onChange={(e) => {
                      if (isTeamMember) {
                        setTeamMemberData(prev => ({ ...prev, first_name: e.target.value }));
                      } else {
                        setFormData(prev => ({ ...prev, first_name: e.target.value }));
                      }
                    }}
                    className="rounded-2xl"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={isTeamMember ? teamMemberData.last_name : formData.last_name}
                    onChange={(e) => {
                      if (isTeamMember) {
                        setTeamMemberData(prev => ({ ...prev, last_name: e.target.value }));
                      } else {
                        setFormData(prev => ({ ...prev, last_name: e.target.value }));
                      }
                    }}
                    className="rounded-2xl"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">{isTeamMember ? "Clinic's Email Address" : "Email Address"}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="rounded-2xl"
                  disabled={saving || uploading}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">{isTeamMember ? "Clinic's Phone Number" : "Phone Number"}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="rounded-2xl"
                  disabled={saving || uploading}
                />
              </div>

              {userRole === 'physician' && physicianProfile && (
                <>
                  <div>
                    <Label htmlFor="degree_type">Degree Type</Label>
                    <Input id="degree_type" value={physicianProfile.degree_type} disabled />
                  </div>
                  <div>
                    <Label htmlFor="credentials">Credentials</Label>
                    <Input id="credentials" value={physicianProfile.credentials.join(', ')} disabled />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Input id="bio" value={physicianProfile.bio || ''} disabled />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {userRole === 'physician' ? (
            <Button
              onClick={() => setDialogOpen(true)}
              className="w-full py-4 bg-gradient-to-r from-[#0E7C9D] to-[#FD904B] hover:from-[#0E7C9D]/90 hover:to-[#FD904B]/90 rounded-2xl text-lg font-semibold shadow-lg"
            >
              Edit Physician Details
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={saving || uploading}
              className="w-full py-4 bg-gradient-to-r from-[#0E7C9D] to-[#FD904B] hover:from-[#0E7C9D]/90 hover:to-[#FD904B]/90 rounded-2xl text-lg font-semibold shadow-lg"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </div>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {isTeamMember ? "Save Personal Information" : "Save Profile"}
                </>
              )}
            </Button>
          )}
          
          {isTeamMember && (
            <div className="w-full py-3 bg-blue-50 border border-blue-200 rounded-2xl text-center text-blue-700 text-sm font-medium">
              <Building className="w-4 h-4 mr-2 inline" />
              You can only edit your personal name. Clinic information is managed by the main doctor.
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Physician Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Headshot */}
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={physicianFormData.headshot_url} />
                <AvatarFallback>
                  {physicianFormData.first_name.charAt(0)}{physicianFormData.last_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label>Headshot URL</Label>
                <Input
                  value={physicianFormData.headshot_url}
                  onChange={(e) => setPhysicianFormData(p => ({ ...p, headshot_url: e.target.value }))}
                  placeholder="https://example.com/headshot.jpg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload images in the Assets Library and paste the URL here
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input
                  value={physicianFormData.first_name}
                  onChange={(e) => setPhysicianFormData(p => ({ ...p, first_name: e.target.value }))}
                  placeholder="Ryan"
                />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input
                  value={physicianFormData.last_name}
                  onChange={(e) => setPhysicianFormData(p => ({ ...p, last_name: e.target.value }))}
                  placeholder="Vaughn"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Degree Type</Label>
                <Select
                  value={physicianFormData.degree_type}
                  onValueChange={(v) => setPhysicianFormData(p => ({ ...p, degree_type: v as 'MD' | 'DO' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MD">MD (Doctor of Medicine)</SelectItem>
                    <SelectItem value="DO">DO (Doctor of Osteopathic Medicine)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Credentials</Label>
                <Input
                  value={physicianFormData.credentials}
                  onChange={(e) => setPhysicianFormData(p => ({ ...p, credentials: e.target.value }))}
                  placeholder="FACS, FAAO (comma-separated)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mobile</Label>
                <Input
                  value={physicianFormData.mobile}
                  onChange={(e) => setPhysicianFormData(p => ({ ...p, mobile: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={physicianFormData.email}
                  onChange={(e) => setPhysicianFormData(p => ({ ...p, email: e.target.value }))}
                  placeholder="dr.vaughn@clinic.com"
                />
              </div>
            </div>

            <div>
              <Label>Bio</Label>
              <Textarea
                value={physicianFormData.bio}
                onChange={(e) => setPhysicianFormData(p => ({ ...p, bio: e.target.value }))}
                placeholder="Dr. Vaughn specializes in..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !physicianFormData.first_name.trim() || !physicianFormData.last_name.trim()}
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              Update Physician
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
