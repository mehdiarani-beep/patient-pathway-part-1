import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useClinicPhysicians } from '@/hooks/useClinicPhysicians';
import { Loader2, UserPlus, Users, Mail, Shield, Settings, Trash2, Crown, UserCheck, Stethoscope } from 'lucide-react';

interface ClinicMember {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'owner' | 'staff' | 'physician';
  permissions?: {
    leads: boolean;
    content: boolean;
    payments: boolean;
    team: boolean;
  };
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
  accepted_at?: string | null;
  avatar_url?: string | null;
  headshot_url?: string | null;
}

interface ClinicLocation {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  is_primary: boolean;
}

export function TeamManagementPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<ClinicMember[]>([]);
  const [locations, setLocations] = useState<ClinicLocation[]>([]);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'owner' | 'staff'>('staff');
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const { physicians, loading: physiciansLoading } = useClinicPhysicians();
  const [combinedMembers, setCombinedMembers] = useState<ClinicMember[]>([]);
  
  // Invite form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState<'staff'>('staff');
  const [invitePermissions, setInvitePermissions] = useState({
    leads: true,
    content: true,
    payments: false,
    team: false
  });
  const [inviteLocations, setInviteLocations] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);

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
      setUserPermissions(primaryClinic.permissions);

      // Load team members
      await loadTeamMembers(primaryClinic.id);
      
      // Load clinic locations
      await loadClinicLocations(primaryClinic.id);
      
    } catch (error) {
      console.error('Error loading clinic data:', error);
      toast.error('Failed to load clinic data');
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async (clinicId: string) => {
    try {
      const { data, error } = await supabase
        .from('clinic_members')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error loading team members:', error);
      toast.error('Failed to load team members');
    }
  };

  const loadClinicLocations = async (clinicId: string) => {
    try {
      const { data, error } = await supabase
        .from('clinic_locations')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Failed to load locations');
    }
  };

  useEffect(() => {
    const physicianMembers: ClinicMember[] = physicians.map(p => ({
      id: p.id,
      email: p.email || 'No Email Provided',
      first_name: p.first_name,
      last_name: p.last_name,
      role: 'physician',
      status: p.is_active ? 'active' : 'inactive',
      created_at: p.created_at,
      headshot_url: p.headshot_url,
    }));

    const allMembers = [...teamMembers, ...physicianMembers]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    setCombinedMembers(allMembers);
  }, [teamMembers, physicians]);

  const handleInviteTeamMember = async () => {
    if (!inviteEmail || !clinicId) {
      toast.error('Please enter an email address');
      return;
    }

    if (!inviteEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check permissions
    if (userRole === 'staff' || !userPermissions?.team) {
      toast.error('You do not have permission to invite team members');
      return;
    }

    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-clinic-member', {
        body: {
          clinicId,
          email: inviteEmail.toLowerCase().trim(),
          firstName: inviteFirstName.trim() || null,
          lastName: inviteLastName.trim() || null,
          role: inviteRole,
          permissions: invitePermissions,
          locationIds: inviteLocations
        }
      });

      if (error) {
        console.error('Invitation error:', error);
        toast.error(error.message || 'Failed to send invitation');
        return;
      }

      if (data.success) {
        toast.success('Team member invitation sent successfully!');
        
        // Clear form
        setInviteEmail('');
        setInviteFirstName('');
        setInviteLastName('');
        setInviteRole('staff');
        setInvitePermissions({
          leads: true,
          content: true,
          payments: false,
          team: false
        });
        setInviteLocations([]);
        
        // Refresh team members
        await loadTeamMembers(clinicId);
      }
    } catch (error) {
      console.error('Error inviting team member:', error);
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: 'staff') => {
    if (userRole !== 'owner') {
      toast.error('Only clinic owners can change member roles');
      return;
    }

    try {
      const { error } = await supabase
        .from('clinic_members')
        .update({ 
          role: newRole,
          permissions: {
            leads: true,
            content: true,
            payments: false,
            team: false
          }
        })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member role updated successfully');
      await loadTeamMembers(clinicId!);
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
    }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    if (userRole !== 'owner') {
      toast.error('Only clinic owners can remove team members');
      return;
    }

    try {
      const { error } = await supabase
        .from('clinic_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Team member removed successfully');
      await loadTeamMembers(clinicId!);
    } catch (error) {
      console.error('Error removing team member:', error);
      toast.error('Failed to remove team member');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4" />;
      case 'physician': return <Stethoscope className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800';
      case 'physician': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || physiciansLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const canManageTeam = userRole === 'owner';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Management</h2>
          <p className="text-gray-600">Manage your clinic team members and their permissions</p>
        </div>
        {canManageTeam && (
          <Button onClick={() => {/* TODO: Add modal trigger */}}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members ({combinedMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {combinedMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {member.avatar_url || member.headshot_url ? (
                    <img
                      src={member.avatar_url || member.headshot_url}
                      alt={`${member.first_name} ${member.last_name}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        {member.first_name && member.last_name 
                          ? `${member.first_name} ${member.last_name}`
                          : member.email
                        }
                      </h3>
                      <Badge className={getRoleColor(member.role)}>
                        <div className="flex items-center gap-1">
                          {getRoleIcon(member.role)}
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </div>
                      </Badge>
                      {member.status === 'pending' && (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{member.email}</p>
                    <div className="flex items-center gap-4 mt-1">
                      {member.permissions && (
                        <>
                          <span className={`text-xs ${member.permissions.leads ? 'text-green-600' : 'text-gray-400'}`}>
                            Leads
                          </span>
                          <span className={`text-xs ${member.permissions.content ? 'text-green-600' : 'text-gray-400'}`}>
                            Content
                          </span>
                          <span className={`text-xs ${member.permissions.payments ? 'text-green-600' : 'text-gray-400'}`}>
                            Payments
                          </span>
                          <span className={`text-xs ${member.permissions.team ? 'text-green-600' : 'text-gray-400'}`}>
                            Team
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {canManageTeam && member.role !== 'owner' && member.role !== 'physician' && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role}
                      onValueChange={(value: 'staff') => handleUpdateMemberRole(member.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveTeamMember(member.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
            
            {combinedMembers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No team members yet</p>
                <p className="text-sm">Invite your first team member to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invite Team Member Form */}
      {canManageTeam && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Invite Team Member
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={inviteFirstName}
                  onChange={(e) => setInviteFirstName(e.target.value)}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={inviteLastName}
                  onChange={(e) => setInviteLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={inviteRole} onValueChange={(value: 'staff') => setInviteRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="leads" className="text-sm">View Leads</Label>
                  <Switch
                    id="leads"
                    checked={invitePermissions.leads}
                    onCheckedChange={(checked) => setInvitePermissions(prev => ({ ...prev, leads: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="content" className="text-sm">Manage Content</Label>
                  <Switch
                    id="content"
                    checked={invitePermissions.content}
                    onCheckedChange={(checked) => setInvitePermissions(prev => ({ ...prev, content: checked }))}
                  />
                </div>
                {/* Manager role removed — managers are treated as staff now. */}
              </div>
            </div>

            <Button 
              onClick={handleInviteTeamMember}
              disabled={inviting || !inviteEmail}
              className="w-full"
            >
              {inviting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Send Invitation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
