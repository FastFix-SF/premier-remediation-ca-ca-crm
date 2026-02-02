import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UseFastoVoiceOptions {
  wakeWord?: string;
  onWakeWordDetected?: () => void;
  onCommand?: (command: string) => void;
  enableContinuousListening?: boolean;
  speakResponses?: boolean;
}

interface UseFastoVoiceReturn {
  isListening: boolean;
  isWakeWordActive: boolean;
  isSpeaking: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (voice: SpeechSynthesisVoice) => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
}

// Voice quality rankings - higher is better
const VOICE_PRIORITY: Record<string, number> = {
  // Microsoft Edge Neural voices (best quality)
  'Microsoft Aria Online (Natural)': 100,
  'Microsoft Jenny Online (Natural)': 99,
  'Microsoft Guy Online (Natural)': 98,
  'Microsoft Michelle Online (Natural)': 97,
  'Microsoft Ana Online (Natural)': 96,
  // Google Chrome voices (very good)
  'Google US English': 85,
  'Google UK English Female': 84,
  'Google UK English Male': 83,
  // Apple voices (good)
  'Samantha': 75,
  'Karen': 74,
  'Daniel': 73,
  'Moira': 72,
  'Alex': 70,
  // Windows voices
  'Microsoft David': 60,
  'Microsoft Zira': 59,
  'Microsoft Mark': 58,
};

const STORAGE_KEY_VOICE = 'fasto-voice-preference';
const STORAGE_KEY_RATE = 'fasto-speech-rate';

function getVoicePriority(voice: SpeechSynthesisVoice): number {
  // Check exact match first
  if (VOICE_PRIORITY[voice.name]) {
    return VOICE_PRIORITY[voice.name];
  }
  
  // Check partial matches
  for (const [key, priority] of Object.entries(VOICE_PRIORITY)) {
    if (voice.name.includes(key) || key.includes(voice.name)) {
      return priority;
    }
  }
  
  // Prefer English voices
  if (voice.lang.startsWith('en')) {
    // Prefer natural/neural voices
    if (voice.name.toLowerCase().includes('natural') || voice.name.toLowerCase().includes('neural')) {
      return 50;
    }
    // Prefer online voices
    if (voice.name.toLowerCase().includes('online')) {
      return 45;
    }
    return 30;
  }
  
  return 10;
}

function getBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  
  // Sort by priority (highest first)
  const sorted = [...voices].sort((a, b) => getVoicePriority(b) - getVoicePriority(a));
  return sorted[0];
}

