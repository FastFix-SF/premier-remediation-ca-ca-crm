import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTeamMembers } from '@/hooks/useTeamMembers';

interface UserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (userId: string, userName: string, avatarUrl: string | null) => void;
}

export const UserSelectionModal: React.FC<UserSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: teamMembers = [], isLoading } = useTeamMembers();

  const filteredMembers = teamMembers.filter((member) =>
    member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (member: typeof teamMembers[0]) => {
    onSelect(member.user_id, member.full_name || member.email, member.avatar_url || null);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl p-0 z-[10001]">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-6 h-6" />
            </Button>
            <h2 className="text-lg font-semibold">Select user</h2>
            <div className="w-10" />
          </div>

          {/* Search */}
          <div className="px-6 py-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl bg-muted/50 border-none"
              />
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p>Loading users...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p>No users found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredMembers.map((member) => (
                  <button
                    key={member.user_id}
                    className="w-full flex items-center gap-3 px-6 py-4 hover:bg-muted/30 transition-colors"
                    onClick={() => handleSelect(member)}
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.avatar_url || ''} />
                      <AvatarFallback>
                        {member.full_name?.slice(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-base font-medium text-foreground">
                      {member.full_name || member.email}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border">
            <Button
              variant="outline"
              className="w-full h-14 rounded-full text-base"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
