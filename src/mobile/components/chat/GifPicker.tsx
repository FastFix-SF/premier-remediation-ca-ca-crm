import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Gif {
  id: string;
  title: string;
  url: string;
  preview: string;
  width: number;
  height: number;
}

interface GifPickerProps {
  isOpen: boolean;
  onSelectGif: (gifUrl: string) => void;
  onClose: () => void;
}

export const GifPicker: React.FC<GifPickerProps> = ({ isOpen, onSelectGif, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchGifs = async (search?: string) => {
    setIsLoading(true);
    try {
      console.log('Fetching GIFs with search term:', search);
      const { data, error } = await supabase.functions.invoke('fetch-gifs', {
        body: { searchTerm: search || '', limit: 12 }
      });

      console.log('GIF fetch response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data || !data.gifs) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response from GIF service');
      }

      console.log('Successfully fetched GIFs:', data.gifs.length);
      setGifs(data.gifs || []);
    } catch (error) {
      console.error('Failed to fetch GIFs:', error);
      toast.error('Failed to load GIFs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load trending GIFs on mount
    fetchGifs();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGifs(searchTerm);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[70vh] p-0" hideClose>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-2 p-4 border-b">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search GIFs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" size="sm">
                Search
              </Button>
            </form>
          </div>

          {/* GIF Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">Loading GIFs...</div>
              </div>
            ) : gifs.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">No GIFs found</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {gifs.map((gif) => (
                  <button
                    key={gif.id}
                    onClick={() => {
                      onSelectGif(gif.url);
                      onClose();
                    }}
                    className="relative aspect-square rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-primary transition-all"
                  >
                    <img
                      src={gif.preview}
                      alt={gif.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
