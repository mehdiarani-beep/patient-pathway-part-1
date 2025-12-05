import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Building, MapPin, Stethoscope, Users, FolderOpen, Save } from 'lucide-react';
import { BusinessInfoSection } from './config/BusinessInfoSection';
import { LocationsSection } from './config/LocationsSection';
import { PhysiciansSection } from './config/PhysiciansSection';
import { TeamManagementPage } from './TeamManagementPage';
import { AssetsLibraryPage } from './AssetsLibraryPage';

interface BusinessInfo {
  clinic_name: string;
  website: string;
  phone: string;
  owner_name: string;
  owner_mobile: string;
  owner_email: string;
  logo_url: string;
  avatar_url: string;
}

export function ConfigurationPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [doctorProfileId, setDoctorProfileId] = useState<string | null>(null);
  
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    clinic_name: '',
    website: '',
    phone: '',
    owner_name: '',
    owner_mobile: '',
    owner_email: '',
    logo_url: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (user) {
      fetchClinicData();
    }
  }, [user]);

  const fetchClinicData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get doctor profile with clinic info
      const { data: profile, error: profileError } = await supabase
        .from('doctor_profiles')
        .select('id, clinic_id, clinic_name, phone, website, logo_url, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (profile) {
        setDoctorProfileId(profile.id);
        setClinicId(profile.clinic_id);

        // If clinic exists, fetch clinic profile data
        if (profile.clinic_id) {
          const { data: clinic, error: clinicError } = await supabase
            .from('clinic_profiles')
            .select('*')
            .eq('id', profile.clinic_id)
            .single();

          if (!clinicError && clinic) {
            setBusinessInfo({
              clinic_name: clinic.clinic_name || '',
              website: clinic.website || '',
              phone: clinic.phone || '',
              owner_name: clinic.owner_name || '',
              owner_mobile: clinic.owner_mobile || '',
              owner_email: clinic.owner_email || '',
              logo_url: clinic.logo_url || '',
              avatar_url: clinic.avatar_url || ''
            });
          }
        } else {
          // Use doctor profile data if no clinic
          setBusinessInfo({
            clinic_name: profile.clinic_name || '',
            website: profile.website || '',
            phone: profile.phone || '',
            owner_name: '',
            owner_mobile: '',
            owner_email: user.email || '',
            logo_url: profile.logo_url || '',
            avatar_url: profile.avatar_url || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching clinic data:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessInfoChange = (field: keyof BusinessInfo, value: string) => {
    setBusinessInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      setBusinessInfo(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      toast.success('Logo uploaded!');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      setBusinessInfo(prev => ({ ...prev, avatar_url: urlData.publicUrl }));
      toast.success('Avatar uploaded!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveBusinessInfo = async () => {
    if (!user || !businessInfo.clinic_name.trim()) {
      toast.error('Clinic name is required');
      return;
    }

    setSaving(true);
    try {
      if (clinicId) {
        // Update existing clinic profile
        const { error } = await supabase
          .from('clinic_profiles')
          .update({
            clinic_name: businessInfo.clinic_name.trim(),
            website: businessInfo.website.trim() || null,
            phone: businessInfo.phone.trim() || null,
            owner_name: businessInfo.owner_name.trim() || null,
            owner_mobile: businessInfo.owner_mobile.trim() || null,
            owner_email: businessInfo.owner_email.trim() || null,
            logo_url: businessInfo.logo_url.trim() || null,
            avatar_url: businessInfo.avatar_url.trim() || null
          })
          .eq('id', clinicId);

        if (error) throw error;
      } else {
        // Create new clinic profile
        const { data: newClinic, error: createError } = await supabase
          .from('clinic_profiles')
          .insert({
            clinic_name: businessInfo.clinic_name.trim(),
            website: businessInfo.website.trim() || null,
            phone: businessInfo.phone.trim() || null,
            owner_name: businessInfo.owner_name.trim() || null,
            owner_mobile: businessInfo.owner_mobile.trim() || null,
            owner_email: businessInfo.owner_email.trim() || null,
            logo_url: businessInfo.logo_url.trim() || null,
            avatar_url: businessInfo.avatar_url.trim() || null,
            created_by: user.id
          })
          .select()
          .single();

        if (createError) throw createError;

        // Link clinic to doctor profile
        if (newClinic && doctorProfileId) {
          await supabase
            .from('doctor_profiles')
            .update({ clinic_id: newClinic.id })
            .eq('id', doctorProfileId);
          
          setClinicId(newClinic.id);
        }
      }

      // Also update doctor_profiles for backward compatibility
      if (doctorProfileId) {
        await supabase
          .from('doctor_profiles')
          .update({
            clinic_name: businessInfo.clinic_name.trim(),
            phone: businessInfo.phone.trim() || null,
            website: businessInfo.website.trim() || null,
            logo_url: businessInfo.logo_url.trim() || null,
            avatar_url: businessInfo.avatar_url.trim() || null
          })
          .eq('id', doctorProfileId);
      }

      toast.success('Business information saved!');
    } catch (error: any) {
      console.error('Error saving business info:', error);
      toast.error(error.message || 'Failed to save business information');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Clinic Configuration</h2>
          <p className="text-muted-foreground">Manage your clinic information, locations, and physicians</p>
        </div>
        <Button onClick={handleSaveBusinessInfo} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="business" className="gap-2">
            <Building className="w-4 h-4" />
            <span className="hidden sm:inline">Business</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-2">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Locations</span>
          </TabsTrigger>
          <TabsTrigger value="physicians" className="gap-2">
            <Stethoscope className="w-4 h-4" />
            <span className="hidden sm:inline">Physicians</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Team</span>
          </TabsTrigger>
          <TabsTrigger value="assets" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Assets</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <BusinessInfoSection
            data={businessInfo}
            onChange={handleBusinessInfoChange}
            onLogoUpload={handleLogoUpload}
            onAvatarUpload={handleAvatarUpload}
            uploadingLogo={uploadingLogo}
            uploadingAvatar={uploadingAvatar}
          />
        </TabsContent>

        <TabsContent value="locations">
          <LocationsSection clinicId={clinicId} />
        </TabsContent>

        <TabsContent value="physicians">
          <PhysiciansSection />
        </TabsContent>

        <TabsContent value="team">
          <TeamManagementPage />
        </TabsContent>

        <TabsContent value="assets">
          <AssetsLibraryPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
