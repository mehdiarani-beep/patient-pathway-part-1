import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Globe,
  Loader2,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube
} from 'lucide-react';

interface ClinicLocation {
  id: string;
  clinic_id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  social_links: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  } | null;
  google_business_url: string | null;
}

interface LocationsSectionProps {
  clinicId: string | null;
}

const emptyLocation = {
  name: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  phone: '',
  email: '',
  social_links: {
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: '',
    youtube: ''
  },
  google_business_url: ''
};

export function LocationsSection({ clinicId }: LocationsSectionProps) {
  const [locations, setLocations] = useState<ClinicLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<ClinicLocation | null>(null);
  const [formData, setFormData] = useState(emptyLocation);

  useEffect(() => {
    if (clinicId) {
      fetchLocations();
    }
  }, [clinicId]);

  const fetchLocations = async () => {
    if (!clinicId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinic_locations')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setLocations((data || []) as ClinicLocation[]);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (location?: ClinicLocation) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name,
        address: location.address || '',
        city: location.city || '',
        state: location.state || '',
        zip_code: location.zip_code || '',
        phone: location.phone || '',
        email: location.email || '',
        social_links: {
          facebook: location.social_links?.facebook || '',
          instagram: location.social_links?.instagram || '',
          twitter: location.social_links?.twitter || '',
          linkedin: location.social_links?.linkedin || '',
          youtube: location.social_links?.youtube || ''
        },
        google_business_url: location.google_business_url || ''
      });
    } else {
      setEditingLocation(null);
      setFormData(emptyLocation);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Location name is required');
      return;
    }
    if (!clinicId) {
      toast.error('No clinic found');
      return;
    }

    setSaving(true);
    try {
      const socialLinks = {
        facebook: formData.social_links.facebook || null,
        instagram: formData.social_links.instagram || null,
        twitter: formData.social_links.twitter || null,
        linkedin: formData.social_links.linkedin || null,
        youtube: formData.social_links.youtube || null
      };

      const locationData = {
        name: formData.name.trim(),
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        zip_code: formData.zip_code.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        social_links: socialLinks,
        google_business_url: formData.google_business_url.trim() || null
      };

      if (editingLocation) {
        const { error } = await supabase
          .from('clinic_locations')
          .update(locationData)
          .eq('id', editingLocation.id);
        if (error) throw error;
        toast.success('Location updated');
      } else {
        const { error } = await supabase
          .from('clinic_locations')
          .insert({
            ...locationData,
            clinic_id: clinicId,
            is_primary: locations.length === 0
          });
        if (error) throw error;
        toast.success('Location added');
      }

      setDialogOpen(false);
      await fetchLocations();
    } catch (error: any) {
      console.error('Error saving location:', error);
      toast.error(error.message || 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      const { error } = await supabase
        .from('clinic_locations')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Location deleted');
      await fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Failed to delete location');
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await supabase
        .from('clinic_locations')
        .update({ is_primary: false })
        .eq('clinic_id', clinicId!);

      const { error } = await supabase
        .from('clinic_locations')
        .update({ is_primary: true })
        .eq('id', id);

      if (error) throw error;
      toast.success('Primary location updated');
      await fetchLocations();
    } catch (error) {
      console.error('Error setting primary:', error);
      toast.error('Failed to update primary location');
    }
  };

  if (!clinicId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Save your business information first to add locations.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Locations
          </CardTitle>
          <CardDescription>
            Number of Locations: {locations.length}
          </CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Add Location
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No locations added yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {locations.map((location, index) => (
              <div
                key={location.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        Location {index + 1}:
                      </span>
                      <span className="font-semibold">{location.name}</span>
                      {location.is_primary && (
                        <Badge variant="secondary" className="text-xs">Primary</Badge>
                      )}
                    </div>
                    {(location.address || location.city) && (
                      <p className="text-sm text-muted-foreground">
                        {[location.address, location.city, location.state, location.zip_code]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-2 text-sm">
                      {location.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {location.phone}
                        </span>
                      )}
                      {location.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {location.email}
                        </span>
                      )}
                    </div>
                    {/* Social Links */}
                    <div className="flex gap-2 mt-2">
                      {location.social_links?.facebook && (
                        <a href={location.social_links.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                          <Facebook className="w-4 h-4" />
                        </a>
                      )}
                      {location.social_links?.instagram && (
                        <a href={location.social_links.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                          <Instagram className="w-4 h-4" />
                        </a>
                      )}
                      {location.social_links?.twitter && (
                        <a href={location.social_links.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                          <Twitter className="w-4 h-4" />
                        </a>
                      )}
                      {location.social_links?.linkedin && (
                        <a href={location.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {location.social_links?.youtube && (
                        <a href={location.social_links.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                          <Youtube className="w-4 h-4" />
                        </a>
                      )}
                      {location.google_business_url && (
                        <a href={location.google_business_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!location.is_primary && (
                      <Button variant="ghost" size="sm" onClick={() => handleSetPrimary(location.id)}>
                        Set Primary
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(location)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(location.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Location Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="Main Office"
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
                  placeholder="Chicago"
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData(p => ({ ...p, state: e.target.value }))}
                  placeholder="IL"
                />
              </div>
              <div>
                <Label>ZIP Code</Label>
                <Input
                  value={formData.zip_code}
                  onChange={(e) => setFormData(p => ({ ...p, zip_code: e.target.value }))}
                  placeholder="60601"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  placeholder="location@clinic.com"
                />
              </div>
            </div>
            
            {/* Social Links */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Social Media Links</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-1">
                    <Facebook className="w-4 h-4" /> Facebook
                  </Label>
                  <Input
                    value={formData.social_links.facebook}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      social_links: { ...p.social_links, facebook: e.target.value }
                    }))}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    <Instagram className="w-4 h-4" /> Instagram
                  </Label>
                  <Input
                    value={formData.social_links.instagram}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      social_links: { ...p.social_links, instagram: e.target.value }
                    }))}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    <Twitter className="w-4 h-4" /> Twitter/X
                  </Label>
                  <Input
                    value={formData.social_links.twitter}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      social_links: { ...p.social_links, twitter: e.target.value }
                    }))}
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </Label>
                  <Input
                    value={formData.social_links.linkedin}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      social_links: { ...p.social_links, linkedin: e.target.value }
                    }))}
                    placeholder="https://linkedin.com/..."
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    <Youtube className="w-4 h-4" /> YouTube
                  </Label>
                  <Input
                    value={formData.social_links.youtube}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      social_links: { ...p.social_links, youtube: e.target.value }
                    }))}
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    <Globe className="w-4 h-4" /> Google Business Profile
                  </Label>
                  <Input
                    value={formData.google_business_url}
                    onChange={(e) => setFormData(p => ({ ...p, google_business_url: e.target.value }))}
                    placeholder="https://g.page/..."
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingLocation ? 'Update' : 'Add'} Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
