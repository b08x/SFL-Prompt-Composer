
import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveSession, FunctionDeclaration, Type } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { fileToBase64, readFileAsText } from '../utils/fileUtils';
import type { SFLPrompt, TranscriptEntry } from '../types';

type ConversationStatus = 'idle' | 'connecting' | 'active' | 'error';

interface UseLiveConversationProps {
  systemInstruction: string;
  onUpdatePrompt: (updates: Partial<SFLPrompt>) => void;
  onApiKeyError: (message?: string) => void;
}

const updatePromptComponentsFunctionDeclaration: FunctionDeclaration = {
    name: 'updatePromptComponents',
    description: "Updates one or more components of the SFL prompt (Field, Tenor, or Mode). Only include fields that need changing.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        field: {
          type: Type.OBJECT,
          description: "Updates to the 'Field' component (the subject matter).",
          properties: {
            topic: { type: Type.STRING },
            taskVerb: { type: Type.STRING },
            taskDescription: { type: Type.STRING },
            keyEntities: { type: Type.STRING },
            circumstances: { type: Type.STRING },
          },
        },
        tenor: {
          type: Type.OBJECT,
          description: "Updates to the 'Tenor' component (persona and audience).",
          properties: {
            persona: { type: Type.STRING },
            audience: { type: Type.STRING },
            tone: { type: Type.STRING },
            modality: { type: Type.STRING },
          },
        },
        mode: {
          type: Type.OBJECT,
          description: "Updates to the 'Mode' component (output format and structure).",
          properties: {
            format: { type: Type.STRING },
            structure: { type: Type.STRING },
            constraints: { type: Type.STRING },
          },
        },
      },
    },
};

export const useLiveConversation = ({ systemInstruction, onUpdatePrompt, onApiKeyError }: UseLiveConversationProps) => {
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
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
        inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        outputAudioContextRef.current.close();
    }
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

  const uploadFile = useCallback(async (file: File) => {
    if (!sessionRef.current || status !== 'active') {
        setError('Cannot upload file: conversation is not active.');
        return;
    }

    try {
        if (file.type.startsWith('image/')) {
            const imageUrl = URL.createObjectURL(file);
            setTranscript(prev => [...prev, { speaker: 'user', image: { name: file.name, url: imageUrl } }]);

            const base64Data = await fileToBase64(file);
            sessionRef.current.sendRealtimeInput({
                media: { data: base64Data, mimeType: file.type }
            });
        } else if (file.type.startsWith('text/')) {
            const textContent = await readFileAsText(file);
            const message = `The user uploaded a file named "${file.name}" with the following content:\n\n---\n${textContent}\n---`;
            
            // Show a user-friendly message in the transcript, but send the full content to the model
            setTranscript(prev => [...prev, { speaker: 'user', text: `(Uploaded ${file.name})` }]);

            sessionRef.current.sendRealtimeInput({
                text: message,
            });
        } else {
            const unsupportedMessage = `File type "${file.type}" is not supported. Please upload an image or a text file.`;
            setError(unsupportedMessage);
            setTranscript(prev => [...prev, { speaker: 'system', text: unsupportedMessage }]);
        }
    } catch (e) {
        console.error('Failed to process or send file:', e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred while sending the file.';
        setError(errorMessage);
    }
  }, [status]);
  
  const startConversation = useCallback(async () => {
    setStatus('connecting');
    setError(null);
    setTranscript([]);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
                    if (message.toolCall) {
                        const functionResponses = [];
                        for (const fc of message.toolCall.functionCalls) {
                            if (fc.name === 'updatePromptComponents') {
                                onUpdatePrompt(fc.args as Partial<SFLPrompt>);
                                const updatedSections = Object.keys(fc.args).join(', ');
                                setTranscript(prev => [...prev, { speaker: 'system', text: `Updated ${updatedSections}` }]);
                                
                                functionResponses.push({
                                    id : fc.id,
                                    name: fc.name,
                                    response: { result: "OK, the prompt has been updated." },
                                });
                            }
                        }
                        if (functionResponses.length > 0) {
                            sessionPromise.then((session) => {
                                session.sendToolResponse({ functionResponses });
                            });
                        }
                    }

                    if (message.serverContent?.inputTranscription) {
                        const text = message.serverContent.inputTranscription.text;
                        setTranscript(prev => {
                            const last = prev.length > 0 ? prev[prev.length - 1] : null;
                            if (last?.speaker === 'user' && last.text) {
                                const updatedLast = { ...last, text: last.text + text };
                                return [...prev.slice(0, -1), updatedLast];
                            }
                            return [...prev, { speaker: 'user', text }];
                        });
                    } else if (message.serverContent?.outputTranscription) {
                        const text = message.serverContent.outputTranscription.text;
                        setTranscript(prev => {
                            const last = prev.length > 0 ? prev[prev.length - 1] : null;
                            if (last?.speaker === 'model' && last.text) {
                                const updatedLast = { ...last, text: last.text + text };
                                return [...prev.slice(0, -1), updatedLast];
                            }
                            return [...prev, { speaker: 'model', text }];
                        });
                    }

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
                onerror: (e: any) => {
                    console.error('Live session error:', e);
                    const rawErrorMessage = e?.message || 'An unknown connection error occurred.';
                    // Treat any connection error as a potential API key issue, as it's the most common and user-fixable problem.
                    const userFriendlyMessage = 'Live session failed. This could be due to an invalid API key or network issue.';
                    
                    setError(userFriendlyMessage); // Set local error for the component itself
                    onApiKeyError(rawErrorMessage); // Bubble up the raw error to trigger the modal
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
                tools: [{ functionDeclarations: [updatePromptComponentsFunctionDeclaration] }],
            },
        });
        
        sessionRef.current = await sessionPromise;

    } catch (e) {
        console.error('Failed to start conversation:', e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(errorMessage);
        onApiKeyError(errorMessage)
        setStatus('error');
        cleanup();
    }
  }, [systemInstruction, cleanup, onUpdatePrompt, onApiKeyError]);

  return { status, transcript, error, startConversation, endConversation, uploadFile };
};
