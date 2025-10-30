
import React from 'react';
import { Button } from './ui/Button';
import { FIELD_ICON, TENOR_ICON, MODE_ICON, USER_AVATAR_ICON, AI_AVATAR_ICON, HELP_ICON } from '../constants';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-3xl transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
                <span className="w-8 h-8 text-violet-400 flex-shrink-0">{HELP_ICON}</span>
                <h2 className="text-2xl font-bold text-slate-100">
                    SFL Prompting Guide
                </h2>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                <span className="sr-only">Close help guide</span>
            </button>
        </div>
        
        <div className="max-h-[70vh] overflow-y-auto pr-4 -mr-4 text-slate-300 space-y-6">
            <p className="text-slate-400">
                Systemic Functional Linguistics (SFL) provides a powerful framework for crafting precise and effective prompts. By defining the Field, Tenor, and Mode, you gain granular control over the LLM's output.
            </p>

            <HelpSection icon={FIELD_ICON} title="Field: The 'What'">
                <p>This component defines the subject matter and the world of the response. It controls what the AI talks about, ensuring factual accuracy and logical consistency.</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                    <li><strong>Topic:</strong> The core subject.</li>
                    <li><strong>Task:</strong> The action the AI should perform (e.g., Analyze, Create).</li>
                    <li><strong>Key Entities:</strong> Specific concepts, names, or terms to include.</li>
                    <li><strong>Circumstances:</strong> The scope or context (e.g., time period, viewpoint).</li>
                </ul>
            </HelpSection>

            <HelpSection icon={TENOR_ICON} title="Tenor: The 'Who'">
                <p>Tenor establishes the relationship between the AI and the audience. It dictates the AI's personality, tone, and the expected style of interaction.</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                    <li><strong>LLM Persona:</strong> The role the AI should adopt (e.g., an expert, a critic).</li>
                    <li><strong>Target Audience:</strong> Who the response is for (e.g., beginners, executives).</li>
                    <li><strong>Tone & Style:</strong> The emotional and stylistic quality (e.g., Formal, Humorous).</li>
                    <li><strong>Modality:</strong> The level of certainty or confidence (e.g., use 'might' vs. 'will').</li>
                </ul>
            </HelpSection>

            <HelpSection icon={MODE_ICON} title="Mode: The 'How'">
                <p>This component specifies the structure and format of the output. It controls how the AI organizes and delivers the information, like a blueprint for the response.</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                    <li><strong>Output Format:</strong> The final form (e.g., JSON, email, bulleted list).</li>
                    <li><strong>Required Structure:</strong> The organizational flow (e.g., Intro, Body, Conclusion).</li>
                    <li><strong>Constraints & Rules:</strong> Specific rules to follow (e.g., word count, language).</li>
                </ul>
            </HelpSection>
            
            <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Live Refinement Examples</h3>
                <p className="text-slate-400 mb-4">After generating a response, use the "Converse & Refine" feature to make changes with your voice. The AI will listen and use its tools to update the prompt components in real-time.</p>
                <div className="space-y-4 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                    <p className="text-sm text-slate-400 font-medium">Example 1: Refining the <strong className="text-slate-200">Tenor</strong></p>
                    <div className="flex items-start gap-3 flex-row-reverse">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center p-1 bg-slate-600 text-slate-300">{USER_AVATAR_ICON}</div>
                        <div className="text-slate-200 rounded-xl px-4 py-2 bg-slate-700 rounded-br-none text-sm">"This is good, but can you make the tone more persuasive and aim it at marketing professionals?"</div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center p-1 bg-violet-500 text-violet-100">{AI_AVATAR_ICON}</div>
                        <div className="text-slate-200 rounded-xl px-4 py-2 bg-violet-600/80 rounded-bl-none text-sm">"Of course. I've updated the tone to 'persuasive' and the audience to 'marketing professionals'."</div>
                    </div>

                    <p className="text-sm text-slate-400 font-medium pt-4 border-t border-slate-700">Example 2: Refining the <strong className="text-slate-200">Mode</strong></p>
                    <div className="flex items-start gap-3 flex-row-reverse">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center p-1 bg-slate-600 text-slate-300">{USER_AVATAR_ICON}</div>
                        <div className="text-slate-200 rounded-xl px-4 py-2 bg-slate-700 rounded-br-none text-sm">"Please change the output format to a JSON object."</div>
                    </div>
                     <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center p-1 bg-violet-500 text-violet-100">{AI_AVATAR_ICON}</div>
                        <div className="text-slate-200 rounded-xl px-4 py-2 bg-violet-600/80 rounded-bl-none text-sm">"Done. The prompt is now set to output a JSON object."</div>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-700 flex justify-end">
            <Button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 focus:ring-slate-500">
                Close
            </Button>
        </div>
      </div>
    </div>
  );
};

interface HelpSectionProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}

const HelpSection: React.FC<HelpSectionProps> = ({ icon, title, children }) => (
    <div>
        <div className="flex items-center mb-2">
            <span className="w-6 h-6 mr-3 text-violet-400">{icon}</span>
            <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        </div>
        <div className="pl-9">{children}</div>
    </div>
);
