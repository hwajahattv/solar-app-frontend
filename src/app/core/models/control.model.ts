export type ControlInputType = 'toggle' | 'select' | 'text';

export interface ControlOption {
  value: string;
  label: string;
}

export interface ControlField {
  id: string;
  name: string;
  hint: string | null;
  inputType: ControlInputType;
  options: ControlOption[];
}

export interface ControlValue {
  fieldId: string;
  value: string | null;
  label: string | null;
}

export interface ControlWriteResult {
  fieldId: string;
  name: string;
  value: string;
  label: string | null;
  success: boolean;
  message: string | null;
}

export interface ProfileStep {
  id: string;
  name: string;
  value: string;
  label: string;
}

export interface ProfileResult {
  applied: number;
  total: number;
  steps: ControlWriteResult[];
}
