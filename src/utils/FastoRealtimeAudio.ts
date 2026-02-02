// Audio Recorder for capturing microphone input at 24kHz PCM
export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      console.log('[AudioRecorder] Started recording at 24kHz');
    } catch (error) {
      console.error('[AudioRecorder] Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    console.log('[AudioRecorder] Stopped');
  }
}

// Encode Float32 audio to base64 PCM16
export const encodeAudioForAPI = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};

// Audio Queue for sequential playback
class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;
  private onPlayingChange?: (playing: boolean) => void;

  constructor(audioContext: AudioContext, onPlayingChange?: (playing: boolean) => void) {
    this.audioContext = audioContext;
    this.onPlayingChange = onPlayingChange;
  }

  async addToQueue(audioData: Uint8Array) {
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.onPlayingChange?.(false);
      return;
    }

    this.isPlaying = true;
    this.onPlayingChange?.(true);
    const audioData = this.queue.shift()!;

    try {
      const wavData = createWavFromPCM(audioData);
      const arrayBuffer = wavData.buffer.slice(wavData.byteOffset, wavData.byteOffset + wavData.byteLength) as ArrayBuffer;
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => this.playNext();
      source.start(0);
    } catch (error) {
      console.error('[AudioQueue] Error playing audio:', error);
      this.playNext();
    }
  }

  clear() {
    this.queue = [];
    this.isPlaying = false;
    this.onPlayingChange?.(false);
  }
}

// Create WAV header for PCM data
const createWavFromPCM = (pcmData: Uint8Array): Uint8Array => {
  const int16Data = new Int16Array(pcmData.length / 2);
  for (let i = 0; i < pcmData.length; i += 2) {
    int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
  }
  
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = int16Data.byteLength;

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
  wavArray.set(new Uint8Array(wavHeader), 0);
  wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
  
  return wavArray;
};

// Event types from OpenAI Realtime API
export interface RealtimeEvent {
  type: string;
  event_id?: string;
  [key: string]: any;
}

export interface ToolCallEvent {
  type: 'response.function_call_arguments.done';
  call_id: string;
  name: string;
  arguments: string;
}

// Realtime Conversation Manager
export class RealtimeConversation {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private recorder: AudioRecorder | null = null;
  private audioQueue: AudioQueue | null = null;
  private audioContext: AudioContext | null = null;
  private accumulatedAudio: Uint8Array[] = [];
  private mediaStream: MediaStream | null = null;
  private isAudioInputEnabled = true;
  private textOnlyMode = false;

