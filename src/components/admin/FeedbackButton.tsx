import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, HelpCircle, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import roofingFriendMascot from '@/assets/roofing-friend-mascot.png';
import html2canvas from 'html2canvas';

const POSITION_STORAGE_KEY = 'feedbackButtonPosition';

// Parse navigation links from AI response
interface NavLink {
  label: string;
  route: string;
  tab?: string;
}

const parseNavLinks = (text: string): { cleanText: string; navLinks: NavLink[] } => {
  const navRegex = /\[\[NAV:([^|]+)\|([^|]+)\|([^\]]*)\]\]/g;
  const navLinks: NavLink[] = [];
  let match;
  
  while ((match = navRegex.exec(text)) !== null) {
    navLinks.push({
      label: match[1].trim(),
      route: match[2].trim(),
      tab: match[3]?.trim() || undefined
    });
  }
  
  const cleanText = text.replace(navRegex, '').trim();
  return { cleanText, navLinks };
};

// Simple markdown to JSX renderer
const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];
  
  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc pl-5 space-y-1 my-2">
          {listItems.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      );
      listItems = [];
    }
  };
  
  lines.forEach((line, idx) => {
    // Handle bullet points
    if (line.trim().match(/^[-*]\s+/)) {
      const content = line.trim().replace(/^[-*]\s+/, '');
      listItems.push(content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>'));
    } else {
      flushList();
      
      // Handle regular paragraphs with bold/italic
      if (line.trim()) {
        const formatted = line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>');
        elements.push(
          <p key={`p-${idx}`} dangerouslySetInnerHTML={{ __html: formatted }} className="mb-2" />
        );
      } else if (elements.length > 0) {
        elements.push(<br key={`br-${idx}`} />);
      }
    }
  });
  
  flushList();
  return <>{elements}</>;
};

