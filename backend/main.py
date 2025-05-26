import os
import json
from typing import List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
from cohere import Client as CohereClient
from time import perf_counter

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY", "")
cohere_api_key = os.getenv("COHERE_API_KEY", "")

openai_client = OpenAI(api_key=openai_api_key)
cohere_client = CohereClient(cohere_api_key)

class Node(BaseModel):
    id: int
    label: str
    weight: int
    summary: str

class Link(BaseModel):
    source: int
    target: int
    weight: float
    relation: str

class GraphRequest(BaseModel):
    transcript: str

class GraphResponse(BaseModel):
    nodes: List[Node]
    links: List[Link]

system_prompt = """
You are an AI assistant whose sole job is to convert a lecture transcript into a **complete concept‑map**. When given a transcript, you must:

1. **Extract Every Major Concept & Subtopic**  
   – Identify all the core topics discussed.  
   – For each core topic, pull out any related subtopics or examples that the speaker spent time on.  
   – Do not impose a fixed minimum or maximum—include everything essential so the map covers the full transcript.

2. **Assign Weights**  
   – Give each node a `weight` from 1–10 based on how frequently and centrally it appears.  
   – Core topics tend to be higher (7–10), subtopics lower (1–6).

3. **Write Context‑Aware Summaries**  
   – For each node, provide a **3-4 sentence** summary that:
     • Defines the concept clearly.  
     • Explains how it was used in the transcript (examples, time stamps, emphasis).

4. **Create All Relevant Links**  
   – For every clear connection (core→subtopic or topic↔topic), emit a `link` object with:
     • `source` / `target`: the node IDs.  
     • `weight`: 0.1–1.0 reflecting strength.  
     • `relation`: a concise verb phrase (e.g. “is an example of”, “builds on”, “contrasts with”).

5. **Return Strict JSON Only**  
   – Respond with exactly one JSON object containing two arrays:  
     ```jsonc
     {
       "nodes": [ /* Node objects */ ],
       "links": [ /* Link objects */ ]
     }
     ```  
   – Do **not** include any extra text, markdown, or code fences.

Example structure (no content limit implied):
```jsonc
{
  "nodes": [
    { "id": 1, "label": "Core Topic",   "weight": 9, "summary": "…” },
    { "id": 2, "label": "Subtopic A",   "weight": 5, "summary": "…” },
    { "id": 3, "label": "Subtopic B.1", "weight": 3, "summary": "…” }
  ],
  "links": [
    { "source": 1, "target": 2, "weight": 0.8, "relation": "includes example" },
    { "source": 2, "target": 3, "weight": 0.6, "relation": "is part of" }
  ]
}
"""

def call_llm(prompt: str, provider="openai") -> str:
    if provider == "openai":
        try:
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"},
            )
            return response.choices[0].message.content
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"OpenAI error: {e}")

    elif provider == "cohere":
        try:
            response = cohere_client.chat(
                message=prompt,
                model="command",
                temperature=0.3,
            )
            return response.text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Cohere error: {e}")

    else:
        raise HTTPException(status_code=400, detail="Unsupported provider")

def parse_graph_json(raw: str) -> GraphResponse:
    try:
        data = json.loads(raw)
        return GraphResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse graph JSON: {e}")

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/extract-graph", response_model=GraphResponse)
def extract_graph(req: GraphRequest):
    start = perf_counter()

    prompt = f"{system_prompt}\n\nTranscript:\n\"\"\"\n{req.transcript}\n\"\"\""
    raw = call_llm(prompt, provider="openai")  # Change to "cohere" to test fallback
    graph = parse_graph_json(raw)

    elapsed = perf_counter() - start
    print(f"⏱️ LLM processing time: {elapsed:.2f} seconds")
    print(f"📈 Nodes: {len(graph.nodes)}, Links: {len(graph.links)}")
    print(f"✅ Graph generated in {elapsed:.2f}s with {len(graph.nodes)} nodes")

    return graph