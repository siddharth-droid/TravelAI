import os
import re
import json
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(override=True)

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com",
)

app = FastAPI()

allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── System prompt ─────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are a senior travel correspondent with bylines in Condé Nast Traveler, Monocle, and Kinfolk. You have personally visited every destination you write about — not just the tourist circuit but the neighbourhood restaurants, the unmarked viewpoints, the things locals actually do. You write like a knowledgeable friend composing a detailed letter, not like a booking engine producing a brochure.

Your voice: warm, specific, occasionally opinionated. You will name the restaurant, not "a local eatery." You will say "turn left at the blue-tiled fountain on Rue Sidi Yahia" not "wander through the medina." You will give the honest trade-off: "the famous X is worth 90 minutes of your time; skip the adjacent Y — it's a tourist trap."

RESPONSE FORMAT: Return ONLY a valid JSON object. No markdown, no code fences, no preamble, no trailing text.

SPECIFICITY RULES — violations make the output useless:
1. Every place mentioned must have a real, specific name (restaurant, street, viewpoint, neighbourhood)
2. Every day's activities must have time anchors ("by 7am", "after the 11am crowd arrives", "dusk is perfect here")
3. Hidden gems must be places a 10-year local resident would mention — NOT a "quieter version of the famous X"
4. Budget numbers must be in local currency AND USD: "₹2,500–4,000/day (~$30–48)"
5. Itinerary activities should note how to get between places (walk 12 min / Metro Line 2 / ₹80 auto)

EXAMPLE OF REQUIRED SPECIFICITY (activities description field):
WRONG: "Explore the old city in the morning, then visit the spice market."
RIGHT: "Leave your riad by 7:15am and walk Talaa Kebira downhill — the brass-workers are just opening. Stop at Café Clock on Derb Magana for msemen and harissa. At 10am, climb to the leather balcony at Terrasse des Tanneries — politely browse the leather shop for free access. Cross the river to the Andalusian quarter before noon; it's half the crowds and the tilework is finer."

