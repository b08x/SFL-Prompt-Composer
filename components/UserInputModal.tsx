
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Label } from './ui/Label';
import { Textarea } from './ui/Textarea';
import { INPUT_ICON } from '../constants';

interface UserInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userInput: string) => void;
  isLoading: boolean;
}

export const UserInputModal: React.FC<UserInputModalProps> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [userInput, setUserInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!userInput.trim()) return;
    onSubmit(userInput);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-8 text-violet-400 flex-shrink-0">{INPUT_ICON}</span>
          <h2 className="text-2xl font-bold text-slate-100">
            Provide Input
          </h2>
        </div>
        <p className="text-slate-400 mb-6">
          Your input will be combined with the assembled prompt to generate the final response.
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="userInput">Your Input</Label>
            <Textarea
              id="userInput"
              name="userInput"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows={8}
              placeholder="Type your input here..."
              className="min-h-[150px] font-mono text-sm"
              disabled={isLoading}
              autoFocus
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-slate-700">
          <Button onClick={handleClose} className="w-full bg-slate-700 hover:bg-slate-600 focus:ring-slate-500" disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="w-full" disabled={isLoading || !userInput.trim()}>
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : 'Submit & Generate'}
          </Button>
        </div>
      </div>
    </div>
  );
};
