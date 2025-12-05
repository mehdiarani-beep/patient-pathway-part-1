import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ClinicAsset {
  id: string;
  clinic_id: string;
  name: string;
  file_type: 'image' | 'pdf' | 'video' | 'vector' | 'document' | 'other';
  mime_type: string | null;
  url: string;
  storage_path: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  metadata: Record<string, any>;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export type AssetFileType = 'all' | 'image' | 'pdf' | 'video' | 'vector' | 'document' | 'other';

const getFileType = (mimeType: string, fileName: string): ClinicAsset['file_type'] => {
  if (mimeType.startsWith('image/')) {
    if (mimeType === 'image/svg+xml') return 'vector';
    return 'image';
  }
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.includes('word') || mimeType.includes('document') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'document';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return 'document';
  if (fileName.endsWith('.svg') || fileName.endsWith('.ai') || fileName.endsWith('.eps')) return 'vector';
  return 'other';
};

export function useClinicAssets() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<ClinicAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [filter, setFilter] = useState<AssetFileType>('all');

  // Fetch clinic ID from doctor profile
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

  // Fetch assets
  const fetchAssets = useCallback(async () => {
    if (!clinicId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      let query = supabase
        .from('clinic_assets')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });
      
      if (filter !== 'all') {
        query = query.eq('file_type', filter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setAssets((data || []) as ClinicAsset[]);
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [clinicId, filter]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Upload file
  const uploadFile = async (file: File): Promise<ClinicAsset | null> => {
    if (!clinicId || !user) {
      toast.error('No clinic found. Please set up your clinic first.');
      return null;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${clinicId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('clinic-assets')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('clinic-assets')
        .getPublicUrl(fileName);
      
      // Get image dimensions if it's an image
      let width: number | null = null;
      let height: number | null = null;
      
      if (file.type.startsWith('image/')) {
        const dimensions = await getImageDimensions(file);
        width = dimensions.width;
        height = dimensions.height;
      }
      
      // Insert into database
      const fileType = getFileType(file.type, file.name);
      const { data: assetData, error: dbError } = await supabase
        .from('clinic_assets')
        .insert({
          clinic_id: clinicId,
          name: file.name,
          file_type: fileType,
          mime_type: file.type,
          url: publicUrl,
          storage_path: fileName,
          file_size: file.size,
          width,
          height,
          uploaded_by: user.id
        })
        .select()
        .single();
      
      if (dbError) throw dbError;
      
      toast.success('File uploaded successfully');
      await fetchAssets();
      return assetData as ClinicAsset;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Failed to upload file');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Upload from URL
  const uploadFromUrl = async (url: string, name?: string): Promise<ClinicAsset | null> => {
    if (!clinicId || !user) {
      toast.error('No clinic found. Please set up your clinic first.');
      return null;
    }

    setUploading(true);
    try {
      // Determine file type from URL
      const urlPath = new URL(url).pathname;
      const extension = urlPath.split('.').pop()?.toLowerCase() || '';
      const fileName = name || urlPath.split('/').pop() || `asset-${Date.now()}`;
      
      let fileType: ClinicAsset['file_type'] = 'other';
      let mimeType = '';
      
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
        fileType = 'image';
        mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
      } else if (extension === 'svg') {
        fileType = 'vector';
        mimeType = 'image/svg+xml';
      } else if (extension === 'pdf') {
        fileType = 'pdf';
        mimeType = 'application/pdf';
      } else if (['mp4', 'webm', 'mov'].includes(extension)) {
        fileType = 'video';
        mimeType = `video/${extension}`;
      }
      
      // Insert into database (storing external URL directly)
      const { data: assetData, error: dbError } = await supabase
        .from('clinic_assets')
        .insert({
          clinic_id: clinicId,
          name: fileName,
          file_type: fileType,
          mime_type: mimeType || null,
          url: url,
          storage_path: null, // External URL, not stored in our bucket
          uploaded_by: user.id
        })
        .select()
        .single();
      
      if (dbError) throw dbError;
      
      toast.success('Asset added from URL');
      await fetchAssets();
      return assetData as ClinicAsset;
    } catch (error: any) {
      console.error('Error adding from URL:', error);
      toast.error(error.message || 'Failed to add asset from URL');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Delete asset
  const deleteAsset = async (asset: ClinicAsset): Promise<boolean> => {
    try {
      // Delete from storage if it's stored there
      if (asset.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('clinic-assets')
          .remove([asset.storage_path]);
        
        if (storageError) {
          console.error('Error deleting from storage:', storageError);
        }
      }
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('clinic_assets')
        .delete()
        .eq('id', asset.id);
      
      if (dbError) throw dbError;
      
      toast.success('Asset deleted');
      await fetchAssets();
      return true;
    } catch (error: any) {
      console.error('Error deleting asset:', error);
      toast.error(error.message || 'Failed to delete asset');
      return false;
    }
  };

  // Update asset name
  const updateAssetName = async (assetId: string, newName: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('clinic_assets')
        .update({ name: newName })
        .eq('id', assetId);
      
      if (error) throw error;
      
      toast.success('Asset renamed');
      await fetchAssets();
      return true;
    } catch (error: any) {
      console.error('Error renaming asset:', error);
      toast.error(error.message || 'Failed to rename asset');
      return false;
    }
  };

  const filteredAssets = filter === 'all' ? assets : assets.filter(a => a.file_type === filter);

  return {
    assets: filteredAssets,
    allAssets: assets,
    loading,
    uploading,
    clinicId,
    filter,
    setFilter,
    uploadFile,
    uploadFromUrl,
    deleteAsset,
    updateAssetName,
    refetch: fetchAssets
  };
}

// Helper to get image dimensions
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
    };
    img.src = URL.createObjectURL(file);
  });
}
