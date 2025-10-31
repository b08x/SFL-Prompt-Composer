
export interface Field {
  topic: string;
  taskVerb: string;
  taskDescription: string;
  keyEntities: string;
  circumstances: string;
}

export interface Tenor {
  persona: string;
  audience: string;

  tone: string;
  modality: string;
}

export interface Mode {
  format: string;
  structure: string;
  constraints: string;
}

export interface SFLPrompt {
  field: Field;
  tenor: Tenor;
  mode: Mode;
}

export type Severity = 'error' | 'warning' | 'info';
export type GrammarAspect = 'Functional' | 'Generative' | 'Pragmatic';
export type SFLComponent = 'Field' | 'Tenor' | 'Mode' | 'Cross-Component';

export interface ValidationIssue {
  id: string;
  component: SFLComponent;
  field?: string;
  severity: Severity;
  grammar: GrammarAspect;
  message: string;
  suggestion: string;
}

export interface ValidationResult {
  score: number;
  assessment: string;
  issues: ValidationIssue[];
}

export interface GenerateContentResult {
  text: string;
  sources: { uri: string; title: string }[];
}

// A transcript entry can contain spoken text, a system message, or an uploaded image.
export type TranscriptEntry = {
  speaker: 'user' | 'model' | 'system';
  text?: string;
  image?: {
    name: string;
    url: string; // Using a blob URL for preview
  };
};
