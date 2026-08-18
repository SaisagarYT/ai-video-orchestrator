export type CreationMode = 'beginner' | 'advanced';

export interface ClarificationQuestionItem {
  id: string;
  field: string;
  question: string;
  suggested_options?: string[];
  required?: boolean;
}

export interface ExtractedCampaignData {
  product_name?: string;
  industry?: string;
  target_audience?: string;
  tone_of_voice?: string;
  unique_selling_points?: string[] | string;
  campaign_objective?: string;
  target_platforms?: string[] | string;
  call_to_action?: string;
  visual_style_preferences?: string;
  aspect_ratio?: '16:9' | '9:16' | '1:1' | '4:5' | string;
  duration_seconds?: number;
}

export interface ContextSessionState {
  id: string;
  raw_input_prompt: string;
  extracted_data: ExtractedCampaignData;
  missing_fields: string[];
  clarification_questions: ClarificationQuestionItem[];
  user_answers: Record<string, string>;
  complete_context: Record<string, unknown>;
  status: 'ANALYZING' | 'NEEDS_CLARIFICATION' | 'COMPLETED' | 'ERROR';
  current_question_index: number;
}

export interface AdvancedFormData {
  campaignName: string;
  productName: string;
  industry: string;
  productDescription: string;
  objective: string;
  targetAudience: string;
  callToAction: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  durationSeconds: number;
  visualStyle: string;
  cameraMovement: string;
  lightingAtmosphere: string;
}
