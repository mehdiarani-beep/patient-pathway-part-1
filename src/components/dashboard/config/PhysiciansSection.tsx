import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useClinicPhysicians, ClinicPhysician, PhysicianFormData } from '@/hooks/useClinicPhysicians';
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Loader2,
  Stethoscope
} from 'lucide-react';

export function PhysiciansSection() {
  const { physicians, loading, saving, clinicId, addPhysician, updatePhysician, deletePhysician, emptyForm } = useClinicPhysicians();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPhysician, setEditingPhysician] = useState<ClinicPhysician | null>(null);
  const [formData, setFormData] = useState<PhysicianFormData>(emptyForm);

  const handleOpenDialog = (physician?: ClinicPhysician) => {
    if (physician) {
      setEditingPhysician(physician);
      setFormData({
        first_name: physician.first_name,
        last_name: physician.last_name,
        degree_type: physician.degree_type,
        credentials: (physician.credentials || []).join(', '),
        mobile: physician.mobile || '',
        email: physician.email || '',
        bio: physician.bio || '',
        headshot_url: physician.headshot_url || ''
      });
    } else {
      setEditingPhysician(null);
      setFormData(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      return;
    }

    if (editingPhysician) {
      await updatePhysician(editingPhysician.id, formData);
    } else {
      await addPhysician(formData);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deletePhysician(id);
  };

  const getInitials = (physician: ClinicPhysician) => {
    return `${physician.first_name.charAt(0)}${physician.last_name.charAt(0)}`.toUpperCase();
  };

  const getDisplayName = (physician: ClinicPhysician) => {
    return `Dr. ${physician.first_name} ${physician.last_name}, ${physician.degree_type}`;
  };

  if (!clinicId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Save your business information first to add physicians.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            Physicians
          </CardTitle>
          <CardDescription>
            Number of Physicians: {physicians.length}
          </CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <UserPlus className="w-4 h-4 mr-1" /> Add Physician
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : physicians.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Stethoscope className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No physicians added yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {physicians.map((physician, index) => (
              <div
                key={physician.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={physician.headshot_url || ''} alt={getDisplayName(physician)} />
                    <AvatarFallback className="text-lg">{getInitials(physician)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        Physician {index + 1}:
                      </span>
                      <span className="font-semibold">{getDisplayName(physician)}</span>
                    </div>
                    {physician.credentials && physician.credentials.length > 0 && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {physician.credentials.join(', ')}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {physician.mobile && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {physician.mobile}
                        </span>
                      )}
                      {physician.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {physician.email}
                        </span>
                      )}
                    </div>
                    {physician.bio && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {physician.bio}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(physician)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Physician</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {getDisplayName(physician)}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(physician.id)}>
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
              {editingPhysician ? 'Edit Physician' : 'Add New Physician'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Headshot */}
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={formData.headshot_url} />
                <AvatarFallback>
                  {formData.first_name.charAt(0)}{formData.last_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label>Headshot URL</Label>
                <Input
                  value={formData.headshot_url}
                  onChange={(e) => setFormData(p => ({ ...p, headshot_url: e.target.value }))}
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
                  value={formData.first_name}
                  onChange={(e) => setFormData(p => ({ ...p, first_name: e.target.value }))}
                  placeholder="Ryan"
                />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData(p => ({ ...p, last_name: e.target.value }))}
                  placeholder="Vaughn"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Degree Type</Label>
                <Select
                  value={formData.degree_type}
                  onValueChange={(v) => setFormData(p => ({ ...p, degree_type: v as 'MD' | 'DO' }))}
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
                  value={formData.credentials}
                  onChange={(e) => setFormData(p => ({ ...p, credentials: e.target.value }))}
                  placeholder="FACS, FAAO (comma-separated)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mobile</Label>
                <Input
                  value={formData.mobile}
                  onChange={(e) => setFormData(p => ({ ...p, mobile: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  placeholder="dr.vaughn@clinic.com"
                />
              </div>
            </div>

            <div>
              <Label>Bio</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
                placeholder="Dr. Vaughn specializes in..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !formData.first_name.trim() || !formData.last_name.trim()}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingPhysician ? 'Update' : 'Add'} Physician
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