export const useFastoVoice = (options: UseFastoVoiceOptions = {}): UseFastoVoiceReturn => {
  const {
    wakeWord = 'hey fasto',
    onWakeWordDetected,
    onCommand,
    enableContinuousListening = false,
    speakResponses = true,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoiceState] = useState<SpeechSynthesisVoice | null>(null);
  const [speechRate, setSpeechRateState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RATE);
    return saved ? parseFloat(saved) : 1.1; // Default to 1.1x for snappier responses
  });
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasListeningBeforeSpeakRef = useRef(false);
  const shouldAutoResumeRef = useRef(false);
  const voicesLoadedRef = useRef(false);

  // Load and preload voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    synthRef.current = window.speechSynthesis;
    
    const loadVoices = () => {
      const voices = synthRef.current?.getVoices() || [];
      if (voices.length === 0) return;
      
      // Filter to English voices primarily
      const englishVoices = voices.filter(v => v.lang.startsWith('en'));
      const sortedVoices = [...englishVoices].sort((a, b) => getVoicePriority(b) - getVoicePriority(a));
      
      setAvailableVoices(sortedVoices.length > 0 ? sortedVoices : voices);
      
      if (!voicesLoadedRef.current) {
        voicesLoadedRef.current = true;
        
        // Try to restore saved preference
        const savedVoiceName = localStorage.getItem(STORAGE_KEY_VOICE);
        if (savedVoiceName) {
          const savedVoice = voices.find(v => v.name === savedVoiceName);
          if (savedVoice) {
            setSelectedVoiceState(savedVoice);
            return;
          }
        }
        
        // Otherwise use best available
        const best = getBestVoice(sortedVoices.length > 0 ? sortedVoices : voices);
        if (best) {
          setSelectedVoiceState(best);
          console.log('[Fasto Voice] Selected best voice:', best.name, 'Priority:', getVoicePriority(best));
        }
      }
    };
    
    // Load immediately if available
    loadVoices();
    
    // Also listen for voiceschanged event (needed for Chrome)
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Set selected voice with persistence
  const setSelectedVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setSelectedVoiceState(voice);
    localStorage.setItem(STORAGE_KEY_VOICE, voice.name);
    console.log('[Fasto Voice] Voice changed to:', voice.name);
  }, []);

  // Set speech rate with persistence
  const setSpeechRate = useCallback((rate: number) => {
    const clampedRate = Math.max(0.5, Math.min(2, rate));
    setSpeechRateState(clampedRate);
    localStorage.setItem(STORAGE_KEY_RATE, clampedRate.toString());
  }, []);

  // Check for speech recognition support
  const getSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return SpeechRecognition ? new SpeechRecognition() : null;
  }, []);

  // Stop listening (defined here to use in speak)
  const stopListeningInternal = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors
      }
      recognitionRef.current = null;
    }
    
    setIsListening(false);
    setIsWakeWordActive(false);
  }, []);

  // Speak text using speech synthesis
  const speak = useCallback((text: string) => {
    console.log('[Fasto TTS] speak() called with:', text?.substring(0, 100));
    
    if (!speakResponses) {
      console.log('[Fasto TTS] speakResponses is disabled, skipping');
      return;
    }
    
    if (!synthRef.current) {
      console.log('[Fasto TTS] No speechSynthesis available');
      return;
    }

    // Remember if we were listening so we can auto-resume (Alexa-style)
    wasListeningBeforeSpeakRef.current = !!recognitionRef.current;
    shouldAutoResumeRef.current = enableContinuousListening;
    
    // Pause recognition during TTS so Fasto doesn't hear itself
    if (recognitionRef.current) {
      console.log('[Fasto TTS] Pausing recognition during speech...');
      stopListeningInternal();
    }

    // Cancel any ongoing speech
    synthRef.current.cancel();

    // Clean the text - remove nav tags and other markup
    const cleanText = text
      .replace(/\[\[NAV:[^\]]+\]\]/g, '')
      .replace(/\[\[VISUAL:[^\]]+\]\]/g, '')
      .replace(/\*\*/g, '')
      .replace(/\n+/g, ' ')
      .replace(/#+/g, '') // Remove markdown headers
      .replace(/`[^`]+`/g, '') // Remove code blocks
      .trim();

    if (!cleanText) {
      console.log('[Fasto TTS] No clean text to speak');
      return;
    }

    console.log('[Fasto TTS] Clean text to speak:', cleanText.substring(0, 100));

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speechRate;
    utterance.pitch = 0.95; // Slightly lower for more natural tone
    utterance.volume = 1.0;

    // Use selected voice or best available
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('[Fasto TTS] Using selected voice:', selectedVoice.name);
    } else {
      const best = getBestVoice(availableVoices);
      if (best) {
        utterance.voice = best;
        console.log('[Fasto TTS] Using best available voice:', best.name);
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      console.log('[Fasto TTS] Started speaking!');
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      console.log('[Fasto TTS] Finished speaking.');
      
      // ✨ Alexa-style: Auto-resume listening after speaking
      if (shouldAutoResumeRef.current || wasListeningBeforeSpeakRef.current) {
        console.log('[Fasto TTS] Auto-resuming listening after speech (Alexa-style)...');
        // Dispatch event so UI can show "listening" feedback
        window.dispatchEvent(new CustomEvent('fastoListeningResumed'));
        // Small delay to avoid picking up tail end of TTS audio
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('fastoStartListening'));
        }, 400);
      }
    };
    
    utterance.onerror = (e) => {
      console.error('[Fasto TTS] Speech error:', e.error, e);
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    
    // Chrome bug workaround: Chrome pauses speech synthesis when tab is not focused
    // Also, voices may not be loaded immediately
    const voices = synthRef.current.getVoices();
    if (voices.length === 0) {
      console.log('[Fasto TTS] Voices not loaded yet, waiting...');
      // Wait for voices to load
      const checkVoices = setInterval(() => {
        const v = synthRef.current?.getVoices();
        if (v && v.length > 0) {
          clearInterval(checkVoices);
          console.log('[Fasto TTS] Voices loaded, speaking now');
          synthRef.current?.speak(utterance);
        }
      }, 100);
      // Timeout after 2 seconds
      setTimeout(() => clearInterval(checkVoices), 2000);
    } else {
      console.log('[Fasto TTS] Speaking now with', voices.length, 'voices available');
      synthRef.current.speak(utterance);
    }
  }, [speakResponses, selectedVoice, availableVoices, speechRate, enableContinuousListening, stopListeningInternal]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Start listening for voice
  const startListening = useCallback(() => {
    const recognition = getSpeechRecognition();
    
    if (!recognition) {
      toast.error('Voice input is not supported in this browser');
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
    }

    recognition.continuous = enableContinuousListening;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = String(event?.results?.[event.results.length - 1]?.[0]?.transcript || '').trim().toLowerCase();
      
      console.log('[Fasto Voice] Raw transcript:', transcript);
      
      if (!transcript) return;
      
      // Skip if transcript is too short (likely fragment like "R")
      if (transcript.length < 3) {
        console.log('[Fasto Voice] Ignoring short fragment:', transcript);
        return;
      }

      // IMPROVED: Simple split-based wake word detection instead of complex regex
      // This is more reliable than capture groups that can fail
      const wakeWordVariants = [
        'hey fasto', 'hey festo', 'hey faster', 'hey pastor', 
        'hey vasto', 'hey basto', 'hey fast', 'a fasto', 'a festo',
        'hay fasto', 'hay festo', 'hey fast oh', 'hey fest oh'
      ];
      
      let command = '';
      let wakeWordDetected = false;
      let matchedWakeWord = '';

      // Method 1: Check if transcript contains any wake word variant
      for (const variant of wakeWordVariants) {
        if (transcript.includes(variant)) {
          wakeWordDetected = true;
          matchedWakeWord = variant;
          // Split on the wake word and take everything after
          const parts = transcript.split(variant);
          command = parts.slice(1).join(variant).trim(); // Get everything after wake word
          // Clean up punctuation at start
          command = command.replace(/^[\s,:]+/, '').trim();
          console.log('[Fasto Voice] Wake word variant matched:', variant, '| Command:', command);
          break;
        }
      }

      // Method 2: Looser check - just contains "fasto" or similar anywhere
      if (!wakeWordDetected) {
        const fastoLikeWords = ['fasto', 'festo', 'faster', 'pastor', 'vasto', 'basto'];
        for (const word of fastoLikeWords) {
          const idx = transcript.indexOf(word);
          if (idx !== -1) {
            wakeWordDetected = true;
            matchedWakeWord = word;
            // Take everything after the wake word
            command = transcript.substring(idx + word.length).replace(/^[\s,:]+/, '').trim();
            console.log('[Fasto Voice] Found wake-like word:', word, '| Command:', command);
            break;
          }
        }
      }

      // Method 3: Starts with just "fasto" or similar
      if (!wakeWordDetected) {
        const startsWithFasto = /^(?:fasto|festo|faster)/i;
        if (startsWithFasto.test(transcript)) {
          wakeWordDetected = true;
          command = transcript.replace(/^(?:fasto|festo|faster)[\s,:]+/i, '').trim();
          console.log('[Fasto Voice] Starts with fasto-like word! Command:', command);
        }
      }

      if (wakeWordDetected) {
        setIsWakeWordActive(true);
        onWakeWordDetected?.();
        
        if (command && onCommand) {
          console.log('[Fasto Voice] Calling onCommand with:', command);
          onCommand(command);
        }
        
        setTimeout(() => setIsWakeWordActive(false), 2000);
      } else if (enableContinuousListening) {
        console.log('[Fasto Voice] Continuous mode - no wake word detected');
      } else if (onCommand) {
        console.log('[Fasto Voice] Non-continuous mode - sending as command:', transcript);
        onCommand(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast.error('Voice recognition failed');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      
      if (enableContinuousListening && recognitionRef.current === recognition) {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            // Ignore restart errors
          }
        }, 100);
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }, [getSpeechRecognition, enableContinuousListening, wakeWord, onWakeWordDetected, onCommand]);

  // Stop listening (public version that also prevents auto-resume)
  const stopListening = useCallback(() => {
    shouldAutoResumeRef.current = false; // Prevent auto-resume when manually stopped
    wasListeningBeforeSpeakRef.current = false;
    stopListeningInternal();
  }, [stopListeningInternal]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, [stopListening, stopSpeaking]);

  return {
    isListening,
    isWakeWordActive,
    isSpeaking,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
    availableVoices,
    selectedVoice,
    setSelectedVoice,
    speechRate,
    setSpeechRate,
  };
};
