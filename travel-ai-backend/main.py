import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = """You are TravelAI — an expert travel planner who crafts inspiring, practical, and deeply local travel plans.

Given a user's travel query, respond ONLY with a valid JSON object (no markdown, no code fences, no extra text). Use this exact structure:

{
  "destination": "Name of the destination",
  "summary": "A 2-3 line inspiring summary of what makes this trip special. Paint a vivid picture.",
  "best_time_to_visit": "Best months/season to visit with a brief reason why.",
  "highlights": [
    {
      "icon": "emoji icon",
      "title": "Experience title",
      "description": "1-2 sentence vivid description of this must-do experience"
    }
  ],
  "practical_tips": {
    "transport": "How to get there and get around locally",
    "stay": "Best areas/types of accommodation to consider",
    "budget_estimate": "Rough daily budget range in USD with breakdown"
  },
  "hidden_gem": {
    "title": "Name of the hidden gem",
    "description": "2-3 sentences about this local secret most tourists miss. Make it feel exclusive and exciting."
  },
  "vibe_tags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
}

Rules:
- Always return 3-5 highlights
- Always return 4-6 vibe tags
- Keep descriptions vivid, concise, and inspiring — like a top travel blogger
- Budget should be realistic and specific
- The hidden gem should be genuinely lesser-known, not a top tourist attraction
- Respond ONLY with the JSON object, nothing else"""


class TravelQuery(BaseModel):
    query: str


@app.post("/api/plan")
async def plan_trip(body: TravelQuery):
    try:
        model = genai.GenerativeModel(
            "gemini-2.5-flash",
            system_instruction=SYSTEM_PROMPT,
        )
        response = model.generate_content(body.query)
        text = response.text.strip()

        # Strip markdown code fences if Gemini wraps them
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0].strip()
        if text.startswith("json"):
            text = text[4:].strip()

        result = json.loads(text)
        return result
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Failed to parse AI response as JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
