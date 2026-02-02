import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, HelpCircle, ExternalLink } from 'lucide-react';
import { AgentHubDialog } from './agent-hub/AgentHubDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import roofingFriendMascot from '@/assets/roofing-friend-mascot.png';
import html2canvas from 'html2canvas';

// Parse navigation links from AI response
interface NavLink {
  label: string;
  route: string;
  tab?: string;
}
const parseNavLinks = (text: string): {
  cleanText: string;
  navLinks: NavLink[];
} => {
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
  return {
    cleanText,
    navLinks
  };
};

// Simple markdown to JSX renderer
const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];
  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(<ul key={`list-${elements.length}`} className="list-disc pl-5 space-y-1 my-2">
          {listItems.map((item, idx) => <li key={idx} dangerouslySetInnerHTML={{
          __html: item
        }} />)}
        </ul>);
      listItems = [];
    }
  };
  lines.forEach((line, idx) => {
    if (line.trim().match(/^[-*]\s+/)) {
      const content = line.trim().replace(/^[-*]\s+/, '');
      listItems.push(content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>'));
    } else {
      flushList();
      if (line.trim()) {
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
        elements.push(<p key={`p-${idx}`} dangerouslySetInnerHTML={{
          __html: formatted
        }} className="mb-2" />);
      } else if (elements.length > 0) {
        elements.push(<br key={`br-${idx}`} />);
      }
    }
  });
  flushList();
  return <>{elements}</>;
};
export const MobileFeedbackButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isAgentHubOpen, setIsAgentHubOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    navLinks?: NavLink[];
  }>>([]);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [selectedElement, setSelectedElement] = useState<{
    selector: string;
    text: string;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    component?: string;
    pageRoute?: string;
    pageUrl?: string;
  } | null>(null);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackContributorCount, setFeedbackContributorCount] = useState(0);
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('feedback-button-position');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      x: window.innerWidth - 72,
      y: window.innerHeight - 144
    };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({
    x: 0,
    y: 0,
    buttonX: 0,
    buttonY: 0
  });
  const animationFrame = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    user
  } = useAuth();
  const {
    profile
  } = useProfile();
  const {
    data: adminStatus
  } = useAdminStatus();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch feedback contributor count
  useEffect(() => {
    const fetchContributorCount = async () => {
      try {
        const { count, error } = await supabase
          .from('admin_feedback')
          .select('user_id', { count: 'exact', head: true });
        
        if (!error && count !== null) {
          setFeedbackContributorCount(count);
        }
      } catch (err) {
        console.error('Error fetching contributor count:', err);
      }
    };
    
    fetchContributorCount();
  }, []);

  // Check if user has Agent Hub access (phone-gated)
  const agentHubPhones = ['5106196839', '5107145062', '5102003693']; // Sebastian, Theresa, Florentino
  const isAgentHubUser = agentHubPhones.some(phone => user?.phone?.includes(phone));

  // Handle navigation from AI assistant
  const handleNavigation = (navLink: NavLink) => {
    setIsQuestionDialogOpen(false);

    // Parse the tab info (format: "mainTab:subTab" or just "mainTab")
    const [mainTab, subTab] = navLink.tab?.split(':') || [];

    // Navigate to the route (convert admin routes to mobile routes if needed)
    let targetRoute = navLink.route;
    if (targetRoute.startsWith('/admin')) {
      // Map admin routes to mobile equivalents where possible
      if (targetRoute.includes('/workforce')) targetRoute = '/mobile/job-scheduling';else if (targetRoute.includes('/projects')) targetRoute = '/mobile/projects';else if (targetRoute.includes('/leads')) targetRoute = '/mobile/projects';else targetRoute = '/mobile';
    }
    navigate(targetRoute);

    // If there's a tab to activate, store tab info
    if (mainTab) {
      sessionStorage.setItem('assistantNavTab', JSON.stringify({
        mainTab,
        subTab
      }));
      window.dispatchEvent(new CustomEvent('assistantNavigate', {
        detail: {
          mainTab,
          subTab
        }
      }));
    }
    toast({
      title: "Navigating",
      description: `Taking you to ${navLink.label.replace('View ', '').replace('Go to ', '')}...`
    });
  };

  // Handle element selection
  useEffect(() => {
    if (!isSelectionMode) {
      document.querySelectorAll('[style*="outline"]').forEach(el => {
        (el as HTMLElement).style.outline = '';
        (el as HTMLElement).style.cursor = '';
      });
      return;
    }
    const handleElementClick = async (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;
      target.style.outline = '';
      target.style.cursor = '';
      const rect = target.getBoundingClientRect();
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
        target.style.outline = '3px solid red';
        target.style.boxShadow = '0 0 10px rgba(255,0,0,0.5)';
        const scale = 1; // Full resolution for clarity
        const padding = 100; // Padding around element

        const fullCanvas = await html2canvas(document.body, {
          useCORS: true,
          logging: false,
          scale: scale,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight
        });
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
      }
      setSelectedElement(elementInfo);
      setIsSelectionMode(false);
      setIsOpen(true);
      toast({
        title: "Element selected",
        description: "Now describe what needs to be fixed",
        duration: 2000
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
      document.querySelectorAll('[style*="outline"]').forEach(el => {
        (el as HTMLElement).style.outline = '';
        (el as HTMLElement).style.cursor = '';
      });
    };
  }, [isSelectionMode, toast]);
  const handleButtonClick = () => {
    if (!isDragging) {
      setIsMenuOpen(true);
    }
  };
  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragStartPos.current = {
      x: touch.clientX,
      y: touch.clientY,
      buttonX: position.x,
      buttonY: position.y
    };
    setIsDragging(false);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartPos.current.x;
    const deltaY = touch.clientY - dragStartPos.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance > 10) {
      setIsDragging(true);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      animationFrame.current = requestAnimationFrame(() => {
        const newX = Math.max(0, Math.min(window.innerWidth - 56, dragStartPos.current.buttonX + deltaX));
        const newY = Math.max(0, Math.min(window.innerHeight - 56, dragStartPos.current.buttonY + deltaY));
        setPosition({
          x: newX,
          y: newY
        });
      });
    }
  };
  const handleTouchEnd = () => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    if (isDragging) {
      localStorage.setItem('feedback-button-position', JSON.stringify(position));
    }
    setTimeout(() => setIsDragging(false), 100);
  };

  // Mouse handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      buttonX: position.x,
      buttonY: position.y
    };
    setIsDragging(false);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStartPos.current.x;
      const deltaY = moveEvent.clientY - dragStartPos.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance > 5) {
        setIsDragging(true);
        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current);
        }
        animationFrame.current = requestAnimationFrame(() => {
          const newX = Math.max(0, Math.min(window.innerWidth - 56, dragStartPos.current.buttonX + deltaX));
          const newY = Math.max(0, Math.min(window.innerHeight - 56, dragStartPos.current.buttonY + deltaY));
          setPosition({ x: newX, y: newY });
        });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      // Save position if dragged
      setPosition(pos => {
        localStorage.setItem('feedback-button-position', JSON.stringify(pos));
        return pos;
      });
      setTimeout(() => setIsDragging(false), 100);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast({
        title: "Error",
        description: "Please enter your feedback",
        variant: "destructive",
        duration: 2000
      });
      return;
    }
    setIsSubmitting(true);
    try {
      let screenshotUrl: string | null = null;

      // Upload screenshot if available
      if (screenshotDataUrl) {
        const blob = await fetch(screenshotDataUrl).then(r => r.blob());
        const fileName = `feedback-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const {
          data: uploadData,
          error: uploadError
        } = await supabase.storage.from('feedback-screenshots').upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });
        if (uploadError) {
          console.error('Screenshot upload error:', uploadError);
        } else {
          const {
            data: urlData
          } = supabase.storage.from('feedback-screenshots').getPublicUrl(fileName);
          screenshotUrl = urlData.publicUrl;
        }
      }
      const {
        error
      } = await supabase.from('admin_feedback' as any).insert({
        user_id: user?.id,
        feedback_text: feedback.trim(),
        selected_element: selectedElement ? JSON.stringify(selectedElement) : null,
        screenshot_url: screenshotUrl
      });
      if (error) throw error;
      toast({
        title: "Success",
        description: "Thank you for your feedback!",
        duration: 2000
      });
      setFeedback('');
      setSelectedElement(null);
      setScreenshotDataUrl(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
        duration: 2000
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
  const handleGiveFeedback = () => {
    setIsMenuOpen(false);
    setIsSelectionMode(true);
    toast({
      title: "Selection mode active",
      description: "Tap any element to give feedback",
      duration: 2000
    });
  };
  const handleAskQuestion = () => {
    setIsMenuOpen(false);
    // Use Agent Hub for authorized user, regular dialog for others
    if (isAgentHubUser) {
      setIsAgentHubOpen(true);
    } else {
      setIsQuestionDialogOpen(true);
    }
  };
  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    const userMessage = {
      role: 'user' as const,
      content: question.trim()
    };
    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setIsLoadingResponse(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('help-assistant', {
        body: {
          messages: [...messages, userMessage]
        }
      });
      if (error) throw error;
      if (data?.answer) {
        // Parse navigation links from the response
        const {
          cleanText,
          navLinks
        } = parseNavLinks(data.answer);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: cleanText,
          navLinks
        }]);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: "Failed to get response from AI assistant",
        variant: "destructive",
        duration: 2000
      });
    } finally {
      setIsLoadingResponse(false);
    }
  };
  const handleCloseQuestionDialog = () => {
    setIsQuestionDialogOpen(false);
    setMessages([]);
    setQuestion('');
  };
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }, [messages, isLoadingResponse]);
  return <>
      {/* Small Floating Mascot Button - draggable */}
      <div className="fixed z-40" style={{
      left: `${position.x}px`,
      top: `${position.y}px`,
      transform: 'translate3d(0,0,0)'
    }}>
        {/* Animated text bubble - engaging prompt for ideas */}
        {!isDragging && !isMenuOpen && (
          <div className="absolute bottom-full right-0 mb-3 animate-fade-in">
            <div className="relative bg-gradient-to-br from-primary via-primary to-primary/90 shadow-xl shadow-primary/25 rounded-2xl px-3 py-2 border border-primary-foreground/10">
              <p className="text-sm font-semibold text-primary-foreground leading-snug whitespace-nowrap">
                Got an idea? 💡
              </p>
              
              {/* Speech bubble tail */}
              <div className="absolute -bottom-2 right-4 w-3 h-3 bg-primary border-r border-b border-primary-foreground/10 rotate-45" />
            </div>
          </div>
        )}
        
        {/* Drag indicators - subtle dots around the button */}
        {!isDragging && <>
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
            <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
          </>}
        
        <button 
          onClick={handleButtonClick} 
          onTouchStart={handleTouchStart} 
          onTouchMove={handleTouchMove} 
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          className="w-14 h-14 bg-card hover:bg-accent rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 border-2 border-primary" 
          aria-label="Send feedback" 
          style={{
            animation: !isDragging ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
            touchAction: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none'
          }}
        >
          <img src={roofingFriendMascot} alt="Feedback" className="w-10 h-10 object-contain pointer-events-none" draggable={false} />
        </button>
      </div>

      {/* Menu Dialog */}
      <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-sm p-4 gap-3">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-base">How can we help?</DialogTitle>
            <DialogDescription className="sr-only">
              Choose feedback or ask a question
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleGiveFeedback} 
              variant="ghost" 
              className="group relative h-auto p-0 overflow-hidden rounded-2xl border-0 bg-transparent hover:bg-transparent"
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse" style={{ animationDuration: '3s' }} />
              
              {/* Card content */}
              <div className="relative w-full p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-br from-card via-card/95 to-accent/5 border border-border/50 rounded-2xl shadow-sm group-hover:shadow-xl group-hover:shadow-primary/5 group-hover:border-primary/30 transition-all duration-300">
                
                {/* Animated icon container */}
                <div className="relative flex-shrink-0">
                  {/* Pulsing ring */}
                  <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
                    <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                
                {/* Text content */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="font-bold text-lg sm:text-xl text-foreground group-hover:text-primary transition-colors duration-300">
                      Give Feedback
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                      BETA
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Select any element and help us improve the app
                  </p>
                  
                  {/* Contributors section */}
                  {feedbackContributorCount > 0 && (
                    <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                      <div className="flex -space-x-2.5">
                        {[...Array(Math.min(4, feedbackContributorCount))].map((_, i) => (
                          <div 
                            key={i} 
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-card flex items-center justify-center shadow-sm animate-fade-in"
                            style={{ animationDelay: `${i * 100}ms` }}
                          >
                            <span className="text-[9px] font-bold text-primary-foreground">
                              {String.fromCharCode(65 + i)}
                            </span>
                          </div>
                        ))}
                        {feedbackContributorCount > 4 && (
                          <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center shadow-sm">
                            <span className="text-[9px] font-bold text-muted-foreground">
                              +{feedbackContributorCount - 4}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        <span className="text-primary font-semibold">{feedbackContributorCount}</span> contributors
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Arrow indicator */}
                <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors">
                  <ExternalLink className="w-5 h-5 text-primary/60 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </div>
            </Button>
            {adminStatus?.isAdmin || adminStatus?.isOwner}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Assistant Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={handleCloseQuestionDialog}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-md max-h-[85vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-4 pt-4 pb-3 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="w-5 h-5" />
              <span>AI Assistant</span>
            </DialogTitle>
            <DialogDescription className="text-xs mt-1">
              Ask me about projects, schedules, timesheets, or roofing
            </DialogDescription>
          </DialogHeader>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[50vh]">
            {messages.length === 0 ? <div className="text-center py-6 space-y-3">
                <Avatar className="w-16 h-16 mx-auto">
                  <AvatarImage src={roofingFriendMascot} alt="Assistant" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Ask me anything!</p>
                  <ul className="space-y-1 text-left max-w-[280px] mx-auto">
                    <li>📊 Active projects and status</li>
                    <li>👷 Team schedules</li>
                    <li>⏰ Timesheets</li>
                    <li>📋 Leads and quotes</li>
                    <li>🏠 Roofing best practices</li>
                  </ul>
                </div>
              </div> : messages.map((msg, idx) => <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && <Avatar className="w-7 h-7 flex-shrink-0">
                      <AvatarImage src={roofingFriendMascot} alt="Assistant" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>}
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {msg.role === 'assistant' ? <div className="text-xs leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                        {renderMarkdown(msg.content)}
                        {/* Navigation buttons */}
                        {msg.navLinks && msg.navLinks.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t not-prose">
                            {msg.navLinks.map((navLink, navIdx) => <Button key={navIdx} variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => handleNavigation(navLink)}>
                                <ExternalLink className="w-3 h-3" />
                                {navLink.label}
                              </Button>)}
                          </div>}
                      </div> : <p className="text-xs whitespace-pre-wrap">{msg.content}</p>}
                  </div>
                  {msg.role === 'user' && <Avatar className="w-7 h-7 flex-shrink-0">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'User'} />
                      <AvatarFallback>
                        {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>}
                </div>)}
            
            {isLoadingResponse && <div className="flex justify-start gap-2">
                <Avatar className="w-7 h-7 flex-shrink-0">
                  <AvatarImage src={roofingFriendMascot} alt="Assistant" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{
                  animationDelay: '0ms'
                }} />
                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{
                  animationDelay: '150ms'
                }} />
                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{
                  animationDelay: '300ms'
                }} />
                  </div>
                </div>
              </div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleQuestionSubmit} className="flex-shrink-0 p-3 border-t space-y-2">
            <div className="flex gap-2">
              <Textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask your question..." className="min-h-[44px] max-h-[120px] resize-none text-sm" disabled={isLoadingResponse} rows={1} />
              <Button type="submit" disabled={isLoadingResponse || !question.trim()} className="h-11 px-4 flex-shrink-0">
                Send
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Selection Mode Banner */}
      {isSelectionMode && <div className="fixed top-4 left-4 right-4 z-50 animate-fade-in">
          <div className="bg-primary text-primary-foreground rounded-lg shadow-xl px-4 py-3 flex items-center gap-3">
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <div className="text-sm font-medium flex-1">
              Tap any element for feedback
            </div>
            <Button size="sm" variant="secondary" onClick={() => {
          setIsSelectionMode(false);
          toast({
            title: "Cancelled",
            duration: 2000
          });
        }} className="h-8 px-3 text-xs">
              Cancel
            </Button>
          </div>
        </div>}

      {/* Feedback Dialog - Mobile Optimized */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-md max-h-[90vh] p-4 sm:p-6 gap-3 sm:gap-4">
          <DialogHeader className="space-y-1.5 sm:space-y-2">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Send Feedback</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Provide feedback about selected elements
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {selectedElement && <div className="p-2.5 sm:p-3 bg-muted rounded-md text-xs sm:text-sm space-y-0.5 sm:space-y-1">
                <p className="font-medium">Selected element</p>
                {selectedElement.text && <p className="text-[11px] sm:text-xs text-muted-foreground break-words">
                    "{selectedElement.text}"
                  </p>}
              </div>}

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="feedback" className="text-xs sm:text-sm font-medium">
                {selectedElement ? "What needs improvement?" : "Your feedback"}
              </Label>
              <Textarea id="feedback" value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Share your thoughts or report issues..." className="min-h-[100px] sm:min-h-[120px] resize-none text-sm sm:text-base" disabled={isSubmitting} />
            </div>

            <div className="flex flex-col-reverse gap-2 pt-1">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting} className="w-full h-10 sm:h-11 text-sm sm:text-base">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !feedback.trim()} className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium">
                {isSubmitting ? 'Sending...' : 'Send Feedback'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Agent Hub Dialog - Only for authorized user */}
      <AgentHubDialog open={isAgentHubOpen} onOpenChange={setIsAgentHubOpen} />
    </>;
};