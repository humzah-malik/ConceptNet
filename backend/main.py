import os
import json
from typing import List, Dict
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
from cohere import Client as CohereClient
from time import perf_counter
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import hashlib
import asyncio

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

print(f"Supabase URL: {supabase_url}")
print(f"Supabase Key: {supabase_key}")

supabase: Client = create_client(supabase_url, supabase_key)

openai_api_key = os.getenv("OPENAI_API_KEY", "")
cohere_api_key = os.getenv("COHERE_API_KEY", "")

openai_client = OpenAI(api_key=openai_api_key)
cohere_client = CohereClient(cohere_api_key)

class QuizItem(BaseModel):
    question: str
    options: List[str]
    answer_index: int

class Node(BaseModel):
    id: int
    label: str
    weight: int
    summary: str
    quiz: List[QuizItem]
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

graph_structure_prompt = """
You are an expert at analyzing educational content and creating concept maps. Your task is to extract the core concepts and their relationships from a transcript to create a clear, hierarchical knowledge graph.

Focus ONLY on:
1. Identifying main concepts/topics and subtopics as nodes
2. Creating meaningful relationships ONLY where they clearly exist in the transcript
3. Assigning appropriate weights to reflect importance

Rules:
- Create nodes for every major concept and significant subtopic
- It's perfectly acceptable and often desirable to have standalone/singleton nodes with no connections
- DO NOT force relationships between nodes if they're not clearly supported by the transcript
- Weight nodes from 1-10 based on their importance in the transcript
- Only create links when there is an explicit or strongly implied relationship in the transcript
- Each link must have a clear, concise relationship label (e.g., "leads to", "influences", "is part of")
- Link weights should be 0.1-1.0 based on relationship strength
- Quality over quantity: Better to have fewer, accurate relationships than many forced ones

Return ONLY a JSON object with:
{
  "nodes": [{"id": integer, "label": "concept name", "weight": integer}],
  "links": [{"source": integer, "target": integer, "weight": float, "relation": "relationship label"}]
}

Do not include summaries or quizzes - focus purely on the knowledge graph structure.
Remember: Not every node needs to be connected. Singleton nodes are valid and often better than forced connections."""

node_summary_prompt = """
You are an educational content expert specializing in summarizing detailed concept explanations. For each concept in a knowledge graph, provide a thorough, insightful summarized explanation.

For each node, create a detailed summary that:
1. Defines and explains the concept thoroughly (3-4 sentences)
2. Connects it to related concepts from the transcript
3. Includes specific examples or applications mentioned
4. Highlights its significance in the broader context
5. References specific details from the transcript

The summary should be comprehensive enough for someone to fully understand the concept's role and importance.

Input will be a transcript and a list of nodes. Return ONLY a JSON object:
{
  "node_summaries": {
    "node_id": "detailed 4-6 sentence summary",
    ...
  }
}"""

quiz_generation_prompt = """
You are an expert at creating educational assessments that test deep understanding. Create engaging, thought-provoking questions for each concept in the knowledge graph.

For each node, create 3-5 multiple choice questions that:
1. Test understanding of core concepts rather than mere memorization
2. Include application and analysis-level thinking
3. Have plausible but clearly incorrect distractors
4. Reference specific content from the transcript
5. Build connections between related concepts

Input will be a transcript and list of nodes. Return ONLY a JSON object:
{
  "node_quizzes": {
    "node_id": [
      {
        "question": "thought-provoking question",
        "options": ["correct answer", "plausible wrong answer", ...],
        "answer_index": correct_index
      },
      ...
    ]
  }
}"""

async def generate_graph_structure(client: OpenAI, transcript: str) -> Dict:
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": graph_structure_prompt},
                {"role": "user", "content": transcript}
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error generating graph structure: {str(e)}")
        raise

async def generate_node_summaries(client: OpenAI, transcript: str, nodes: List[Dict]) -> Dict:
    try:
        input_content = f"""
Transcript:
{transcript}

Nodes to summarize:
{json.dumps(nodes, indent=2)}
"""
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": node_summary_prompt},
                {"role": "user", "content": input_content}
            ],
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error generating node summaries: {str(e)}")
        raise

async def generate_quizzes(client: OpenAI, transcript: str, nodes: List[Dict]) -> Dict:
    try:
        input_content = f"""
Transcript:
{transcript}

Nodes to create quizzes for:
{json.dumps(nodes, indent=2)}
"""
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": quiz_generation_prompt},
                {"role": "user", "content": input_content}
            ],
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error generating quizzes: {str(e)}")
        raise

app = FastAPI()

def get_hash(transcript: str) -> str:
    return hashlib.sha256(transcript.encode()).hexdigest()

@app.post("/store-graph")
async def store_graph(req: GraphRequest):
    try:
        start = perf_counter()
        print("1. Starting parallel graph generation...")

        # Generate graph structure first
        graph_data = await generate_graph_structure(openai_client, req.transcript)
        
        # Then generate summaries and quizzes in parallel
        summary_task = generate_node_summaries(openai_client, req.transcript, graph_data["nodes"])
        quiz_task = generate_quizzes(openai_client, req.transcript, graph_data["nodes"])
        
        summaries_data, quizzes_data = await asyncio.gather(summary_task, quiz_task)
        
        # Combine all data
        for node in graph_data["nodes"]:
            node_id = node["id"]
            node["summary"] = summaries_data["node_summaries"].get(str(node_id), "")
            node["quiz"] = quizzes_data["node_quizzes"].get(str(node_id), [])

        print("2. Graph generation complete")
        
        # Store in Supabase
        hash_id = get_hash(req.transcript)
        try:
            result = supabase.table("memory_graphs").upsert({
                "hash": hash_id,
                "transcript": req.transcript,
                "graph_json": graph_data
            }).execute()
            print("3. Stored in Supabase successfully")
        except Exception as supabase_error:
            print(f"Supabase error: {str(supabase_error)}")
            # Continue even if Supabase fails - return the graph anyway

        elapsed = perf_counter() - start
        print(f"⏱️ Total processing time: {elapsed:.2f} seconds")
        print(f"📈 Nodes: {len(graph_data['nodes'])}, Links: {len(graph_data['links'])}")

        return graph_data
    except Exception as e:
        print(f"Error in store_graph: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to store graph: {str(e)}")
    
@app.get("/get-cached-graph/{hash}", response_model=GraphResponse)
def get_cached_graph(hash: str):
    try:
        response = supabase.table("memory_graphs").select("graph_json").eq("hash", hash).single().execute()
        if response.data:
            return GraphResponse(**response.data["graph_json"])
        else:
            raise HTTPException(status_code=404, detail="Graph not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching cached graph: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/extract-graph", response_model=GraphResponse)
def extract_graph(req: GraphRequest):
    start = perf_counter()

    prompt = f"{system_prompt}\n\nTranscript:\n\"\"\"\n{req.transcript}\n\"\"\""
    raw = call_llm(prompt, provider="openai")
    graph = parse_graph_json(raw)

    elapsed = perf_counter() - start
    print(f"⏱️ LLM processing time: {elapsed:.2f} seconds")
    print(f"📈 Nodes: {len(graph.nodes)}, Links: {len(graph.links)}")
    print(f"✅ Graph generated in {elapsed:.2f}s with {len(graph.nodes)} nodes")

    return graph