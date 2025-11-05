
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useLiveConversation } from '../hooks/useLiveConversation';
import { summarizeConversation } from '../services/geminiService';
import { getGeminiError } from '../utils/errorHandler';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { CONVERSATION_ICON, MIC_ICON, STOP_ICON, USER_AVATAR_ICON, AI_AVATAR_ICON, INFO_ICON, SUMMARY_ICON, ATTACHMENT_ICON, SEND_ICON, X_ICON } from '../constants';
import type { SFLPrompt, TranscriptEntry } from '../types';
import { MemoizedMarkdown } from './ui/MemoizedMarkdown';

interface LiveConversationProps {
  systemInstruction: string;
  onUpdatePrompt: (updates: Partial<SFLPrompt>) => void;
  onApiKeyError: (message?: string) => void;
  latestContext: { prompt: string; response: string } | null;
}

export const LiveConversation: React.FC<LiveConversationProps> = ({ systemInstruction, onUpdatePrompt, onApiKeyError, latestContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    status,
    transcript,
    error,
    startConversation,
    endConversation,
    uploadFile,
    sendTextMessage,
  } = useLiveConversation({ systemInstruction, onUpdatePrompt, onApiKeyError, latestContext });

  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const handleSummarize = useCallback(async () => {
    if (transcript.length === 0) return;
    
    setIsSummarizing(true);
    setSummaryError(null);
    try {
      const result = await summarizeConversation(transcript);
      setSummary(result);
      setIsSummaryModalOpen(true);
    } catch (e) {
      console.error("Summarization failed:", e);
      setSummaryError(getGeminiError(e));
    } finally {
      setIsSummarizing(false);
    }
  }, [transcript]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && uploadFile) {
        uploadFile(file);
    }
    if (event.target) {
        event.target.value = '';
    }
  };

  const triggerFileSelect = () => {
      fileInputRef.current?.click();
  };

  const handleSendText = useCallback(() => {
    if (textInput.trim() && sendTextMessage) {
        sendTextMessage(textInput.trim());
        setTextInput('');
    }
  }, [textInput, sendTextMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSendText();
      }
  };

  const getStatusIndicator = () => {
    switch (status) {
      case 'connecting':
        return <span className="text-yellow-400 text-sm">Connecting...</span>;
      case 'active':
        return (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Active
          </div>
        );
      case 'error':
        return <span className="text-red-400 text-sm">Error</span>;
      default:
        return <span className="text-slate-400 text-sm">Idle</span>;
    }
  };

  return (
    <>
      {isSummaryModalOpen && (
         <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={() => setIsSummaryModalOpen(false)}
          aria-modal="true"
          role="dialog"
        >
          <div 
            className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl transform transition-all"
            onClick={e => e.stopPropagation()}
          >
              <h2 className="text-2xl font-bold text-slate-100 mb-4">Summary of Changes</h2>
              <div className="max-h-[60vh] overflow-y-auto pr-2 text-slate-300">
                <MemoizedMarkdown content={summary} id="summary-modal" />
              </div>
              <div className="mt-6 pt-6 border-t border-slate-700 flex justify-end">
                <Button onClick={() => setIsSummaryModalOpen(false)} className="bg-slate-700 hover:bg-slate-600 focus:ring-slate-500">
                  Close
                </Button>
              </div>
          </div>
        </div>
      )}

      {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 w-16 h-16 rounded-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shadow-2xl shadow-violet-900/50 transform transition-all hover:scale-105 focus:outline-none focus:ring-4 focus:ring-violet-500 focus:ring-offset-4 focus:ring-offset-slate-900"
            aria-label="Open conversation"
          >
              <span className="w-8 h-8">{CONVERSATION_ICON}</span>
          </button>
      )}

      {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
            <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl w-full h-full sm:w-[440px] sm:h-auto sm:max-h-[80vh] flex flex-col m-4 transform transition-all">
                <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
                    <div className="flex items-center">
                        <span className="w-7 h-7 mr-3 text-violet-400 flex-shrink-0">{CONVERSATION_ICON}</span>
                        <h2 className="text-lg font-semibold text-slate-100">Converse & Refine</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        {getStatusIndicator()}
                        <button 
                            onClick={handleSummarize}
                            disabled={isSummarizing || transcript.length === 0}
                            className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700 hover:text-slate-200 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                            aria-label="Summarize Changes"
                            title="Summarize Changes"
                        >
                        {isSummarizing ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <span className="w-5 h-5 block">{SUMMARY_ICON}</span>
                        )}
                        </button>
                        <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md hover:bg-slate-700">
                           <span className="w-5 h-5 block">{X_ICON}</span>
                        </button>
                    </div>
                </div>

                <div className="flex-grow bg-slate-900/50 p-4 overflow-auto min-h-[12rem] flex flex-col gap-4 text-sm">
                    {transcript.length === 0 && (
                        <p className="text-slate-500 m-auto text-center italic">
                            {status === 'idle' ? 'Start the conversation to refine your prompt or response.' : 'Listening...'}
                        </p>
                    )}
                    {transcript.map((entry, index) => {
                        if (entry.speaker === 'system') {
                            return (
                                <div key={index} className="flex items-center justify-center gap-2 my-2 text-slate-500">
                                    <span className="w-4 h-4">{INFO_ICON}</span>
                                    <span className="text-xs italic">{entry.text}</span>
                                </div>
                            );
                        }
                        
                        const isUser = entry.speaker === 'user';
                        return (
                            <div key={index} className={`flex items-end gap-3 w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center p-1 ${isUser ? 'bg-slate-600 text-slate-300' : 'bg-violet-500 text-violet-100'}`}>
                                    {isUser ? USER_AVATAR_ICON : AI_AVATAR_ICON}
                                </div>
                                <div className={`text-slate-200 rounded-xl max-w-[80%] break-words ${isUser ? 'bg-slate-700 rounded-br-none' : 'bg-violet-600/80 rounded-bl-none'}`}>
                                    {entry.text && <div className="px-4 py-2">{entry.text}</div>}
                                    {entry.image && (
                                    <div className="p-2">
                                        <img src={entry.image.url} alt={entry.image.name} className="max-w-full h-auto rounded-lg max-h-48" />
                                        <p className="text-xs text-slate-400 mt-1 italic px-2">{entry.image.name}</p>
                                    </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={transcriptEndRef} />
                </div>

                <div className="p-4 border-t border-slate-700 flex-shrink-0">
                    {(error || summaryError) && <p className="text-red-400 text-sm bg-red-900/20 p-3 rounded-md border border-red-800/50 mb-4">{error || summaryError}</p>}
                    
                    <div className="space-y-2">
                        <div className="flex items-end gap-2">
                            <Textarea
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={status === 'active' ? "Type to refine..." : "Start conversation to enable text input"}
                                disabled={status !== 'active'}
                                rows={1}
                                className="flex-grow max-h-24"
                            />
                            <Button
                                onClick={handleSendText}
                                disabled={status !== 'active' || !textInput.trim()}
                                className="flex-shrink-0 !p-2.5"
                                aria-label="Send text message"
                                title="Send"
                            >
                                <span className="w-5 h-5">{SEND_ICON}</span>
                            </Button>
                        </div>
                        
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileSelect} 
                            className="hidden" 
                            accept="image/*,text/plain,text/markdown"
                        />
                        <div className="flex gap-2">
                            <Button 
                                onClick={status === 'active' ? endConversation : startConversation}
                                disabled={status === 'connecting'}
                                className="w-full"
                            >
                            {status === 'active' ? (
                                <>
                                <span className="w-5 h-5 mr-2">{STOP_ICON}</span>
                                End Conversation
                                </>
                            ) : (
                                <>
                                <span className="w-5 h-5 mr-2">{MIC_ICON}</span>
                                Start Conversation
                                </>
                            )}
                            </Button>
                            <Button
                                onClick={triggerFileSelect}
                                disabled={status !== 'active'}
                                className="flex-shrink-0 !p-2.5 bg-slate-700 hover:bg-slate-600 focus:ring-slate-500"
                                aria-label="Attach file"
                                title="Attach file"
                            >
                                <span className="w-5 h-5">{ATTACHMENT_ICON}</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
          </div>
      )}
    </>
  );
};
