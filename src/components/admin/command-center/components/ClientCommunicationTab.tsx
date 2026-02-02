import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Users, User, Send } from 'lucide-react';
import { useProjectTeamChat } from '../hooks/useProjectTeamChat';
import { useClientPortalChat } from '../hooks/useClientPortalChat';
import { useClientCommunications } from '../hooks/useClientCommunications';
import { format } from 'date-fns';

interface ClientCommunicationTabProps {
  projectId: string;
  clientPhone?: string;
}

export const ClientCommunicationTab: React.FC<ClientCommunicationTabProps> = ({ projectId, clientPhone }) => {
  const [teamMessage, setTeamMessage] = useState('');
  const [clientMessage, setClientMessage] = useState('');
  
  const { messages: teamChat, isLoading: teamLoading, sendMessage: sendTeamMessageMutation } = useProjectTeamChat(projectId);
  const { messages: clientChat, isLoading: clientLoading, sendMessage: sendClientMessageMutation } = useClientPortalChat(projectId);
  const { communications, isLoading: commsLoading } = useClientCommunications(projectId, clientPhone);

  const handleSendTeamMessage = async () => {
    if (!teamMessage.trim()) return;
    sendTeamMessageMutation.mutate(teamMessage);
    setTeamMessage('');
  };

  const handleSendClientMessage = async () => {
    if (!clientMessage.trim()) return;
    sendClientMessageMutation.mutate(clientMessage);
    setClientMessage('');
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="team" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Team Chat
          </TabsTrigger>
          <TabsTrigger value="client" className="gap-2">
            <User className="h-4 w-4" />
            Client Chat
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            All History
          </TabsTrigger>
        </TabsList>

        {/* Team Chat */}
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Internal Team Discussion</CardTitle>
              <p className="text-sm text-muted-foreground">
                This chat syncs with the mobile app project chat
              </p>
            </CardHeader>
            <CardContent>
              {teamLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <>
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                      {teamChat && teamChat.length > 0 ? (
                        teamChat.map((message) => (
                          <div 
                            key={message.id} 
                            className="p-3 rounded-lg bg-muted"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{message.senderName || 'Team Member'}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(message.timestamp), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            <p className="text-sm">{message.message}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No team messages yet. Start the conversation!
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2 mt-4">
                    <Input
                      placeholder="Type a message to the team..."
                      value={teamMessage}
                      onChange={(e) => setTeamMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendTeamMessage()}
                    />
                    <Button onClick={handleSendTeamMessage} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Chat */}
        <TabsContent value="client">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Portal Messages</CardTitle>
              <p className="text-sm text-muted-foreground">
                Communication with the client through their portal
              </p>
            </CardHeader>
            <CardContent>
              {clientLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <>
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                      {clientChat && clientChat.length > 0 ? (
                        clientChat.map((message) => (
                          <div 
                            key={message.id} 
                            className={`p-3 rounded-lg ${
                              message.isFromClient 
                                ? 'bg-primary/10 ml-8' 
                                : 'bg-muted mr-8'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">
                                {message.senderName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(message.timestamp), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            <p className="text-sm">{message.message}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No client messages yet
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2 mt-4">
                    <Input
                      placeholder="Reply to client..."
                      value={clientMessage}
                      onChange={(e) => setClientMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendClientMessage()}
                    />
                    <Button onClick={handleSendClientMessage} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communication History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Communication History</CardTitle>
              <p className="text-sm text-muted-foreground">
                Unified view of all chatbot, SMS, and portal messages
              </p>
            </CardHeader>
            <CardContent>
              {commsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {communications && communications.length > 0 ? (
                      communications.map((comm, index) => (
                        <div key={comm.id || index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium px-2 py-1 rounded bg-muted">
                              {comm.type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comm.timestamp), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm">{comm.content}</p>
                          {comm.sender && (
                            <p className="text-xs text-muted-foreground mt-1">
                              From: {comm.sender}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No communication history found
                      </p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
