import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import type {
  CreationMode,
  ContextSessionState,
  AdvancedFormData,
} from '../types';

const STORAGE_KEY = 'kanggird_campaign_interview_state';

const initialAdvancedData: AdvancedFormData = {
  campaignName: '',
  productName: '',
  industry: 'Food & Beverage',
  productDescription: '',
  objective: 'Drive online delivery orders and customer acquisition',
  targetAudience: 'General consumers, food enthusiasts, and young professionals',
  callToAction: 'Order Now and Get 20% Off',
  aspectRatio: '16:9',
  durationSeconds: 60,
  visualStyle: '35mm Cinematic Film with Warm Atmospheric Lighting',
  cameraMovement: 'Dynamic Dolly-In & 120 FPS Macro Focus',
  lightingAtmosphere: 'Golden Rim Glow with Firewood Hearth Embers',
};

export function useCampaignInterview() {
  const [mode, setMode] = useState<CreationMode>('beginner');
  const [session, setSession] = useState<ContextSessionState | null>(null);
  const [advancedData, setAdvancedData] = useState<AdvancedFormData>(initialAdvancedData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Restore saved interview state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.session) setSession(parsed.session);
        if (parsed.mode) setMode(parsed.mode);
        if (parsed.advancedData) setAdvancedData(parsed.advancedData);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Autosave state on change
  useEffect(() => {
    if (session || advancedData.campaignName) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ session, mode, advancedData })
        );
      } catch {
        // ignore storage errors
      }
    }
  }, [session, mode, advancedData]);

  // Sync extracted attributes into Advanced Form Data
  const syncToAdvanced = useCallback((extracted: Record<string, unknown>) => {
    setAdvancedData((prev) => ({
      ...prev,
      campaignName: (extracted.product_name as string) ? `${extracted.product_name} Commercial` : prev.campaignName,
      productName: (extracted.product_name as string) || prev.productName,
      industry: (extracted.industry as string) || prev.industry,
      objective: (extracted.campaign_objective as string) || prev.objective,
      targetAudience: (extracted.target_audience as string) || prev.targetAudience,
      callToAction: (extracted.call_to_action as string) || prev.callToAction,
      visualStyle: (extracted.visual_style_preferences as string) || prev.visualStyle,
      aspectRatio: (extracted.aspect_ratio as '16:9' | '9:16' | '1:1') || prev.aspectRatio,
    }));
  }, []);

  // 1. Initial Prompt Analysis (POST /context/analyze)
  const startInterview = async (prompt: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post('/context/analyze', { prompt: prompt.trim() });
      const data = res.data;

      const newSession: ContextSessionState = {
        id: data.id,
        raw_input_prompt: prompt,
        extracted_data: data.extracted_data || {},
        missing_fields: data.missing_fields || [],
        clarification_questions: data.clarification_questions || [],
        user_answers: data.user_answers || {},
        complete_context: data.complete_context || {},
        status: data.status === 'COMPLETED' ? 'COMPLETED' : 'NEEDS_CLARIFICATION',
        current_question_index: 0,
      };

      setSession(newSession);
      syncToAdvanced(data.extracted_data || {});
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to analyze initial vision. Please check your network.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Submit Question Answer (POST /context/{id}/answer)
  const submitAnswer = async (fieldOrId: string, answerText: string) => {
    if (!session) return;
    setIsLoading(true);
    setError(null);

    const updatedAnswers = {
      ...session.user_answers,
      [fieldOrId]: answerText.trim(),
    };

    try {
      const res = await api.post(`/context/${session.id}/answer`, {
        answers: updatedAnswers,
      });
      const data = res.data;

      const updatedSession: ContextSessionState = {
        ...session,
        extracted_data: data.extracted_data || session.extracted_data,
        missing_fields: data.missing_fields || [],
        clarification_questions: data.clarification_questions || [],
        user_answers: data.user_answers || updatedAnswers,
        complete_context: data.complete_context || {},
        status: data.status === 'COMPLETED' ? 'COMPLETED' : 'NEEDS_CLARIFICATION',
        current_question_index: session.current_question_index + 1,
      };

      setSession(updatedSession);
      syncToAdvanced(data.extracted_data || {});
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to submit answer. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Rewind to previous question
  const rewindToQuestion = (index: number) => {
    if (!session) return;
    setSession({
      ...session,
      current_question_index: Math.max(0, Math.min(index, session.clarification_questions.length - 1)),
    });
  };

  // 4. Create and approve the final campaign in the database
  const finalizeCampaign = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // A. Create or Retrieve Business
      let businessId: string;
      const bizRes = await api.get('/businesses/');
      if (bizRes.data && bizRes.data.length > 0) {
        businessId = bizRes.data[0].id;
      } else {
        const createBizRes = await api.post('/businesses/', {
          name: advancedData.productName ? `${advancedData.productName} Brand` : 'New Brand',
          industry: advancedData.industry || 'General',
          description: advancedData.productDescription || session?.raw_input_prompt || 'Commercial ad vision',
          tone_of_voice: (session?.extracted_data?.tone_of_voice as string) || 'Modern & Dynamic',
          brand_colors: '#013F32, #E7FE25, #161616',
          target_audience: advancedData.targetAudience,
        });
        businessId = createBizRes.data.id;
      }

      // B. Create Campaign
      const title = advancedData.campaignName || (session?.extracted_data?.product_name ? `${session.extracted_data.product_name} Commercial` : 'New Commercial Ad');
      const prodName = advancedData.productName || (session?.extracted_data?.product_name as string) || 'Product';
      const desc = advancedData.productDescription || session?.raw_input_prompt || 'Commercial visual';
      const obj = advancedData.objective || (session?.extracted_data?.campaign_objective as string) || 'Brand Awareness';
      const cta = advancedData.callToAction || (session?.extracted_data?.call_to_action as string) || 'Learn More';

      const campRes = await api.post('/campaigns/', {
        business_id: businessId,
        name: title,
        product_name: prodName,
        product_description: desc,
        objective: obj,
        call_to_action: cta,
        target_platforms: 'Instagram, TikTok, YouTube Shorts, Web',
      });

      // Clear interview state
      localStorage.removeItem(STORAGE_KEY);
      return campRes.data.id;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create campaign in database.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetInterview = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setAdvancedData(initialAdvancedData);
    setError(null);
  };

  return {
    mode,
    setMode,
    session,
    advancedData,
    setAdvancedData,
    isLoading,
    error,
    startInterview,
    submitAnswer,
    rewindToQuestion,
    finalizeCampaign,
    resetInterview,
  };
}
