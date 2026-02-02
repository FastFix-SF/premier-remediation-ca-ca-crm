import React, { useState } from 'react';
import { Search, User, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTeamMembers, TeamMember } from '@/hooks/useTeamMembers';

interface TechnicianSelectPopoverProps {
  selectedTechnician: { id: string; name: string } | null;
  onSelect: (technician: { id: string; name: string } | null) => void;
}

export const TechnicianSelectPopover: React.FC<TechnicianSelectPopoverProps> = ({
  selectedTechnician,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: teamMembers = [], isLoading } = useTeamMembers();

  const filteredMembers = teamMembers.filter((member) => {
    const name = member.full_name || member.email || '';
    return name.toLowerCase().includes(search.toLowerCase()) ||
      member.email?.toLowerCase().includes(search.toLowerCase()) ||
      member.role?.toLowerCase().includes(search.toLowerCase());
  });

  const getDisplayName = (member: TeamMember) => {
    return member.full_name || member.email || 'Unnamed';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSelectMember = (member: TeamMember) => {
    onSelect({ id: member.user_id, name: getDisplayName(member) });
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10 font-normal"
        >
          {selectedTechnician ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-primary">
                  {getInitials(selectedTechnician.name)}
                </span>
              </div>
              <span className="truncate">{selectedTechnician.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select technician...</span>
          )}
          {selectedTechnician ? (
            <X
              className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100 cursor-pointer"
              onClick={handleClear}
            />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0 z-50 bg-popover" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="h-[280px]">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Loading...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No team members found
            </div>
          ) : (
            <div className="py-1">
              {filteredMembers.map((member) => {
                const name = getDisplayName(member);
                return (
                  <button
                    key={member.user_id}
                    onClick={() => handleSelectMember(member)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={member.avatar_url || undefined} alt={name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm truncate block">{name}</span>
                      {member.email && (
                        <span className="text-xs text-muted-foreground truncate block">
                          {member.email}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 capitalize">
                      {member.role || 'Team Member'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
