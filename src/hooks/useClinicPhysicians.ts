import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ClinicPhysician {
  id: string;
  clinic_id: string;
  first_name: string;
  last_name: string;
  degree_type: 'MD' | 'DO';
  credentials: string[];
  mobile: string | null;
  email: string | null;
  bio: string | null;
  short_bio: string | null;
  headshot_url: string | null;
  note_image_url: string | null;
  full_shot_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface PhysicianFormData {
  first_name: string;
  last_name: string;
  degree_type: 'MD' | 'DO';
  credentials: string;
  mobile: string;
  email: string;
  bio: string;
  short_bio: string;
  headshot_url: string;
  full_shot_url: string;
}

const emptyPhysicianForm: PhysicianFormData = {
  first_name: '',
  last_name: '',
  degree_type: 'MD',
  credentials: '',
  mobile: '',
  email: '',
  bio: '',
  short_bio: '',
  headshot_url: '',
  full_shot_url: ''
};

export function useClinicPhysicians() {
  const { user } = useAuth();
  const [physicians, setPhysicians] = useState<ClinicPhysician[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);

  // Fetch clinic ID
  useEffect(() => {
    const fetchClinicId = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select('clinic_id')
        .eq('user_id', user.id)
        .single();
      
      if (!error && data?.clinic_id) {
        setClinicId(data.clinic_id);
      }
    };
    
    fetchClinicId();
  }, [user]);

  // Fetch physicians
  const fetchPhysicians = useCallback(async () => {
    if (!clinicId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinic_physicians')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      setPhysicians((data || []) as ClinicPhysician[]);
    } catch (error) {
      console.error('Error fetching physicians:', error);
      toast.error('Failed to load physicians');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    if (clinicId) {
      fetchPhysicians();
    }
  }, [clinicId]);

  // Add physician
  const addPhysician = async (formData: PhysicianFormData): Promise<ClinicPhysician | null> => {
    if (!clinicId) {
      toast.error('No clinic found');
      return null;
    }

    setSaving(true);
    try {
      const credentials = formData.credentials
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);

      const { data, error } = await supabase
        .from('clinic_physicians')
        .insert({
          clinic_id: clinicId,
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          degree_type: formData.degree_type,
          credentials,
          mobile: formData.mobile.trim() || null,
          email: formData.email.trim() || null,
          bio: formData.bio.trim() || null,
          short_bio: formData.short_bio.trim() || null,
          headshot_url: formData.headshot_url.trim() || null,
          full_shot_url: formData.full_shot_url.trim() || null,
          display_order: physicians.length
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Physician added successfully');
      await fetchPhysicians();
      return data as ClinicPhysician;
    } catch (error: any) {
      console.error('Error adding physician:', error);
      toast.error(error.message || 'Failed to add physician');
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Update physician
  const updatePhysician = async (id: string, formData: PhysicianFormData): Promise<boolean> => {
    setSaving(true);
    try {
      const credentials = formData.credentials
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);

      const { error } = await supabase
        .from('clinic_physicians')
        .update({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          degree_type: formData.degree_type,
          credentials,
          mobile: formData.mobile.trim() || null,
          email: formData.email.trim() || null,
          bio: formData.bio.trim() || null,
          short_bio: formData.short_bio.trim() || null,
          headshot_url: formData.headshot_url.trim() || null,
          full_shot_url: formData.full_shot_url.trim() || null
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Physician updated successfully');
      await fetchPhysicians();
      return true;
    } catch (error: any) {
      console.error('Error updating physician:', error);
      toast.error(error.message || 'Failed to update physician');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Delete physician (soft delete)
  const deletePhysician = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('clinic_physicians')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Physician removed');
      await fetchPhysicians();
      return true;
    } catch (error: any) {
      console.error('Error deleting physician:', error);
      toast.error(error.message || 'Failed to remove physician');
      return false;
    }
  };

  return {
    physicians,
    loading,
    saving,
    clinicId,
    addPhysician,
    updatePhysician,
    deletePhysician,
    refetch: fetchPhysicians,
    emptyForm: emptyPhysicianForm
  };
}
