
import React from 'react';
import { MIC_ICON, STOP_ICON } from '../../constants';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showSpeechButton?: boolean;
  isListening?: boolean;
  onSpeechClick?: () => void;
  isSpeechSupported?: boolean;
}

export const Input: React.FC<InputProps> = ({ className = '', showSpeechButton, isListening, onSpeechClick, isSpeechSupported, ...props }) => {
  return (
    <div className="relative">
      <input
        className={`block w-full bg-slate-700/50 border-slate-600 rounded-md shadow-sm py-2 px-3 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm transition ${showSpeechButton && isSpeechSupported ? 'pr-10' : ''} ${className}`}
        {...props}
      />
      {showSpeechButton && onSpeechClick && isSpeechSupported && (
        <button
          type="button"
          onClick={onSpeechClick}
          className={`absolute inset-y-0 right-0 flex items-center pr-3 z-10 text-slate-400 hover:text-violet-400 focus:outline-none transition-colors ${isListening ? 'text-red-500 hover:text-red-400' : ''}`}
          aria-label={isListening ? 'Stop dictation' : 'Start dictation'}
        >
          {isListening ? (
            <span className="w-5 h-5">
              <span className="relative flex h-full w-full items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex">{STOP_ICON}</span>
              </span>
            </span>
          ) : (
            <span className="w-5 h-5">{MIC_ICON}</span>
          )}
        </button>
      )}
    </div>
  );
};
