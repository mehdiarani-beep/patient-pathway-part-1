import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Type, Image, MessageSquare, Eye, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BrandKitData {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  heading_font: string;
  body_font: string;
  tagline: string;
  logo_url: string;
  avatar_url: string;
  logo_icon_url: string;
}

interface BrandKitSectionProps {
  data: BrandKitData;
  onChange: (field: keyof BrandKitData, value: string) => void;
  clinicId: string | null;
}

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Playfair Display', label: 'Playfair Display' },
];

export function BrandKitSection({ data, onChange, clinicId }: BrandKitSectionProps) {
  const [uploadingIcon, setUploadingIcon] = useState(false);

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clinicId) {
      toast.error('Please save business info first to enable uploads');
      return;
    }

    setUploadingIcon(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${clinicId}/icon-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('clinic-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('clinic-assets')
        .getPublicUrl(fileName);

      onChange('logo_icon_url', urlData.publicUrl);
      toast.success('Icon uploaded successfully');
    } catch (error) {
      console.error('Error uploading icon:', error);
      toast.error('Failed to upload icon');
    } finally {
      setUploadingIcon(false);
    }
  };

  const ColorPicker = ({ 
    label, 
    value, 
    field 
  }: { 
    label: string; 
    value: string; 
    field: keyof BrandKitData;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <div 
          className="w-10 h-10 rounded-lg border border-border cursor-pointer overflow-hidden"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(field, e.target.value)}
            className="w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder="#000000"
          className="font-mono text-sm uppercase"
          maxLength={7}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Color Palette */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Color Palette
          </CardTitle>
          <CardDescription>
            Define your brand colors for consistent styling across all touchpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <ColorPicker 
              label="Primary" 
              value={data.primary_color} 
              field="primary_color" 
            />
            <ColorPicker 
              label="Secondary" 
              value={data.secondary_color} 
              field="secondary_color" 
            />
            <ColorPicker 
              label="Accent" 
              value={data.accent_color} 
              field="accent_color" 
            />
            <ColorPicker 
              label="Background" 
              value={data.background_color} 
              field="background_color" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5 text-primary" />
            Typography
          </CardTitle>
          <CardDescription>
            Choose fonts that represent your brand personality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Heading Font</Label>
              <Select 
                value={data.heading_font} 
                onValueChange={(value) => onChange('heading_font', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select heading font" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>{font.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Body Font</Label>
              <Select 
                value={data.body_font} 
                onValueChange={(value) => onChange('body_font', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select body font" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>{font.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Typography Preview */}
          <div className="p-4 border border-border rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">Preview</p>
            <h3 
              className="text-xl font-bold mb-1"
              style={{ fontFamily: data.heading_font }}
            >
              Your Health Journey Starts Here
            </h3>
            <p 
              className="text-muted-foreground"
              style={{ fontFamily: data.body_font }}
            >
              We're committed to helping you breathe easier and live better every day.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Logo Variations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            Logo Variations
          </CardTitle>
          <CardDescription>
            Different logo formats for various use cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Full Logo */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Full Logo (Rectangular)</Label>
              <div className="h-24 border border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30 p-4">
                {data.logo_url ? (
                  <img 
                    src={data.logo_url} 
                    alt="Full Logo" 
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground text-center">
                    Set in Business tab
                  </p>
                )}
              </div>
            </div>

            {/* Avatar */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Avatar (Circular)</Label>
              <div className="h-24 border border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30">
                {data.avatar_url ? (
                  <img 
                    src={data.avatar_url} 
                    alt="Avatar" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground text-center">
                    Set in Business tab
                  </p>
                )}
              </div>
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Icon (Square)</Label>
              <div className="h-24 border border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30 relative">
                {data.logo_icon_url ? (
                  <img 
                    src={data.logo_icon_url} 
                    alt="Icon" 
                    className="w-16 h-16 object-contain"
                  />
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIconUpload}
                      className="hidden"
                      disabled={uploadingIcon}
                    />
                    {uploadingIcon ? (
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Upload</span>
                      </>
                    )}
                  </label>
                )}
                {data.logo_icon_url && (
                  <label className="absolute bottom-2 right-2 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIconUpload}
                      className="hidden"
                      disabled={uploadingIcon}
                    />
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" asChild>
                      <span>Change</span>
                    </Button>
                  </label>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Voice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Brand Voice
          </CardTitle>
          <CardDescription>
            Your clinic's tagline and messaging tone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tagline</Label>
              <span className="text-xs text-muted-foreground">
                {data.tagline?.length || 0}/120
              </span>
            </div>
            <Input
              value={data.tagline || ''}
              onChange={(e) => onChange('tagline', e.target.value)}
              placeholder="e.g., Breathe Easy, Live Better"
              maxLength={120}
            />
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Live Preview
          </CardTitle>
          <CardDescription>
            See how your brand looks in action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="rounded-lg border overflow-hidden"
            style={{ backgroundColor: data.background_color }}
          >
            {/* Header Preview */}
            <div 
              className="p-4 flex items-center gap-3"
              style={{ backgroundColor: data.primary_color }}
            >
              {data.logo_icon_url || data.avatar_url ? (
                <img 
                  src={data.logo_icon_url || data.avatar_url} 
                  alt="Logo" 
                  className="w-10 h-10 rounded-lg object-contain bg-white/20 p-1"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white/20" />
              )}
              <span 
                className="font-semibold text-white"
                style={{ fontFamily: data.heading_font }}
              >
                {data.tagline || 'Your Clinic Name'}
              </span>
            </div>
            
            {/* Content Preview */}
            <div className="p-6 space-y-4">
              <h2 
                className="text-2xl font-bold"
                style={{ 
                  fontFamily: data.heading_font,
                  color: data.primary_color 
                }}
              >
                Take Our Quick Assessment
              </h2>
              <p 
                className="text-muted-foreground"
                style={{ fontFamily: data.body_font }}
              >
                Answer a few simple questions to understand your symptoms better and find the right care path for you.
              </p>
              <Button 
                style={{ 
                  backgroundColor: data.accent_color,
                  color: '#FFFFFF'
                }}
              >
                Start Assessment →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
