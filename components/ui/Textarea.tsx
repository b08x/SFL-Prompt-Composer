import React, { useLayoutEffect, useRef, useState } from 'react';
import { MIC_ICON, STOP_ICON } from '../../constants';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  showSpeechButton?: boolean;
  isListening?: boolean;
  onSpeechClick?: () => void;
  isSpeechSupported?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({ className = '', showSpeechButton, isListening, onSpeechClick, isSpeechSupported, ...props }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isManuallyResized, setIsManuallyResized] = useState(false);
  const sizeOnMouseDown = useRef<{ width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    if (isManuallyResized) {
      return;
    }
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height to allow shrinking
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [props.value, isManuallyResized]);

  const handleMouseDown = () => {
    // If auto-resizing is already disabled, no need to track.
    if (isManuallyResized || !textareaRef.current) return;
    
    sizeOnMouseDown.current = {
      width: textareaRef.current.clientWidth,
      height: textareaRef.current.clientHeight,
    };
  };

  const handleMouseUp = () => {
    // If auto-resizing is already disabled or we weren't tracking, do nothing.
    if (isManuallyResized || !textareaRef.current || !sizeOnMouseDown.current) return;

    if (
      textareaRef.current.clientWidth !== sizeOnMouseDown.current.width ||
      textareaRef.current.clientHeight !== sizeOnMouseDown.current.height
    ) {
      // Dimensions changed between mouse down and up, so disable auto-sizing.
      setIsManuallyResized(true);
    }
    sizeOnMouseDown.current = null;
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        className={`block w-full bg-slate-700/50 border-slate-600 rounded-md shadow-sm py-2 px-3 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm transition resize-y max-h-40 ${showSpeechButton && isSpeechSupported ? 'pr-10' : ''} ${className}`}
        {...props}
      />
      {showSpeechButton && onSpeechClick && isSpeechSupported && (
        <button
          type="button"
          onClick={onSpeechClick}
          className={`absolute top-2 right-0 flex items-center pr-3 z-10 text-slate-400 hover:text-violet-400 focus:outline-none transition-colors ${isListening ? 'text-red-500 hover:text-red-400' : ''}`}
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
