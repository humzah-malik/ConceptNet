import os
import json
from enum import Enum
from typing import List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from cohere import Client as CohereClient
from time import perf_counter

load_dotenv()

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

cohere_api_key = os.getenv("COHERE_API_KEY", "")
cohere_client = CohereClient(cohere_api_key)

def call_llm(prompt: str) -> str:
    resp = cohere_client.chat(
        message=prompt,
        model="command-r",
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    return resp.text

def parse_graph_json(raw: str) -> GraphResponse:
    try:
        data = json.loads(raw)
        return GraphResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse graph JSON: {e}")

app = FastAPI()

gpt_system_prompt = """
Parse this transcript and extract main concepts as a graph with nodes and links.
Respond *only* with a JSON object in this format. This example is only for structure — not content.
Each node's "summary" should be atleast 2-3 sentencesbased on how the concept is used in the transcript.
{
  "nodes": [
    {
      "id": 1,
      "label": "Python",
      "weight": 5,
      "summary": "Python is a versatile programming language used in many domains including web, data, and AI."
    },
    {
      "id": 2,
      "label": "Django",
      "weight": 3,
      "summary": "Django is a high-level web framework built on Python that encourages rapid development and clean design."
    }
  ],
  "links": [
    {
      "source": 1,
      "target": 2,
      "weight": 0.8,
      "relation": "is a Python framework"
    }
  ]
}
"""

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/extract-graph", response_model=GraphResponse)
def extract_graph(req: GraphRequest):
    start = perf_counter()

    prompt = f"{gpt_system_prompt}\n\nTranscript:\n\"\"\"\n{req.transcript}\n\"\"\""
    raw = call_llm(prompt)
    graph = parse_graph_json(raw)

    elapsed = perf_counter() - start
    print(f"⏱️ LLM processing time: {elapsed:.2f} seconds")
    print(f"📈 Nodes: {len(graph.nodes)}, Links: {len(graph.links)}")

    return graph