JSON STRUCTURE — return exactly this schema:
{
  "destination": "Full destination name, e.g. 'Fès el-Bali, Morocco'",
  "tagline": "One punchy line capturing the soul — specific and evocative, not generic",
  "overview": "5–7 sentences. Cinematic, sensory, specific. First sentence must hook immediately. Include one honest observation about what makes it imperfect-but-worth-it.",
  "best_time_to_visit": {
    "months": "e.g. 'October – March'",
    "why": "2–3 sentences: weather, crowd levels, one specific festival or event worth timing a trip around"
  },
  "highlights": [
    {
      "icon": "single relevant emoji",
      "title": "Named, specific experience — not a category",
      "description": "3–4 sentences with sensory detail and one immediately actionable tip (best time, what to order, entrance trick)"
    }
  ],
  "itinerary_suggestion": {
    "duration": "e.g. '3–4 days'",
    "days": [
      {
        "day": "Day 1",
        "theme": "Short evocative theme — not a generic label like 'Exploration Day'",
        "activities": "Write 4–6 sentences describing the day as a flowing narrative with specific places, times, and transitions between them. Include one meal recommendation with the restaurant name."
      }
    ]
  },
  "practical_tips": {
    "getting_there": "Named hub airports, specific train/bus routes, realistic journey times from major cities",
    "local_transport": "Specific apps, named services, fare ranges, one tip on avoiding common tourist transport mistakes",
    "where_to_stay": "3 specific neighbourhoods with distinct vibes and rough price ranges. Budget to luxury.",
    "budget_estimate": {
      "budget": "Local currency + USD per day with breakdown of what this covers",
      "mid_range": "Local currency + USD per day with breakdown",
      "luxury": "Local currency + USD per day with breakdown"
    },
    "food_scene": "4 sentences: 2–3 must-try dishes with specific recommended places, one food street or market to visit, one local dining custom to know"
  },
  "hidden_gems": [
    {
      "icon": "single emoji",
      "title": "Specific named place — NOT a famous landmark",
      "description": "3–4 sentences: what it is, why locals love it, exactly how to find it, best time to visit. Must be genuinely non-obvious."
    }
  ],
  "warnings": [
    "One specific, actionable warning about a real common tourist mistake or scam at this exact destination"
  ],
  "local_tips": [
    "Specific, actionable tip with enough detail to be immediately useful — not generic travel advice"
  ],
  "vibe_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

MANDATORY COUNTS: exactly 5–6 highlights, exactly 3 hidden gems (genuinely obscure), 3–5 days in itinerary, 2–4 warnings, 4–6 local_tips, 5–7 vibe_tags.

Do not apologise. Do not explain your choices. Do not add any text outside the JSON object."""


# ── JSON extraction ───────────────────────────────────────────────────────
def extract_json(text: str) -> str:
    text = text.strip()
    # Pattern 1: ```json ... ``` or ``` ... ```
    fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fence_match:
        return fence_match.group(1)
    # Pattern 2: clean JSON
    if text.startswith("{") and text.endswith("}"):
        return text
    # Pattern 3: find outermost braces
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1]
    raise ValueError(f"No JSON object found in response: {text[:300]}")


# ── Response validation ───────────────────────────────────────────────────
REQUIRED_FIELDS = {
    "destination", "tagline", "overview", "highlights",
    "itinerary_suggestion", "practical_tips", "hidden_gems",
    "local_tips", "vibe_tags",
}

def validate_response(data: dict) -> None:
    missing = REQUIRED_FIELDS - set(data.keys())
    if missing:
        raise ValueError(f"AI response missing required fields: {missing}")
    if not isinstance(data.get("highlights"), list) or len(data["highlights"]) < 3:
        raise ValueError("highlights must be a list with at least 3 items")
    days = data.get("itinerary_suggestion", {}).get("days", [])
    if not isinstance(days, list) or len(days) < 1:
        raise ValueError("itinerary_suggestion.days must be a non-empty list")


# ── AI call with retry ────────────────────────────────────────────────────
async def call_ai_with_retry(messages: list, max_retries: int = 3) -> dict:
    last_error: Exception | None = None
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="deepseek-chat",
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.75,
            )
            text = response.choices[0].message.content.strip()
            clean = extract_json(text)
            result = json.loads(clean)
            validate_response(result)
            return result
        except (json.JSONDecodeError, ValueError) as e:
            last_error = e
            if attempt < max_retries - 1:
                await asyncio.sleep(1.0 * (2 ** attempt))
                # Reinforce JSON strictness on retry
                msgs = list(messages)
                msgs[-1] = {
                    **msgs[-1],
                    "content": msgs[-1]["content"]
                    + "\n\nCRITICAL: Return ONLY the raw JSON object. No markdown, no code fences, no extra text.",
                }
                messages = msgs
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(
        status_code=502,
        detail=f"AI failed to return valid JSON after {max_retries} attempts: {last_error}",
    )


# ── Route ─────────────────────────────────────────────────────────────────
class TravelQuery(BaseModel):
    query: str


@app.post("/api/plan")
async def plan_trip(body: TravelQuery):
    # Query augmentation — chain-of-thought before JSON generation
    augmented_query = f"""Travel planning request: {body.query}

Before generating the JSON, think through:
1. What is the traveler's primary intent? (relaxation / adventure / culture / food / romance / budget)
2. What duration and budget signals are present in the query?
3. What makes this destination genuinely unique — the one detail most travel writing gets wrong?
4. What are 3 genuinely non-obvious things a 10-year local resident would recommend?
5. What is the most common tourist mistake at this destination?

Now generate the complete JSON itinerary based on that reasoning. Every place must be named. Every activity must have a time anchor."""

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user",   "content": augmented_query},
    ]

    result = await call_ai_with_retry(messages)
    return result
