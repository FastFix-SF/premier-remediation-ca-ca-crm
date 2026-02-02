import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AIMessageSuggestionsProps {
  lastMessage?: string;
  channelContext: string;
  onSuggestionSelect: (suggestion: string) => void;
  isVisible: boolean;
}

interface Suggestion {
  text: string;
  type: 'quick' | 'contextual' | 'smart';
  icon: React.ReactNode;
}

export const AIMessageSuggestions: React.FC<AIMessageSuggestionsProps> = ({
  lastMessage,
  channelContext,
  onSuggestionSelect,
  isVisible,
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    if (isVisible) {
      generateSuggestions();
    }
  }, [lastMessage, channelContext, isVisible, t]);

  const generateSuggestions = () => {
    const contextualSuggestions = getContextualSuggestions();
    const quickReplies = getQuickReplies();
    const smartSuggestions = getSmartSuggestions();

    const allSuggestions = [
      ...contextualSuggestions,
      ...quickReplies,
      ...smartSuggestions,
    ].slice(0, 6); // Limit to 6 suggestions

    setSuggestions(allSuggestions);
  };

  const getContextualSuggestions = (): Suggestion[] => {
    if (!lastMessage) return [];

    const lowerMessage = lastMessage.toLowerCase();
    
    if (lowerMessage.includes('meeting') || lowerMessage.includes('schedule') || lowerMessage.includes('reunión') || lowerMessage.includes('horario')) {
      return [
        { text: t('chat.whatTimeWorks'), type: 'contextual', icon: <Clock className="w-3 h-3" /> },
        { text: t('chat.sendCalendarInvite'), type: 'contextual', icon: <Clock className="w-3 h-3" /> },
      ];
    }
    
    if (lowerMessage.includes('project') || lowerMessage.includes('deadline') || lowerMessage.includes('proyecto') || lowerMessage.includes('fecha límite')) {
      return [
        { text: t('chat.updateProjectStatus'), type: 'contextual', icon: <Zap className="w-3 h-3" /> },
        { text: t('chat.needHelp'), type: 'contextual', icon: <Zap className="w-3 h-3" /> },
      ];
    }
    
    if (lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('problema')) {
      return [
        { text: t('chat.letMeLook'), type: 'contextual', icon: <Zap className="w-3 h-3" /> },
        { text: t('chat.shareMoreDetails'), type: 'contextual', icon: <Zap className="w-3 h-3" /> },
      ];
    }

    return [];
  };

  const getQuickReplies = (): Suggestion[] => {
    return [
      { text: t('chat.soundsGood'), type: 'quick', icon: <Sparkles className="w-3 h-3" /> },
      { text: t('chat.thanksForUpdate'), type: 'quick', icon: <Sparkles className="w-3 h-3" /> },
      { text: t('chat.illTakeCareOfIt'), type: 'quick', icon: <Sparkles className="w-3 h-3" /> },
      { text: t('chat.keepMePosted'), type: 'quick', icon: <Sparkles className="w-3 h-3" /> },
    ];
  };

  const getSmartSuggestions = (): Suggestion[] => {
    const hour = new Date().getHours();
    const isWorkingHours = hour >= 9 && hour <= 17;
    
    if (channelContext.toLowerCase().includes('general')) {
      return [
        { 
          text: isWorkingHours ? t('chat.goodMorningTeam') : t('chat.haveGreatEvening'),
          type: 'smart',
          icon: <Sparkles className="w-3 h-3" />
        },
      ];
    }
    
    if (channelContext.toLowerCase().includes('project') || channelContext.toLowerCase().includes('proyecto')) {
      return [
        { text: t('chat.nextMilestone'), type: 'smart', icon: <Sparkles className="w-3 h-3" /> },
        { text: t('chat.anyBlockers'), type: 'smart', icon: <Sparkles className="w-3 h-3" /> },
      ];
    }

    return [];
  };

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="px-4 pb-2 animate-fade-up">
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="ai-suggestion-pill flex items-center space-x-1"
            onClick={() => onSuggestionSelect(suggestion.text)}
          >
            {suggestion.icon}
            <span>{suggestion.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
