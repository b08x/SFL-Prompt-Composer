
import React, { useRef, useEffect, useState, useCallback } from 'react';
// Fix: Import TranscriptEntry from the shared types file, not the hook.
import { useLiveConversation } from '../hooks/useLiveConversation';
import { summarizeConversation } from '../services/geminiService';
import { getGeminiError } from '../utils/errorHandler';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { CONVERSATION_ICON, MIC_ICON, STOP_ICON, USER_AVATAR_ICON, AI_AVATAR_ICON, INFO_ICON, SUMMARY_ICON } from '../constants';
import type { SFLPrompt, TranscriptEntry } from '../types';
import { MemoizedMarkdown } from './ui/MemoizedMarkdown';

interface LiveConversationProps {
  systemInstruction: string;
  onUpdatePrompt: (updates: Partial<SFLPrompt>) => void;
  onApiKeyError: (message?: string) => void;
}

export const LiveConversation: React.FC<LiveConversationProps> = ({ systemInstruction, onUpdatePrompt, onApiKeyError }) => {
  const {
    status,
    transcript,
    error,
    startConversation,
    endConversation,
  } = useLiveConversation({ systemInstruction, onUpdatePrompt, onApiKeyError });

  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Automatically start the conversation when the component mounts (or gets a new key)
  useEffect(() => {
    startConversation();
  }, [startConversation]);

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
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
      <Card>
        <div className="flex items-start sm:items-center justify-between mb-4 flex-col sm:flex-row gap-3">
          <div className="flex items-center">
              <span className="w-8 h-8 mr-3 text-violet-400 flex-shrink-0">{CONVERSATION_ICON}</span>
              <h2 className="text-xl font-semibold text-slate-100">Converse & Refine</h2>
          </div>
          <div className="flex items-center gap-4 self-end sm:self-center">
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
          </div>
        </div>
        
        <div className="bg-slate-900/50 rounded-md p-4 mb-4 overflow-auto h-48 min-h-[12rem] flex flex-col gap-4 text-sm">
          {transcript.length === 0 && status !== 'active' && (
              <p className="text-slate-500 m-auto text-center italic">
                  Start the conversation to refine your prompt or response.
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
                      <div className={`text-slate-200 rounded-xl px-4 py-2 max-w-[80%] break-words ${isUser ? 'bg-slate-700 rounded-br-none' : 'bg-violet-600/80 rounded-bl-none'}`}>
                          {entry.text}
                      </div>
                  </div>
              );
          })}
          <div ref={transcriptEndRef} />
        </div>

        {(error || summaryError) && <p className="text-red-400 text-sm bg-red-900/20 p-3 rounded-md border border-red-800/50 mb-4">{error || summaryError}</p>}
        
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
      </Card>
    </>
  );
};
