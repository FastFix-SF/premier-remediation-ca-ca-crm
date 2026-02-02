
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

interface QualificationData {
  [key: string]: any;
  projectType?: string;
  propertySize?: number;
  projectUrgency?: string;
  budgetRange?: string;
  hasRoofingExperience?: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
}

interface Lead {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  status: 'new' | 'qualified' | 'nurturing';
  source: string;
  mrf_prospect_id: string;
  estimated_value?: number;
  qualification_data?: QualificationData;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  interestScore?: number;
}

interface SearchResult {
  id: string;
  title: string;
  url: string;
  type: 'product' | 'service' | 'faq';
  content: string;
  keywords: string[];
  category: string;
}

interface SearchContextType {
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  searchMode: 'search' | 'chat';
  setSearchMode: (mode: 'search' | 'chat') => void;
  interestScore: number;
  setInterestScore: (score: number) => void;
  sessionId: string;
  mrfProspectId: string;
  currentLead: Lead | null;
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  qualificationData: QualificationData;
  updateQualificationData: (data: Partial<QualificationData>) => void;
  searchResults: SearchResult[];
  setSearchResults: (results: SearchResult[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: ReactNode;
}

const generateMRFProspectId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const fingerprint = navigator.userAgent.slice(-6);
  return `MRF_${timestamp}_${random}_${fingerprint}`;
};

const extractQualificationData = (messages: ChatMessage[]): QualificationData => {
  const allText = messages
    .filter(m => m && m.content)
    .map(m => (m.content || '').toLowerCase())
    .join(' ');
  
  const data: QualificationData = {};
  
  if (allText.includes('residential') || allText.includes('home') || allText.includes('house')) {
    data.projectType = 'residential';
  } else if (allText.includes('commercial') || allText.includes('business') || allText.includes('office')) {
    data.projectType = 'commercial';
  } else if (allText.includes('industrial') || allText.includes('warehouse') || allText.includes('factory')) {
    data.projectType = 'industrial';
  }
  
  if (allText.includes('emergency') || allText.includes('urgent') || allText.includes('leak')) {
    data.projectUrgency = 'emergency';
  } else if (allText.includes('planning') || allText.includes('next year') || allText.includes('future')) {
    data.projectUrgency = 'planned';
  } else if (allText.includes('looking') || allText.includes('considering') || allText.includes('thinking')) {
    data.projectUrgency = 'exploring';
  }
  
  const sizeMatch = allText.match(/(\d+)\s*(?:sq|square|sqft)/);
  if (sizeMatch) {
    data.propertySize = parseInt(sizeMatch[1]);
  }
  
  const emailMatch = allText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    data.email = emailMatch[1];
  }
  
  const phoneMatch = allText.match(/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
  if (phoneMatch) {
    data.phone = phoneMatch[1];
  }
  
  const nameMatch = allText.match(/(?:my name is|i'm|i am)\s+([a-zA-Z]+)(?:\s+([a-zA-Z]+))?/);
  if (nameMatch) {
    data.firstName = nameMatch[1];
    if (nameMatch[2]) data.lastName = nameMatch[2];
  }
  
  return data;
};

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<'search' | 'chat'>('search');
  const [interestScore, setInterestScore] = useState(0);
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15));
  const [mrfProspectId] = useState(() => {
    const stored = localStorage.getItem('mrf_prospect_id');
    if (stored) return stored;
    const newId = generateMRFProspectId();
    localStorage.setItem('mrf_prospect_id', newId);
    return newId;
  });
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [qualificationData, setQualificationData] = useState<QualificationData>({});
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trackPageView = async () => {
      try {
        await supabase.functions.invoke('track-visitor', {
          body: {
            mrf_prospect_id: mrfProspectId,
            session_id: sessionId,
            page_url: window.location.pathname,
            action: 'page_view'
          }
        });
      } catch (error) {
        console.error('Error tracking page view:', error);
      }
    };

    trackPageView();
  }, [mrfProspectId, sessionId]);

  const addChatMessage = (message: ChatMessage) => {
    console.log('Adding chat message:', message);
    setChatMessages(prev => [...prev, message]);
  };

  const updateQualificationData = (data: Partial<QualificationData>) => {
    setQualificationData(prev => ({ ...prev, ...data }));
  };

  useEffect(() => {
    const createLeadIfQualified = async () => {
      if (interestScore >= 3 && !currentLead && (qualificationData.email || interestScore >= 7)) {
        try {
          const leadData = {
            name: `${qualificationData.firstName || 'Prospect'} ${qualificationData.lastName || ''}`.trim(),
            first_name: qualificationData.firstName,
            last_name: qualificationData.lastName,
            email: qualificationData.email || `prospect_${mrfProspectId}@temp.com`,
            phone: qualificationData.phone,
            mrf_prospect_id: mrfProspectId,
            source: 'roofbot_chat',
            status: interestScore >= 7 ? 'qualified' : interestScore >= 5 ? 'new' : 'nurturing',
            qualification_data: qualificationData
          };

          const { data, error } = await supabase.from('leads').insert([leadData]).select().maybeSingle();
          
          if (!error && data) {
            setCurrentLead(data as Lead);
          }
        } catch (error) {
          console.error('Error creating lead:', error);
        }
      }
    };

    createLeadIfQualified();
  }, [interestScore, qualificationData, currentLead, mrfProspectId]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      const extracted = extractQualificationData(chatMessages);
      updateQualificationData(extracted);
    }
  }, [chatMessages]);

  return (
    <SearchContext.Provider value={{
      isSearchOpen,
      setIsSearchOpen,
      searchMode,
      setSearchMode,
      interestScore,
      setInterestScore,
      sessionId,
      mrfProspectId,
      currentLead,
      chatMessages,
      addChatMessage,
      qualificationData,
      updateQualificationData,
      searchResults,
      setSearchResults,
      isLoading,
      setIsLoading,
    }}>
      {children}
    </SearchContext.Provider>
  );
};
