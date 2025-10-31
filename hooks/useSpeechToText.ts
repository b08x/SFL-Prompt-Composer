
import { useState, useEffect, useRef } from 'react';

// Define the interface for the SpeechRecognition API for type safety
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((this: SpeechRecognition, ev: any) => any) | null;
  onerror: ((this: SpeechRecognition, ev: any) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

const getSpeechRecognition = (): SpeechRecognitionStatic | null => {
  const w = window as any;
  const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
  return SpeechRecognition ? SpeechRecognition : null;
};


export const useSpeechToText = (onTranscriptUpdate: (transcript: string) => void) => {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const onTranscriptUpdateRef = useRef(onTranscriptUpdate);

    // Keep the ref updated with the latest callback from the parent component
    useEffect(() => {
        onTranscriptUpdateRef.current = onTranscriptUpdate;
    }, [onTranscriptUpdate]);

    const SpeechRecognition = getSpeechRecognition();
    const isSupported = !!SpeechRecognition;
    
    useEffect(() => {
        if (!isSupported) {
            setError("Speech recognition is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
              // Use the ref to call the latest callback
              onTranscriptUpdateRef.current(finalTranscript.trim());
            }
        };
        
        recognition.onerror = (event: any) => {
            // Ignore common non-errors
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                setError(`Speech recognition error: ${event.error}`);
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };
        
        recognitionRef.current = recognition;
        
        // Cleanup function to stop recognition if the component unmounts
        return () => {
          recognition.onresult = null;
          recognition.onerror = null;
          recognition.onend = null;
          recognition.stop();
        };

    // This effect should only re-run if browser support changes, which is effectively once on mount.
    // The callback is handled via a ref, so it doesn't need to be a dependency.
    }, [isSupported]);

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
                setError(null);
            } catch (err) {
                // This can happen if start() is called again on an object that's already started.
                console.error("Speech recognition could not be started.", err);
                setError("Speech recognition could not be started.");
                setIsListening(false);
            }
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            // The onend event will fire and set isListening to false.
        }
    };

    return {
        isListening,
        startListening,
        stopListening,
        error,
        isSupported,
    };
};
