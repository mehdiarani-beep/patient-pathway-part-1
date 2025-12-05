import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MapPin, Plus, Edit, Trash2, Building, Phone, Mail } from 'lucide-react';

interface ClinicLocation {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  created_at: string;
}

export function LocationsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<ClinicLocation[]>([]);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'owner' | 'staff'>('staff');
  
  // Add/Edit form states
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<ClinicLocation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClinicData();
  }, []);

  const loadClinicData = async () => {
    try {
      setLoading(true);
      
      // Get user's clinic context
      const { data: contextData, error: contextError } = await supabase.functions.invoke('get-user-clinic-context');
      
      if (contextError || !contextData.hasClinics) {
        toast.error('No clinic found. Please contact support.');
        return;
      }

      const primaryClinic = contextData.primaryClinic;
      setClinicId(primaryClinic.id);
      setUserRole(primaryClinic.role);

      // Load clinic locations
      await loadLocations(primaryClinic.id);
      
    } catch (error) {
      console.error('Error loading clinic data:', error);
      toast.error('Failed to load clinic data');
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async (clinicId: string) => {
    try {
      const { data, error } = await supabase
        .from('clinic_locations')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Failed to load locations');
    }
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      if (editingLocation) {
        // Update existing location
        const { error } = await supabase
          .from('clinic_locations')
          .update({
            name: formData.name.trim(),
            address: formData.address.trim() || null,
            city: formData.city.trim() || null,
            state: formData.state.trim() || null,
            zip_code: formData.zip_code.trim() || null,
            phone: formData.phone.trim() || null,
            email: formData.email.trim() || null
          })
          .eq('id', editingLocation.id);

        if (error) throw error;
        toast.success('Location updated successfully');
      } else {
        // Create new location
        const { error } = await supabase
          .from('clinic_locations')
          .insert([{
            clinic_id: clinicId,
            name: formData.name.trim(),
            address: formData.address.trim() || null,
            city: formData.city.trim() || null,
            state: formData.state.trim() || null,
            zip_code: formData.zip_code.trim() || null,
            phone: formData.phone.trim() || null,
            email: formData.email.trim() || null,
            is_primary: locations.length === 0 // First location is primary
          }]);

        if (error) throw error;
        toast.success('Location added successfully');
      }

      // Reset form and reload data
      setShowForm(false);
      setEditingLocation(null);
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        phone: '',
        email: ''
      });
      await loadLocations(clinicId);
      
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const handleEditLocation = (location: ClinicLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address || '',
      city: location.city || '',
      state: location.state || '',
      zip_code: location.zip_code || '',
      phone: location.phone || '',
      email: location.email || ''
    });
    setShowForm(true);
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      const { error } = await supabase
        .from('clinic_locations')
        .delete()
        .eq('id', locationId);

      if (error) throw error;

      toast.success('Location deleted successfully');
      await loadLocations(clinicId!);
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Failed to delete location');
    }
  };

  const handleSetPrimary = async (locationId: string) => {
    if (userRole !== 'owner') {
      toast.error('Only owners can set primary locations');
      return;
    }

    try {
      // First, unset all primary locations
      const { error: unsetError } = await supabase
        .from('clinic_locations')
        .update({ is_primary: false })
        .eq('clinic_id', clinicId!);

      if (unsetError) throw unsetError;

      // Then set the selected location as primary
      const { error: setError } = await supabase
        .from('clinic_locations')
        .update({ is_primary: true })
        .eq('id', locationId);

      if (setError) throw setError;

      toast.success('Primary location updated');
      await loadLocations(clinicId!);
    } catch (error) {
      console.error('Error setting primary location:', error);
      toast.error('Failed to update primary location');
    }
  };

  const canManageLocations = userRole === 'owner';

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Locations</h2>
          <p className="text-gray-600">Manage your clinic locations and addresses</p>
        </div>
        {canManageLocations && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </Button>
        )}
      </div>

      {/* Locations List */}
      <div className="grid gap-4">
        {locations.map((location) => (
          <Card key={location.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{location.name}</h3>
                      {location.is_primary && (
                        <Badge className="bg-blue-100 text-blue-800">Primary</Badge>
                      )}
                    </div>
                    
                    {(location.address || location.city) && (
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {[location.address, location.city, location.state, location.zip_code]
                            .filter(Boolean)
                            .join(', ')
                          }
                        </span>
                      </div>
                    )}
                    
                    {location.phone && (
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Phone className="w-4 h-4" />
                        <span>{location.phone}</span>
                      </div>
                    )}
                    
                    {location.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{location.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {canManageLocations && (
                  <div className="flex items-center gap-2">
                    {!location.is_primary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(location.id)}
                      >
                        Set Primary
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditLocation(location)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteLocation(location.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {locations.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No locations yet</h3>
              <p className="text-gray-600 mb-4">Add your first clinic location to get started</p>
              {canManageLocations && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Location
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Location Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveLocation} className="space-y-4">
              <div>
                <Label htmlFor="name">Location Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Main Office, Downtown Branch, etc."
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="New York"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="NY"
                  />
                </div>
                <div>
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                    placeholder="10001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="location@clinic.com"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {editingLocation ? 'Update Location' : 'Add Location'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingLocation(null);
                    setFormData({
                      name: '',
                      address: '',
                      city: '',
                      state: '',
                      zip_code: '',
                      phone: '',
                      email: ''
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
