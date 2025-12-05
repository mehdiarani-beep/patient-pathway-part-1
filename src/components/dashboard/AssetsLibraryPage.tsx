import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClinicAssets, ClinicAsset, AssetFileType } from '@/hooks/useClinicAssets';
import { 
  Upload, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  File, 
  Trash2, 
  Copy, 
  Download,
  Loader2,
  Search,
  Grid,
  List,
  Eye,
  Edit2,
  Check,
  X,
  FolderOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const FILE_TYPE_FILTERS: { value: AssetFileType; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <FolderOpen size={16} /> },
  { value: 'image', label: 'Images', icon: <ImageIcon size={16} /> },
  { value: 'pdf', label: 'PDFs', icon: <FileText size={16} /> },
  { value: 'video', label: 'Videos', icon: <Video size={16} /> },
  { value: 'vector', label: 'Vectors', icon: <File size={16} /> },
  { value: 'document', label: 'Documents', icon: <FileText size={16} /> },
];

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'image': return <ImageIcon className="text-blue-500" size={24} />;
    case 'pdf': return <FileText className="text-red-500" size={24} />;
    case 'video': return <Video className="text-purple-500" size={24} />;
    case 'vector': return <File className="text-green-500" size={24} />;
    case 'document': return <FileText className="text-orange-500" size={24} />;
    default: return <File className="text-gray-500" size={24} />;
  }
};

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function AssetsLibraryPage() {
  const { 
    assets, 
    loading, 
    uploading, 
    clinicId,
    filter, 
    setFilter, 
    uploadFile, 
    uploadFromUrl, 
    deleteAsset,
    updateAssetName 
  } = useClinicAssets();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlName, setUrlName] = useState('');
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<ClinicAsset | null>(null);
  const [editingAsset, setEditingAsset] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    for (const file of Array.from(files)) {
      await uploadFile(file);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    
    try {
      new URL(urlInput); // Validate URL
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }
    
    await uploadFromUrl(urlInput.trim(), urlName.trim() || undefined);
    setUrlInput('');
    setUrlName('');
    setIsUrlDialogOpen(false);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const handleStartEdit = (asset: ClinicAsset) => {
    setEditingAsset(asset.id);
    setEditName(asset.name);
  };

  const handleSaveEdit = async (assetId: string) => {
    if (editName.trim()) {
      await updateAssetName(assetId, editName.trim());
    }
    setEditingAsset(null);
  };

  const handleCancelEdit = () => {
    setEditingAsset(null);
    setEditName('');
  };

  if (!clinicId) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Clinic Found</h3>
          <p className="text-muted-foreground">
            Please set up your clinic in Configuration first to use the Assets Library.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Upload Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-lg font-semibold">Assets Library</h2>
          <p className="text-sm text-muted-foreground">
            Manage your clinic's images, documents, and media files
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.svg,.ai,.eps"
          />
          
          <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <LinkIcon className="mr-2 h-4 w-4" />
                Add from URL
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Asset from URL</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="asset-url">URL</Label>
                  <Input
                    id="asset-url"
                    placeholder="https://example.com/image.jpg"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset-name">Name (optional)</Label>
                  <Input
                    id="asset-name"
                    placeholder="My Asset"
                    value={urlName}
                    onChange={(e) => setUrlName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUrlDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUrlUpload} disabled={uploading}>
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Add Asset
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-2">
          {FILE_TYPE_FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.value)}
              className="gap-1.5"
            >
              {f.icon}
              {f.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid size={18} />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Assets Display */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No assets found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try a different search term' : 'Upload your first asset to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              isEditing={editingAsset === asset.id}
              editName={editName}
              onEditName={setEditName}
              onStartEdit={() => handleStartEdit(asset)}
              onSaveEdit={() => handleSaveEdit(asset.id)}
              onCancelEdit={handleCancelEdit}
              onPreview={() => setPreviewAsset(asset)}
              onCopyUrl={() => handleCopyUrl(asset.url)}
              onDelete={() => deleteAsset(asset)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <div className="divide-y">
            {filteredAssets.map((asset) => (
              <AssetListItem
                key={asset.id}
                asset={asset}
                isEditing={editingAsset === asset.id}
                editName={editName}
                onEditName={setEditName}
                onStartEdit={() => handleStartEdit(asset)}
                onSaveEdit={() => handleSaveEdit(asset.id)}
                onCancelEdit={handleCancelEdit}
                onPreview={() => setPreviewAsset(asset)}
                onCopyUrl={() => handleCopyUrl(asset.url)}
                onDelete={() => deleteAsset(asset)}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewAsset?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {previewAsset?.file_type === 'image' || previewAsset?.file_type === 'vector' ? (
              <img
                src={previewAsset.url}
                alt={previewAsset.name}
                className="max-h-[70vh] mx-auto object-contain rounded-lg"
              />
            ) : previewAsset?.file_type === 'video' ? (
              <video
                src={previewAsset.url}
                controls
                className="max-h-[70vh] mx-auto rounded-lg"
              />
            ) : previewAsset?.file_type === 'pdf' ? (
              <iframe
                src={previewAsset.url}
                className="w-full h-[70vh] rounded-lg"
                title={previewAsset.name}
              />
            ) : (
              <div className="text-center py-12">
                {getFileIcon(previewAsset?.file_type || 'other')}
                <p className="mt-4 text-muted-foreground">
                  Preview not available for this file type
                </p>
                <Button
                  className="mt-4"
                  onClick={() => window.open(previewAsset?.url, '_blank')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download File
                </Button>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {previewAsset?.width && previewAsset?.height && (
                <span>{previewAsset.width} × {previewAsset.height} • </span>
              )}
              {formatFileSize(previewAsset?.file_size || null)}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleCopyUrl(previewAsset?.url || '')}>
                <Copy className="mr-2 h-4 w-4" />
                Copy URL
              </Button>
              <Button onClick={() => window.open(previewAsset?.url, '_blank')}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Asset Card Component (Grid View)
interface AssetCardProps {
  asset: ClinicAsset;
  isEditing: boolean;
  editName: string;
  onEditName: (name: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onPreview: () => void;
  onCopyUrl: () => void;
  onDelete: () => void;
}

function AssetCard({
  asset,
  isEditing,
  editName,
  onEditName,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onPreview,
  onCopyUrl,
  onDelete
}: AssetCardProps) {
  return (
    <Card className="group overflow-hidden hover:shadow-md transition-shadow">
      <div 
        className="aspect-square relative bg-muted cursor-pointer"
        onClick={onPreview}
      >
        {asset.file_type === 'image' || asset.file_type === 'vector' ? (
          <img
            src={asset.url}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {getFileIcon(asset.file_type)}
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="icon" variant="secondary" onClick={(e) => { e.stopPropagation(); onPreview(); }}>
            <Eye size={16} />
          </Button>
          <Button size="icon" variant="secondary" onClick={(e) => { e.stopPropagation(); onCopyUrl(); }}>
            <Copy size={16} />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="destructive" onClick={(e) => e.stopPropagation()}>
                <Trash2 size={16} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{asset.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="p-2">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              value={editName}
              onChange={(e) => onEditName(e.target.value)}
              className="h-7 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit();
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onSaveEdit}>
              <Check size={14} />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCancelEdit}>
              <X size={14} />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <p className="text-xs font-medium truncate flex-1" title={asset.name}>
              {asset.name}
            </p>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onStartEdit}
            >
              <Edit2 size={12} />
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {formatFileSize(asset.file_size)}
        </p>
      </div>
    </Card>
  );
}

// Asset List Item Component (List View)
function AssetListItem({
  asset,
  isEditing,
  editName,
  onEditName,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onPreview,
  onCopyUrl,
  onDelete
}: AssetCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
      <div 
        className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center cursor-pointer overflow-hidden"
        onClick={onPreview}
      >
        {asset.file_type === 'image' || asset.file_type === 'vector' ? (
          <img
            src={asset.url}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        ) : (
          getFileIcon(asset.file_type)
        )}
      </div>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editName}
              onChange={(e) => onEditName(e.target.value)}
              className="h-8"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit();
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
            <Button size="sm" variant="ghost" onClick={onSaveEdit}>
              <Check size={14} />
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancelEdit}>
              <X size={14} />
            </Button>
          </div>
        ) : (
          <>
            <p className="font-medium truncate">{asset.name}</p>
            <p className="text-sm text-muted-foreground">
              {asset.file_type.charAt(0).toUpperCase() + asset.file_type.slice(1)} • {formatFileSize(asset.file_size)}
              {asset.width && asset.height && ` • ${asset.width}×${asset.height}`}
            </p>
          </>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" onClick={onPreview}>
          <Eye size={18} />
        </Button>
        <Button size="icon" variant="ghost" onClick={onStartEdit}>
          <Edit2 size={18} />
        </Button>
        <Button size="icon" variant="ghost" onClick={onCopyUrl}>
          <Copy size={18} />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
              <Trash2 size={18} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Asset</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{asset.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