  constructor(
    private onMessage: (event: RealtimeEvent) => void,
    private onToolCall: (name: string, args: any, callId: string) => Promise<any>,
    private onSpeakingChange: (speaking: boolean) => void,
    private onStatusChange: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void
  ) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
  }

  async connect(ephemeralToken: string, textOnly: boolean = false) {
    try {
      this.onStatusChange('connecting');
      this.textOnlyMode = textOnly;
      
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.audioQueue = new AudioQueue(this.audioContext, this.onSpeakingChange);

      // Create peer connection
      this.pc = new RTCPeerConnection();

      // Set up remote audio
      this.pc.ontrack = (e) => {
        console.log('[RealtimeConversation] Received audio track');
        this.audioEl.srcObject = e.streams[0];
      };

      // Add local audio track (skip if text-only mode)
      if (!textOnly) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        this.pc.addTrack(this.mediaStream.getTracks()[0]);
      } else {
        // For text-only, add a silent audio track to satisfy WebRTC requirements
        const silentAudioContext = new AudioContext();
        const oscillator = silentAudioContext.createOscillator();
        const dst = silentAudioContext.createMediaStreamDestination();
        oscillator.connect(dst);
        oscillator.start();
        const silentTrack = dst.stream.getAudioTracks()[0];
        silentTrack.enabled = false; // Mute it
        this.pc.addTrack(silentTrack);
        console.log('[RealtimeConversation] Text-only mode - silent audio track added');
      }

      // Set up data channel
      this.dc = this.pc.createDataChannel("oai-events");
      
      this.dc.addEventListener("open", () => {
        console.log('[RealtimeConversation] Data channel open');
        this.onStatusChange('connected');
      });

      this.dc.addEventListener("message", async (e) => {
        const event: RealtimeEvent = JSON.parse(e.data);
        console.log('[RealtimeConversation] Event:', event.type);
        
        await this.handleEvent(event);
        this.onMessage(event);
      });

      this.dc.addEventListener("close", () => {
        console.log('[RealtimeConversation] Data channel closed');
        this.onStatusChange('disconnected');
      });

      // Create and set local description
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Connect to OpenAI's Realtime API
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralToken}`,
          "Content-Type": "application/sdp"
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`Failed to connect: ${sdpResponse.status}`);
      }

      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      
      await this.pc.setRemoteDescription(answer);
      console.log('[RealtimeConversation] WebRTC connection established' + (textOnly ? ' (text-only mode)' : ''));

    } catch (error) {
      console.error('[RealtimeConversation] Connection error:', error);
      this.onStatusChange('error');
      throw error;
    }
  }

  // Pause audio input (mute mic)
  pauseAudioInput() {
    if (this.mediaStream && !this.textOnlyMode) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
      this.isAudioInputEnabled = false;
      console.log('[RealtimeConversation] Audio input paused');
    }
  }

  // Resume audio input (unmute mic)
  resumeAudioInput() {
    if (this.mediaStream && !this.textOnlyMode) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = true;
      });
      this.isAudioInputEnabled = true;
      console.log('[RealtimeConversation] Audio input resumed');
    }
  }

  private async handleEvent(event: RealtimeEvent) {
    switch (event.type) {
      case 'response.audio.delta':
        // Accumulate audio chunks
        if (event.delta) {
          const binaryString = atob(event.delta);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          this.accumulatedAudio.push(bytes);
        }
        break;

      case 'response.audio.done':
        // Play accumulated audio
        if (this.accumulatedAudio.length > 0 && this.audioQueue) {
          const totalLength = this.accumulatedAudio.reduce((acc, arr) => acc + arr.length, 0);
          const combined = new Uint8Array(totalLength);
          let offset = 0;
          for (const arr of this.accumulatedAudio) {
            combined.set(arr, offset);
            offset += arr.length;
          }
          await this.audioQueue.addToQueue(combined);
          this.accumulatedAudio = [];
        }
        break;

      case 'response.function_call_arguments.done':
        // Handle tool calls
        const toolEvent = event as ToolCallEvent;
        console.log('[RealtimeConversation] Tool call:', toolEvent.name, toolEvent.arguments);
        
        try {
          const args = JSON.parse(toolEvent.arguments);
          const result = await this.onToolCall(toolEvent.name, args, toolEvent.call_id);
          
          // Send tool result back
          this.sendEvent({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: toolEvent.call_id,
              output: JSON.stringify(result)
            }
          });
          
          // Trigger response after tool result
          this.sendEvent({ type: 'response.create' });
        } catch (error) {
          console.error('[RealtimeConversation] Tool execution error:', error);
          this.sendEvent({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: toolEvent.call_id,
              output: JSON.stringify({ error: 'Tool execution failed' })
            }
          });
          this.sendEvent({ type: 'response.create' });
        }
        break;

      case 'input_audio_buffer.speech_started':
        // User started speaking - stop any playing audio
        this.audioQueue?.clear();
        this.onSpeakingChange(false);
        break;
    }
  }

  sendEvent(event: any) {
    if (this.dc?.readyState === 'open') {
      this.dc.send(JSON.stringify(event));
    }
  }

  sendTextMessage(text: string) {
    this.sendEvent({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }]
      }
    });
    this.sendEvent({ type: 'response.create' });
  }

  disconnect() {
    this.recorder?.stop();
    this.audioQueue?.clear();
    this.dc?.close();
    this.pc?.close();
    this.audioContext?.close();
    // Stop all media tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.onStatusChange('disconnected');
    console.log('[RealtimeConversation] Disconnected');
  }
}
