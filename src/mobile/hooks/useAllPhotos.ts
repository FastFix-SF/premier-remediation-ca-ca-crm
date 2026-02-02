import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PhotoWithDetails {
  id: string;
  photo_url: string;
  caption?: string;
  uploaded_at: string;
  uploaded_by: string;
  uploader_initials: string;
  uploader_name: string;
  project_id: string;
  project_name: string;
  photo_tag?: string;
}

export interface GroupedPhotos {
  date: string;
  dateLabel: string;
  photos: PhotoWithDetails[];
}

const formatDateLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  if (isToday) {
    return `Today • ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
  if (isYesterday) {
    return `Yesterday • ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const getInitials = (fullName?: string): string => {
  if (!fullName) return '??';
  const parts = fullName.trim().split(' ').filter(Boolean);
  const first = parts[0]?.charAt(0)?.toUpperCase() || '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.charAt(0)?.toUpperCase() : '';
  return first + last || '??';
};

const groupPhotosByDate = (photos: PhotoWithDetails[]): GroupedPhotos[] => {
  const groups: Record<string, PhotoWithDetails[]> = {};
  
  photos.forEach(photo => {
    const date = new Date(photo.uploaded_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(photo);
  });
  
  return Object.entries(groups)
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .map(([date, photos]) => ({
      date,
      dateLabel: formatDateLabel(date),
      photos
    }));
};

interface UseAllPhotosFilters {
  tag?: string;
  projectId?: string;
  uploaderId?: string;
}

const PAGE_SIZE = 30; // Reduced for faster initial load

export const useAllPhotos = (filters?: UseAllPhotosFilters) => {
  return useInfiniteQuery({
    queryKey: ['all-photos', filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('project_photos')
        .select(`
          id,
          photo_url,
          caption,
          uploaded_at,
          uploaded_by,
          photo_tag,
          project_id,
          projects!inner(name)
        `)
        .order('uploaded_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);
      
      if (filters?.tag && filters.tag !== 'all') {
        query = query.eq('photo_tag', filters.tag);
      }
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters?.uploaderId) {
        query = query.eq('uploaded_by', filters.uploaderId);
      }
      
      const { data: photos, error } = await query;
      
      if (error) throw error;
      
      // Get unique uploader IDs
      const uploaderIds = [...new Set(photos?.map(p => p.uploaded_by).filter(Boolean) || [])];
      
      // Fetch team member details for uploaders
      let teamMembers: Record<string, { full_name: string }> = {};
      if (uploaderIds.length > 0) {
        const { data: members } = await supabase
          .from('team_directory')
          .select('user_id, full_name')
          .in('user_id', uploaderIds);
        
        if (members) {
          teamMembers = members.reduce((acc, m) => {
            if (m.user_id) {
              acc[m.user_id] = { full_name: m.full_name || '' };
            }
            return acc;
          }, {} as Record<string, { full_name: string }>);
        }
      }
      
      // Map photos with uploader details
      const photosWithDetails: PhotoWithDetails[] = (photos || []).map(photo => {
        const uploader = teamMembers[photo.uploaded_by || ''];
        const projectData = photo.projects as unknown as { name: string } | null;
        
        return {
          id: photo.id,
          photo_url: photo.photo_url,
          caption: photo.caption || undefined,
          uploaded_at: photo.uploaded_at,
          uploaded_by: photo.uploaded_by || '',
          uploader_initials: getInitials(uploader?.full_name),
          uploader_name: uploader?.full_name || 'Unknown',
          project_id: photo.project_id,
          project_name: projectData?.name || 'Unknown Project',
          photo_tag: photo.photo_tag || undefined
        };
      });
      
      return {
        photos: photosWithDetails,
        grouped: groupPhotosByDate(photosWithDetails),
        nextPage: photos && photos.length === PAGE_SIZE ? pageParam + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes for better caching
  });
};
