import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building, Globe, Phone, User, Image } from 'lucide-react';

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

interface BusinessInfoSectionProps {
  data: BusinessInfo;
  onChange: (field: keyof BusinessInfo, value: string) => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingLogo: boolean;
  uploadingAvatar: boolean;
}

export function BusinessInfoSection({ 
  data, 
  onChange, 
  onLogoUpload, 
  onAvatarUpload,
  uploadingLogo,
  uploadingAvatar
}: BusinessInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5 text-primary" />
          Business Information
        </CardTitle>
        <CardDescription>
          Your clinic's basic information and owner details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Branding Section - Logo and Avatar side by side */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Image className="w-4 h-4" />
            Clinic Branding
          </h4>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Logo Upload */}
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="w-32 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-background overflow-hidden">
                  {data.logo_url ? (
                    <img
                      src={data.logo_url}
                      alt="Clinic Logo"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  ) : (
                    <Building className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-medium">Clinic Logo</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Full logo for landing pages, email footers, and headers
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/logo.png"
                  value={data.logo_url}
                  onChange={(e) => onChange('logo_url', e.target.value)}
                  className="flex-1 text-sm"
                />
                <label className="inline-flex items-center justify-center px-3 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer text-sm font-medium whitespace-nowrap">
                  {uploadingLogo ? 'Uploading...' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onLogoUpload}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                </label>
              </div>
            </div>

            {/* Avatar Upload */}
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-background overflow-hidden">
                  {data.avatar_url ? (
                    <img
                      src={data.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  ) : (
                    <User className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-medium">Avatar</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Small circular image for quiz chat bubbles
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/avatar.png"
                  value={data.avatar_url}
                  onChange={(e) => onChange('avatar_url', e.target.value)}
                  className="flex-1 text-sm"
                />
                <label className="inline-flex items-center justify-center px-3 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer text-sm font-medium whitespace-nowrap">
                  {uploadingAvatar ? 'Uploading...' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Info Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="clinic_name">Clinic (Business) Name *</Label>
            <Input
              id="clinic_name"
              value={data.clinic_name}
              onChange={(e) => onChange('clinic_name', e.target.value)}
              placeholder="Exhale Sinus & Facial Pain Center"
            />
          </div>
          
          <div>
            <Label htmlFor="website">
              <Globe className="w-4 h-4 inline mr-1" />
              Website URL
            </Label>
            <Input
              id="website"
              value={data.website}
              onChange={(e) => onChange('website', e.target.value)}
              placeholder="https://exhalesinus.com"
            />
          </div>
          
          <div>
            <Label htmlFor="main_phone">
              <Phone className="w-4 h-4 inline mr-1" />
              Main Phone
            </Label>
            <Input
              id="main_phone"
              value={data.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        {/* Owner Info */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Owner Information
          </h4>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="owner_name">Owner Name</Label>
              <Input
                id="owner_name"
                value={data.owner_name}
                onChange={(e) => onChange('owner_name', e.target.value)}
                placeholder="Dr. Ryan Vaughn"
              />
            </div>
            <div>
              <Label htmlFor="owner_mobile">Owner Mobile</Label>
              <Input
                id="owner_mobile"
                value={data.owner_mobile}
                onChange={(e) => onChange('owner_mobile', e.target.value)}
                placeholder="(555) 987-6543"
              />
            </div>
            <div>
              <Label htmlFor="owner_email">Owner Email</Label>
              <Input
                id="owner_email"
                type="email"
                value={data.owner_email}
                onChange={(e) => onChange('owner_email', e.target.value)}
                placeholder="owner@clinic.com"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
