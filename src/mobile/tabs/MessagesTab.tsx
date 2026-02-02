import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ChatList } from '../components/chat/ChatList';
import { DirectMessagesList } from '../components/chat/DirectMessagesList';
import { AgentConversationsList } from '../components/chat/AgentConversationsList';
import { NotificationPrompt } from '../components/NotificationPrompt';
import { useLanguage } from '@/contexts/LanguageContext';
import { AgentHubDialog, AgentCategory } from '../components/agent-hub/AgentHubDialog';
import { AgentConversation } from '../hooks/useAgentConversations';
import agentProjectManagement from '@/assets/agent-project-management.jpg';
import agentFinancials from '@/assets/agent-financials.jpg';
import agentPeople from '@/assets/agent-people.jpg';
import agentDocuments from '@/assets/agent-documents.jpg';
import agentSettingsSupport from '@/assets/agent-settings-support.jpg';
const agentCategories = [{
  id: 'project-management' as AgentCategory,
  label: 'Project Management',
  image: agentProjectManagement
}, {
  id: 'financials' as AgentCategory,
  label: 'Financials',
  image: agentFinancials
}, {
  id: 'people' as AgentCategory,
  label: 'People',
  image: agentPeople
}, {
  id: 'documents' as AgentCategory,
  label: 'Documents',
  image: agentDocuments
}, {
  id: 'settings-support' as AgentCategory,
  label: 'Settings & Support',
  image: agentSettingsSupport
}];
export const MessagesTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'teams'>('all');
  const [chatType, setChatType] = useState<'agents' | 'team'>('team');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedAgentCategory, setSelectedAgentCategory] = useState<AgentCategory>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const navigate = useNavigate();
  const {
    t
  } = useLanguage();
  const handleStartDirectMessage = (userId: string) => {
    setSheetOpen(false);
    navigate(`/mobile/messages/chat/dm-${userId}`);
  };
  const handleSelectAgent = (agentId: AgentCategory) => {
    setSheetOpen(false);
    setSelectedAgentCategory(agentId);
    setSelectedConversationId(null); // New conversation
    setIsAgentDialogOpen(true);
  };
  const handleSelectConversation = (conversation: AgentConversation) => {
    setSelectedAgentCategory(conversation.category as AgentCategory);
    setSelectedConversationId(conversation.id);
    setIsAgentDialogOpen(true);
  };
  const handleCloseAgentDialog = (open: boolean) => {
    setIsAgentDialogOpen(open);
    if (!open) {
      setSelectedConversationId(null);
      setSelectedAgentCategory(null);
    }
  };
  return <div className="flex flex-col h-full">
      <NotificationPrompt />
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="p-4 space-y-3">
          <Tabs value={chatType} onValueChange={v => setChatType(v as 'agents' | 'team')} className="w-full">
            <TabsList className="w-full grid grid-cols-2 h-9">
              <TabsTrigger value="agents" className="text-sm">Agents</TabsTrigger>
              <TabsTrigger value="team" className="text-sm">Team</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl xs:text-2xl font-bold truncate">{t('messages.title')}</h1>
              <p className="text-xs xs:text-sm text-muted-foreground truncate">{t('messages.subtitle')}</p>
            </div>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" className="rounded-full touch-target bg-secondary">
                  <Plus className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl flex flex-col">
                <div className="py-3 xs:py-4 flex flex-col h-full overflow-hidden">
                  <h2 className="text-lg xs:text-xl font-bold mb-3 xs:mb-4 flex-shrink-0">
                    {chatType === 'agents' ? 'Select Agent' : t('messages.startConversation')}
                  </h2>
                  <div className="relative mb-3 flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder={chatType === 'agents' ? 'Search agents...' : 'Search contacts...'} 
                      className="pl-9" 
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {chatType === 'agents' ? <div className="space-y-2">
                        {agentCategories.map(agent => <button key={agent.id} onClick={() => handleSelectAgent(agent.id)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left">
                            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                              <img src={agent.image} alt={agent.label} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-medium">{agent.label}</span>
                          </button>)}
                      </div> : <DirectMessagesList onStartDirectMessage={handleStartDirectMessage} />}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('messages.searchPlaceholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
          </div>

          {chatType === 'team' && <Tabs value={filter} onValueChange={v => setFilter(v as any)} className="w-full">
              <div className="bg-muted/50 rounded-xl p-1.5">
                <TabsList variant="segmented" className="w-full grid grid-cols-3">
                  <TabsTrigger variant="segmented" value="all">{t('messages.all')}</TabsTrigger>
                  <TabsTrigger variant="segmented" value="unread">{t('messages.unread')}</TabsTrigger>
                  <TabsTrigger variant="segmented" value="teams">{t('messages.teams')}</TabsTrigger>
                </TabsList>
              </div>
            </Tabs>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chatType === 'team' ? <ChatList searchQuery={searchQuery} filter={filter} /> : <AgentConversationsList searchQuery={searchQuery} onSelectConversation={handleSelectConversation} />}
      </div>

      <AgentHubDialog open={isAgentDialogOpen} onOpenChange={handleCloseAgentDialog} category={selectedAgentCategory} conversationId={selectedConversationId} />
    </div>;
};