import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone } from 'lucide-react';

interface UserRequestCardProps {
  name: string;
  phone: string;
  onApprove: () => void;
  userId?: string;
  avatarUrl?: string | null;
}

export const UserRequestCard: React.FC<UserRequestCardProps> = ({
  name,
  phone,
  onApprove,
  userId,
  avatarUrl,
}) => {
  const getInitials = (fullName: string) => {
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (fullName: string) => {
    const colors = [
      'bg-orange-500', 'bg-blue-500', 'bg-pink-500', 
      'bg-green-500', 'bg-purple-500', 'bg-yellow-500',
      'bg-red-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = fullName.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
      <div className="flex items-center gap-3">
        <Avatar className={`w-12 h-12 ${!avatarUrl ? getAvatarColor(name) : ''}`}>
          {avatarUrl && (
            <AvatarImage src={avatarUrl} alt={name} />
          )}
          <AvatarFallback className="text-white font-semibold">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-base">{name}</p>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Phone className="w-3 h-3" />
            <span>{phone}</span>
          </div>
        </div>
      </div>
      
      <Button
        onClick={onApprove}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        Approve
      </Button>
    </div>
  );
};
