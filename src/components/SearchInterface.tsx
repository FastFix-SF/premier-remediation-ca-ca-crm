import React, { useState, useEffect, useRef } from 'react';
import { Search, MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { useSearch } from '../contexts/SearchContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { supabase } from '../integrations/supabase/client';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  interestScore?: number;
}

// Bionic reading utility function
const formatBionicText = (text: string) => {
  return text.split(' ').map((word, index) => {
    if (word.length <= 2) return <span key={index}>{word} </span>;
    const splitPoint = Math.ceil(word.length / 2);
    const boldPart = word.slice(0, splitPoint);
    const normalPart = word.slice(splitPoint);
    return (
      <span key={index}>
        <strong>{boldPart}</strong>{normalPart}{' '}
      </span>
    );
  });
};

const SearchInterface: React.FC = () => {
  const { 
    isSearchOpen, 
    setIsSearchOpen, 
    searchMode, 
    setSearchMode,
    chatMessages,
    addChatMessage,
    interestScore,
    setInterestScore,
    searchResults,
    setSearchResults,
    isLoading,
    setIsLoading,
    mrfProspectId,
    sessionId
  } = useSearch();

  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Enhanced search functionality with scoring
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        console.log('Performing search for:', searchQuery);
        
        // Build advanced search query with relevance scoring
        const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);
        const { data, error } = await supabase
          .from('site_content')
          .select('*')
          .or(searchTerms.map(term => 
            `title.ilike.%${term}%,content.ilike.%${term}%,keywords.cs.{${term}}`
          ).join(','))
          .eq('is_active', true)
          .order('search_score', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Search error:', error);
          // If database error, show empty results but don't crash
          setSearchResults([]);
        } else {
          console.log('Search results:', data);
          
          // Enhanced relevance scoring
          const scoredResults = (data || []).map(item => {
            let score = item.search_score || 0;
            const titleLower = item.title.toLowerCase();
            const contentLower = item.content.toLowerCase();
            const queryLower = searchQuery.toLowerCase();
            
            // Boost score for exact matches in title
            if (titleLower.includes(queryLower)) score += 10;
            
            // Boost for matches in keywords
            if (item.keywords?.some(keyword => 
              keyword.toLowerCase().includes(queryLower))) score += 5;
            
            // Boost for content matches
            if (contentLower.includes(queryLower)) score += 3;
            
            return {
              ...item,
              calculatedScore: score
            };
          });

          // Sort by calculated score and map to SearchResult format
          const mappedResults = scoredResults
            .sort((a, b) => b.calculatedScore - a.calculatedScore)
            .map(item => ({
              id: item.id,
              title: item.title,
              url: item.url,
              type: item.content_type as 'product' | 'service' | 'faq',
              content: item.content,
              keywords: item.keywords || [],
              category: item.category
            }));
            
          setSearchResults(mappedResults);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, setSearchResults, setIsLoading]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date().toISOString()
    };

    console.log('Sending message:', userMessage);
    addChatMessage(userMessage);
    setChatInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: chatInput.trim(),
          conversationId: null,
          mrfProspectId,
          sessionId
        }
      });

      if (error) {
        console.error('Chat API error:', error);
        throw error;
      }

      console.log('Chat API response:', data);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data?.message || "I apologize, but I'm having trouble responding right now. Please try again or contact us directly at (510) 555-ROOF for immediate assistance with your roofing needs.",
        timestamp: new Date().toISOString()
      };

      addChatMessage(assistantMessage);
      
      // Enhanced interest scoring based on roofing keywords
      const roofingKeywords = [
        'quote', 'price', 'cost', 'install', 'replace', 'urgent', 'when', 'how much',
        'repair', 'leak', 'emergency', 'metal roof', 'standing seam', 'r-panel',
        'estimate', 'consultation', 'contractor', 'residential', 'commercial'
      ];
      
      const messageScore = roofingKeywords.reduce((score, keyword) => {
        return chatInput.toLowerCase().includes(keyword) ? score + 1 : score;
      }, 0);
      
      if (messageScore > 0) {
        setInterestScore(Math.max(interestScore, messageScore));
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please try again or contact us directly at (510) 555-ROOF for immediate assistance with your roofing needs.",
        timestamp: new Date().toISOString()
      };
      addChatMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] sm:h-[80vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-card shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  Roofing Friend Assistant
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Search content or chat with our roofing expert
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-muted rounded-lg p-1">
                <Button
                  variant={searchMode === 'search' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSearchMode('search')}
                  className="h-8 px-3 text-sm"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Button
                  variant={searchMode === 'chat' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSearchMode('chat')}
                  className="h-8 px-3 text-sm"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat with Expert
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {searchMode === 'search' ? (
            <div className="h-full flex flex-col">
              {/* Search Input */}
              <div className="p-6 border-b shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for roofing materials, installation tips..."
                    className="pl-10 h-12 text-base border-2 focus:border-primary"
                  />
                </div>
              </div>

              {/* Search Results */}
              <div className="flex-1 overflow-y-auto">
                {!searchQuery ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Start typing to search our content</h3>
                    <p className="text-muted-foreground max-w-md">
                      Find information about our services, locations, and resources
                    </p>
                  </div>
                ) : isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span className="text-muted-foreground">Searching...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No results found</h3>
                    <p className="text-muted-foreground max-w-md">
                      Try different keywords or ask our expert in chat mode
                    </p>
                  </div>
                ) : (
                  <div className="p-6 space-y-4">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => window.open(result.url, '_self')}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-base">{result.title}</h3>
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                            {result.category}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {result.content}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.keywords.slice(0, 3).map((keyword) => (
                            <span key={keyword} className="bg-muted text-muted-foreground px-2 py-1 rounded-md text-xs">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                      <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Hi! I'm your Roofing Expert</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      Your roofing technology assistant
                    </p>
                    <p className="text-sm text-muted-foreground max-w-lg">
                      I can help you with roofing materials, installation guidance, pricing estimates, and connect you with our roofing specialists.
                    </p>
                  </div>
                ) : (
                  <div className="p-6 space-y-4">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground ml-auto'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <div className="text-sm leading-relaxed">
                            {message.role === 'assistant' ? (
                              <div className="bionic-text">
                                {formatBionicText(message.content)}
                              </div>
                            ) : (
                              message.content
                            )}
                          </div>
                          <p className="text-xs opacity-70 mt-2">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Expert is typing...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-6 border-t shrink-0">
                <div className="flex gap-3">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about roofing materials, pricing, or schedule a consultation..."
                    className="flex-1 h-12 text-base"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isLoading}
                    className="h-12 px-4"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Our expert can help with roofing questions, consultations, and professional guidance
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchInterface;
