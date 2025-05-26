from fastapi import FastAPI, Request
from typing import List
from pydantic import BaseModel

class Node(BaseModel):
    id: int
    label: str
    weight: int

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

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

# TODO: /extract-graph, /quiz endpoints go here
@app.post("/extract-graph", response_model=GraphResponse)
def extract_graph(request: GraphRequest):
    nodes = [
        Node(id=1, label="Python", weight=5),
        Node(id=2, label="Django", weight=3),
    ]
    links = [
        Link(source=1, target=2, weight=0.8, relation="is a Python framework"),
    ]
    return GraphResponse(nodes=nodes, links=links)