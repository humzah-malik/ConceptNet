import os
import json
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
from cohere import Client as CohereClient
from time import perf_counter
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import hashlib
import asyncio
import fitz # PyMuPDF
from docx import Document
from langdetect import detect
import tiktoken


load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

print(f"Supabase URL: {supabase_url}")
print(f"Supabase Key: {supabase_key}")

supabase: Client = create_client(supabase_url, supabase_key)

def truncate_text_to_token_limit(text: str, max_tokens: int = 100000) -> str:
    try:
        enc = tiktoken.encoding_for_model("gpt-4o")
        tokens = enc.encode(text)
        if len(tokens) > max_tokens:
            tokens = tokens[:max_tokens]
        return enc.decode(tokens)
    except Exception as e:
        print(f"Truncation fallback: {e}")
        # crude fallback: truncate by characters
        return text[:40000]

async def translate_to_english(text: str) -> str:
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a translation assistant. Translate any input into fluent, accurate English."},
                {"role": "user", "content": text}
            ],
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Translation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Translation failed.")

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
    transcript: Optional[str] = None
    graph: Optional[Dict] = None

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
        "question": "thought-provoking question, or a straight forward question depending on the concept",
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


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",                 
        "https://mindmapper-1.vercel.app",      
        "https://mindmapper-crll.onrender.com",  
        "https://xn--mindmapperpvw8-f72h.onrender.com",
        
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "MindMapper backend is operational!"}

def get_hash(transcript: str) -> str:
    return hashlib.sha256(transcript.encode()).hexdigest()

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Invalid file type. Upload a PDF.")

        file_location = f"/tmp/{file.filename}"
        with open(file_location, "wb") as f:
            f.write(await file.read())

        doc = fitz.open(file_location)
        text = "\n".join([page.get_text() for page in doc])
        doc.close()

        if not text.strip():
            raise HTTPException(status_code=400, detail="No extractable text found in PDF.")
        
        # translate the text to english if it's not in english
        if detect(text) != "en":
            text = await translate_to_english(text)

        return {"transcript": text}
    
    except Exception as e:
        print(f"PDF upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process PDF.")

@app.post("/upload-docx")
async def upload_docx(file: UploadFile = File(...)):
    try:
        if not file.filename.endswith(".docx"):
            raise HTTPException(status_code=400, detail="Invalid file type. Upload a .docx file.")

        file_location = f"/tmp/{file.filename}"
        with open(file_location, "wb") as f:
            f.write(await file.read())

        doc = Document(file_location)
        text = "\n".join([para.text for para in doc.paragraphs])

        if not text.strip():
            raise HTTPException(status_code=400, detail="No extractable text found in DOCX.")
        
        # translate the text to english if it's not in english
        if detect(text) != "en":
            text = await translate_to_english(text)

        return {"transcript": text}

    except Exception as e:
        print(f"DOCX upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process DOCX.")

@app.post("/store-graph")
async def store_graph(req: GraphRequest):
    try:
        start = perf_counter()

        transcript = req.transcript or (req.graph or {}).get("transcript")
        if not transcript:
            raise HTTPException(status_code=422, detail="transcript is required")

        hash_id = get_hash(transcript)

        if req.graph:
            # Use provided graph
            graph_data = req.graph
            print("1. Using provided graph")
        else:
            # Default path: generate from scratch
            print("1. Starting parallel graph generation...")
            safe_transcript = truncate_text_to_token_limit(req.transcript)
            graph_data = await generate_graph_structure(openai_client, safe_transcript)

            summary_task = generate_node_summaries(openai_client, safe_transcript, graph_data["nodes"])
            quiz_task = generate_quizzes(openai_client, safe_transcript, graph_data["nodes"])

            summaries_data, quizzes_data = await asyncio.gather(summary_task, quiz_task)

            for node in graph_data["nodes"]:
                node_id = node["id"]
                node["summary"] = summaries_data["node_summaries"].get(str(node_id), "")
                node["quiz"] = quizzes_data["node_quizzes"].get(str(node_id), [])

            print("2. Graph generation complete")

        # Store in Supabase
        supabase.table("memory_graphs").upsert({
            "hash": hash_id,
            "transcript": req.transcript,
            "graph_json": graph_data
        }).execute()
        print("3. Stored in Supabase successfully")

        elapsed = perf_counter() - start
        print(f"Total processing time: {elapsed:.2f} seconds")
        print(f"Nodes: {len(graph_data['nodes'])}, Links: {len(graph_data['links'])}")

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