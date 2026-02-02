import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, ArrowLeft, Calendar, User, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useTeamMember } from '@/hooks/useTeamMember';

interface SearchMessage {
  id: string;
  message: string;
  sender: string;
  sender_user_id?: string;
  timestamp: string;
  channel_name: string;
  message_type?: string;
}

interface MessageSearchProps {
  onClose: () => void;
  onMessageSelect: (channelId: string, messageId: string) => void;
}

export const MessageSearch: React.FC<MessageSearchProps> = ({
  onClose,
  onMessageSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedSender, setSelectedSender] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const { teamMembers, getDisplayName } = useTeamMember();

  const channels = useMemo(() => [
    { id: 'all', name: 'All Channels' },
    { id: 'general', name: 'General' },
    { id: 'project-updates', name: 'Project Updates' },
    { id: 'daily-operations', name: 'Daily Operations' },
    { id: 'logistics', name: 'Logistics' },
  ], []);

  const senders = useMemo(() => [
    { id: 'all', name: 'All Members' },
    ...teamMembers.map(member => ({
      id: member.user_id,
      name: member.full_name || member.email.split('@')[0]
    }))
  ], [teamMembers]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedChannel, selectedSender, dateFilter]);

  const performSearch = async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('team_chats')
        .select('*')
        .ilike('message', `%${searchQuery.trim()}%`)
        .order('timestamp', { ascending: false })
        .limit(50);

      // Apply channel filter
      if (selectedChannel !== 'all') {
        const channelName = channels.find(c => c.id === selectedChannel)?.name.toLowerCase().replace(/\s+/g, ' ');
        if (channelName) {
          query = query.eq('channel_name', channelName);
        }
      }

      // Apply sender filter
      if (selectedSender !== 'all') {
        query = query.eq('sender_user_id', selectedSender);
      }

      // Apply date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('timestamp', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching messages:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.trim()})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleMessageClick = (message: SearchMessage) => {
    const channelId = message.channel_name.toLowerCase().replace(/\s+/g, '-');
    onMessageSelect(channelId, message.id);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Search Header */}
      <div className="sticky top-0 bg-background border-b border-border p-4 z-10">
        <div className="flex items-center space-x-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="p-1"
            onClick={onClose}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">Search Messages</h2>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="pl-10 pr-10 border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary rounded-2xl"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1"
              onClick={() => setSearchQuery('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-2">
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="h-8 text-xs">
              <Hash className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {channels.map(channel => (
                <SelectItem key={channel.id} value={channel.id} className="text-xs">
                  {channel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSender} onValueChange={setSelectedSender}>
            <SelectTrigger className="h-8 text-xs">
              <User className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {senders.map(sender => (
                <SelectItem key={sender.id} value={sender.id} className="text-xs">
                  {sender.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="h-8 text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Time</SelectItem>
              <SelectItem value="today" className="text-xs">Today</SelectItem>
              <SelectItem value="week" className="text-xs">This Week</SelectItem>
              <SelectItem value="month" className="text-xs">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Searching...</div>
          </div>
        ) : searchQuery.length < 2 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Search className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Search Messages
            </h3>
            <p className="text-sm text-muted-foreground">
              Type at least 2 characters to search through your team's messages
            </p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Search className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No Results Found
            </h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search terms or filters
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            <div className="px-2 py-1">
              <p className="text-xs text-muted-foreground">
                {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found
              </p>
            </div>
            
            {searchResults.map((message) => (
              <Card
                key={message.id}
                className="p-0 cursor-pointer hover:bg-muted/50 transition-colors border-0 shadow-none"
                onClick={() => handleMessageClick(message)}
              >
                <div className="flex items-start space-x-3 p-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(getDisplayName(message.sender_user_id, message.sender))}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {getDisplayName(message.sender_user_id, message.sender)}
                      </span>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        #{message.channel_name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(message.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-foreground line-clamp-2">
                      {highlightText(message.message, searchQuery)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};