export const FeedbackButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; navLinks?: NavLink[] }>>([]);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [selectedElement, setSelectedElement] = useState<{
    selector: string;
    text: string;
    position: { x: number; y: number; width: number; height: number };
    component?: string;
    pageRoute?: string;
    pageUrl?: string;
  } | null>(null);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Draggable position state
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(POSITION_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return { x: window.innerWidth - 100, y: window.innerHeight - 120 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  // Save position to localStorage when it changes
  useEffect(() => {
    if (!isDragging) {
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
    }
  }, [position, isDragging]);

  // Handle window resize to keep button in bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 80),
        y: Math.min(prev.y, window.innerHeight - 100)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y
    };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      const newX = Math.max(0, Math.min(window.innerWidth - 80, dragStartRef.current.posX + deltaX));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, dragStartRef.current.posY + deltaY));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Touch drag handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      posX: position.x,
      posY: position.y
    };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragStartRef.current) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartRef.current.x;
      const deltaY = touch.clientY - dragStartRef.current.y;
      const newX = Math.max(0, Math.min(window.innerWidth - 80, dragStartRef.current.posX + deltaX));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, dragStartRef.current.posY + deltaY));
      setPosition({ x: newX, y: newY });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  // Handle navigation from AI assistant
  const handleNavigation = (navLink: NavLink) => {
    setIsQuestionDialogOpen(false);
    
    // Parse the tab info (format: "mainTab:subTab" or just "mainTab")
    const [mainTab, subTab] = navLink.tab?.split(':') || [];
    
    // Navigate to the route
    navigate(navLink.route);
    
    // If there's a tab to activate, we'll use URL params or dispatch an event
    if (mainTab) {
      // Store tab info in sessionStorage for the target page to read
      sessionStorage.setItem('assistantNavTab', JSON.stringify({ mainTab, subTab }));
      
      // Dispatch custom event for same-page tab changes
      window.dispatchEvent(new CustomEvent('assistantNavigate', { 
        detail: { mainTab, subTab } 
      }));
    }
    
    toast({
      title: "Navigating",
      description: `Taking you to ${navLink.label.replace('View ', '').replace('Go to ', '')}...`,
    });
  };

  // Handle element selection
  useEffect(() => {
    if (!isSelectionMode) {
      // Clean up any remaining outlines when selection mode ends
      document.querySelectorAll('[style*="outline"]').forEach((el) => {
        (el as HTMLElement).style.outline = '';
        (el as HTMLElement).style.cursor = '';
      });
      return;
    }

    const handleElementClick = async (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const target = e.target as HTMLElement;
      
      // Remove outline from clicked element
      target.style.outline = '';
      target.style.cursor = '';
      
      const rect = target.getBoundingClientRect();
      
      // Capture element information with page route
      const elementInfo = {
        selector: target.tagName.toLowerCase() + (target.className ? `.${target.className.split(' ').join('.')}` : ''),
        text: target.textContent?.slice(0, 100) || '',
        position: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        },
        component: target.closest('[data-component]')?.getAttribute('data-component'),
        pageRoute: location.pathname,
        pageUrl: window.location.href
      };

      // Capture screenshot with element highlighted and cropped to element area
      try {
        // Temporarily add highlight to the element
        target.style.outline = '3px solid red';
        target.style.boxShadow = '0 0 10px rgba(255,0,0,0.5)';
        
        const scale = 1; // Full resolution for clarity
        const padding = 100; // Padding around element
        
        const fullCanvas = await html2canvas(document.body, {
          useCORS: true,
          logging: false,
          scale: scale,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
        });
        
        // Remove highlight
        target.style.outline = '';
        target.style.boxShadow = '';
        
        // Calculate crop bounds with padding (adjusted for scale)
        const cropX = Math.max(0, (rect.left - padding) * scale);
        const cropY = Math.max(0, (rect.top + window.scrollY - padding) * scale);
        const cropWidth = Math.min((rect.width + padding * 2) * scale, fullCanvas.width - cropX);
        const cropHeight = Math.min((rect.height + padding * 2) * scale, fullCanvas.height - cropY);
        
        // Create cropped canvas
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = cropWidth;
        croppedCanvas.height = cropHeight;
        const ctx = croppedCanvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(fullCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
          const dataUrl = croppedCanvas.toDataURL('image/jpeg', 0.9);
          setScreenshotDataUrl(dataUrl);
        }
      } catch (err) {
        console.error('Failed to capture screenshot:', err);
        // Continue without screenshot
      }

      setSelectedElement(elementInfo);
      setIsSelectionMode(false);
      setIsOpen(true);
      
      toast({
        title: "Element selected",
        description: "Now describe what needs to be fixed or improved",
      });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      target.style.outline = '2px solid hsl(var(--primary))';
      target.style.cursor = 'crosshair';
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      target.style.outline = '';
      target.style.cursor = '';
    };

    document.addEventListener('click', handleElementClick, true);
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);

    return () => {
      document.removeEventListener('click', handleElementClick, true);
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('mouseout', handleMouseOut, true);
      
      // Clean up all outlines on unmount
      document.querySelectorAll('[style*="outline"]').forEach((el) => {
        (el as HTMLElement).style.outline = '';
        (el as HTMLElement).style.cursor = '';
      });
    };
  }, [isSelectionMode, toast]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-component="FeedbackButton"]')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  const handleButtonClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleFeedbackClick = () => {
    setIsMenuOpen(false);
    setIsSelectionMode(true);
    toast({
      title: "Selection mode active",
      description: "Click on any element you want to provide feedback about",
    });
  };

  const handleAskQuestionClick = () => {
    setIsMenuOpen(false);
    setIsQuestionDialogOpen(true);
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast({
        title: "Error",
        description: "Please enter your question",
        variant: "destructive",
      });
      return;
    }

    const userMessage = question.trim();
    setQuestion(''); // Clear input immediately
    
    // Add user message to conversation
    const updatedMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(updatedMessages);
    setIsLoadingResponse(true);

    try {
      const { data, error } = await supabase.functions.invoke('help-assistant', {
        body: { messages: updatedMessages }
      });

      if (error) throw error;

      // Parse navigation links from the response
      const rawAnswer = data.answer || 'No response received';
      const { cleanText, navLinks } = parseNavLinks(rawAnswer);

      // Add assistant response with parsed nav links
      setMessages(prev => [...prev, { role: 'assistant', content: cleanText, navLinks }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
      // Remove the user message if the request failed
      setMessages(messages);
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const handleCloseQuestionDialog = () => {
    setIsQuestionDialogOpen(false);
    setQuestion('');
    setMessages([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast({
        title: "Error",
        description: "Please enter your feedback",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let screenshotUrl: string | null = null;

      // Upload screenshot if available
      if (screenshotDataUrl) {
        const base64Data = screenshotDataUrl.split(',')[1];
        const blob = await fetch(screenshotDataUrl).then(r => r.blob());
        const fileName = `feedback-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('feedback-screenshots')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) {
          console.error('Screenshot upload error:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('feedback-screenshots')
            .getPublicUrl(fileName);
          screenshotUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase
        .from('admin_feedback' as any)
        .insert({
          user_id: user?.id,
          feedback_text: feedback.trim(),
          selected_element: selectedElement ? JSON.stringify(selectedElement) : null,
          screenshot_url: screenshotUrl,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Thank you for your feedback!",
      });

      setFeedback('');
      setSelectedElement(null);
      setScreenshotDataUrl(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setSelectedElement(null);
    setScreenshotDataUrl(null);
    setFeedback('');
  };

  return (
    <>
      {/* Floating Feedback Button with Menu - Draggable */}
      <div 
        ref={dragRef}
        className="fixed z-[1100] flex flex-col items-end gap-2 select-none"
        style={{ 
          left: position.x,
          top: position.y,
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none'
        }}
        data-component="FeedbackButton" 
        data-file="src/components/admin/FeedbackButton.tsx"
      >
        {/* Subtle Menu */}
        {isMenuOpen && (
          <div className="bg-background border border-border rounded-lg shadow-lg overflow-hidden mb-2 animate-fade-in">
            <button
              onClick={handleAskQuestionClick}
              className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
            >
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">AI Assistant</span>
            </button>
            <div className="h-px bg-border" />
            <button
              onClick={handleFeedbackClick}
              className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
            >
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Give Feedback</span>
            </button>
          </div>
        )}
        
        <div className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-md animate-fade-in pointer-events-none">
          Need Help?
        </div>
        <button
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={(e) => {
            // Only trigger click if we weren't dragging
            if (!isDragging) {
              handleButtonClick();
            }
          }}
          className="w-16 h-16 bg-white hover:bg-gray-50 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 border-2 border-primary animate-pulse hover:animate-none"
          aria-label="Help menu - drag to reposition"
        >
          <img 
            src={roofingFriendMascot} 
            alt="Roofing Friend Mascot" 
            className="w-12 h-12 object-contain pointer-events-none"
          />
        </button>
      </div>

      {/* Selection Mode Overlay - Top banner instead of center */}
      {isSelectionMode && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-primary text-primary-foreground rounded-lg shadow-xl px-6 py-3 flex items-center gap-4">
            <MessageSquare className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm font-medium">
              Click on any element to provide feedback
            </div>
            <Button 
              size="sm"
              variant="secondary"
              onClick={() => {
                setIsSelectionMode(false);
                toast({
                  title: "Cancelled",
                  description: "Selection mode cancelled",
                });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* AI Assistant Chat Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col mx-4">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              AI Assistant
            </DialogTitle>
            <DialogDescription>
              Your AI coworker with full access to projects, schedules, employees, leads, and roofing expertise
            </DialogDescription>
          </DialogHeader>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Start a conversation! Ask me anything about:</p>
                <ul className="text-xs mt-2 space-y-1">
                  <li>📊 Active projects and their status</li>
                  <li>👷 Team schedules and assignments</li>
                  <li>⏰ Timesheets and hours worked</li>
                  <li>📋 Leads, quotes, and proposals</li>
                  <li>🏠 Roofing best practices and materials</li>
                </ul>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={roofingFriendMascot} alt="Assistant" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                        {renderMarkdown(msg.content)}
                        {/* Navigation buttons */}
                        {msg.navLinks && msg.navLinks.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t not-prose">
                            {msg.navLinks.map((navLink, navIdx) => (
                              <Button
                                key={navIdx}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => handleNavigation(navLink)}
                              >
                                <ExternalLink className="w-3 h-3" />
                                {navLink.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'User'} />
                      <AvatarFallback>
                        {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            
            {isLoadingResponse && (
              <div className="flex justify-start gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={roofingFriendMascot} alt="Assistant" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleQuestionSubmit} className="flex-shrink-0 space-y-3 pt-3 border-t">
            <div className="flex gap-2">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask me anything... (e.g., who's working today? how many active projects?)"
                className="min-h-[60px] resize-none text-sm flex-1"
                disabled={isLoadingResponse}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleQuestionSubmit(e);
                  }
                }}
              />
              <Button
                type="submit"
                disabled={isLoadingResponse || !question.trim()}
                size="lg"
                className="self-end"
              >
                Send
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Press Enter to send, Shift+Enter for new line
              </p>
              {messages.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMessages([])}
                  className="text-xs"
                >
                  Clear chat
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Send Feedback
            </DialogTitle>
            <DialogDescription className="sr-only">
              Provide feedback about selected elements or general suggestions
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedElement && (
              <div className="p-3 bg-muted rounded-md text-sm space-y-1">
                <p className="font-medium">Selected element</p>
                {selectedElement.text && (
                  <p className="text-xs text-muted-foreground break-words">
                    "{selectedElement.text}"
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="feedback" className="text-sm">
                {selectedElement 
                  ? "What would you like to improve about this element?" 
                  : "Tell us what you think"}
              </Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts, suggestions, or report issues..."
                className="min-h-[100px] sm:min-h-[120px] resize-none text-sm"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !feedback.trim()}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? 'Sending...' : 'Send Feedback'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
