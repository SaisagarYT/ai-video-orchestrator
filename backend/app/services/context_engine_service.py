import re
from typing import Any, Dict, List, Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.context_session import ContextSession
from app.repositories.business_repository import BusinessRepository
from app.repositories.campaign_repository import CampaignRepository
from app.repositories.context_session_repository import ContextSessionRepository
from app.schemas.context_engine import (
    ContextAnalyzeRequest,
    SubmitAnswersRequest,
)


class ContextEngineService:

    def __init__(self):
        self.repository = ContextSessionRepository()
        self.business_repository = BusinessRepository()
        self.campaign_repository = CampaignRepository()

    def analyze_natural_language_prompt(
        self,
        db: Session,
        user_id: UUID,
        request: ContextAnalyzeRequest,
    ) -> ContextSession:
        # 1. Fetch existing Business / Campaign context if IDs provided
        business_context = {}
        if request.business_id:
            business = self.business_repository.get_business_by_id(
                db=db,
                business_id=request.business_id,
                user_id=user_id,
            )
            if business:
                business_context = {
                    "brand_name": business.name,
                    "industry": business.industry,
                    "target_audience": business.target_audience,
                    "tone_of_voice": business.tone_of_voice,
                    "brand_colors": business.brand_colors,
                    "brand_guidelines": business.brand_guidelines,
                }

        # 2. Extract semantic attributes from natural language
        extracted_data = self._extract_attributes_from_text(request.prompt, business_context)

        # 3. Detect missing information gaps
        missing_fields, clarification_questions = self._detect_missing_and_generate_questions(extracted_data)

        # 4. Determine status & complete context
        status = "needs_clarification" if clarification_questions else "completed"
        complete_context = self._synthesize_complete_context(extracted_data, {}) if not clarification_questions else {}

        # 5. Persist Session
        session = self.repository.create_session(
            db=db,
            user_id=user_id,
            raw_input_prompt=request.prompt,
            business_id=request.business_id,
            campaign_id=request.campaign_id,
            extracted_data=extracted_data,
            missing_fields=missing_fields,
            clarification_questions=clarification_questions,
            status=status,
        )

        if complete_context:
            self.repository.update_session(
                db=db,
                session=session,
                complete_context=complete_context,
            )

        return session

    def submit_clarification_answers(
        self,
        db: Session,
        session_id: UUID,
        user_id: UUID,
        request: SubmitAnswersRequest,
    ) -> ContextSession:
        session = self.repository.get_session_by_id(db=db, session_id=session_id, user_id=user_id)
        if session is None:
            raise ValueError("Context session not found")

        # Merge user answers
        merged_answers = dict(session.user_answers or {})
        merged_answers.update(request.answers)

        merged_data = dict(session.extracted_data or {})
        for field, answer in request.answers.items():
            clean_field = field.replace("q_", "")
            merged_data[clean_field] = answer

        # Re-check remaining missing fields
        remaining_missing, remaining_questions = self._detect_missing_and_generate_questions(merged_data)

        status = "needs_clarification" if remaining_questions else "completed"
        complete_context = self._synthesize_complete_context(merged_data, merged_answers) if not remaining_questions else {}

        return self.repository.update_session(
            db=db,
            session=session,
            extracted_data=merged_data,
            missing_fields=remaining_missing,
            clarification_questions=remaining_questions,
            user_answers=merged_answers,
            complete_context=complete_context,
            status=status,
        )

    def get_session(
        self,
        db: Session,
        session_id: UUID,
        user_id: UUID,
    ) -> ContextSession:
        session = self.repository.get_session_by_id(db=db, session_id=session_id, user_id=user_id)
        if session is None:
            raise ValueError("Context session not found")
        return session

    # ---------------------------------------------------------
    # Internal NLP Extraction & Semantic Parser
    # ---------------------------------------------------------

    def _extract_attributes_from_text(self, text: str, preloaded_context: Dict[str, Any]) -> Dict[str, Any]:
        lower_text = text.lower()
        extracted: Dict[str, Any] = dict(preloaded_context)

        # 1. Product Name Extraction
        product_match = re.search(r"(?:for|introducing|about|ad for|commercial for)\s+(?:our\s+)?([A-Z0-9][A-Za-z0-9\s\-]+?)(?:\.|\,|with|targeting|that|in|$)", text)
        if product_match and not extracted.get("product_name"):
            extracted["product_name"] = product_match.group(1).strip()
        elif not extracted.get("product_name"):
            # Fallback heuristic: look for quoted terms or leading noun phrases
            quoted = re.search(r"[\"']([^\"']+)[\"']", text)
            if quoted:
                extracted["product_name"] = quoted.group(1)

        # 2. Target Audience Extraction
        audience_keywords = [
            (r"(?:for|targeting|aimed at)\s+(gym goers|runners|athletes|fitness enthusiasts|gen z|gamers|creators|professionals|students|young adults|parents|developers)", r"\1"),
            (r"(gym rat|runner|athlete|fitness enthusiast|gamer|developer|student|creator)s?", r"\1s"),
        ]
        if not extracted.get("target_audience"):
            for pattern, repl in audience_keywords:
                match = re.search(pattern, lower_text)
                if match:
                    extracted["target_audience"] = match.group(0).strip().title()
                    break

        # 3. Tone of Voice Extraction
        tone_keywords = {
            "energetic": ["energetic", "high energy", "fast-paced", "pumped", "intense"],
            "cinematic": ["cinematic", "film look", "dramatic", "epic", "hollywood", "anamorphic"],
            "luxury": ["luxury", "minimalist", "sleek", "premium", "elegant", "sophisticated"],
            "conversational": ["conversational", "casual", "humorous", "relatable", "warm", "friendly"],
            "bold": ["bold", "aggressive", "edgy", "cyberpunk", "futuristic"],
        }
        if not extracted.get("tone_of_voice"):
            detected_tones = []
            for tone_category, synonyms in tone_keywords.items():
                if any(syn in lower_text for syn in synonyms):
                    detected_tones.append(tone_category.capitalize())
            if detected_tones:
                extracted["tone_of_voice"] = ", ".join(detected_tones)

        # 4. Unique Selling Points (USPs)
        usp_indicators = ["waterproof", "carbon fiber", "50% lighter", "24-hr battery", "wireless", "noise canceling", "ai powered", "ultra-durable", "sustainable", "handcrafted", "100% organic", "glow in the dark"]
        detected_usps = [usp.title() for usp in usp_indicators if usp in lower_text]
        if detected_usps and not extracted.get("unique_selling_points"):
            extracted["unique_selling_points"] = detected_usps

        # 5. Campaign Objective
        if any(term in lower_text for term in ["launch", "introducing", "announcing", "new release"]):
            extracted["campaign_objective"] = "Product Launch"
        elif any(term in lower_text for term in ["sale", "discount", "order", "buy", "conversion", "holiday"]):
            extracted["campaign_objective"] = "Conversions & Sales"
        elif any(term in lower_text for term in ["awareness", "brand", "showcase", "story"]):
            extracted["campaign_objective"] = "Brand Awareness"

        # 6. Target Platforms
        platforms = []
        if "instagram" in lower_text or "reels" in lower_text:
            platforms.append("Instagram Reels (9:16)")
        if "tiktok" in lower_text:
            platforms.append("TikTok (9:16)")
        if "youtube" in lower_text or "shorts" in lower_text:
            platforms.append("YouTube Shorts (9:16)")
        if "tv" in lower_text or "broadcast" in lower_text or "16:9" in lower_text:
            platforms.append("Broadcast Commercial (16:9)")
        if platforms and not extracted.get("target_platforms"):
            extracted["target_platforms"] = platforms

        # 7. Call To Action (CTA)
        cta_match = re.search(r"(?:cta|call to action|ending with|button)\s+(?:saying\s+)?[\"']?([^\"'\.\,]+)[\"']?", lower_text)
        if cta_match:
            extracted["call_to_action"] = cta_match.group(1).strip().capitalize()
        elif "order now" in lower_text:
            extracted["call_to_action"] = "Order Now"
        elif "shop now" in lower_text:
            extracted["call_to_action"] = "Shop Now"

        return extracted

    # ---------------------------------------------------------
    # Gap Analysis & Clarification Question Generator
    # ---------------------------------------------------------

    def _detect_missing_and_generate_questions(self, data: Dict[str, Any]) -> Tuple[List[str], List[Dict[str, Any]]]:
        missing_fields: List[str] = []
        questions: List[Dict[str, Any]] = []

        # Check Product Name
        if not data.get("product_name"):
            missing_fields.append("product_name")
            questions.append({
                "id": "q_product_name",
                "field": "product_name",
                "question": "What is the exact product or service name you are promoting?",
                "suggested_options": ["e.g. Apex Runner X1", "e.g. Lumina Glow Serum", "e.g. Pulse AI App"],
                "required": True,
            })

        # Check Target Audience
        if not data.get("target_audience"):
            missing_fields.append("target_audience")
            questions.append({
                "id": "q_target_audience",
                "field": "target_audience",
                "question": "Who is the primary target audience for this commercial?",
                "suggested_options": [
                    "Gen Z Creators & Social Explorers (18-24)",
                    "High-Performance Athletes & Fitness Enthusiasts",
                    "Urban Tech Professionals & Founders (25-40)",
                    "Eco-Conscious Lifestyle Shoppers",
                ],
                "required": True,
            })

        # Check Tone of Voice
        if not data.get("tone_of_voice"):
            missing_fields.append("tone_of_voice")
            questions.append({
                "id": "q_tone_of_voice",
                "field": "tone_of_voice",
                "question": "What cinematic tone best fits your brand image?",
                "suggested_options": [
                    "High-Energy, Fast-Paced & Bold",
                    "Cinematic Hollywood Drama (35mm Anamorphic)",
                    "Sleek, Luxury & Minimalist",
                    "Warm, Authentic & Conversational",
                ],
                "required": True,
            })

        # Check Call To Action (CTA)
        if not data.get("call_to_action"):
            missing_fields.append("call_to_action")
            questions.append({
                "id": "q_call_to_action",
                "field": "call_to_action",
                "question": "What should the final call-to-action (CTA) inspire viewers to do?",
                "suggested_options": [
                    "Order Today & Claim 20% Off Launch Discount",
                    "Visit Our Website to Learn More",
                    "Download the Free App on iOS & Android",
                    "Book an Exclusive VIP Demo",
                ],
                "required": False,
            })

        return missing_fields, questions

    # ---------------------------------------------------------
    # Final Complete Context Synthesizer
    # ---------------------------------------------------------

    def _synthesize_complete_context(self, extracted_data: Dict[str, Any], user_answers: Dict[str, Any]) -> Dict[str, Any]:
        product = extracted_data.get("product_name") or user_answers.get("product_name") or "Featured Product"
        audience = extracted_data.get("target_audience") or user_answers.get("target_audience") or "Broad Audience"
        tone = extracted_data.get("tone_of_voice") or user_answers.get("tone_of_voice") or "Cinematic & Dynamic"
        cta = extracted_data.get("call_to_action") or user_answers.get("call_to_action") or "Visit website to learn more"
        objective = extracted_data.get("campaign_objective") or "High-Converting Commercial"
        platforms = extracted_data.get("target_platforms") or ["Instagram Reels (9:16)", "TikTok (9:16)"]
        usps = extracted_data.get("unique_selling_points") or ["Premium Quality", "Innovative Design"]

        return {
            "title": f"{product} - {objective}",
            "product_name": product,
            "target_audience": audience,
            "tone_of_voice": tone,
            "campaign_objective": objective,
            "target_platforms": platforms,
            "unique_selling_points": usps,
            "call_to_action": cta,
            "brand_context": {
                "brand_name": extracted_data.get("brand_name", "Brand"),
                "industry": extracted_data.get("industry", "Consumer Goods"),
                "colors": extracted_data.get("brand_colors", "#000000, #FFFFFF"),
            },
            "strategy_directives": {
                "visual_pacing": "Dynamic with quick 2-4s cuts" if "High-Energy" in str(tone) else "Smooth cinematic dolly & tracking",
                "voiceover_style": f"Narrator delivering with a {tone} demeanor",
                "recommended_aspect_ratios": ["9:16", "16:9"],
            },
            "is_complete": True,
        }
