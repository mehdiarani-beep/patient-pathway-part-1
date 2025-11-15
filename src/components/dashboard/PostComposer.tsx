import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Facebook, 
  Instagram, 
  MessageSquare,
  Users,
  Share2,
  Image,
  Hash,
  Clock,
  Send,
  Eye,
  Copy,
  Check,
  Sparkles,
  Calendar,
  Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  connected: boolean;
  permissions: any;
}

interface PostTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  hashtags: string[];
  usage_count?: number;
}

interface PostComposerProps {
  connectedAccounts: SocialAccount[];
  onPostCreated: () => void;
}

const platforms = {
  facebook: { name: 'Facebook', limit: 63206, icon: Facebook, color: 'text-blue-600' },
  instagram: { name: 'Instagram', limit: 2200, icon: Instagram, color: 'text-pink-600' },
  twitter: { name: 'Twitter/X', limit: 280, icon: MessageSquare, color: 'text-blue-400' },
  linkedin: { name: 'LinkedIn', limit: 3000, icon: Users, color: 'text-blue-700' },
  youtube: { name: 'YouTube', limit: 5000, icon: Share2, color: 'text-red-600' }
};

export function PostComposer({ connectedAccounts, onPostCreated }: PostComposerProps) {
  const { user } = useAuth();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAltText, setImageAltText] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [templates, setTemplates] = useState<PostTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PostTemplate | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      setContent(selectedTemplate.content);
      setHashtags(selectedTemplate.hashtags);
    }
  }, [selectedTemplate]);

  const fetchTemplates = async () => {
    if (!user) return;

    try {
      // Get doctor profile first
      const { data: doctorProfile } = await supabase
        .from('doctor_profiles')
        .select('id, clinic_id')
        .eq('user_id', user.id)
        .single();

      if (!doctorProfile) return;

      const { data: templatesData, error } = await supabase
        .from('social_media_templates')
        .select('*')
        .or(`doctor_id.eq.${doctorProfile.id},clinic_id.eq.${doctorProfile.clinic_id},is_public.eq.true`)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setTemplates(templatesData || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const getCharacterCount = (text: string) => text.length;
  const getMaxCharacterLimit = () => {
    if (selectedPlatforms.length === 0) return 63206; // Default to Facebook limit
    return Math.min(...selectedPlatforms.map(platform => platforms[platform as keyof typeof platforms]?.limit || 63206));
  };

  const isOverLimit = (text: string) => getCharacterCount(text) > getMaxCharacterLimit();

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const addHashtag = () => {
    if (newHashtag.trim() && !hashtags.includes(newHashtag.trim())) {
      const tag = newHashtag.startsWith('#') ? newHashtag.trim() : `#${newHashtag.trim()}`;
      setHashtags(prev => [...prev, tag]);
      setNewHashtag('');
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(prev => prev.filter(t => t !== tag));
  };

  const handleTemplateSelect = (template: PostTemplate) => {
    setSelectedTemplate(template);
    // Increment usage count
    supabase
      .from('social_media_templates')
      .update({ usage_count: template.usage_count + 1 })
      .eq('id', template.id);
  };

  const generateContent = async () => {
    if (!user) return;

    try {
      setIsPosting(true);
      
      // Use the existing AI content generation logic
      const { data, error } = await supabase.functions.invoke('generate-social-content', {
        body: {
          category: selectedTemplate?.category || 'general',
          platform: selectedPlatforms.join(','),
          doctorInfo: {
            name: 'Dr. Smith', // Get from doctor profile
            clinic: 'ENT Clinic' // Get from clinic profile
          }
        }
      });

      if (error) throw error;
      
      if (data?.content) {
        setContent(data.content);
        if (data.hashtags) {
          setHashtags(data.hashtags);
        }
      }
    } catch (error) {
      console.error('Error generating content:', error);
      // Fallback to template content
      if (selectedTemplate) {
        setContent(selectedTemplate.content);
      }
    } finally {
      setIsPosting(false);
    }
  };

  const publishPost = async () => {
    if (!user || selectedPlatforms.length === 0 || !content.trim()) {
      toast.error('Please select platforms and enter content');
      return;
    }

    if (isOverLimit(content)) {
      toast.error(`Content exceeds character limit for selected platforms`);
      return;
    }

    try {
      setIsPosting(true);

      // Get doctor profile first
      const { data: doctorProfile } = await supabase
        .from('doctor_profiles')
        .select('id, clinic_id')
        .eq('user_id', user.id)
        .single();

      if (!doctorProfile) {
        toast.error('Doctor profile not found');
        return;
      }

      // Create the main post record
      const { data: postData, error: postError } = await supabase
        .from('social_posts')
        .insert({
          doctor_id: doctorProfile.id,
          clinic_id: doctorProfile.clinic_id,
          platform: selectedPlatforms[0], // Primary platform
          content,
          image_url: imageUrl || null,
          image_alt_text: imageAltText || null,
          hashtags,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          status: scheduledAt ? 'scheduled' : 'draft'
        })
        .select()
        .single();

      if (postError) throw postError;

      // Create platform-specific records for cross-platform posting
      if (selectedPlatforms.length > 1) {
        const platformRecords = selectedPlatforms.map(platform => ({
          post_id: postData.id,
          platform,
          status: 'pending'
        }));

        const { error: platformError } = await supabase
          .from('social_post_platforms')
          .insert(platformRecords);

        if (platformError) throw platformError;
      }

      // If not scheduled, attempt to publish immediately
      if (!scheduledAt) {
        await publishToPlatforms(postData.id, selectedPlatforms);
      }

      toast.success(scheduledAt ? 'Post scheduled successfully!' : 'Post published successfully!');
      
      // Reset form
      setContent('');
      setImageUrl('');
      setImageAltText('');
      setHashtags([]);
      setScheduledAt('');
      setSelectedPlatforms([]);
      setSelectedTemplate(null);
      
      // Refresh parent data
      onPostCreated();

    } catch (error) {
      console.error('Error publishing post:', error);
      toast.error('Failed to publish post');
    } finally {
      setIsPosting(false);
    }
  };

  const publishToPlatforms = async (postId: string, platforms: string[]) => {
    try {
      // Call the edge function to publish to social media platforms
      const { data, error } = await supabase.functions.invoke('publish-to-social', {
        body: {
          postId,
          platforms
        }
      });

      if (error) throw error;

      // Update post status
      await supabase
        .from('social_posts')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', postId);

    } catch (error) {
      console.error('Error publishing to platforms:', error);
      // Update post status to failed
      await supabase
        .from('social_posts')
        .update({ 
          status: 'failed',
          error_message: error.message
        })
        .eq('id', postId);
      throw error;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Composer */}
      <div className="lg:col-span-2 space-y-6">
        {/* Platform Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(platforms).map(([key, platform]) => {
                const PlatformIcon = platform.icon;
                const isConnected = connectedAccounts.some(acc => acc.platform === key);
                const isSelected = selectedPlatforms.includes(key);
                
                return (
                  <div
                    key={key}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => isConnected && handlePlatformToggle(key)}
                  >
                    <div className="flex items-center gap-2">
                      <PlatformIcon className={`w-5 h-5 ${platform.color}`} />
                      <span className="font-medium">{platform.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {isConnected ? 'Connected' : 'Not Connected'}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Content Composer */}
        <Card>
          <CardHeader>
            <CardTitle>Create Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="content">Post Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-32"
              />
              <div className="flex justify-between items-center mt-2">
                <div className={`text-sm ${isOverLimit(content) ? 'text-red-600' : 'text-gray-500'}`}>
                  {getCharacterCount(content)} / {getMaxCharacterLimit()} characters
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateContent}
                  disabled={isPosting}
                >
                  {isPosting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <Label htmlFor="imageAltText">Alt Text (Optional)</Label>
                <Input
                  id="imageAltText"
                  value={imageAltText}
                  onChange={(e) => setImageAltText(e.target.value)}
                  placeholder="Describe the image for accessibility"
                />
              </div>
            </div>

            <div>
              <Label>Hashtags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value)}
                  placeholder="Add hashtag"
                  onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
                />
                <Button onClick={addHashtag} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeHashtag(tag)}>
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="scheduledAt">Schedule Post (Optional)</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={publishPost}
            disabled={isPosting || selectedPlatforms.length === 0 || !content.trim() || isOverLimit(content)}
            className="flex-1"
          >
            {isPosting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {scheduledAt ? 'Schedule Post' : 'Publish Now'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Content Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {templates.slice(0, 5).map((template) => (
                <div
                  key={template.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <h4 className="font-medium text-sm">{template.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                  <Badge variant="outline" className="text-xs mt-2">{template.category}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {showPreview && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPlatforms.map((platform) => {
                const platformInfo = platforms[platform as keyof typeof platforms];
                const PlatformIcon = platformInfo.icon;
                
                return (
                  <div key={platform} className="mb-4 p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <PlatformIcon className={`w-4 h-4 ${platformInfo.color}`} />
                      <span className="font-medium">{platformInfo.name}</span>
                    </div>
                    <div className="text-sm">
                      {imageUrl && (
                        <div className="mb-2">
                          <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                            <Image className="w-8 h-8 text-gray-400" />
                          </div>
                        </div>
                      )}
                      <p className="mb-2">{content}</p>
                      {hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {hashtags.map((tag, index) => (
                            <span key={index} className="text-blue-600 text-xs">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {getCharacterCount(content)} / {platformInfo.limit} characters
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Connected Accounts Status */}
        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(platforms).map(([key, platform]) => {
                const PlatformIcon = platform.icon;
                const isConnected = connectedAccounts.some(acc => acc.platform === key);
                
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PlatformIcon className={`w-4 h-4 ${platform.color}`} />
                      <span className="text-sm">{platform.name}</span>
                    </div>
                    <Badge variant={isConnected ? "default" : "secondary"}>
                      {isConnected ? 'Connected' : 'Not Connected'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
