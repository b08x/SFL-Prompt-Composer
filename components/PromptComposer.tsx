
import React, { useState, useCallback } from 'react';
import type { SFLPrompt } from '../types';
import { Card } from './ui/Card';
import { Label } from './ui/Label';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Tooltip } from './ui/Tooltip';
import { FIELD_ICON, TENOR_ICON, MODE_ICON, TASK_VERBS } from '../constants';
import { useSpeechToText } from '../hooks/useSpeechToText';

interface PromptComposerProps {
  promptComponents: SFLPrompt;
  setPromptComponents: React.Dispatch<React.SetStateAction<SFLPrompt>>;
}

export const PromptComposer: React.FC<PromptComposerProps> = ({
  promptComponents,
  setPromptComponents,
}) => {
  const [speechTarget, setSpeechTarget] = useState<{ category: keyof SFLPrompt; field: string } | null>(null);

  const handleTranscriptUpdate = useCallback((transcript: string) => {
    if (speechTarget) {
      setPromptComponents(prev => {
        const { category, field } = speechTarget;
        const currentCategory = prev[category];
        const currentValue = (currentCategory as any)[field] || '';
        
        return {
          ...prev,
          [category]: {
            ...currentCategory,
            [field]: (currentValue ? currentValue + ' ' : '') + transcript,
          },
        };
      });
    }
  }, [speechTarget, setPromptComponents]);

  const { isListening, startListening, stopListening, isSupported } = useSpeechToText(handleTranscriptUpdate);

  const handleSpeechClick = (category: keyof SFLPrompt, field: string) => {
    if (isListening && speechTarget?.category === category && speechTarget?.field === field) {
      stopListening();
      setSpeechTarget(null);
    } else {
      if (isListening) {
        stopListening();
      }
      setSpeechTarget({ category, field });
      startListening();
    }
  };

  const isFieldListening = (category: keyof SFLPrompt, field: string) => {
    return isListening && speechTarget?.category === category && speechTarget?.field === field;
  };


  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setPromptComponents(prev => ({ ...prev, field: { ...prev.field, [e.target.name]: e.target.value } }));
  };
  const handleTenorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPromptComponents(prev => ({ ...prev, tenor: { ...prev.tenor, [e.target.name]: e.target.value } }));
  };
  const handleModeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPromptComponents(prev => ({ ...prev, mode: { ...prev.mode, [e.target.name]: e.target.value } }));
  };

  return (
    <div className="space-y-6">
      <SectionCard 
        icon={FIELD_ICON}
        title="Field (The 'What')"
        tooltip="Controls the subject matter, accuracy, and logical connections. What the LLM talks about."
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="topic">Topic / Subject Matter</Label>
            <Textarea id="topic" name="topic" value={promptComponents.field.topic} onChange={handleFieldChange} placeholder="e.g., Quantum Computing" 
              rows={1}
              showSpeechButton={isSupported}
              isListening={isFieldListening('field', 'topic')}
              onSpeechClick={() => handleSpeechClick('field', 'topic')}
              isSpeechSupported={isSupported}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <Label htmlFor="taskVerb">Core Task Verb</Label>
              <Select id="taskVerb" name="taskVerb" value={promptComponents.field.taskVerb} onChange={handleFieldChange}>
                {TASK_VERBS.map(verb => <option key={verb} value={verb}>{verb}</option>)}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="taskDescription">Task Description</Label>
              <Textarea id="taskDescription" name="taskDescription" value={promptComponents.field.taskDescription} onChange={handleFieldChange} placeholder="e.g., the core principles for a beginner" 
                rows={1}
                showSpeechButton={isSupported}
                isListening={isFieldListening('field', 'taskDescription')}
                onSpeechClick={() => handleSpeechClick('field', 'taskDescription')}
                isSpeechSupported={isSupported}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="keyEntities">Key Entities</Label>
            <Textarea id="keyEntities" name="keyEntities" value={promptComponents.field.keyEntities} onChange={handleFieldChange} rows={1} placeholder="e.g., Superposition, Entanglement, Qubits"
              showSpeechButton={isSupported}
              isListening={isFieldListening('field', 'keyEntities')}
              onSpeechClick={() => handleSpeechClick('field', 'keyEntities')}
              isSpeechSupported={isSupported}
            />
          </div>
          <div>
            <Label htmlFor="circumstances">Circumstances / Scope</Label>
            <Textarea id="circumstances" name="circumstances" value={promptComponents.field.circumstances} onChange={handleFieldChange} placeholder="e.g., Focus on applications in cryptography" 
              rows={1}
              showSpeechButton={isSupported}
              isListening={isFieldListening('field', 'circumstances')}
              onSpeechClick={() => handleSpeechClick('field', 'circumstances')}
              isSpeechSupported={isSupported}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard 
        icon={TENOR_ICON}
        title="Tenor (The 'Who')"
        tooltip="Defines the LLM's persona, audience, style, and tone. How the LLM interacts."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="persona">LLM Persona</Label>
              <Textarea id="persona" name="persona" value={promptComponents.tenor.persona} onChange={handleTenorChange} placeholder="e.g., A university professor"
                rows={1}
                showSpeechButton={isSupported}
                isListening={isFieldListening('tenor', 'persona')}
                onSpeechClick={() => handleSpeechClick('tenor', 'persona')}
                isSpeechSupported={isSupported}
              />
            </div>
            <div>
              <Label htmlFor="audience">Target Audience</Label>
              <Textarea id="audience" name="audience" value={promptComponents.tenor.audience} onChange={handleTenorChange} placeholder="e.g., High school students"
                rows={1}
                showSpeechButton={isSupported}
                isListening={isFieldListening('tenor', 'audience')}
                onSpeechClick={() => handleSpeechClick('tenor', 'audience')}
                isSpeechSupported={isSupported}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="tone">Tone & Style</Label>
            <Textarea id="tone" name="tone" value={promptComponents.tenor.tone} onChange={handleTenorChange} placeholder="e.g., Enthusiastic and encouraging"
              rows={1}
              showSpeechButton={isSupported}
              isListening={isFieldListening('tenor', 'tone')}
              onSpeechClick={() => handleSpeechClick('tenor', 'tone')}
              isSpeechSupported={isSupported}
            />
          </div>
          <div>
            <Label htmlFor="modality">Modality / Confidence</Label>
            <Textarea id="modality" name="modality" value={promptComponents.tenor.modality} onChange={handleTenorChange} placeholder="e.g., Express claims cautiously with words like 'may' or 'could'"
              rows={1}
              showSpeechButton={isSupported}
              isListening={isFieldListening('tenor', 'modality')}
              onSpeechClick={() => handleSpeechClick('tenor', 'modality')}
              isSpeechSupported={isSupported}
            />
          </div>
        </div>
      </SectionCard>
      
      <SectionCard 
        icon={MODE_ICON}
        title="Mode (The 'How')"
        tooltip="Specifies the output format, length, and organization. How the LLM organizes its message."
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="format">Output Format</Label>
            <Textarea id="format" name="format" value={promptComponents.mode.format} onChange={handleModeChange} placeholder="e.g., a blog post, a technical report, a marketing email, a Python script, a JSON object" 
              rows={1}
              showSpeechButton={isSupported}
              isListening={isFieldListening('mode', 'format')}
              onSpeechClick={() => handleSpeechClick('mode', 'format')}
              isSpeechSupported={isSupported}
            />
          </div>
          <div>
            <Label htmlFor="structure">Required Structure</Label>
            <Textarea id="structure" name="structure" value={promptComponents.mode.structure} onChange={handleModeChange} rows={1} placeholder="e.g., Introduction, Main Body (3 paragraphs), Conclusion" 
              showSpeechButton={isSupported}
              isListening={isFieldListening('mode', 'structure')}
              onSpeechClick={() => handleSpeechClick('mode', 'structure')}
              isSpeechSupported={isSupported}
            />
          </div>
          <div>
            <Label htmlFor="constraints">Constraints & Rules</Label>
            <Textarea id="constraints" name="constraints" value={promptComponents.mode.constraints} onChange={handleModeChange} placeholder="e.g., Limit response to 200 words. Do not use jargon."
              rows={1}
              showSpeechButton={isSupported}
              isListening={isFieldListening('mode', 'constraints')}
              onSpeechClick={() => handleSpeechClick('mode', 'constraints')}
              isSpeechSupported={isSupported}
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
};


interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  tooltip: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ icon, title, tooltip, children }) => (
  <Card>
    <div className="flex items-center mb-4">
      <span className="w-8 h-8 mr-3 text-violet-400">{icon}</span>
      <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
      <Tooltip text={tooltip} />
    </div>
    {children}
  </Card>
);
