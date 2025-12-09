import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Building, MapPin, Stethoscope, Users, FolderOpen, Save, Palette } from 'lucide-react';
import { BusinessInfoSection } from './config/BusinessInfoSection';
import { LocationsSection } from './config/LocationsSection';
import { PhysiciansSection } from './config/PhysiciansSection';
import { TeamManagementPage } from './TeamManagementPage';
import { AssetsLibraryPage } from './AssetsLibraryPage';
import { BrandKitSection } from './config/BrandKitSection';

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

interface BrandKitInfo {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  heading_font: string;
  body_font: string;
  tagline: string;
  logo_icon_url: string;
}

export function ConfigurationPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [doctorProfileId, setDoctorProfileId] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
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

  const [brandKit, setBrandKit] = useState<BrandKitInfo>({
    primary_color: '#0063A0',
    secondary_color: '#0796CC',
    accent_color: '#F7904F',
    background_color: '#FFFFFF',
    heading_font: 'Inter',
    body_font: 'Inter',
    tagline: '',
    logo_icon_url: ''
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
      const physicianID = new URLSearchParams(window.location.search).get('physicianID');
      const doctorIdparam = new URLSearchParams(window.location.search).get('id');
  
      // Only query clinic_physicians if we have a valid physicianID that differs from doctorIdparam
      if (physicianID && physicianID !== 'null' && physicianID === doctorIdparam) {
        // The user is a physician, so fetch their data from the clinic_physicians table
        const { data: physician, error: physicianError } = await supabase
          .from('clinic_physicians')
          .select('*')
          .eq('id', physicianID)
          .maybeSingle();
  
        if (physicianError) {
          console.error('Error fetching physician:', physicianError);
        }
  
        if (physician) {
          setBusinessInfo({
            clinic_name: physician.first_name + ' ' + physician.last_name || '',
            website: '',
            phone: physician.mobile || '',
            owner_name: '',
            owner_mobile: '',
            owner_email: physician.email || '',
            logo_url: physician.headshot_url || '',
            avatar_url: physician.headshot_url || ''
          });
          setLoading(false);
          return;
        }
      }
      
      // Default: fetch clinic data for the logged-in user
      const { data: profile, error: profileError } = await supabase
        .from('doctor_profiles')
        .select('id, clinic_id, clinic_name, phone, website, logo_url, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (profile) {
        setDoctorProfileId(profile.id);
        setClinicId(profile.clinic_id);

        if (profile.clinic_id) {
          const { data: clinic, error: clinicError } = await supabase
            .from('clinic_profiles')
            .select('*')
            .eq('id', profile.clinic_id)
            .maybeSingle();

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
            setBrandKit({
              primary_color: clinic.primary_color || '#0063A0',
              secondary_color: clinic.secondary_color || '#0796CC',
              accent_color: clinic.accent_color || '#F7904F',
              background_color: clinic.background_color || '#FFFFFF',
              heading_font: clinic.heading_font || 'Inter',
              body_font: clinic.body_font || 'Inter',
              tagline: clinic.tagline || '',
              logo_icon_url: clinic.logo_icon_url || ''
            });
          }
        } else {
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
      console.error('Error fetching data:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessInfoChange = (field: keyof BusinessInfo, value: string) => {
    setBusinessInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleBrandKitChange = (field: keyof BrandKitInfo, value: string) => {
    setBrandKit(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clinicId) return;

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${clinicId}/logo-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('clinic-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('clinic-assets')
        .getPublicUrl(fileName);

      setBusinessInfo(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clinicId) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${clinicId}/avatar-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('clinic-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('clinic-assets')
        .getPublicUrl(fileName);

      setBusinessInfo(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Avatar uploaded successfully');
    } catch (error) {
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
        // Update existing clinic profile with business info and brand kit
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
            avatar_url: businessInfo.avatar_url.trim() || null,
            primary_color: brandKit.primary_color || null,
            secondary_color: brandKit.secondary_color || null,
            accent_color: brandKit.accent_color || null,
            background_color: brandKit.background_color || null,
            heading_font: brandKit.heading_font || null,
            body_font: brandKit.body_font || null,
            tagline: brandKit.tagline?.trim() || null,
            logo_icon_url: brandKit.logo_icon_url || null
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="business" className="gap-2">
            <Building className="w-4 h-4" />
            <span className="hidden sm:inline">Business</span>
          </TabsTrigger>
          <TabsTrigger value="brandkit" className="gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Brand Kit</span>
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

        <TabsContent value="brandkit">
          <BrandKitSection
            data={{
              ...brandKit,
              logo_url: businessInfo.logo_url,
              avatar_url: businessInfo.avatar_url
            }}
            onChange={handleBrandKitChange}
            clinicId={clinicId}
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
