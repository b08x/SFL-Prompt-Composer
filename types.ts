
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
