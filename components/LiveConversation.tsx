
import React, { useRef, useEffect } from 'react';
import { useLiveConversation } from '../hooks/useLiveConversation';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { CONVERSATION_ICON, MIC_ICON, STOP_ICON } from '../constants';

interface LiveConversationProps {
  systemInstruction: string;
}

export const LiveConversation: React.FC<LiveConversationProps> = ({ systemInstruction }) => {
  const {
    status,
    transcript,
    error,
    startConversation,
    endConversation,
  } = useLiveConversation({ systemInstruction });

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
            <span className="w-8 h-8 mr-3 text-violet-400">{CONVERSATION_ICON}</span>
            <h2 className="text-xl font-semibold text-slate-100">Converse & Refine</h2>
        </div>
        {getStatusIndicator()}
      </div>
      
      <div className="bg-slate-900/50 rounded-md p-4 mb-4 overflow-auto h-48 min-h-[12rem] flex flex-col gap-2 text-sm">
        {transcript.length === 0 && status !== 'active' && (
            <p className="text-slate-500 m-auto text-center italic">
                Start the conversation to refine your prompt or response.
            </p>
        )}
        {transcript.map((entry, index) => (
          <div key={index} className={`flex flex-col ${entry.speaker === 'user' ? 'items-start' : 'items-end'}`}>
            <div className={`rounded-lg px-3 py-2 max-w-[80%] ${entry.speaker === 'user' ? 'bg-slate-700 text-slate-200' : 'bg-violet-800 text-violet-100'}`}>
              <span className="font-bold text-xs block mb-1 opacity-70">{entry.speaker === 'user' ? 'You' : 'AI'}</span>
              {entry.text}
            </div>
          </div>
        ))}
        <div ref={transcriptEndRef} />
      </div>

      {error && <p className="text-red-400 text-sm bg-red-900/20 p-3 rounded-md border border-red-800/50 mb-4">{error}</p>}
      
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
  );
};
