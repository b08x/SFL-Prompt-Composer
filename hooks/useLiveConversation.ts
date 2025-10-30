
import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveSession } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';

type ConversationStatus = 'idle' | 'connecting' | 'active' | 'error';
type TranscriptEntry = { speaker: 'user' | 'model'; text: string };

interface UseLiveConversationProps {
  systemInstruction: string;
}

export const useLiveConversation = ({ systemInstruction }: UseLiveConversationProps) => {
  const [status, setStatus] = useState<ConversationStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<LiveSession | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const cleanup = useCallback(() => {
    // Stop audio processing
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.onaudioprocess = null;
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect();
        mediaStreamSourceRef.current = null;
    }
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    }

    // Close audio contexts
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
        inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        outputAudioContextRef.current.close();
    }
    
    // Stop any playing audio
    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

  }, []);


  const endConversation = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    cleanup();
    setStatus('idle');
  }, [cleanup]);
  
  const startConversation = useCallback(async () => {
    setStatus('connecting');
    setError(null);
    setTranscript([]);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        // FIX: Cast window to `any` to support `webkitAudioContext` for older Safari browsers
        // without causing TypeScript compilation errors.
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    setStatus('active');
                    const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                    mediaStreamSourceRef.current = source;

                    const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current = scriptProcessor;
                    
                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        // FIX: Replaced .map with a for loop for audio data conversion
                        // to improve performance and reduce memory allocation, aligning with best practices for real-time audio processing.
                        const l = inputData.length;
                        const int16 = new Int16Array(l);
                        for (let i = 0; i < l; i++) {
                            int16[i] = inputData[i] * 32768;
                        }
                        const pcmBlob = {
                            data: encode(new Uint8Array(int16.buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        sessionPromise.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContextRef.current!.destination);
                },
                onmessage: async (message) => {
                    // Handle transcription
                    // FIX: Simplified transcription logic to update the last message from the same speaker,
                    // preventing duplicate entries and creating a smoother streaming experience.
                    if (message.serverContent?.inputTranscription) {
                        const text = message.serverContent.inputTranscription.text;
                        setTranscript(prev => {
                            const last = prev[prev.length - 1];
                            if (last?.speaker === 'user') {
                                const updatedLast = { ...last, text };
                                return [...prev.slice(0, -1), updatedLast];
                            }
                            return [...prev, { speaker: 'user', text }];
                        });
                    } else if (message.serverContent?.outputTranscription) {
                        const text = message.serverContent.outputTranscription.text;
                        setTranscript(prev => {
                            const last = prev[prev.length - 1];
                            if (last?.speaker === 'model') {
                                const updatedLast = { ...last, text };
                                return [...prev.slice(0, -1), updatedLast];
                            }
                            return [...prev, { speaker: 'model', text }];
                        });
                    }

                    // Handle audio playback
                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio) {
                        const outputContext = outputAudioContextRef.current!;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContext.currentTime);

                        const audioBuffer = await decodeAudioData(decode(base64Audio), outputContext, 24000, 1);
                        const source = outputContext.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputContext.destination);
                        
                        source.addEventListener('ended', () => {
                            audioSourcesRef.current.delete(source);
                        });
                        
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        audioSourcesRef.current.add(source);
                    }
                    
                    if (message.serverContent?.interrupted) {
                        audioSourcesRef.current.forEach(s => s.stop());
                        audioSourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                    }
                },
                onerror: (e) => {
                    console.error('Live session error:', e);
                    setError('A connection error occurred.');
                    setStatus('error');
                    cleanup();
                },
                onclose: () => {
                    cleanup();
                    setStatus('idle');
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction,
            },
        });
        
        sessionRef.current = await sessionPromise;

    } catch (e) {
        console.error('Failed to start conversation:', e);
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        setStatus('error');
        cleanup();
    }
  }, [systemInstruction, cleanup]);

  return { status, transcript, error, startConversation, endConversation };
};
