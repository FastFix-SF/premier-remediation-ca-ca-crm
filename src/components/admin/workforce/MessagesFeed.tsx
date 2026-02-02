import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { MessageCircle, User, Clock, AlertCircle, Megaphone, Search } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { useToast } from '../../../hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';

interface WorkforceMessage {
  id: string;
  author_name: string;
  author_role?: string;
  message_text: string;
  message_type: string;
  channel_name?: string;
  timestamp: string;
  is_important: boolean;
  attachments?: any;
}

const MessagesFeed = () => {
  const [messages, setMessages] = useState<WorkforceMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<WorkforceMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [messages, searchTerm, typeFilter]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('workforce_messages')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedMessages = (data || []).map(msg => ({
        ...msg,
        attachments: msg.attachments || []
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load team messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...messages];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(message =>
        message.message_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.channel_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(message => message.message_type === typeFilter);
    }

    setFilteredMessages(filtered);
  };

  const getMessageIcon = (type: string, isImportant: boolean) => {
    if (isImportant) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }

    switch (type) {
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-blue-500" />;
      case 'chat':
        return <MessageCircle className="w-4 h-4 text-green-500" />;
      case 'alert':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'system':
        return <Clock className="w-4 h-4 text-gray-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getMessageTypeBadge = (type: string) => {
    const typeConfig = {
      announcement: { label: 'Announcement', variant: 'secondary' as const },
      chat: { label: 'Chat', variant: 'outline' as const },
      alert: { label: 'Alert', variant: 'destructive' as const },
      system: { label: 'System', variant: 'default' as const },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || {
      label: type,
      variant: 'outline' as const
    };

    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  const getAuthorInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search & Filter Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                placeholder="Search messages or authors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="announcement">Announcements</SelectItem>
                  <SelectItem value="chat">Team Chat</SelectItem>
                  <SelectItem value="alert">Alerts</SelectItem>
                  <SelectItem value="system">System Messages</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Feed */}
      <div className="space-y-3">
        {filteredMessages.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">No messages found</p>
              <p className="text-sm text-muted-foreground">
                {messages.length === 0 
                  ? "Try syncing workforce data to see team messages"
                  : "Try adjusting your search or filters"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredMessages.map((message) => (
            <Card key={message.id} className={`transition-all hover:shadow-md ${message.is_important ? 'border-red-200 bg-red-50/50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getAuthorInitials(message.author_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{message.author_name}</span>
                        {message.author_role && (
                          <Badge variant="outline" className="text-xs">
                            {message.author_role}
                          </Badge>
                        )}
                        {message.channel_name && (
                          <span className="text-xs text-muted-foreground">
                            in #{message.channel_name}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        {getMessageIcon(message.message_type, message.is_important)}
                        {getMessageTypeBadge(message.message_type)}
                        <span title={format(new Date(message.timestamp), 'PPpp')}>
                          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm leading-relaxed">
                      {message.message_text}
                    </div>
                    
                    {message.attachments && Array.isArray(message.attachments) && message.attachments.length > 0 && (
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>📎 {message.attachments.length} attachment(s)</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More Button */}
      {filteredMessages.length > 0 && filteredMessages.length >= 100 && (
        <Card>
          <CardContent className="text-center py-4">
            <Button variant="outline" onClick={fetchMessages}>
              Load More Messages
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MessagesFeed;