
import React from 'react';
import type { SFLPrompt } from '../types';
import { Card } from './ui/Card';
import { Label } from './ui/Label';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Tooltip } from './ui/Tooltip';
import { FIELD_ICON, TENOR_ICON, MODE_ICON, TASK_VERBS } from '../constants';

interface PromptComposerProps {
  promptComponents: SFLPrompt;
  setPromptComponents: React.Dispatch<React.SetStateAction<SFLPrompt>>;
}

export const PromptComposer: React.FC<PromptComposerProps> = ({
  promptComponents,
  setPromptComponents,
}) => {
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
            <Input id="topic" name="topic" value={promptComponents.field.topic} onChange={handleFieldChange} placeholder="e.g., Quantum Computing" />
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
              <Input id="taskDescription" name="taskDescription" value={promptComponents.field.taskDescription} onChange={handleFieldChange} placeholder="e.g., the core principles for a beginner" />
            </div>
          </div>
          <div>
            <Label htmlFor="keyEntities">Key Entities</Label>
            <Textarea id="keyEntities" name="keyEntities" value={promptComponents.field.keyEntities} onChange={handleFieldChange} rows={2} placeholder="e.g., Superposition, Entanglement, Qubits" />
          </div>
          <div>
            <Label htmlFor="circumstances">Circumstances / Scope</Label>
            <Input id="circumstances" name="circumstances" value={promptComponents.field.circumstances} onChange={handleFieldChange} placeholder="e.g., Focus on applications in cryptography" />
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
              <Input id="persona" name="persona" value={promptComponents.tenor.persona} onChange={handleTenorChange} placeholder="e.g., A university professor" />
            </div>
            <div>
              <Label htmlFor="audience">Target Audience</Label>
              <Input id="audience" name="audience" value={promptComponents.tenor.audience} onChange={handleTenorChange} placeholder="e.g., High school students" />
            </div>
          </div>
          <div>
            <Label htmlFor="tone">Tone & Style</Label>
            <Input id="tone" name="tone" value={promptComponents.tenor.tone} onChange={handleTenorChange} placeholder="e.g., Enthusiastic and encouraging" />
          </div>
          <div>
            <Label htmlFor="modality">Modality / Confidence</Label>
            <Input id="modality" name="modality" value={promptComponents.tenor.modality} onChange={handleTenorChange} placeholder="e.g., Express claims cautiously with words like 'may' or 'could'" />
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
            <Input id="format" name="format" value={promptComponents.mode.format} onChange={handleModeChange} placeholder="e.g., A JSON object, a Python script, a blog post" />
          </div>
          <div>
            <Label htmlFor="structure">Required Structure</Label>
            <Textarea id="structure" name="structure" value={promptComponents.mode.structure} onChange={handleModeChange} rows={2} placeholder="e.g., Introduction, Main Body (3 paragraphs), Conclusion" />
          </div>
          <div>
            <Label htmlFor="constraints">Constraints & Rules</Label>
            <Input id="constraints" name="constraints" value={promptComponents.mode.constraints} onChange={handleModeChange} placeholder="e.g., Limit response to 200 words. Do not use jargon." />
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
