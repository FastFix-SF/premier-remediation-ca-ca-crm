import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDirectConversation } from '@/hooks/useDirectConversation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Send, Loader2, Paperclip, X } from 'lucide-react';
import { format } from 'date-fns';
import { FileUpload } from './FileUpload';

interface ChatViewProps {
  otherUserId: string;
}

export const ChatView: React.FC<ChatViewProps> = ({ otherUserId }) => {
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage, isSending } = useDirectConversation(otherUserId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUploaded = (fileUrl: string, fileName: string, fileType: string, fileSize?: number) => {
    const newAttachment = {
      url: fileUrl,
      filename: fileName,
      type: fileType,
      size: fileSize
    };
    
    setShowFileUpload(false);
    
    // Auto-send the attachment immediately
    const displayText = fileType.startsWith('image/') 
      ? `📸 ${fileName}`
      : `📎 ${fileName}`;
    
    sendMessage({ 
      content: displayText, 
      attachments: [newAttachment]
    });
  };

  const handleSend = () => {
    if (!messageText.trim() || isSending) return;
    
    sendMessage({ content: messageText.trim() });
    setMessageText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[75%]">
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    
                    {/* Display attachments */}
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
                              <div className={`flex items-center gap-2 p-2 rounded-lg ${
                                isOwn ? 'bg-primary-foreground/10' : 'bg-background/50'
                              }`}>
                                <div className={`w-8 h-8 rounded flex items-center justify-center ${
                                  isOwn ? 'bg-primary-foreground/20' : 'bg-muted-foreground/20'
                                }`}>
                                  <span className="text-xs font-bold">📎</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-medium truncate ${
                                    isOwn ? 'text-primary-foreground' : 'text-foreground'
                                  }`}>
                                    {attachment.filename}
                                  </p>
                                  {attachment.size && (
                                    <p className={`text-xs ${
                                      isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                    }`}>
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
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? 'text-right text-muted-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {format(new Date(message.created_at), 'h:mm a')}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-card p-4">
        <div className="flex items-end space-x-2">
          {/* File upload button */}
          <Sheet open={showFileUpload} onOpenChange={setShowFileUpload}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <FileUpload
                channelId={otherUserId}
                onFileUploaded={handleFileUploaded}
                onCancel={() => setShowFileUpload(false)}
              />
            </SheetContent>
          </Sheet>

          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isSending}
          />
          <Button
            onClick={handleSend}
            disabled={!messageText.trim() || isSending}
            size="icon"
            className="shrink-0"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};