import React, { useState, useMemo, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';

interface User {
  user_id: string | null;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
}

interface UserSelectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUserIds: string[];
  onSelectUsers: (userIds: string[]) => void;
}

export const UserSelectionSheet: React.FC<UserSelectionSheetProps> = ({
  isOpen,
  onClose,
  selectedUserIds,
  onSelectUsers
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [enableClaim, setEnableClaim] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedUserIds);
  const [profilesMap, setProfilesMap] = useState<Map<string, string>>(new Map());

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['team-directory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_directory')
        .select('*')
        .eq('status', 'active')
        .order('full_name');
      
      if (error) throw error;
      return data as User[];
    }
  });

  // Fetch profile pictures
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase.from('profiles').select('id, avatar_url');
      if (data) {
        setProfilesMap(new Map(data.map(p => [p.id, p.avatar_url || ''])));
      }
    };
    fetchProfiles();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.full_name?.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const handleToggleUser = (userId: string) => {
    setTempSelectedIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const allUserIds = filteredUsers.map(u => u.user_id).filter(Boolean) as string[];
    setTempSelectedIds(allUserIds);
  };

  const handleConfirm = () => {
    onSelectUsers(tempSelectedIds);
    onClose();
  };

  const handleCancel = () => {
    setTempSelectedIds(selectedUserIds);
    onClose();
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleCancel}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0 z-[10001]">
        <SheetHeader className="px-4 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="h-6 w-6" />
            </Button>
            <SheetTitle>Select users</SheetTitle>
            <div className="w-10" />
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Enable claim toggle */}
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm">Enable users to claim this shift</span>
              <Switch checked={enableClaim} onCheckedChange={setEnableClaim} />
            </div>
          </div>

          {/* Search bar */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                variant="ghost" 
                className="text-primary"
                onClick={handleSelectAll}
              >
                Select all
              </Button>
            </div>
          </div>

          {/* User list */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredUsers.map((user) => {
                  const userId = user.user_id || user.email;
                  const isSelected = tempSelectedIds.includes(userId);
                  
                  return (
                    <div
                      key={userId}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50"
                      onClick={() => handleToggleUser(userId)}
                    >
                      <Avatar className="h-10 w-10">
                        {profilesMap.get(userId) && (
                          <AvatarImage src={profilesMap.get(userId)} alt={user.full_name || user.email} />
                        )}
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {user.full_name || user.email}
                        </p>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                          Available
                        </p>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => handleToggleUser(userId)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="px-4 py-4 border-t border-border flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleConfirm}
          >
            Select {tempSelectedIds.length} users
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
