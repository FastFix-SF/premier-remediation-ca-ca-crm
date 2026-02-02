import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTeamMember } from '@/hooks/useTeamMember';
import { useAvatar } from '@/hooks/useAvatars';
import { VoicePlayer } from './VoiceMessage';
import { Check, CheckCheck, Clock, RotateCcw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getDateStringPacific, getTodayDateStringPacific } from '@/utils/timezone';

interface Message {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  sender_user_id?: string;
  sender_employee_id?: string;
  is_important?: boolean;
  message_type?: string;
  isOwn: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isOptimistic?: boolean;
  reactions?: { emoji: string; count: number; users: string[] }[];
  audio_url?: string;
  duration?: number;
  attachments?: Array<{
    url: string;
    filename: string;
    type: string;
    size?: number;
  }>;
}

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  onRetry?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  showAvatar = true,
  onRetry
}) => {
  const { getMemberByUserId, getInitials } = useTeamMember();
  const { data: avatarUrl } = useAvatar(message.sender_user_id);
  
  // Get team member info for better display
  const senderMember = message.sender_user_id ? getMemberByUserId(message.sender_user_id) : null;
  const displayName = senderMember?.full_name || message.sender;
  const senderRole = senderMember?.role;
  const getInitialsLocal = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const todayStr = getTodayDateStringPacific();
    const dateStr = getDateStringPacific(date);
    
    // Calculate yesterday in Pacific Time
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getDateStringPacific(yesterday);

    if (dateStr === todayStr) {
      return 'Today';
    } else if (dateStr === yesterdayStr) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        timeZone: 'America/Los_Angeles',
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const isGifUrl = (text: string) => {
    try {
      const url = new URL(text);
      return url.hostname.includes('tenor') || 
             url.hostname.includes('giphy') || 
             text.toLowerCase().endsWith('.gif');
    } catch {
      return false;
    }
  };

  const isLocationMessage = (text: string) => {
    return text.includes('📍 Location:') && text.includes('maps.google.com');
  };

  const extractCoordinates = (text: string): { lat: number; lng: number } | null => {
    try {
      const match = text.match(/q=([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)/);
      if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }
      return null;
    } catch {
      return null;
    }
  };

  const [mapboxToken, setMapboxToken] = useState<string>('');
  
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data } = await supabase.functions.invoke('map-config');
        if (data?.mapboxPublicToken) {
          setMapboxToken(data.mapboxPublicToken);
        }
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
      }
    };
    fetchMapboxToken();
  }, []);

  const renderLocationMap = (text: string) => {
    const coords = extractCoordinates(text);
    if (!coords || !mapboxToken) return null;

    const { lat, lng } = coords;
    const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+ff0000(${lng},${lat})/${lng},${lat},14,0/600x300@2x?access_token=${mapboxToken}`;
    const googleMapsUrl = `https://maps.google.com/?q=${lat},${lng}`;

    return (
      <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={mapUrl}
          alt="Location Map"
          className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          loading="lazy"
        />
        <p className="text-xs mt-2 px-4 pb-2 opacity-70">📍 Tap to open in Google Maps</p>
      </a>
    );
  };

  const renderStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-muted-foreground animate-spin" />;
      case 'sent':
        return <Check className="w-3 h-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-primary" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-destructive" />;
      default:
        return <Check className="w-3 h-3 text-muted-foreground" />;
    }
  };

  if (message.isOwn) {
    // Own messages (right side, blue)
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[75%]">
        <div className={`
            rounded-2xl rounded-br-md shadow-sm transition-all duration-200
            ${message.status === 'failed' 
              ? 'bg-destructive/10 border border-destructive/20' 
              : message.message_type === 'voice' 
                ? 'bg-[#25D366]' 
                : 'bg-primary text-primary-foreground'
            }
          `}>
            {message.message_type !== 'voice' && (
              isLocationMessage(message.message) ? (
                renderLocationMap(message.message)
              ) : isGifUrl(message.message) ? (
                <img
                  src={message.message}
                  alt="GIF"
                  className="max-w-full max-h-64 rounded-lg"
                  loading="lazy"
                />
              ) : (
                <p className="text-sm leading-relaxed break-words px-4 py-2">{message.message}</p>
              )
            )}
            {message.message_type === 'voice' && message.audio_url && message.duration && (
              <div className="p-2">
                <VoicePlayer 
                  audioUrl={message.audio_url} 
                  duration={message.duration} 
                  isOwn={true}
                />
              </div>
            )}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((attachment, index) => (
                  <div key={index}>
                    {attachment.type.startsWith('image/') ? (
                      <img
                        src={attachment.url}
                        alt={attachment.filename}
                        className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(attachment.url, '_blank')}
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-primary-foreground/10 rounded-lg">
                        <div className="w-8 h-8 bg-primary-foreground/20 rounded flex items-center justify-center">
                          <span className="text-xs font-bold">📎</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate text-primary-foreground">
                            {attachment.filename}
                          </p>
                          {attachment.size && (
                            <p className="text-xs text-primary-foreground/70">
                              {(attachment.size / 1024).toFixed(1)} KB
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-1 mt-1">
            {message.status === 'failed' && onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetry}
                className="h-auto p-1 text-xs text-destructive hover:text-destructive"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDate(message.timestamp)} · {formatTime(message.timestamp)}
            </span>
            {renderStatusIcon()}
            {message.is_important && (
              <Badge variant="destructive" className="ml-1 h-4 text-xs px-1">
                !
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Other messages (left side, gray)
  return (
    <div className="flex space-x-3 animate-fade-in">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {showAvatar ? (
          <Avatar className="w-8 h-8 ring-2 ring-background">
            {avatarUrl && (
              <AvatarImage src={avatarUrl} alt={displayName} />
            )}
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs font-medium">
              {getInitialsLocal(displayName)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8 h-8" /> // Spacer for alignment
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 max-w-[75%]">
        {showAvatar && (
          <div className="flex items-baseline space-x-2 mb-1">
            <span className="text-sm font-medium text-foreground">
              {displayName}
            </span>
            {senderRole && (
              <Badge variant="secondary" className="text-xs px-2 py-0 h-4 rounded-full">
                {senderRole}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDate(message.timestamp)} · {formatTime(message.timestamp)}
            </span>
            {message.is_important && (
              <Badge variant="destructive" className="h-4 text-xs px-2 rounded-full">
                Important
              </Badge>
            )}
          </div>
        )}
        
        <div className="bg-muted/50 backdrop-blur-sm rounded-2xl rounded-bl-md shadow-sm border border-border/50 overflow-hidden">
          {isLocationMessage(message.message) ? (
            renderLocationMap(message.message)
          ) : isGifUrl(message.message) ? (
            <img
              src={message.message}
              alt="GIF"
              className="max-w-full max-h-64 w-full object-contain"
              loading="lazy"
            />
          ) : (
            <p className="text-sm leading-relaxed break-words text-foreground px-4 py-2">
              {message.message}
            </p>
          )}
          {message.message_type === 'voice' && message.audio_url && message.duration && (
            <div className="mt-2">
              <VoicePlayer 
                audioUrl={message.audio_url} 
                duration={message.duration} 
                isOwn={false}
              />
            </div>
          )}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, index) => (
                <div key={index}>
                  {attachment.type.startsWith('image/') ? (
                    <img
                      src={attachment.url}
                      alt={attachment.filename}
                      className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(attachment.url, '_blank')}
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <div className="w-8 h-8 bg-muted-foreground/20 rounded flex items-center justify-center">
                        <span className="text-xs font-bold">📎</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {attachment.filename}
                        </p>
                        {attachment.size && (
                          <p className="text-xs text-muted-foreground">
                            {(attachment.size / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {!showAvatar && (
          <div className="flex justify-start mt-1">
            <span className="text-xs text-muted-foreground">
              {formatDate(message.timestamp)} · {formatTime(message.timestamp)}
            </span>
            {message.is_important && (
              <Badge variant="destructive" className="ml-2 h-4 text-xs px-1">
                !
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
