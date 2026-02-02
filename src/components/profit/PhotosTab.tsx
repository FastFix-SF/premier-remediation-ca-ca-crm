import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Filter, Grid, List, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PhotosTabProps {
  projectId: string;
}

export const PhotosTab: React.FC<PhotosTabProps> = ({ projectId }) => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchPhotos();
  }, [projectId]);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('project_photos')
        .select('*')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast({
        title: "Error",
        description: "Failed to load project photos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPhotos = photos.filter(photo => {
    const matchesTag = filterTag === 'all' || photo.photo_tag === filterTag;
    const matchesSearch = searchTerm === '' || 
      photo.caption?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'before':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'after':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'progress':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'damage':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'communication':
        return 'bg-purple-500/10 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const uniqueTags = [...new Set(photos.map(p => p.photo_tag).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading photos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search photos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:w-64"
          />
          <Select value={filterTag} onValueChange={setFilterTag}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Photos</SelectItem>
              {uniqueTags.filter(tag => tag && tag.trim()).map(tag => (
                <SelectItem key={tag} value={tag}>
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Photos
          </Button>
        </div>
      </div>

      {/* Photos Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{photos.length}</div>
              <p className="text-sm text-muted-foreground">Total Photos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {photos.filter(p => p.photo_tag === 'before').length}
              </div>
              <p className="text-sm text-muted-foreground">Before</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {photos.filter(p => p.photo_tag === 'after').length}
              </div>
              <p className="text-sm text-muted-foreground">After</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {photos.filter(p => p.photo_tag === 'progress').length}
              </div>
              <p className="text-sm text-muted-foreground">Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {photos.filter(p => p.photo_tag === 'communication').length}
              </div>
              <p className="text-sm text-muted-foreground">Communication</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Photos Grid/List */}
      {filteredPhotos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground">
              <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Photos Found</h3>
              <p className="mb-4">
                {searchTerm || filterTag !== 'all' 
                  ? 'No photos match your current filters' 
                  : 'Upload photos to track project progress'
                }
              </p>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload First Photo
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-4'
        }>
          {filteredPhotos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              <div className="aspect-square bg-muted relative">
                <img
                  src={photo.photo_url}
                  alt={photo.caption || 'Project photo'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {photo.photo_tag && (
                  <Badge 
                    className={`absolute top-2 left-2 ${getTagColor(photo.photo_tag)}`}
                  >
                    {photo.photo_tag.charAt(0).toUpperCase() + photo.photo_tag.slice(1)}
                  </Badge>
                )}
              </div>
              {viewMode === 'list' && (
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{photo.caption || 'Untitled'}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(photo.uploaded_at).toLocaleDateString()}
                      </p>
                      {photo.photo_tag && (
                        <Badge 
                          variant="outline"
                          className={`mt-2 ${getTagColor(photo.photo_tag)}`}
                        >
                          {photo.photo_tag}
                        </Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};